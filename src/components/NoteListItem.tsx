import { useI18n, type TFn } from "../i18n";

function formatRelative(iso: string | undefined, t: TFn): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const min = Math.round((Date.now() - then) / 60000);
  if (min < 1) return t("time.now");
  if (min < 60) return t("time.min", { n: min });
  const h = Math.round(min / 60);
  if (h < 24) return t("time.hour", { n: h });
  const d = Math.round(h / 24);
  if (d < 7) return t("time.day", { n: d });
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
  const { t } = useI18n();
  return (
    <div className={`note-item${active ? " note-item--active" : ""}`}>
      <button className="note-item__main" onClick={onClick} title={name}>
        <span className="note-item__name">{name.replace(/\.md$/i, "") || t("note.untitled")}</span>
        <span className="note-item__meta">{formatRelative(modifiedTime, t)}</span>
      </button>
      {onDelete && (
        <button
          className="note-item__del"
          aria-label={t("note.deleteAria")}
          title={t("action.delete")}
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
