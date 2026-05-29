//! Thin wrappers over Google Drive REST v3 (raw reqwest, no generated client).
//! Content lives on the `/upload` host; metadata/list/changes on the main host.

use rand::{distributions::Alphanumeric, Rng};
use serde::de::DeserializeOwned;

use crate::error::{Error, Result};
use crate::google::models::{ChangeList, DriveFile, FileList, StartPageToken};

const FILES: &str = "https://www.googleapis.com/drive/v3/files";
const UPLOAD_FILES: &str = "https://www.googleapis.com/upload/drive/v3/files";
const CHANGES: &str = "https://www.googleapis.com/drive/v3/changes";
const FOLDER_MIME: &str = "application/vnd.google-apps.folder";
const MD_MIME: &str = "text/markdown";

const FILE_FIELDS: &str =
    "id,name,mimeType,modifiedTime,md5Checksum,headRevisionId,parents,appProperties";
const LIST_FIELDS: &str = "files(id,name,mimeType,modifiedTime,md5Checksum,headRevisionId,parents,appProperties)";
const CHANGE_FIELDS: &str = "newStartPageToken,nextPageToken,changes(fileId,removed,file(id,name,mimeType,modifiedTime,md5Checksum,headRevisionId,parents,appProperties,trashed))";

async fn check(resp: reqwest::Response) -> Result<reqwest::Response> {
    let status = resp.status();
    if status.is_success() {
        return Ok(resp);
    }
    if status.as_u16() == 412 {
        return Err(Error::Conflict);
    }
    let body = resp.text().await.unwrap_or_default();
    Err(Error::Drive(format!("{status}: {body}")))
}

async fn json<T: DeserializeOwned>(resp: reqwest::Response) -> Result<T> {
    Ok(check(resp).await?.json().await?)
}

fn rand_boundary() -> String {
    let suffix: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(24)
        .map(char::from)
        .collect();
    format!("stela_{suffix}")
}

/// Find the "Stela Notes" folder; create it (visible in My Drive) if missing.
pub async fn ensure_folder(client: &reqwest::Client, token: &str, name: &str) -> Result<String> {
    let q = format!(
        "mimeType = '{FOLDER_MIME}' and name = '{}' and trashed = false",
        name.replace('\'', "\\'")
    );
    let resp = client
        .get(FILES)
        .bearer_auth(token)
        .query(&[
            ("q", q.as_str()),
            ("fields", "files(id,name)"),
            ("spaces", "drive"),
            ("pageSize", "10"),
        ])
        .send()
        .await?;
    let list: FileList = json(resp).await?;
    if let Some(folder) = list.files.into_iter().next() {
        return Ok(folder.id);
    }

    let body = serde_json::json!({ "name": name, "mimeType": FOLDER_MIME });
    let resp = client
        .post(FILES)
        .bearer_auth(token)
        .query(&[("fields", "id")])
        .json(&body)
        .send()
        .await?;
    let folder: DriveFile = json(resp).await?;
    Ok(folder.id)
}

pub async fn list_notes(
    client: &reqwest::Client,
    token: &str,
    folder_id: &str,
) -> Result<Vec<DriveFile>> {
    let q = format!("'{folder_id}' in parents and trashed = false");
    let resp = client
        .get(FILES)
        .bearer_auth(token)
        .query(&[
            ("q", q.as_str()),
            ("fields", LIST_FIELDS),
            ("spaces", "drive"),
            ("orderBy", "modifiedTime desc"),
            ("pageSize", "1000"),
        ])
        .send()
        .await?;
    let list: FileList = json(resp).await?;
    Ok(list.files)
}

pub async fn read_content(client: &reqwest::Client, token: &str, file_id: &str) -> Result<String> {
    let resp = client
        .get(format!("{FILES}/{file_id}"))
        .bearer_auth(token)
        .query(&[("alt", "media")])
        .send()
        .await?;
    Ok(check(resp).await?.text().await?)
}

pub async fn get_meta(client: &reqwest::Client, token: &str, file_id: &str) -> Result<DriveFile> {
    let resp = client
        .get(format!("{FILES}/{file_id}"))
        .bearer_auth(token)
        .query(&[("fields", FILE_FIELDS)])
        .send()
        .await?;
    json(resp).await
}

pub async fn create_note(
    client: &reqwest::Client,
    token: &str,
    folder_id: &str,
    name: &str,
    content: &str,
) -> Result<DriveFile> {
    let boundary = rand_boundary();
    let metadata = serde_json::json!({
        "name": name,
        "parents": [folder_id],
        "mimeType": MD_MIME,
        "appProperties": { "app": "stela" }
    });
    let body = format!(
        "--{b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n{meta}\r\n--{b}\r\nContent-Type: {mime}\r\n\r\n{content}\r\n--{b}--",
        b = boundary,
        meta = metadata,
        mime = MD_MIME,
        content = content
    );
    let resp = client
        .post(UPLOAD_FILES)
        .bearer_auth(token)
        .query(&[("uploadType", "multipart"), ("fields", FILE_FIELDS)])
        .header(
            "Content-Type",
            format!("multipart/related; boundary={boundary}"),
        )
        .body(body)
        .send()
        .await?;
    json(resp).await
}

