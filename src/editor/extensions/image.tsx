import { Node, mergeAttributes, type Editor } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useEffect, useState } from "react";
import { resolveDriveMediaUrl } from "../../drive/media";
import { NodeDelete } from "./video";

function ImageView({ node, deleteNode }: NodeViewProps) {
  const src: string = node.attrs.src ?? "";
  const fileId: string | null = node.attrs.fileId ?? null;
  const alt: string = node.attrs.alt ?? "";
  const mime: string = node.attrs.mime ?? "image/png";

  const [url, setUrl] = useState<string | undefined>(src || undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;
    if (!url && fileId) {
      resolveDriveMediaUrl(fileId, mime)
        .then((u) => !revoked && setUrl(u))
        .catch(() => !revoked && setError("Impossible de charger l'image depuis Drive."));
    }
    return () => {
      revoked = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  return (
    <NodeViewWrapper as="div" className="media-node media-image" data-drag-handle>
      <NodeDelete onDelete={deleteNode} />
      {url ? (
        <img className="media-img" src={url} alt={alt} />
      ) : (
        <div className="media-loading">{error ?? "Chargement de l'image…"}</div>
      )}
      {alt && <div className="media-caption">{alt}</div>}
    </NodeViewWrapper>
  );
}

export const ImageNode = Node.create({
  name: "imageNode",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes: () => ({
    src: { default: "" },
    fileId: { default: null },
    alt: { default: "" },
    mime: { default: "image/png" },
  }),
  parseHTML: () => [{ tag: "div[data-image-node]" }],
  renderHTML: ({ HTMLAttributes }) =>
    ["div", mergeAttributes(HTMLAttributes, { "data-image-node": "" })],
  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
});

export interface ImageAttrs {
  src: string;
  fileId?: string | null;
  alt: string;
  mime?: string;
}

export function insertImage(editor: Editor, attrs: ImageAttrs) {
  editor.chain().focus().insertContent({ type: "imageNode", attrs }).run();
}
