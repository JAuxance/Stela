import { useEffect, useState } from "react";
import { inTauri } from "../lib/ipc";

export type Theme = "light" | "dark";

function readMatchMedia(): Theme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Tracks the OS color scheme. Uses `prefers-color-scheme` (works in both
 * WebView2 and WebKitGTK because Tauri sets the webview theme to follow the OS),
 * and additionally subscribes to Tauri's native `onThemeChanged` for instant
 * updates of the titlebar/Mica tint.
 */
export function useSystemTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(readMatchMedia);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onChange = () => setTheme(readMatchMedia());
    mq?.addEventListener?.("change", onChange);

    let unlisten: (() => void) | undefined;
    if (inTauri()) {
      import("@tauri-apps/api/window")
        .then(async ({ getCurrentWindow }) => {
          const win = getCurrentWindow();
          try {
            const t = await win.theme();
            if (t === "dark" || t === "light") setTheme(t);
          } catch {
            /* theme() may be unavailable on some platforms */
          }
          const off = await win.onThemeChanged(({ payload }) => {
            if (payload === "dark" || payload === "light") setTheme(payload);
          });
          unlisten = off;
        })
        .catch(() => {});
    }

    return () => {
      mq?.removeEventListener?.("change", onChange);
      unlisten?.();
    };
  }, []);

  return theme;
}
