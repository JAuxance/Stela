import { useCallback, useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { buildExtensions, type SpellContextInfo } from "./extensions";
import { getMarkdown, setMarkdown } from "./extensions/markdown";
import { spellKey } from "./extensions/spellcheck";
import { SuggestionMenu } from "../components/SuggestionMenu";
import { Toolbar } from "../components/Toolbar";
import { VideoDialog } from "../components/VideoDialog";
import { AudioRecorder } from "../components/AudioRecorder";
import { insertVideo } from "./extensions/video";
import { insertAudio } from "./extensions/audio";
import { addWord, suggest } from "../spellcheck/proofreader";
import { resolvedLang } from "../lib/language";

interface MenuState extends SpellContextInfo {
  suggestions: string[];
  loading: boolean;
}

export interface EditorProps {
  /** Changes whenever a different note is loaded, triggering a content reset. */
  noteKey: string | null;
  initialMarkdown: string;
  editable: boolean;
  onChange: (markdown: string) => void;
  onEditorReady?: (editor: TiptapEditor) => void;
  /** Whether media (audio/video files) can be uploaded to Drive (i.e. connected). */
  canUpload: boolean;
}

export function Editor({
  noteKey,
  initialMarkdown,
  editable,
  onChange,
  onEditorReady,
  canUpload,
}: EditorProps) {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [recOpen, setRecOpen] = useState(false);
  const lang = resolvedLang();

  const handleContextMenu = useCallback((info: SpellContextInfo) => {
    setMenu({ ...info, suggestions: [], loading: true });
    void suggest(info.word, info.lang).then((suggestions) => {
      setMenu((m) => (m && m.from === info.from ? { ...m, suggestions, loading: false } : m));
    });
  }, []);

  const editor = useEditor(
    {
      extensions: buildExtensions({ defaultLang: lang, onSpellContextMenu: handleContextMenu }),
      content: "",
      editable,
      editorProps: {
        attributes: {
          spellcheck: "false",
          autocorrect: "off",
          autocapitalize: "off",
          "aria-label": "Éditeur de note",
        },
      },
      onUpdate: ({ editor }) => onChange(getMarkdown(editor)),
    },
    [],
  );

  // Load content when the active note changes — without emitting onChange.
  useEffect(() => {
    if (editor) setMarkdown(editor, initialMarkdown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, noteKey]);

  useEffect(() => {
    if (editor) editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (editor && onEditorReady) onEditorReady(editor);
  }, [editor, onEditorReady]);

  const replace = (suggestion: string) => {
    if (!editor || !menu) return;
    editor.chain().focus().insertContentAt({ from: menu.from, to: menu.to }, suggestion).run();
    setMenu(null);
  };

  const ignore = () => {
    if (!editor || !menu) return;
    editor.view.dispatch(editor.state.tr.setMeta(spellKey, { ignore: menu.word.toLowerCase() }));
    setMenu(null);
  };

  const add = () => {
    if (!editor || !menu) return;
    addWord(menu.word, menu.lang);
    editor.view.dispatch(editor.state.tr.setMeta(spellKey, { ignore: menu.word.toLowerCase() }));
    setMenu(null);
  };

  return (
    <>
      <Toolbar
        editor={editor}
        onInsertVideo={() => setVideoOpen(true)}
        onRecordAudio={canUpload ? () => setRecOpen(true) : undefined}
      />
      <EditorContent editor={editor} />

      {videoOpen && editor && (
        <VideoDialog
          canUpload={canUpload}
          onInsert={(attrs) => insertVideo(editor, attrs)}
          onClose={() => setVideoOpen(false)}
        />
      )}
      {recOpen && editor && (
        <AudioRecorder onInsert={(attrs) => insertAudio(editor, attrs)} onClose={() => setRecOpen(false)} />
      )}

      {menu && (
        <SuggestionMenu
          x={menu.x}
          y={menu.y}
          word={menu.word}
          loading={menu.loading}
          suggestions={menu.suggestions}
          onReplace={replace}
          onIgnore={ignore}
          onAdd={add}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  );
}
