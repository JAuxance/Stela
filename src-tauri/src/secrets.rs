//! Refresh-token storage in the OS keychain (Windows Credential Manager on the
//! shipped target; Secret Service / keyutils on Linux; Keychain on macOS).
//! Never stored in plaintext on disk.

use crate::error::Result;
use keyring::Entry;

const SERVICE: &str = "app.stela.notes";
const ACCOUNT: &str = "google-refresh-token";

fn entry() -> Result<Entry> {
    Ok(Entry::new(SERVICE, ACCOUNT)?)
}

pub fn store_refresh_token(token: &str) -> Result<()> {
    entry()?.set_password(token)?;
    Ok(())
}

pub fn get_refresh_token() -> Result<Option<String>> {
    match entry()?.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

pub fn delete_refresh_token() -> Result<()> {
    match entry()?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.into()),
    }
}
