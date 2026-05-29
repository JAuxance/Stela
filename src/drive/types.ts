export interface DriveFile {
  id: string;
  name?: string;
  mimeType?: string;
  modifiedTime?: string;
  md5Checksum?: string;
  headRevisionId?: string;
  trashed?: boolean;
  parents?: string[];
  appProperties?: Record<string, string>;
}

export interface ChangeItem {
  fileId?: string;
  removed?: boolean;
  file?: DriveFile;
}

export interface ChangeResult {
  changes: ChangeItem[];
  new_token: string;
}

/** Lightweight note descriptor used by the sidebar. */
export interface NoteRef {
  id: string;
  name: string;
  modifiedTime?: string;
  md5?: string;
}

export type SyncStatus =
  | "offline"
  | "connecting"
  | "idle"
  | "loading"
  | "saving"
  | "saved"
  | "error"
  | "conflict";

export function toNoteRef(f: DriveFile): NoteRef {
  return {
    id: f.id,
    name: f.name ?? "Sans titre.md",
    modifiedTime: f.modifiedTime,
    md5: f.md5Checksum,
  };
}
