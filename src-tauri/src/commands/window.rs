//! Backup theme query for the webview. The frontend prefers `prefers-color-scheme`
//! + the `onThemeChanged` event, but on first paint it can ask the OS directly.

/// Returns "dark" or "light" for the OS color scheme, defaulting to "light"
/// where the platform can't report it (e.g. some Linux setups).
#[tauri::command]
pub fn os_theme(window: tauri::WebviewWindow) -> String {
    match window.theme() {
        Ok(tauri::Theme::Dark) => "dark".to_string(),
        _ => "light".to_string(),
    }
}
