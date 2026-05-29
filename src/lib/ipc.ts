/**
 * Thin, typed helpers over the Tauri runtime. Centralized so the rest of the app
 * never imports `@tauri-apps/api` directly and degrades gracefully when run
 * outside Tauri (e.g. a plain browser preview during development).
 */
import { invoke as tauriInvoke } from "@tauri-apps/api/core";

export function inTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  return tauriInvoke<T>(cmd, args);
}
