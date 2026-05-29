import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { debounce } from "../lib/debounce";
import { inTauri } from "../lib/ipc";
import { getCached, setCached, clearCache } from "./cache";
import { toNoteRef, type NoteRef, type SyncStatus } from "./types";
import * as drive from "./driveClient";

const POLL_INTERVAL_MS = 15_000;
const SAVE_DEBOUNCE_MS = 1500;
const DRAFT_TEMPLATE = "# Nouvelle note\n\n";

export interface DriveSync {
  status: SyncStatus;
  connected: boolean;
  hasCreds: boolean;
  notes: NoteRef[];
  activeId: string | null;
  activeName: string;
  /** id + nonce; changes force the editor to reload its content. */
  noteKey: string;
  initialMarkdown: string;
  editable: boolean;
  connect: () => void;
  disconnect: () => Promise<void>;
  selectNote: (id: string) => Promise<void>;
  newNote: () => Promise<void>;
  deleteActive: () => Promise<void>;
  removeNote: (id: string) => Promise<void>;
  renameActive: (name: string) => Promise<void>;
  /** Drive folder name notes are stored under. */
  folderName: string;
  changeFolder: (name: string) => Promise<void>;
  onContentChange: (markdown: string) => void;
  /** Discard local edits and reload the note from Drive. */
  resolveConflict: () => Promise<void>;
  /** Overwrite Drive with the local version, resolving a conflict in our favor. */
  keepLocal: () => Promise<void>;
  /** Human-readable detail of the last failure (for the error banner). */
  lastError: string | null;
}

function isConflict(err: unknown): boolean {
  return String(err).toLowerCase().includes("conflict");
}

