import { NoteListItem } from "./NoteListItem";
import type { NoteRef } from "../drive/types";

export interface SidebarProps {
  notes: NoteRef[];
  activeId: string | null;
  connected: boolean;
  busy: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onConnect: () => void;
  onSignOut: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({
  notes,
  activeId,
  connected,
  busy,
  onSelect,
  onNew,
  onDelete,
  onConnect,
  onSignOut,
  onOpenSettings,
}: SidebarProps) {
  return (
    <aside className="sidebar glass">
      <div className="sidebar__head">
        <span className="sidebar__title">Notes</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="icon-btn" aria-label="Nouvelle note" onClick={onNew} disabled={busy}>
            <svg width="15" height="15" viewBox="0 0 15 15">
              <path d="M7.5 2 V13 M2 7.5 H13" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
          <button className="icon-btn" aria-label="Réglages" title="Réglages" onClick={onOpenSettings}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="8" cy="8" r="2.2" />
              <path d="M8 1.6v1.8M8 12.6v1.8M1.6 8h1.8M12.6 8h1.8M3.5 3.5l1.3 1.3M11.2 11.2l1.3 1.3M12.5 3.5l-1.3 1.3M4.8 11.2l-1.3 1.3" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="note-list">
        {notes.length === 0 ? (
          <p className="note-item__meta" style={{ padding: "8px 11px" }}>
            {connected ? "Aucune note. Crée la première avec +." : "Connecte Drive pour voir tes notes."}
          </p>
        ) : (
          notes.map((n) => (
            <NoteListItem
              key={n.id}
              name={n.name}
              modifiedTime={n.modifiedTime}
              active={n.id === activeId}
              onClick={() => onSelect(n.id)}
              onDelete={connected ? () => onDelete(n.id) : undefined}
            />
          ))
        )}
      </div>

      <div className="sidebar__footer">
        {connected ? (
          <button className="btn" style={{ width: "100%" }} onClick={onSignOut}>
            Déconnecter Drive
          </button>
        ) : (
          <button className="btn btn--primary" style={{ width: "100%" }} onClick={onConnect}>
            <GoogleGlyph />
            Connecter Google Drive
          </button>
        )}
      </div>
    </aside>
  );
}

function GoogleGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 11v2.8h4.6c-.2 1.2-1.5 3.5-4.6 3.5a5.3 5.3 0 1 1 0-10.6c1.5 0 2.6.6 3.2 1.2l2.2-2.1A8.7 8.7 0 0 0 12 3a9 9 0 1 0 0 18c5.2 0 8.6-3.6 8.6-8.7 0-.6 0-1-.2-1.5H12Z"
      />
    </svg>
  );
}
