import type { Editor } from "@tiptap/core";
import type { ReactNode } from "react";
import { insertMathInline, insertMathBlock } from "../editor/extensions/math";

export interface ToolbarProps {
  editor: Editor | null;
  onInsertVideo?: () => void;
  onRecordAudio?: () => void;
}

const svg = (children: ReactNode) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

const IconList = svg(
  <>
    <circle cx="3" cy="4" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="3" cy="8" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="3" cy="12" r="0.9" fill="currentColor" stroke="none" />
    <line x1="6" y1="4" x2="13" y2="4" />
    <line x1="6" y1="8" x2="13" y2="8" />
    <line x1="6" y1="12" x2="13" y2="12" />
  </>,
);
const IconTask = svg(
  <>
    <rect x="2.2" y="2.2" width="11.6" height="11.6" rx="3" />
    <path d="M5 8.2 L7 10.2 L11 5.6" />
  </>,
);
const IconQuote = svg(
  <path
    d="M6.5 4.5C4.7 5.3 3.5 6.9 3.5 8.9c0 1.4 1 2.3 2.1 2.3 1 0 1.8-.8 1.8-1.8s-.8-1.8-1.8-1.8h-.3c.2-1 .9-1.8 1.9-2.3l-.7-.8Zm5.6 0C10.3 5.3 9.1 6.9 9.1 8.9c0 1.4 1 2.3 2.1 2.3 1 0 1.8-.8 1.8-1.8s-.8-1.8-1.8-1.8h-.3c.2-1 .9-1.8 1.9-2.3l-.7-.8Z"
    fill="currentColor"
    stroke="none"
  />,
);
const IconMic = svg(
  <>
    <rect x="6" y="1.8" width="4" height="7" rx="2" />
    <path d="M4 8a4 4 0 0 0 8 0" />
    <line x1="8" y1="12" x2="8" y2="14" />
    <line x1="6" y1="14" x2="10" y2="14" />
  </>,
);
const IconFilm = svg(
  <>
    <rect x="2" y="3.5" width="12" height="9" rx="2" />
    <path d="M6.7 6.4 L10.4 8 L6.7 9.6 Z" fill="currentColor" stroke="none" />
  </>,
);

export function Toolbar({ editor, onInsertVideo, onRecordAudio }: ToolbarProps) {
  if (!editor) return null;

  const Btn = ({
    on,
    run,
    children,
    title,
  }: {
    on?: boolean;
    run: () => void;
    children: ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      className={`tb-btn${on ? " is-on" : ""}`}
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        run();
      }}
    >
      {children}
    </button>
  );

  return (
    <div className="toolbar glass">
      <Btn on={editor.isActive("bold")} run={() => editor.chain().focus().toggleBold().run()} title="Gras">
        <b>B</b>
      </Btn>
      <Btn on={editor.isActive("italic")} run={() => editor.chain().focus().toggleItalic().run()} title="Italique">
        <i>I</i>
      </Btn>
      <Btn
        on={editor.isActive("heading", { level: 1 })}
        run={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Titre 1"
      >
        H1
      </Btn>
      <Btn
        on={editor.isActive("heading", { level: 2 })}
        run={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Titre 2"
      >
        H2
      </Btn>
      <span className="tb-sep" />
      <Btn on={editor.isActive("bulletList")} run={() => editor.chain().focus().toggleBulletList().run()} title="Liste">
        {IconList}
      </Btn>
      <Btn on={editor.isActive("taskList")} run={() => editor.chain().focus().toggleTaskList().run()} title="Tâches">
        {IconTask}
      </Btn>
      <Btn on={editor.isActive("blockquote")} run={() => editor.chain().focus().toggleBlockquote().run()} title="Citation">
        {IconQuote}
      </Btn>
      <Btn on={editor.isActive("codeBlock")} run={() => editor.chain().focus().toggleCodeBlock().run()} title="Bloc de code">
        <span style={{ fontFamily: "monospace", fontSize: 12 }}>{"</>"}</span>
      </Btn>
      <span className="tb-sep" />
      <Btn run={() => insertMathInline(editor)} title="Formule en ligne ($…$)">
        <span style={{ fontStyle: "italic" }}>Σ</span>
      </Btn>
      <Btn run={() => insertMathBlock(editor)} title="Bloc formule ($$…$$)">
        <span style={{ fontStyle: "italic" }}>Σ</span>
        <span style={{ fontSize: 10, opacity: 0.7 }}>=</span>
      </Btn>
      {(onRecordAudio || onInsertVideo) && <span className="tb-sep" />}
      {onRecordAudio && (
        <Btn run={onRecordAudio} title="Note vocale">
          {IconMic}
        </Btn>
      )}
      {onInsertVideo && (
        <Btn run={onInsertVideo} title="Insérer une vidéo">
          {IconFilm}
        </Btn>
      )}
    </div>
  );
}
