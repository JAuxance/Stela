use serde::{Serialize, Serializer};

/// Unified error type for all Tauri commands. Serializes to a plain string so
/// the webview receives a readable message in `catch`.
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("network error: {0}")]
    Http(#[from] reqwest::Error),

    #[error("keychain error: {0}")]
    Keyring(#[from] keyring::Error),

    #[error("serialization error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("oauth error: {0}")]
    OAuth(String),

    #[error("Google Drive is not configured (missing client id/secret)")]
    NotConfigured,

    #[error("not connected to Google Drive")]
    NotAuthenticated,

    #[error("conflict: the note changed on Drive since it was last read")]
    Conflict,

    #[error("Drive API error: {0}")]
    Drive(String),
}

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

pub type Result<T> = std::result::Result<T, Error>;
