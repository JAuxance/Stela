import { useState } from "react";
import { Overlay } from "./VideoDialog";
import { uploadBlob, cacheBlobUrl } from "../drive/media";
import type { ImageAttrs } from "../editor/extensions/image";

export interface ImageDialogProps {
  canUpload: boolean;
  onInsert: (attrs: ImageAttrs) => void;
  onClose: () => void;
}

export function ImageDialog({ canUpload, onInsert, onClose }: ImageDialogProps) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const addUrl = () => {
    const v = url.trim();
    if (!v) return;
    onInsert({ src: v, alt: "Image", mime: "image/png" });
    onClose();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const objectUrl = URL.createObjectURL(file);
      const fileId = await uploadBlob(file, file.name);
      cacheBlobUrl(fileId, objectUrl);
      onInsert({ src: objectUrl, fileId, alt: file.name, mime: file.type || "image/png" });
      onClose();
    } catch (e2) {
      setErr(`Échec de l'upload : ${String(e2)}`);
      setBusy(false);
    }
  };

  return (
    <Overlay onClose={onClose} title="Insérer une image">
      <label className="dialog-label">Lien de l'image (URL)</label>
      <div className="dialog-row">
        <input
          className="dialog-input"
          value={url}
          autoFocus
          placeholder="https://…/image.png"
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addUrl()}
        />
        <button className="btn btn--primary" onClick={addUrl} disabled={!url.trim()}>
          Insérer
        </button>
      </div>

      <div className="menu__sep" />

      {canUpload ? (
        <label className={`btn${busy ? " is-busy" : ""}`} style={{ width: "100%", cursor: "pointer" }}>
          {busy ? "Upload en cours…" : "📁 Choisir une image (uploadée sur Drive)"}
          <input type="file" accept="image/*" hidden disabled={busy} onChange={onFile} />
        </label>
      ) : (
        <p className="dialog-hint">Connecte Google Drive pour uploader une image locale.</p>
      )}

      {err && <p className="dialog-hint" style={{ color: "var(--danger)" }}>{err}</p>}
    </Overlay>
  );
}
