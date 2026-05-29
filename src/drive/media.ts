import { uploadMedia, downloadMedia } from "./driveClient";
import { inTauri } from "../lib/ipc";

/** Base64-encode a Blob's bytes (chunked to avoid call-stack limits). */
export async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function base64ToBlobUrl(base64: string, mime: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

/** Upload a recorded/picked blob to Drive's media folder; returns the file id. */
export async function uploadBlob(blob: Blob, name: string): Promise<string> {
  const base64 = await blobToBase64(blob);
  const file = await uploadMedia(name, blob.type || "application/octet-stream", base64);
  return file.id;
}

const urlCache = new Map<string, string>();

/** Resolve a Drive media file to a playable blob URL (downloaded once, cached). */
export async function resolveDriveMediaUrl(fileId: string, mime: string): Promise<string> {
  const cached = urlCache.get(fileId);
  if (cached) return cached;
  if (!inTauri()) throw new Error("media unavailable outside the app");
  const base64 = await downloadMedia(fileId);
  const url = base64ToBlobUrl(base64, mime);
  urlCache.set(fileId, url);
  return url;
}

export function cacheBlobUrl(fileId: string, url: string): void {
  urlCache.set(fileId, url);
}

/** Build a YouTube/Vimeo embed URL, or return the direct URL for plain video. */
export function toEmbed(url: string): { provider: "youtube" | "vimeo" | "url"; src: string } {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) {
    return { provider: "youtube", src: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0` };
  }
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return { provider: "vimeo", src: `https://player.vimeo.com/video/${vimeo[1]}` };
  return { provider: "url", src: url };
}
