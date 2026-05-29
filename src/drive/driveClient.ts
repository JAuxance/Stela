import { invoke, inTauri } from "../lib/ipc";
import type { ChangeResult, DriveFile } from "./types";

/** Google OAuth client credentials, injected at build time from `.env` (VITE_*). */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
export const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET ?? "";

export function hasCredentials(): boolean {
  return GOOGLE_CLIENT_ID.length > 0 && GOOGLE_CLIENT_SECRET.length > 0;
}

export const configure = () =>
  invoke<void>("configure", {
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
  });

export const isAuthenticated = () => invoke<boolean>("is_authenticated");
export const signOut = () => invoke<void>("sign_out");

export const startGoogleAuth = () =>
  invoke<number>("start_google_auth", {
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
  });

export const ensureNotesFolder = () => invoke<string>("ensure_notes_folder");
export const listNotes = () => invoke<DriveFile[]>("list_notes");
export const readNote = (fileId: string) => invoke<string>("read_note", { fileId });

export const createNote = (name: string, content: string) =>
  invoke<DriveFile>("create_note", { name, content });

export const updateNote = (fileId: string, content: string, lastKnownMd5?: string) =>
  invoke<DriveFile>("update_note", { fileId, content, lastKnownMd5: lastKnownMd5 ?? null });

export const renameNote = (fileId: string, name: string) =>
  invoke<DriveFile>("rename_note", { fileId, name });

export const deleteNote = (fileId: string) => invoke<void>("delete_note", { fileId });
export const pollChanges = () => invoke<ChangeResult>("poll_changes");

/** Subscribe to the backend's OAuth completion event. */
export async function onAuthResult(
  cb: (ok: boolean, error?: string) => void,
): Promise<() => void> {
  if (!inTauri()) return () => {};
  const { listen } = await import("@tauri-apps/api/event");
  const unlisten = await listen<{ ok: boolean; error?: string }>("google-auth", (e) => {
    cb(e.payload.ok, e.payload.error);
  });
  return unlisten;
}
