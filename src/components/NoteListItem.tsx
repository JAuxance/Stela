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
}

export function NoteListItem({ name, modifiedTime, active, onClick }: NoteListItemProps) {
  return (
    <button
      className={`note-item${active ? " note-item--active" : ""}`}
      onClick={onClick}
      title={name}
    >
      <span className="note-item__name">{name.replace(/\.md$/i, "") || "Sans titre"}</span>
      <span className="note-item__meta">{formatRelative(modifiedTime)}</span>
    </button>
  );
}
