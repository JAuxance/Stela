import { Node, mergeAttributes, type Editor } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useEffect, useState } from "react";
import { resolveDriveMediaUrl } from "../../drive/media";
import { useI18n } from "../../i18n";
import { useResize, ResizeHandle } from "./resize";

export function NodeDelete({ onDelete }: { onDelete: () => void }) {
  return (
    <button
      className="node-del"
      title="Supprimer"
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M4 4 L12 12 M12 4 L4 12" />
      </svg>
    </button>
  );
}

function VideoView({ node, deleteNode, updateAttributes }: NodeViewProps) {
  const { t } = useI18n();
  const { style, onPointerDown } = useResize(node.attrs.width ?? null, (w) => updateAttributes({ width: w }));
  const provider: string = node.attrs.provider ?? "url";
  const src: string = node.attrs.src ?? "";
  const fileId: string | null = node.attrs.fileId ?? null;
  const name: string = node.attrs.name ?? "Vidéo";
  const mime: string = node.attrs.mime ?? "video/mp4";

  const framed = provider === "youtube" || provider === "vimeo";
  const [url, setUrl] = useState<string | undefined>(framed || provider === "url" ? src : src || undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;
    if (provider === "drive" && !url && fileId) {
      resolveDriveMediaUrl(fileId, mime)
        .then((u) => !revoked && setUrl(u))
        .catch(() => !revoked && setError(t("media.loadFailed")));
    }
    return () => {
      revoked = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, fileId]);

  return (
    <NodeViewWrapper as="div" className="media-node" data-drag-handle style={style}>
      <NodeDelete onDelete={deleteNode} />
      {framed ? (
        <div className="media-frame">
          <iframe
            src={src}
            title={name}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
          />
        </div>
      ) : url ? (
        <video className="media-video" src={url} controls preload="metadata" />
      ) : (
        <div className="media-loading">{error ?? t("media.loadingVideo")}</div>
      )}
      <div className="media-caption">{name}</div>
      <ResizeHandle onPointerDown={onPointerDown} />
    </NodeViewWrapper>
  );
}

export const VideoEmbed = Node.create({
  name: "videoEmbed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes: () => ({
    provider: { default: "url" },
    src: { default: "" },
    fileId: { default: null },
    name: { default: "Vidéo" },
    mime: { default: "video/mp4" },
    width: { default: null },
  }),
  parseHTML: () => [{ tag: "div[data-video-embed]" }],
  renderHTML: ({ HTMLAttributes }) =>
    ["div", mergeAttributes(HTMLAttributes, { "data-video-embed": "" })],
  addNodeView() {
    return ReactNodeViewRenderer(VideoView);
  },
});

export interface VideoAttrs {
  provider: string;
  src: string;
  fileId?: string | null;
  name: string;
  mime?: string;
}

export function insertVideo(editor: Editor, attrs: VideoAttrs) {
  editor.chain().focus().insertContent({ type: "videoEmbed", attrs }).run();
}
