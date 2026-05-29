import { useCallback, useEffect, useState } from "react";
import { Titlebar } from "./components/Titlebar";
import { Sidebar } from "./components/Sidebar";
import { StatusBar } from "./components/StatusBar";
import { Editor } from "./editor/Editor";
import { useDriveSync } from "./drive/syncEngine";
import { defaultLang } from "./lib/language";

function countWords(md: string): number {
  return (md.match(/[\p{L}\p{N}]+/gu) ?? []).length;
}

export function App() {
  const sync = useDriveSync();
  const [words, setWords] = useState(0);
  const [title, setTitle] = useState(sync.activeName);

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
          onConnect={sync.connect}
          onSignOut={() => void sync.disconnect()}
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

          <div className="editor-scroll">
            <div className="editor-column">
              {showTitle && (
                <input
                  className="note-title"
                  value={title}
                  placeholder="Sans titre"
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={commitTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                />
              )}
              <Editor
                noteKey={sync.noteKey}
                initialMarkdown={sync.initialMarkdown}
                editable={sync.editable}
                onChange={handleChange}
              />
            </div>
          </div>
        </main>
      </div>

      <StatusBar status={sync.status} lang={defaultLang()} words={words} />
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
