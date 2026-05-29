import { inTauri } from "../lib/ipc";

async function withWindow(fn: (w: import("@tauri-apps/api/window").Window) => void) {
  if (!inTauri()) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  fn(getCurrentWindow());
}

export function WindowControls() {
  return (
    <div className="win-controls">
      <button
        className="win-btn"
        aria-label="Réduire"
        onClick={() => withWindow((w) => void w.minimize())}
      >
        <svg width="11" height="11" viewBox="0 0 11 11">
          <rect x="1" y="5" width="9" height="1" fill="currentColor" />
        </svg>
      </button>
      <button
        className="win-btn"
        aria-label="Agrandir"
        onClick={() => withWindow((w) => void w.toggleMaximize())}
      >
        <svg width="11" height="11" viewBox="0 0 11 11">
          <rect
            x="1.5"
            y="1.5"
            width="8"
            height="8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>
      </button>
      <button
        className="win-btn win-btn--close"
        aria-label="Fermer"
        onClick={() => withWindow((w) => void w.close())}
      >
        <svg width="11" height="11" viewBox="0 0 11 11">
          <path d="M1 1 L10 10 M10 1 L1 10" stroke="currentColor" strokeWidth="1.1" />
        </svg>
      </button>
    </div>
  );
}
