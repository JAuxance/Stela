import { Node, nodeInputRule, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useEffect, useMemo, useRef, useState } from "react";
import katex from "katex";

function renderKatex(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex || "\\,", { displayMode, throwOnError: false });
  } catch {
    return `<span style="color:var(--danger)">${latex}</span>`;
  }
}

function MathComponent({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const display = node.type.name === "mathBlock";
  const latex: string = node.attrs.latex ?? "";
  const [editing, setEditing] = useState(latex.trim().length === 0);
  const [draft, setDraft] = useState(latex);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const html = useMemo(() => renderKatex(latex, display), [latex, display]);
  const Tag = display ? "div" : "span";

  const commit = () => {
    updateAttributes({ latex: draft });
    setEditing(false);
    editor.commands.focus();
  };

  if (editing && editor.isEditable) {
    const common = {
      ref: inputRef as never,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setDraft(e.target.value),
      onBlur: commit,
      placeholder: "ex. E=mc^2",
      className: "math-input",
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey && !display) {
          e.preventDefault();
          commit();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          commit();
        }
      },
    };
    return (
      <NodeViewWrapper as={Tag} className={`math-node math-node--editing${display ? " is-block" : ""}`}>
        {display ? <textarea {...common} rows={2} /> : <input {...common} size={Math.max(draft.length, 6)} />}
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      as={Tag}
      className={`math-node${display ? " is-block" : ""}${selected ? " is-selected" : ""}`}
      onClick={() => {
        setDraft(latex);
        setEditing(true);
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

const inlineAttrs = {
  latex: {
    default: "",
    parseHTML: (el: HTMLElement) => el.getAttribute("data-latex") ?? "",
    renderHTML: (attrs: { latex: string }) => ({ "data-latex": attrs.latex }),
  },
};

export const MathInline = Node.create({
  name: "mathInline",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  addAttributes: () => inlineAttrs,
  parseHTML: () => [{ tag: "span[data-math-inline]" }],
  renderHTML: ({ HTMLAttributes }) =>
    ["span", mergeAttributes(HTMLAttributes, { "data-math-inline": "" })],
  addNodeView() {
    return ReactNodeViewRenderer(MathComponent);
  },
  addInputRules() {
    return [
      nodeInputRule({
        find: /\$([^$\n]+)\$$/,
        type: this.type,
        getAttributes: (match) => ({ latex: match[1] }),
      }),
    ];
  },
});

export const MathBlock = Node.create({
  name: "mathBlock",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes: () => inlineAttrs,
  parseHTML: () => [{ tag: "div[data-math-block]" }],
  renderHTML: ({ HTMLAttributes }) =>
    ["div", mergeAttributes(HTMLAttributes, { "data-math-block": "" })],
  addNodeView() {
    return ReactNodeViewRenderer(MathComponent);
  },
  addInputRules() {
    return [
      nodeInputRule({
        find: /^\$\$([^$]+)\$\$$/,
        type: this.type,
        getAttributes: (match) => ({ latex: match[1] }),
      }),
    ];
  },
});

/** Insert helpers used by the editor toolbar. */
export function insertMathInline(editor: import("@tiptap/core").Editor) {
  editor.chain().focus().insertContent({ type: "mathInline", attrs: { latex: "" } }).run();
}
export function insertMathBlock(editor: import("@tiptap/core").Editor) {
  editor.chain().focus().insertContent({ type: "mathBlock", attrs: { latex: "" } }).run();
}
