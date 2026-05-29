export function formatRelative(iso?: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const min = Math.round(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return `il y a ${d} j`;
  return new Date(then).toLocaleDateString();
}

export interface NoteListItemProps {
  name: string;
  modifiedTime?: string;
  active: boolean;
  onClick: () => void;
  onDelete?: () => void;
}

export function NoteListItem({ name, modifiedTime, active, onClick, onDelete }: NoteListItemProps) {
  return (
    <div className={`note-item${active ? " note-item--active" : ""}`}>
      <button className="note-item__main" onClick={onClick} title={name}>
        <span className="note-item__name">{name.replace(/\.md$/i, "") || "Sans titre"}</span>
        <span className="note-item__meta">{formatRelative(modifiedTime)}</span>
      </button>
      {onDelete && (
        <button
          className="note-item__del"
          aria-label="Supprimer la note"
          title="Supprimer"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 4.5h10M6.5 4.5V3.2h3V4.5M5 4.5l.6 8.3h4.8L11 4.5" />
          </svg>
        </button>
      )}
    </div>
  );
}
