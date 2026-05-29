use tauri::{AppHandle, State};
use tauri_plugin_store::StoreExt;

use crate::commands::auth::get_valid_access_token;
use crate::error::Result;
use crate::google::drive_api;
use crate::google::models::{ChangeResult, DriveFile};
use crate::state::AppState;

const STORE_FILE: &str = "stela.json";
const FOLDER_NAME: &str = "Stela Notes";

fn store_get(app: &AppHandle, key: &str) -> Option<String> {
    let store = app.store(STORE_FILE).ok()?;
    store
        .get(key)
        .and_then(|v| v.as_str().map(str::to_string))
}

fn store_put(app: &AppHandle, key: &str, value: &str) {
    if let Ok(store) = app.store(STORE_FILE) {
        store.set(key, serde_json::Value::String(value.to_string()));
        let _ = store.save();
    }
}

async fn folder_id(app: &AppHandle, state: &AppState, token: &str) -> Result<String> {
    if let Some(id) = store_get(app, "folderId") {
        return Ok(id);
    }
    let id = drive_api::ensure_folder(&state.client, token, FOLDER_NAME).await?;
    store_put(app, "folderId", &id);
    Ok(id)
}

#[tauri::command]
pub async fn ensure_notes_folder(app: AppHandle, state: State<'_, AppState>) -> Result<String> {
    let token = get_valid_access_token(state.inner()).await?;
    folder_id(&app, state.inner(), &token).await
}

#[tauri::command]
pub async fn list_notes(app: AppHandle, state: State<'_, AppState>) -> Result<Vec<DriveFile>> {
    let token = get_valid_access_token(state.inner()).await?;
    let folder = folder_id(&app, state.inner(), &token).await?;
    drive_api::list_notes(&state.client, &token, &folder).await
}

#[tauri::command]
pub async fn read_note(state: State<'_, AppState>, file_id: String) -> Result<String> {
    let token = get_valid_access_token(state.inner()).await?;
    drive_api::read_content(&state.client, &token, &file_id).await
}

#[tauri::command]
pub async fn create_note(
    app: AppHandle,
    state: State<'_, AppState>,
    name: String,
    content: String,
) -> Result<DriveFile> {
    let token = get_valid_access_token(state.inner()).await?;
    let folder = folder_id(&app, state.inner(), &token).await?;
    drive_api::create_note(&state.client, &token, &folder, &name, &content).await
}

#[tauri::command]
pub async fn update_note(
    state: State<'_, AppState>,
    file_id: String,
    content: String,
    last_known_md5: Option<String>,
) -> Result<DriveFile> {
    let token = get_valid_access_token(state.inner()).await?;

    // Optimistic conflict check: if the remote checksum drifted from what the
    // client last saw, refuse the write so the UI can prompt to merge/reload.
    if let Some(known) = last_known_md5.as_deref() {
        let meta = drive_api::get_meta(&state.client, &token, &file_id).await?;
        if let Some(remote) = meta.md5_checksum.as_deref() {
            if remote != known {
                return Err(crate::error::Error::Conflict);
            }
        }
    }

    drive_api::update_content(&state.client, &token, &file_id, &content, None).await
}

#[tauri::command]
pub async fn rename_note(
    state: State<'_, AppState>,
    file_id: String,
    name: String,
) -> Result<DriveFile> {
    let token = get_valid_access_token(state.inner()).await?;
    drive_api::rename_note(&state.client, &token, &file_id, &name).await
}

#[tauri::command]
pub async fn delete_note(state: State<'_, AppState>, file_id: String) -> Result<()> {
    let token = get_valid_access_token(state.inner()).await?;
    drive_api::delete_note(&state.client, &token, &file_id).await
}

/// Poll Drive for remote changes since the last stored page token so the UI can
/// refresh notes edited from another device or the web.
#[tauri::command]
pub async fn poll_changes(app: AppHandle, state: State<'_, AppState>) -> Result<ChangeResult> {
    let token = get_valid_access_token(state.inner()).await?;

    let page = match store_get(&app, "pageToken") {
        Some(p) => p,
        None => {
            let start = drive_api::get_start_page_token(&state.client, &token).await?;
            store_put(&app, "pageToken", &start);
            start
        }
    };

    let changes = drive_api::list_changes(&state.client, &token, &page).await?;
    let new_token = changes
        .new_start_page_token
        .clone()
        .or_else(|| changes.next_page_token.clone())
        .unwrap_or_else(|| page.clone());
    store_put(&app, "pageToken", &new_token);

    Ok(ChangeResult {
        changes: changes.changes,
        new_token,
    })
}
