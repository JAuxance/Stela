import { Node, mergeAttributes, type Editor } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Suspense, lazy, useEffect, useRef, useState, type ComponentType } from "react";
import { NodeDelete } from "./video";

// Heavy: only fetched when a drawing is actually edited.
const ExcalidrawCanvas = lazy(async () => {
  const m = await import("@excalidraw/excalidraw");
  return { default: m.Excalidraw as ComponentType<any> };
});

interface Scene {
  elements?: unknown[];
  appState?: Record<string, unknown>;
  files?: Record<string, unknown> | null;
}

function isDark(): boolean {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

function DrawingView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const scene: Scene | null = node.attrs.scene ?? null;
  const hasContent = (scene?.elements?.length ?? 0) > 0;
  const [editing, setEditing] = useState(!hasContent);
  const [svg, setSvg] = useState("");
  const apiRef = useRef<any>(null);

  useEffect(() => {
    if (editing || !hasContent) return;
    let cancelled = false;
    import("@excalidraw/excalidraw").then(async (m: any) => {
      try {
        const el: SVGSVGElement = await m.exportToSvg({
          elements: scene?.elements ?? [],
          appState: { ...(scene?.appState ?? {}), exportBackground: false },
          files: scene?.files ?? null,
        });
        if (!cancelled) setSvg(el.outerHTML);
      } catch {
        /* leave preview empty */
      }
    });
    return () => {
      cancelled = true;
    };
  }, [editing, hasContent, scene]);

  const save = () => {
    const api = apiRef.current;
    if (api) {
      updateAttributes({
        scene: {
          elements: api.getSceneElements(),
          appState: { viewBackgroundColor: api.getAppState().viewBackgroundColor },
          files: api.getFiles(),
        },
      });
    }
    setEditing(false);
  };

  return (
    <NodeViewWrapper as="div" className="media-node drawing-node">
      <NodeDelete onDelete={deleteNode} />
      <button
        className="node-edit"
        title="Dessiner"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 2.5 13.5 5 5.5 13 2.5 13.5 3 10.5 Z" />
        </svg>
      </button>

      {svg ? (
        <div className="drawing-svg" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="media-loading">Dessin vide — clique sur ✎ pour dessiner.</div>
      )}

      {editing && (
        <div className="overlay" onMouseDown={(e) => e.stopPropagation()}>
          <div className="drawing-modal glass">
            <div className="drawing-modal__bar">
              <span>Dessin</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" onClick={() => setEditing(false)}>
                  Annuler
                </button>
                <button className="btn btn--primary" onClick={save}>
                  Enregistrer
                </button>
              </div>
            </div>
            <div className="drawing-canvas">
              <Suspense fallback={<div className="media-loading">Chargement de l'éditeur de dessin…</div>}>
                <ExcalidrawCanvas
                  excalidrawAPI={(api: unknown) => {
                    apiRef.current = api;
                  }}
                  theme={isDark() ? "dark" : "light"}
                  initialData={{
                    elements: scene?.elements ?? [],
                    appState: scene?.appState ?? {},
                    files: scene?.files ?? undefined,
                    scrollToContent: true,
                  }}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const DrawingNode = Node.create({
  name: "drawing",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes: () => ({ scene: { default: null } }),
  parseHTML: () => [{ tag: "div[data-drawing]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-drawing": "" })],
  addNodeView() {
    return ReactNodeViewRenderer(DrawingView);
  },
});

export function insertDrawing(editor: Editor) {
  editor.chain().focus().insertContent({ type: "drawing", attrs: { scene: null } }).run();
}
