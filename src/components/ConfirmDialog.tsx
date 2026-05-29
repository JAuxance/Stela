import { Overlay } from "./VideoDialog";
import { useI18n } from "../i18n";

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onClose }: ConfirmDialogProps) {
  const { t } = useI18n();
  return (
    <Overlay title={title} onClose={onClose}>
      <p style={{ margin: "2px 2px 18px", color: "var(--text)", lineHeight: 1.55 }}>{message}</p>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button className="btn" onClick={onClose}>
          {t("action.cancel")}
        </button>
        <button
          className={`btn ${danger ? "btn--danger" : "btn--primary"}`}
          autoFocus
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Overlay>
  );
}
