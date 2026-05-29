import { Node, mergeAttributes, type Editor } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { NodeDelete } from "./video";
import { useI18n } from "../../i18n";

const STARTER = "graph TD\n  A[Début] --> B{Choix}\n  B -->|Oui| C[OK]\n  B -->|Non| D[Stop]";

function isDark(): boolean {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

function MermaidView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const { t } = useI18n();
  const code: string = node.attrs.code ?? "";
  const [editing, setEditing] = useState(code.trim() === "");
  const [draft, setDraft] = useState(code || STARTER);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const idRef = useRef(`mmd-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (editing || !code.trim()) return;
    let cancelled = false;
    mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: isDark() ? "dark" : "neutral" });
    mermaid
      .render(idRef.current, code)
      .then(({ svg }) => {
        if (!cancelled) {
          setSvg(svg);
          setError("");
        }
      })
      .catch((e) => !cancelled && setError(String(e?.message ?? e)));
    return () => {
      cancelled = true;
    };
  }, [editing, code]);

  const commit = () => {
    updateAttributes({ code: draft });
    setEditing(false);
  };

  if (editing) {
    return (
      <NodeViewWrapper as="div" className="media-node mermaid-node">
        <textarea
          className="chart-data"
          rows={6}
          placeholder={STARTER}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="chart-edit-actions">
          <button className="btn btn--primary settings-btn" onClick={commit}>
            {t("action.show")}
          </button>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper as="div" className="media-node mermaid-node">
      <NodeDelete onDelete={deleteNode} />
      <button
        className="node-edit"
        title="Modifier"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          setDraft(code || STARTER);
          setEditing(true);
        }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 2.5 13.5 5 5.5 13 2.5 13.5 3 10.5 Z" />
        </svg>
      </button>
      {error ? (
        <div className="media-loading" style={{ color: "var(--danger)" }}>{error}</div>
      ) : (
        <div className="mermaid-svg" dangerouslySetInnerHTML={{ __html: svg }} />
      )}
    </NodeViewWrapper>
  );
}

export const MermaidNode = Node.create({
  name: "mermaidDiagram",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes: () => ({ code: { default: "" } }),
  parseHTML: () => [{ tag: "div[data-mermaid]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-mermaid": "" })],
  addNodeView() {
    return ReactNodeViewRenderer(MermaidView);
  },
});

export function insertMermaid(editor: Editor) {
  editor.chain().focus().insertContent({ type: "mermaidDiagram", attrs: { code: "" } }).run();
}
