use std::time::Instant;
use tokio::sync::Mutex;

/// In-memory auth state. The long-lived refresh token lives in the OS keychain
/// (see `secrets`); only the short-lived access token is cached here.
#[derive(Default)]
pub struct AuthState {
    pub client_id: Option<String>,
    pub client_secret: Option<String>,
    pub access_token: Option<String>,
    pub expires_at: Option<Instant>,
}

/// Shared application state managed by Tauri.
pub struct AppState {
    /// Reused HTTPS client for the token endpoint and Drive REST v3.
    pub client: reqwest::Client,
    pub auth: Mutex<AuthState>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::new(),
            auth: Mutex::new(AuthState::default()),
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
