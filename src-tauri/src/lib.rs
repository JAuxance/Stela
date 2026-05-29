mod commands;
mod error;
mod google;
mod secrets;
mod state;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_oauth::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            commands::auth::configure,
            commands::auth::is_authenticated,
            commands::auth::sign_out,
            commands::auth::start_google_auth,
            commands::drive::ensure_notes_folder,
            commands::drive::list_notes,
            commands::drive::read_note,
            commands::drive::create_note,
            commands::drive::update_note,
            commands::drive::rename_note,
            commands::drive::delete_note,
            commands::drive::poll_changes,
            commands::drive::upload_media,
            commands::drive::download_media,
            commands::window::os_theme,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Stela");
}
