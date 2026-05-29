import { Node, mergeAttributes, type Editor } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useEffect, useState } from "react";
import { resolveDriveMediaUrl } from "../../drive/media";

function VideoView({ node }: NodeViewProps) {
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
        .catch(() => !revoked && setError("Impossible de charger la vidéo depuis Drive."));
    }
    return () => {
      revoked = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, fileId]);

  return (
    <NodeViewWrapper as="div" className="media-node" data-drag-handle>
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
        <div className="media-loading">{error ?? "Chargement de la vidéo…"}</div>
      )}
      <div className="media-caption">{name}</div>
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
