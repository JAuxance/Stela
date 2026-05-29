import { useState } from "react";
import { toEmbed, uploadBlob, cacheBlobUrl } from "../drive/media";
import { useI18n } from "../i18n";
import type { VideoAttrs } from "../editor/extensions/video";

export interface VideoDialogProps {
  canUpload: boolean;
  onInsert: (attrs: VideoAttrs) => void;
  onClose: () => void;
}

export function VideoDialog({ canUpload, onInsert, onClose }: VideoDialogProps) {
  const { t } = useI18n();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const addUrl = () => {
    const v = url.trim();
    if (!v) return;
    const { provider, src } = toEmbed(v);
    onInsert({ provider, src, name: provider === "url" ? "Vidéo" : v, mime: "video/mp4" });
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
      onInsert({
        provider: "drive",
        src: objectUrl,
        fileId,
        name: file.name,
        mime: file.type || "video/mp4",
      });
      onClose();
    } catch (e2) {
      setErr(`${t("upload.fail")} ${String(e2)}`);
      setBusy(false);
    }
  };

  return (
    <Overlay onClose={onClose} title={t("video.title")}>
      <label className="dialog-label">{t("video.urlLabel")}</label>
      <div className="dialog-row">
        <input
          className="dialog-input"
          value={url}
          autoFocus
          placeholder="https://youtube.com/watch?v=…"
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addUrl()}
        />
        <button className="btn btn--primary" onClick={addUrl} disabled={!url.trim()}>
          {t("action.insert")}
        </button>
      </div>

      <div className="menu__sep" />

      {canUpload ? (
        <label className={`btn${busy ? " is-busy" : ""}`} style={{ width: "100%", cursor: "pointer" }}>
          {busy ? t("video.uploading") : `📁 ${t("video.pick")}`}
          <input type="file" accept="video/*" hidden disabled={busy} onChange={onFile} />
        </label>
      ) : (
        <p className="dialog-hint">{t("video.needConnect")}</p>
      )}

      {err && <p className="dialog-hint" style={{ color: "var(--danger)" }}>{err}</p>}
    </Overlay>
  );
}

export function Overlay({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="dialog glass" onMouseDown={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <span>{title}</span>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
