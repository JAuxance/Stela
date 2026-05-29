use std::collections::HashMap;

use serde::{Deserialize, Serialize};

/// Response from the Google OAuth token endpoint.
#[derive(Debug, Deserialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub expires_in: u64,
    #[serde(default)]
    pub refresh_token: Option<String>,
}

/// A Drive file as returned by the REST v3 API (subset of fields we request).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveFile {
    pub id: String,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub mime_type: Option<String>,
    #[serde(default)]
    pub modified_time: Option<String>,
    #[serde(default)]
    pub md5_checksum: Option<String>,
    #[serde(default)]
    pub head_revision_id: Option<String>,
    #[serde(default)]
    pub trashed: Option<bool>,
    #[serde(default)]
    pub parents: Option<Vec<String>>,
    #[serde(default)]
    pub app_properties: Option<HashMap<String, String>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileList {
    #[serde(default)]
    pub files: Vec<DriveFile>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartPageToken {
    pub start_page_token: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangeItem {
    #[serde(default)]
    pub file_id: Option<String>,
    #[serde(default)]
    pub removed: Option<bool>,
    #[serde(default)]
    pub file: Option<DriveFile>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangeList {
    #[serde(default)]
    pub changes: Vec<ChangeItem>,
    #[serde(default)]
    pub new_start_page_token: Option<String>,
    #[serde(default)]
    pub next_page_token: Option<String>,
}

/// Result of a `poll_changes` call returned to the frontend.
#[derive(Debug, Serialize)]
pub struct ChangeResult {
    pub changes: Vec<ChangeItem>,
    pub new_token: String,
}
