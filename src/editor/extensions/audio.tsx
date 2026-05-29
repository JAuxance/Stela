import { Node, mergeAttributes, type Editor } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { resolveDriveMediaUrl } from "../../drive/media";
import { NodeDelete } from "./video";

const BARS = 72;

async function drawWaveform(canvas: HTMLCanvasElement, url: string) {
  const resp = await fetch(url);
  const buf = await resp.arrayBuffer();
  const AC: typeof AudioContext =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  try {
    const audio = await ctx.decodeAudioData(buf);
    const data = audio.getChannelData(0);
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const c = canvas.getContext("2d");
    if (!c) return;
    c.scale(dpr, dpr);
    c.clearRect(0, 0, w, h);
    c.fillStyle = getComputedStyle(canvas).color;
    const block = Math.floor(data.length / BARS) || 1;
    const bw = w / BARS;
    for (let i = 0; i < BARS; i++) {
      let sum = 0;
      for (let j = 0; j < block; j++) sum += Math.abs(data[i * block + j] || 0);
      const amp = sum / block;
      const bh = Math.max(2, Math.min(h, amp * h * 2.2));
      c.fillRect(i * bw + bw * 0.2, (h - bh) / 2, bw * 0.55, bh);
    }
  } catch {
    /* undecodable / unsupported codec — leave the canvas blank */
  } finally {
    void ctx.close();
  }
}

function AudioView({ node, deleteNode }: NodeViewProps) {
  const fileId: string | null = node.attrs.fileId ?? null;
  const name: string = node.attrs.name ?? "Note vocale";
  const mime: string = node.attrs.mime ?? "audio/webm";
  const immediate: string = node.attrs.src ?? "";

  const [url, setUrl] = useState<string | undefined>(immediate || undefined);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let revoked = false;
    if (!url && fileId) {
      resolveDriveMediaUrl(fileId, mime)
        .then((u) => !revoked && setUrl(u))
        .catch(() => !revoked && setError("Impossible de charger l'audio depuis Drive."));
    }
    return () => {
      revoked = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  useEffect(() => {
    if (url && canvasRef.current) void drawWaveform(canvasRef.current, url);
  }, [url]);

  return (
    <NodeViewWrapper as="div" className="media-node audio-node" data-drag-handle>
      <NodeDelete onDelete={deleteNode} />
      <div className="audio-row">
        <svg className="audio-icon" width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <rect x="6" y="1.8" width="4" height="7" rx="2" />
          <path d="M4 8a4 4 0 0 0 8 0" />
          <line x1="8" y1="12" x2="8" y2="14" />
          <line x1="6" y1="14" x2="10" y2="14" />
        </svg>
        <canvas ref={canvasRef} className="audio-wave" />
      </div>
      {url ? (
        <audio className="audio-player" src={url} controls preload="metadata" />
      ) : (
        <div className="media-loading">{error ?? "Chargement de l'audio…"}</div>
      )}
      <div className="media-caption">{name}</div>
    </NodeViewWrapper>
  );
}

export const AudioNote = Node.create({
  name: "audioNote",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes: () => ({
    fileId: { default: null },
    src: { default: "" },
    name: { default: "Note vocale" },
    mime: { default: "audio/webm" },
  }),
  parseHTML: () => [{ tag: "div[data-audio-note]" }],
  renderHTML: ({ HTMLAttributes }) =>
    ["div", mergeAttributes(HTMLAttributes, { "data-audio-note": "" })],
  addNodeView() {
    return ReactNodeViewRenderer(AudioView);
  },
});

export interface AudioAttrs {
  fileId?: string | null;
  src?: string;
  name: string;
  mime: string;
}

export function insertAudio(editor: Editor, attrs: AudioAttrs) {
  editor.chain().focus().insertContent({ type: "audioNote", attrs }).run();
}