export function useDriveSync(): DriveSync {
  const hasCreds = drive.hasCredentials() && inTauri();

  const [status, setStatus] = useState<SyncStatus>(hasCreds ? "idle" : "offline");
  const [connected, setConnected] = useState(false);
  const [notes, setNotes] = useState<NoteRef[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeName, setActiveName] = useState("Brouillon");
  const [initialMarkdown, setInitialMarkdown] = useState(DRAFT_TEMPLATE);
  const [nonce, setNonce] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("Stela Notes");

  // Refs mirror state for use inside async callbacks / intervals.
  const connectedRef = useRef(false);
  const notesRef = useRef<NoteRef[]>([]);
  const activeIdRef = useRef<string | null>(null);
  const contentRef = useRef(DRAFT_TEMPLATE);
  const savedContentRef = useRef(DRAFT_TEMPLATE);
  const activeMd5Ref = useRef<string | undefined>(undefined);

  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  const reload = useCallback((content: string, name: string, id: string | null, md5?: string) => {
    contentRef.current = content;
    savedContentRef.current = content;
    activeMd5Ref.current = md5;
    activeIdRef.current = id;
    setActiveId(id);
    setActiveName(name);
    setInitialMarkdown(content);
    setNonce((n) => n + 1);
  }, []);

  const refreshList = useCallback(async () => {
    const files = await drive.listNotes();
    setNotes(files.map(toNoteRef));
  }, []);

  // --- saving (debounced write-through) ------------------------------------
  const saveNow = useCallback(async () => {
    const id = activeIdRef.current;
    if (!id || !connectedRef.current) return;
    if (contentRef.current === savedContentRef.current) return; // not dirty
    const content = contentRef.current;
    setStatus("saving");
    try {
      const updated = await drive.updateNote(id, content, activeMd5Ref.current);
      activeMd5Ref.current = updated.md5Checksum;
      savedContentRef.current = content;
      setCached(id, content, updated.md5Checksum);
      setNotes((ns) =>
        ns.map((n) =>
          n.id === id
            ? { ...n, modifiedTime: updated.modifiedTime, md5: updated.md5Checksum }
            : n,
        ),
      );
      setStatus("saved");
    } catch (err) {
      setStatus(isConflict(err) ? "conflict" : "error");
    }
  }, []);

  const debouncedSave = useMemo(() => debounce(() => void saveNow(), SAVE_DEBOUNCE_MS), [saveNow]);

  const onContentChange = useCallback(
    (markdown: string) => {
      contentRef.current = markdown;
      if (connectedRef.current && activeIdRef.current) debouncedSave();
    },
    [debouncedSave],
  );

  // --- note operations ------------------------------------------------------
  const selectNote = useCallback(
    async (id: string) => {
      debouncedSave.flush();
      const ref = notesRef.current.find((n) => n.id === id);
      setStatus("loading");
      try {
        let content = getCached(id, ref?.md5);
        if (content == null) {
          content = await drive.readNote(id);
          setCached(id, content, ref?.md5);
        }
        reload(content, ref?.name ?? "Sans titre.md", id, ref?.md5);
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    },
    [debouncedSave, reload],
  );

  const newNote = useCallback(async () => {
    debouncedSave.flush();
    if (!connectedRef.current) {
      reload(DRAFT_TEMPLATE, "Brouillon", null);
      return;
    }
    setStatus("saving");
    try {
      const n = notesRef.current.length + 1;
      const created = await drive.createNote(`Sans titre ${n}.md`, DRAFT_TEMPLATE);
      const ref = toNoteRef(created);
      setNotes((ns) => [ref, ...ns]);
      setCached(created.id, DRAFT_TEMPLATE, created.md5Checksum);
      reload(DRAFT_TEMPLATE, ref.name, created.id, created.md5Checksum);
      setStatus("saved");
    } catch (err) {
      setStatus(isConflict(err) ? "conflict" : "error");
    }
  }, [debouncedSave, reload]);

  const deleteActive = useCallback(async () => {
    const id = activeIdRef.current;
    if (!id || !connectedRef.current) return;
    debouncedSave.cancel();
    try {
      await drive.deleteNote(id);
      const remaining = notesRef.current.filter((n) => n.id !== id);
      setNotes(remaining);
      if (remaining[0]) await selectNote(remaining[0].id);
      else reload(DRAFT_TEMPLATE, "Brouillon", null);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [debouncedSave, reload, selectNote]);

  const renameActive = useCallback(async (name: string) => {
    const trimmed = name.trim();
    const finalName = trimmed ? (/\.md$/i.test(trimmed) ? trimmed : `${trimmed}.md`) : "";
    if (!finalName) return;
    setActiveName(finalName);
    const id = activeIdRef.current;
    if (!id || !connectedRef.current) return;
    try {
      const updated = await drive.renameNote(id, finalName);
      setNotes((ns) =>
        ns.map((n) =>
          n.id === id ? { ...n, name: updated.name ?? finalName, modifiedTime: updated.modifiedTime } : n,
        ),
      );
    } catch {
      setStatus("error");
    }
  }, []);

  const removeNote = useCallback(
    async (id: string) => {
      if (!connectedRef.current) return;
      try {
        await drive.deleteNote(id);
        const remaining = notesRef.current.filter((n) => n.id !== id);
        setNotes(remaining);
        if (activeIdRef.current === id) {
          if (remaining[0]) await selectNote(remaining[0].id);
          else reload(DRAFT_TEMPLATE, "Brouillon", null);
        }
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    },
    [reload, selectNote],
  );

  const changeFolder = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      try {
        await drive.setNotesFolder(trimmed);
        setFolderName(trimmed);
        if (connectedRef.current) {
          setStatus("loading");
          await drive.ensureNotesFolder();
          await refreshList();
          reload(DRAFT_TEMPLATE, "Brouillon", null);
          setStatus("idle");
        }
      } catch {
        setStatus("error");
      }
    },
    [refreshList, reload],
  );

  const resolveConflict = useCallback(async () => {
    const id = activeIdRef.current;
    if (!id) return;
    setStatus("loading");
    try {
      const content = await drive.readNote(id);
      const meta = notesRef.current.find((n) => n.id === id);
      reload(content, meta?.name ?? activeName, id, meta?.md5);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [activeName, reload]);

  const keepLocal = useCallback(async () => {
    const id = activeIdRef.current;
    if (!id) return;
    setStatus("saving");
    try {
      // No If-Match guard -> overwrite the remote with our content.
      const updated = await drive.updateNote(id, contentRef.current, undefined);
      activeMd5Ref.current = updated.md5Checksum;
      savedContentRef.current = contentRef.current;
      setCached(id, contentRef.current, updated.md5Checksum);
      setNotes((ns) =>
        ns.map((n) =>
          n.id === id ? { ...n, modifiedTime: updated.modifiedTime, md5: updated.md5Checksum } : n,
        ),
      );
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, []);

  // --- connect / disconnect -------------------------------------------------
  const connect = useCallback(() => {
    if (!hasCreds) return;
    setLastError(null);
    setStatus("connecting");
    void drive.startGoogleAuth().catch((e) => {
      setLastError(String(e?.message ?? e));
      setStatus("error");
    });
  }, [hasCreds]);

  const disconnect = useCallback(async () => {
    debouncedSave.cancel();
    try {
      await drive.signOut();
    } catch {
      /* ignore */
    }
    clearCache();
    setConnected(false);
    setNotes([]);
    reload(DRAFT_TEMPLATE, "Brouillon", null);
    setStatus("offline");
  }, [debouncedSave, reload]);

  // --- startup: configure, restore session, subscribe to auth result --------
  useEffect(() => {
    if (!hasCreds) return;
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        await drive.configure();
        try {
          const name = await drive.getNotesFolder();
          if (!cancelled && name) setFolderName(name);
        } catch {
          /* keep default */
        }
        const authed = await drive.isAuthenticated();
        if (cancelled) return;
        if (authed) {
          setConnected(true);
          await refreshList();
          setStatus("idle");
        }
      } catch {
        /* leave in idle/offline */
      }
      unlisten = await drive.onAuthResult(async (ok, error) => {
        if (ok) {
          setConnected(true);
          try {
            await refreshList();
            setStatus("idle");
          } catch {
            setStatus("error");
          }
        } else {
          console.error("Google auth failed:", error);
          setLastError(error ?? "échec de l'authentification Google");
          setStatus("error");
        }
      });
    })();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [hasCreds, refreshList]);

  // --- background polling for remote changes --------------------------------
  useEffect(() => {
    if (!connected) return;
    const timer = setInterval(async () => {
      try {
        const { changes } = await drive.pollChanges();
        if (changes.length === 0) return;
        await refreshList();

        const activeChange = changes.find((c) => c.fileId === activeIdRef.current);
        if (activeChange && activeIdRef.current) {
          const remoteMd5 = activeChange.file?.md5Checksum;
          if (remoteMd5 && remoteMd5 !== activeMd5Ref.current) {
            const dirty = contentRef.current !== savedContentRef.current;
            if (dirty) setStatus("conflict");
            else await resolveConflict();
          }
        }
      } catch {
        /* transient; try again next tick */
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [connected, refreshList, resolveConflict]);

  const noteKey = `${activeId ?? "draft"}:${nonce}`;
  const editable = connected || !hasCreds; // offline draft is editable; "connecting" locks it

  return {
    status,
    connected,
    hasCreds,
    notes,
    activeId,
    activeName,
    noteKey,
    initialMarkdown,
    editable,
    connect,
    disconnect,
    selectNote,
    newNote,
    deleteActive,
    removeNote,
    renameActive,
    folderName,
    changeFolder,
    onContentChange,
    resolveConflict,
    keepLocal,
    lastError,
  };
}
