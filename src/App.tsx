import { useCallback, useEffect, useState } from "react";
import { Titlebar } from "./components/Titlebar";
import { Sidebar } from "./components/Sidebar";
import { StatusBar } from "./components/StatusBar";
import { Settings } from "./components/Settings";
import { Editor } from "./editor/Editor";
import { useDriveSync } from "./drive/syncEngine";
import { resolvedLang, LANG_CHANGED_EVENT } from "./lib/language";

function countWords(md: string): number {
  return (md.match(/[\p{L}\p{N}]+/gu) ?? []).length;
}

export function App() {
  const sync = useDriveSync();
  const [words, setWords] = useState(0);
  const [title, setTitle] = useState(sync.activeName);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lang, setLang] = useState(resolvedLang());

  useEffect(() => {
    const onLang = () => setLang(resolvedLang());
    window.addEventListener(LANG_CHANGED_EVENT, onLang);
    return () => window.removeEventListener(LANG_CHANGED_EVENT, onLang);
  }, []);

  // Reset the title field whenever a different note loads.
  useEffect(() => {
    setTitle(sync.activeName.replace(/\.md$/i, ""));
    setWords(countWords(sync.initialMarkdown));
  }, [sync.noteKey, sync.activeName, sync.initialMarkdown]);

  const handleChange = useCallback(
    (markdown: string) => {
      setWords(countWords(markdown));
      sync.onContentChange(markdown);
    },
    [sync],
  );

  const commitTitle = () => {
    if (sync.connected && sync.activeId) void sync.renameActive(title);
  };

  const showTitle = sync.connected && !!sync.activeId;
  const noteName = sync.connected && sync.activeId ? sync.activeName.replace(/\.md$/i, "") : undefined;

  return (
    <div className="app-surface">
      <Titlebar noteName={noteName} />

      <div className="workspace">
        <Sidebar
          notes={sync.notes}
          activeId={sync.activeId}
          connected={sync.connected}
          busy={sync.status === "connecting" || sync.status === "loading"}
          onSelect={(id) => void sync.selectNote(id)}
          onNew={() => void sync.newNote()}
          onDelete={(id) => {
            if (window.confirm("Supprimer définitivement cette note de Google Drive ?")) {
              void sync.removeNote(id);
            }
          }}
          onConnect={sync.connect}
          onSignOut={() => void sync.disconnect()}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <main className="main">
          {!sync.hasCreds && (
            <Banner tone="info">
              Google Drive n'est pas configuré (fichier <code>.env</code>). Tu peux écrire un
              brouillon local ; configure tes identifiants pour sauvegarder. Voir le README.
            </Banner>
          )}

          {sync.status === "connecting" && (
            <Banner tone="info">Connexion à Google Drive… termine l'autorisation dans ton navigateur.</Banner>
          )}

          {sync.status === "error" && (
            <Banner tone="warn">
              <span style={{ flex: 1, minWidth: 200, wordBreak: "break-word" }}>
                {sync.lastError ?? "Erreur de synchronisation."}
              </span>
              <button className="btn" style={{ height: 30 }} onClick={sync.connect}>
                Réessayer la connexion
              </button>
            </Banner>
          )}

          {sync.status === "conflict" && (
            <Banner tone="warn">
              Cette note a été modifiée ailleurs.
              <button className="btn" style={{ height: 30 }} onClick={() => void sync.resolveConflict()}>
                Recharger depuis Drive
              </button>
              <button
                className="btn"
                style={{ height: 30 }}
                onClick={() => void sync.keepLocal()}
              >
                Écraser avec ma version
              </button>
            </Banner>
          )}

          <Editor
            noteKey={sync.noteKey}
            initialMarkdown={sync.initialMarkdown}
            editable={sync.editable}
            onChange={handleChange}
            canUpload={sync.connected}
            showTitle={showTitle}
            title={title}
            onTitleChange={setTitle}
            onTitleCommit={commitTitle}
          />
        </main>
      </div>

      <StatusBar status={sync.status} lang={lang} words={words} />

      {settingsOpen && (
        <Settings
          connected={sync.connected}
          folderName={sync.folderName}
          onChangeFolder={(name) => void sync.changeFolder(name)}
          onConnect={() => {
            setSettingsOpen(false);
            sync.connect();
          }}
          onSignOut={() => void sync.disconnect()}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

function Banner({ tone, children }: { tone: "info" | "warn"; children: React.ReactNode }) {
  const color = tone === "warn" ? "var(--danger)" : "var(--text-soft)";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        padding: "10px 18px",
        borderBottom: "1px solid var(--line)",
        fontSize: 13,
        color,
      }}
    >
      {children}
    </div>
  );
}