/// Replace a note's content (metadata unchanged). `if_match` enables optimistic
/// concurrency: a 412 from Drive surfaces as `Error::Conflict`.
pub async fn update_content(
    client: &reqwest::Client,
    token: &str,
    file_id: &str,
    content: &str,
    if_match: Option<&str>,
) -> Result<DriveFile> {
    let mut req = client
        .patch(format!("{UPLOAD_FILES}/{file_id}"))
        .bearer_auth(token)
        .query(&[("uploadType", "media"), ("fields", FILE_FIELDS)])
        .header("Content-Type", MD_MIME);
    if let Some(etag) = if_match {
        req = req.header("If-Match", etag);
    }
    let resp = req.body(content.to_string()).send().await?;
    json(resp).await
}

pub async fn rename_note(
    client: &reqwest::Client,
    token: &str,
    file_id: &str,
    name: &str,
) -> Result<DriveFile> {
    let resp = client
        .patch(format!("{FILES}/{file_id}"))
        .bearer_auth(token)
        .query(&[("fields", FILE_FIELDS)])
        .json(&serde_json::json!({ "name": name }))
        .send()
        .await?;
    json(resp).await
}

pub async fn delete_note(client: &reqwest::Client, token: &str, file_id: &str) -> Result<()> {
    let resp = client
        .delete(format!("{FILES}/{file_id}"))
        .bearer_auth(token)
        .send()
        .await?;
    check(resp).await?;
    Ok(())
}

/// Find (or create) a subfolder by name under `parent_id`. Used for "Médias".
pub async fn ensure_subfolder(
    client: &reqwest::Client,
    token: &str,
    parent_id: &str,
    name: &str,
) -> Result<String> {
    let q = format!(
        "mimeType = '{FOLDER_MIME}' and name = '{}' and '{parent_id}' in parents and trashed = false",
        name.replace('\'', "\\'")
    );
    let resp = client
        .get(FILES)
        .bearer_auth(token)
        .query(&[("q", q.as_str()), ("fields", "files(id)"), ("spaces", "drive")])
        .send()
        .await?;
    let list: FileList = json(resp).await?;
    if let Some(folder) = list.files.into_iter().next() {
        return Ok(folder.id);
    }

    let body = serde_json::json!({ "name": name, "mimeType": FOLDER_MIME, "parents": [parent_id] });
    let resp = client
        .post(FILES)
        .bearer_auth(token)
        .query(&[("fields", "id")])
        .json(&body)
        .send()
        .await?;
    let folder: DriveFile = json(resp).await?;
    Ok(folder.id)
}

/// Upload arbitrary binary (audio/video) via multipart/related.
pub async fn create_binary(
    client: &reqwest::Client,
    token: &str,
    parent_id: &str,
    name: &str,
    mime: &str,
    bytes: &[u8],
) -> Result<DriveFile> {
    let boundary = rand_boundary();
    let metadata = serde_json::json!({
        "name": name,
        "parents": [parent_id],
        "mimeType": mime,
        "appProperties": { "app": "stela", "kind": "media" }
    });

    let mut body: Vec<u8> = Vec::with_capacity(bytes.len() + 512);
    body.extend_from_slice(
        format!(
            "--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n{metadata}\r\n--{boundary}\r\nContent-Type: {mime}\r\n\r\n"
        )
        .as_bytes(),
    );
    body.extend_from_slice(bytes);
    body.extend_from_slice(format!("\r\n--{boundary}--").as_bytes());

    let resp = client
        .post(UPLOAD_FILES)
        .bearer_auth(token)
        .query(&[("uploadType", "multipart"), ("fields", FILE_FIELDS)])
        .header(
            "Content-Type",
            format!("multipart/related; boundary={boundary}"),
        )
        .body(body)
        .send()
        .await?;
    json(resp).await
}

/// Download a file's raw bytes (for media playback via a blob URL).
pub async fn download_bytes(
    client: &reqwest::Client,
    token: &str,
    file_id: &str,
) -> Result<Vec<u8>> {
    let resp = client
        .get(format!("{FILES}/{file_id}"))
        .bearer_auth(token)
        .query(&[("alt", "media")])
        .send()
        .await?;
    Ok(check(resp).await?.bytes().await?.to_vec())
}

pub async fn get_start_page_token(client: &reqwest::Client, token: &str) -> Result<String> {
    let resp = client
        .get(format!("{CHANGES}/startPageToken"))
        .bearer_auth(token)
        .query(&[("fields", "startPageToken")])
        .send()
        .await?;
    let token: StartPageToken = json(resp).await?;
    Ok(token.start_page_token)
}

pub async fn list_changes(
    client: &reqwest::Client,
    token: &str,
    page_token: &str,
) -> Result<ChangeList> {
    let resp = client
        .get(CHANGES)
        .bearer_auth(token)
        .query(&[
            ("pageToken", page_token),
            ("spaces", "drive"),
            ("includeRemoved", "true"),
            ("restrictToMyDrive", "true"),
            ("fields", CHANGE_FIELDS),
        ])
        .send()
        .await?;
    json(resp).await
}
