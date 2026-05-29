import type { SyncStatus } from "../drive/types";
import { LANG_LABEL, type Lang } from "../lib/language";
import { useI18n } from "../i18n";

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
  const { t } = useI18n();
  return (
    <div className="statusbar glass">
      <span className={dotClass(status)} />
      <span>{t(`status.${status}`)}</span>
      <span className="statusbar__spacer" />
      <span>{t("status.words", { n: words })}</span>
      <span>·</span>
      <span title="Spellcheck language">{LANG_LABEL[lang]}</span>
    </div>
  );
}
