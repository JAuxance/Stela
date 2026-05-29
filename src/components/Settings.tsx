import { useState, type ReactNode } from "react";
import { Overlay } from "./VideoDialog";
import { getLangPref, setLangPref, type LangPref } from "../lib/language";
import { useTheme } from "../theme/ThemeProvider";

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
  const theme = useTheme();
  const [folder, setFolder] = useState(folderName);
  const [lang, setLang] = useState<LangPref>(getLangPref());

  const folderDirty = folder.trim().length > 0 && folder.trim() !== folderName;

  return (
    <Overlay title="Réglages" onClose={onClose}>
      <div className="settings">
        <Section title="Compte Google Drive">
          <Row label={connected ? "Connecté" : "Non connecté"}>
            {connected ? (
              <button className="btn settings-btn" onClick={onSignOut}>
                Déconnecter
              </button>
            ) : (
              <button className="btn btn--primary settings-btn" onClick={onConnect}>
                Connecter
              </button>
            )}
          </Row>
        </Section>

        <Section title="Stockage" hint="Dossier Google Drive où tes notes .md sont créées et lues.">
          <Row label="Dossier">
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
              Appliquer
            </button>
          </div>
          <p className="settings-hint">
            Changer de dossier recharge la liste des notes. (Avec le périmètre <code>drive.file</code>,
            l'app gère ses propres dossiers ; choisir un dossier Drive existant arbitraire nécessiterait
            le Google Picker.)
          </p>
        </Section>

        <Section title="Correction orthographique" hint="Langue par défaut quand la détection automatique n'est pas sûre.">
          <Row label="Langue">
            <select
              className="settings-select"
              value={lang}
              onChange={(e) => {
                const v = e.target.value as LangPref;
                setLang(v);
                setLangPref(v);
              }}
            >
              <option value="auto">Auto (système)</option>
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </Row>
          <p className="settings-hint">Prend effet à l'ouverture de la prochaine note.</p>
        </Section>

        <Section title="Apparence">
          <Row label="Thème">
            <span className="settings-value">Suit le système · {theme === "dark" ? "Sombre" : "Clair"}</span>
          </Row>
        </Section>

        <Section title="À propos">
          <Row label="Version">
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
