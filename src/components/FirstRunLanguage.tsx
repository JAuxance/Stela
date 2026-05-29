import { UI_LANGS, useI18n, type UiLang } from "../i18n";

export function FirstRunLanguage({ onPick }: { onPick: (lang: UiLang) => void }) {
  const { t } = useI18n();
  return (
    <div className="overlay">
      <div className="dialog glass" style={{ textAlign: "center" }}>
        <div className="onboard__mark" style={{ margin: "4px auto 16px" }} />
        <h2 style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 650 }}>{t("firstRun.title")}</h2>
        <p className="dialog-hint" style={{ margin: "0 0 18px" }}>{t("firstRun.subtitle")}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {UI_LANGS.map((l) => (
            <button key={l.code} className="btn" style={{ width: "100%" }} onClick={() => onPick(l.code)}>
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
