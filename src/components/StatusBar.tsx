import type { SyncStatus } from "../drive/types";
import { LANG_LABEL, type Lang } from "../lib/language";

const STATUS_TEXT: Record<SyncStatus, string> = {
  offline: "Hors ligne (brouillon local)",
  connecting: "Connexion…",
  idle: "Prêt",
  loading: "Chargement…",
  saving: "Enregistrement…",
  saved: "Enregistré sur Drive",
  error: "Erreur de synchro",
  conflict: "Conflit — note modifiée ailleurs",
};

function dotClass(status: SyncStatus): string {
  if (status === "saved" || status === "idle") return "statusbar__dot statusbar__dot--ok";
  if (status === "error" || status === "conflict") return "statusbar__dot statusbar__dot--err";
  if (status === "offline") return "statusbar__dot statusbar__dot--warn";
  return "statusbar__dot";
}

export interface StatusBarProps {
  status: SyncStatus;
  lang: Lang;
  words: number;
}

export function StatusBar({ status, lang, words }: StatusBarProps) {
  return (
    <div className="statusbar glass">
      <span className={dotClass(status)} />
      <span>{STATUS_TEXT[status]}</span>
      <span className="statusbar__spacer" />
      <span>{words} mots</span>
      <span>·</span>
      <span title="Langue de correction détectée">{LANG_LABEL[lang]}</span>
    </div>
  );
}
