import { useCallback, useEffect, useState } from "react";
import { Titlebar } from "./components/Titlebar";
import { Sidebar } from "./components/Sidebar";
import { StatusBar } from "./components/StatusBar";
import { Settings } from "./components/Settings";
import { Tabs } from "./components/Tabs";
import { FirstRunLanguage } from "./components/FirstRunLanguage";
import { Editor } from "./editor/Editor";
import { useDriveSync } from "./drive/syncEngine";
import { resolvedLang, LANG_CHANGED_EVENT } from "./lib/language";
import { useI18n, hasUiLang } from "./i18n";

function countWords(md: string): number {
  return (md.match(/[\p{L}\p{N}]+/gu) ?? []).length;
}

export function App() {
  const sync = useDriveSync();
  const { t, setLang: setUiLang } = useI18n();
  const [words, setWords] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lang, setLang] = useState(resolvedLang());
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [needLang, setNeedLang] = useState(!hasUiLang());

  useEffect(() => {
    const onLang = () => setLang(resolvedLang());
    window.addEventListener(LANG_CHANGED_EVENT, onLang);
    return () => window.removeEventListener(LANG_CHANGED_EVENT, onLang);
  }, []);

  // Keep the active note in the open-tabs list.
  useEffect(() => {
    const id = sync.activeId;
    if (id) setOpenIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
  }, [sync.activeId]);

  const tabs = openIds
    .map((id) => {
      const n = sync.notes.find((x) => x.id === id);
      return n ? { id, name: n.name } : null;
    })
    .filter((t): t is { id: string; name: string } => t !== null);

  const closeTab = (id: string) => {
    const next = openIds.filter((x) => x !== id);
    setOpenIds(next);
    if (sync.activeId === id) {
      if (next.length > 0) void sync.selectNote(next[next.length - 1]);
      else if (sync.notes[0]) void sync.selectNote(sync.notes[0].id);
    }
  };

  useEffect(() => {
    setWords(countWords(sync.initialMarkdown));
  }, [sync.noteKey, sync.initialMarkdown]);

  const handleChange = useCallback(
    (markdown: string) => {
      setWords(countWords(markdown));
      sync.onContentChange(markdown);
    },
    [sync],
  );

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
            if (window.confirm(t("confirm.deleteNote"))) {
              setOpenIds((ids) => ids.filter((x) => x !== id));
              void sync.removeNote(id);
            }
          }}
          onConnect={sync.connect}
          onSignOut={() => void sync.disconnect()}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <main className="main">
          {sync.connected && tabs.length > 0 && (
            <Tabs
              tabs={tabs}
              activeId={sync.activeId}
              onSelect={(id) => void sync.selectNote(id)}
              onClose={closeTab}
              onNew={() => void sync.newNote()}
            />
          )}

          {!sync.hasCreds && <Banner tone="info">{t("banner.noEnv")}</Banner>}

          {sync.status === "connecting" && <Banner tone="info">{t("banner.connecting")}</Banner>}

          {sync.status === "error" && (
            <Banner tone="warn">
              <span style={{ flex: 1, minWidth: 200, wordBreak: "break-word" }}>
                {sync.lastError ?? t("banner.error")}
              </span>
              <button className="btn" style={{ height: 30 }} onClick={sync.connect}>
                {t("action.retry")}
              </button>
            </Banner>
          )}

          {sync.status === "conflict" && (
            <Banner tone="warn">
              {t("conflict.message")}
              <button className="btn" style={{ height: 30 }} onClick={() => void sync.resolveConflict()}>
                {t("conflict.reload")}
              </button>
              <button className="btn" style={{ height: 30 }} onClick={() => void sync.keepLocal()}>
                {t("conflict.keepLocal")}
              </button>
            </Banner>
          )}

          <Editor
            noteKey={sync.noteKey}
            initialMarkdown={sync.initialMarkdown}
            editable={sync.editable}
            onChange={handleChange}
            canUpload={sync.connected}
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

      {needLang && (
        <FirstRunLanguage
          onPick={(l) => {
            setUiLang(l);
            setNeedLang(false);
          }}
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
