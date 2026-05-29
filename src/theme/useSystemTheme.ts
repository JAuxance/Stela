import { useEffect, useState } from "react";
import { inTauri } from "../lib/ipc";

export type Theme = "light" | "dark";
export type ThemePref = Theme | "system";

const PREF_KEY = "stela.theme";
export const THEME_CHANGED_EVENT = "stela-theme-changed";

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(PREF_KEY);
    return v === "light" || v === "dark" || v === "system" ? v : "system";
  } catch {
    return "system";
  }
}

export function setThemePref(pref: ThemePref): void {
  try {
    localStorage.setItem(PREF_KEY, pref);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(THEME_CHANGED_EVENT, { detail: pref }));
  }
}

function readMatchMedia(): Theme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Effective theme = the user's preference, or the OS scheme when set to "system".
 * Tracks `prefers-color-scheme`, Tauri's `onThemeChanged`, and the in-app override.
 */
export function useSystemTheme(): Theme {
  const [os, setOs] = useState<Theme>(readMatchMedia);
  const [pref, setPref] = useState<ThemePref>(getThemePref);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onMq = () => setOs(readMatchMedia());
    mq?.addEventListener?.("change", onMq);

    const onPref = () => setPref(getThemePref());
    window.addEventListener(THEME_CHANGED_EVENT, onPref);

    let unlisten: (() => void) | undefined;
    if (inTauri()) {
      import("@tauri-apps/api/window")
        .then(async ({ getCurrentWindow }) => {
          const win = getCurrentWindow();
          try {
            const t = await win.theme();
            if (t === "dark" || t === "light") setOs(t);
          } catch {
            /* unavailable on some platforms */
          }
          unlisten = await win.onThemeChanged(({ payload }) => {
            if (payload === "dark" || payload === "light") setOs(payload);
          });
        })
        .catch(() => {});
    }

    return () => {
      mq?.removeEventListener?.("change", onMq);
      window.removeEventListener(THEME_CHANGED_EVENT, onPref);
      unlisten?.();
    };
  }, []);

  return pref === "system" ? os : pref;
}
