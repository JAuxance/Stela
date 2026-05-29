import { useState, type ReactNode } from "react";
import { Overlay } from "./VideoDialog";
import { getLangPref, setLangPref, type LangPref } from "../lib/language";
import { getThemePref, setThemePref, type ThemePref } from "../theme/useSystemTheme";
import { useI18n, UI_LANGS } from "../i18n";

export interface SettingsProps {
  connected: boolean;
  folderName: string;
  onChangeFolder: (name: string) => void;
  onConnect: () => void;
  onSignOut: () => void;
  onClose: () => void;
}

export function Settings({
  connected,
  folderName,
  onChangeFolder,
  onConnect,
  onSignOut,
  onClose,
}: SettingsProps) {
  const { t, lang: uiLang, setLang: setUiLang } = useI18n();
  const [folder, setFolder] = useState(folderName);
  const [spellLang, setSpellLang] = useState<LangPref>(getLangPref());
  const [themePref, setTheme] = useState<ThemePref>(getThemePref());

  const folderDirty = folder.trim().length > 0 && folder.trim() !== folderName;

  return (
    <Overlay title={t("settings.title")} onClose={onClose}>
      <div className="settings">
        <Section title={t("settings.account")}>
          <Row label={connected ? t("settings.connected") : t("settings.disconnected")}>
            {connected ? (
              <button className="btn settings-btn" onClick={onSignOut}>
                {t("action.disconnect")}
              </button>
            ) : (
              <button className="btn btn--primary settings-btn" onClick={onConnect}>
                {t("action.connect")}
              </button>
            )}
          </Row>
        </Section>

        <Section title={t("settings.storage")} hint={t("settings.storageHint")}>
          <Row label={t("settings.folder")}>
            <input
              className="settings-input"
              value={folder}
              placeholder="Stela Notes"
              onChange={(e) => setFolder(e.target.value)}
            />
          </Row>
          <div className="settings-actions">
            <button
              className="btn btn--primary settings-btn"
              disabled={!folderDirty}
              onClick={() => folderDirty && onChangeFolder(folder.trim())}
            >
              {t("action.apply")}
            </button>
          </div>
          <p className="settings-hint">{t("settings.storageNote")}</p>
        </Section>

        <Section title={t("settings.interface")}>
          <Row label={t("settings.uiLanguage")}>
            <select
              className="settings-select"
              value={uiLang}
              onChange={(e) => setUiLang(e.target.value as typeof uiLang)}
            >
              {UI_LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </Row>
          <Row label={t("settings.theme")}>
            <select
              className="settings-select"
              value={themePref}
              onChange={(e) => {
                const v = e.target.value as ThemePref;
                setTheme(v);
                setThemePref(v);
              }}
            >
              <option value="system">{t("theme.system")}</option>
              <option value="light">{t("theme.light")}</option>
              <option value="dark">{t("theme.dark")}</option>
            </select>
          </Row>
        </Section>

        <Section title={t("settings.spellcheck")} hint={t("settings.spellHintTitle")}>
          <Row label={t("settings.language")}>
            <select
              className="settings-select"
              value={spellLang}
              onChange={(e) => {
                const v = e.target.value as LangPref;
                setSpellLang(v);
                setLangPref(v);
              }}
            >
              <option value="auto">{t("settings.langAuto")}</option>
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </Row>
          <p className="settings-hint">{t("settings.spellHint")}</p>
        </Section>

        <Section title={t("settings.about")}>
          <Row label={t("settings.version")}>
            <span className="settings-value">Stela 0.1.0</span>
          </Row>
        </Section>
      </div>
    </Overlay>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="settings-section">
      <div className="settings-section__title">{title}</div>
      <div className="settings-group">{children}</div>
      {hint && <p className="settings-hint">{hint}</p>}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="settings-row">
      <span className="settings-label">{label}</span>
      <div className="settings-control">{children}</div>
    </div>
  );
}
