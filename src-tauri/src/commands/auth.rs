use std::sync::{Arc, Mutex as StdMutex};
use std::time::{Duration, Instant};

use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_oauth::OauthConfig;

use crate::error::{Error, Result};
use crate::google::oauth;
use crate::secrets;
use crate::state::AppState;

const SCOPE: &str = "https://www.googleapis.com/auth/drive.file";

const SUCCESS_HTML: &str = r#"<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Stela</title>
<style>html,body{height:100%;margin:0}body{display:flex;align-items:center;justify-content:center;
font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#0c0c0e;color:#f4f4f6}
.card{text-align:center}.dot{width:48px;height:48px;border-radius:14px;background:#f4f4f6;margin:0 auto 18px}
h1{font-weight:600;font-size:18px;margin:0 0 6px}p{opacity:.6;font-size:14px;margin:0}</style></head>
<body><div class="card"><div class="dot"></div><h1>Connexion réussie</h1>
<p>Tu peux fermer cet onglet et revenir à Stela.</p></div>
<script>setTimeout(function(){window.close()},900)</script></body></html>"#;

/// Store the Google OAuth client credentials (from the frontend `.env`) so the
/// backend can perform token exchange and silent refresh. Call once at startup.
#[tauri::command]
pub async fn configure(
    state: State<'_, AppState>,
    client_id: String,
    client_secret: String,
) -> Result<()> {
    let mut auth = state.auth.lock().await;
    auth.client_id = Some(client_id);
    auth.client_secret = Some(client_secret);
    Ok(())
}

#[tauri::command]
pub async fn is_authenticated() -> Result<bool> {
    Ok(secrets::get_refresh_token()?.is_some())
}

#[tauri::command]
pub async fn sign_out(state: State<'_, AppState>) -> Result<()> {
    secrets::delete_refresh_token()?;
    let mut auth = state.auth.lock().await;
    auth.access_token = None;
    auth.expires_at = None;
    Ok(())
}

/// Begin the loopback + PKCE flow. Returns the loopback port immediately; the
/// browser opens to Google's consent screen. When the redirect arrives, the
/// backend exchanges the code, stores the refresh token, and emits the
/// `google-auth` event ({ ok, error? }) which the frontend listens for.
#[tauri::command]
pub async fn start_google_auth(
    app: AppHandle,
    state: State<'_, AppState>,
    client_id: String,
    client_secret: String,
) -> Result<u16> {
    {
        let mut auth = state.auth.lock().await;
        auth.client_id = Some(client_id.clone());
        auth.client_secret = Some(client_secret.clone());
    }

    let pkce = oauth::gen_pkce();
    let csrf = oauth::gen_state();

    // Captured by the redirect handler (runs later, on the plugin's thread).
    let port_cell = Arc::new(StdMutex::new(None::<u16>));
    let handler_port = port_cell.clone();
    let app_handle = app.clone();
    let verifier = pkce.verifier.clone();
    let expected_state = csrf.clone();
    let cid = client_id.clone();
    let csec = client_secret.clone();

    let handler = move |url: String| {
        let mut code: Option<String> = None;
        let mut got_state: Option<String> = None;
        if let Ok(parsed) = url::Url::parse(&url) {
            for (k, v) in parsed.query_pairs() {
                match k.as_ref() {
                    "code" => code = Some(v.into_owned()),
                    "state" => got_state = Some(v.into_owned()),
                    _ => {}
                }
            }
        }

        let port = *handler_port.lock().unwrap();
        let redirect_uri = port
            .map(|p| format!("http://127.0.0.1:{p}"))
            .unwrap_or_default();
        if let Some(p) = port {
            let _ = tauri_plugin_oauth::cancel(p);
        }

        let app2 = app_handle.clone();
        let verifier2 = verifier.clone();
        let expected = expected_state.clone();
        let cid2 = cid.clone();
        let csec2 = csec.clone();

        tauri::async_runtime::spawn(async move {
            let outcome: Result<()> = async {
                if got_state.as_deref() != Some(expected.as_str()) {
                    return Err(Error::OAuth("state mismatch (possible CSRF)".into()));
                }
                let code = code.ok_or_else(|| Error::OAuth("no authorization code".into()))?;
                let state = app2.state::<AppState>();
                let tokens = oauth::exchange_code(
                    &state.client,
                    &cid2,
                    &csec2,
                    &code,
                    &verifier2,
                    &redirect_uri,
                )
                .await?;
                if let Some(refresh) = &tokens.refresh_token {
                    secrets::store_refresh_token(refresh)?;
                }
                let mut auth = state.auth.lock().await;
                auth.access_token = Some(tokens.access_token);
                auth.expires_at = Some(Instant::now() + Duration::from_secs(tokens.expires_in));
                Ok(())
            }
            .await;

            let payload = match &outcome {
                Ok(()) => serde_json::json!({ "ok": true }),
                Err(e) => serde_json::json!({ "ok": false, "error": e.to_string() }),
            };
            let _ = app2.emit("google-auth", payload);
        });
    };

    let config = OauthConfig {
        ports: None,
        response: Some(SUCCESS_HTML.into()),
    };
    let port = tauri_plugin_oauth::start_with_config(config, handler)
        .map_err(|e| Error::OAuth(format!("could not start loopback server: {e}")))?;
    *port_cell.lock().unwrap() = Some(port);

    let redirect_uri = format!("http://127.0.0.1:{port}");
    let auth_url = oauth::build_auth_url(&client_id, &redirect_uri, SCOPE, &pkce.challenge, &csrf);
    open::that(auth_url).map_err(|e| Error::OAuth(format!("could not open browser: {e}")))?;

    Ok(port)
}

/// Return a valid access token, refreshing it via the stored refresh token when
/// expired. Used by the Drive commands; not exposed to the frontend.
pub async fn get_valid_access_token(state: &AppState) -> Result<String> {
    let mut auth = state.auth.lock().await;

    if let (Some(token), Some(expiry)) = (&auth.access_token, auth.expires_at) {
        if expiry > Instant::now() + Duration::from_secs(60) {
            return Ok(token.clone());
        }
    }

    let client_id = auth.client_id.clone().ok_or(Error::NotConfigured)?;
    let client_secret = auth.client_secret.clone().ok_or(Error::NotConfigured)?;
    let refresh = secrets::get_refresh_token()?.ok_or(Error::NotAuthenticated)?;

    let tokens =
        oauth::refresh_access_token(&state.client, &client_id, &client_secret, &refresh).await?;
    auth.access_token = Some(tokens.access_token.clone());
    auth.expires_at = Some(Instant::now() + Duration::from_secs(tokens.expires_in));
    Ok(tokens.access_token)
}
