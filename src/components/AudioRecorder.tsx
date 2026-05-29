import { useEffect, useRef, useState } from "react";
import { uploadBlob, cacheBlobUrl } from "../drive/media";
import { Overlay } from "./VideoDialog";
import { useI18n } from "../i18n";
import type { AudioAttrs } from "../editor/extensions/audio";

type Phase = "starting" | "recording" | "saving" | "error";

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export interface AudioRecorderProps {
  onInsert: (attrs: AudioAttrs) => void;
  onClose: () => void;
}

export function AudioRecorder({ onInsert, onClose }: AudioRecorderProps) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>("starting");
  const [seconds, setSeconds] = useState(0);
  const [err, setErr] = useState("");

  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const finalize = async (mime: string) => {
    setPhase("saving");
    const blob = new Blob(chunksRef.current, { type: mime });
    const objectUrl = URL.createObjectURL(blob);
    const ext = mime.includes("ogg") ? "ogg" : mime.includes("mp4") ? "mp4" : "webm";
    const name = `note-vocale-${new Date().toISOString().replace(/[:.]/g, "-")}.${ext}`;
    try {
      const fileId = await uploadBlob(blob, name);
      cacheBlobUrl(fileId, objectUrl);
      onInsert({ fileId, src: objectUrl, name, mime });
      onClose();
    } catch (e) {
      setErr(`${t("audio.saveError")} ${String(e)}`);
      setPhase("error");
    }
  };

  const start = async () => {
    setErr("");
    setPhase("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const preferred = "audio/webm";
      const rec = new MediaRecorder(
        stream,
        typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(preferred)
          ? { mimeType: preferred }
          : undefined,
      );
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => void finalize(rec.mimeType || "audio/webm");
      rec.start();
      recRef.current = rec;
      setSeconds(0);
      setPhase("recording");
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (e) {
      setErr(`${t("audio.micError")} ${String(e)}`);
      setPhase("error");
    }
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  useEffect(() => {
    void start();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Overlay title={t("audio.title")} onClose={() => { cleanup(); onClose(); }}>
      <div className="recorder">
        {phase === "recording" && (
          <>
            <div className="recorder-status">
              <span className="recorder-dot" />
              <span className="recorder-time">{fmt(seconds)}</span>
            </div>
            <button className="btn btn--primary" onClick={stop}>
              {t("audio.stop")}
            </button>
          </>
        )}
        {phase === "starting" && <p className="dialog-hint">{t("audio.start")}</p>}
        {phase === "saving" && <p className="dialog-hint">{t("audio.saving")}</p>}
        {phase === "error" && (
          <>
            <p className="dialog-hint" style={{ color: "var(--danger)" }}>{err}</p>
            <button className="btn" onClick={start}>
              {t("action.retryShort")}
            </button>
          </>
        )}
      </div>
    </Overlay>
  );
}
