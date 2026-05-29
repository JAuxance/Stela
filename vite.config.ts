import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// @tauri-apps/cli sets these env vars during `tauri build`.
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Tauri expects a fixed port and surfaces Rust errors, so don't clear the screen.
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? { protocol: "ws", host, port: 1421 }
      : undefined,
    // Don't watch the Rust side; it has its own watcher and would trigger HMR loops.
    watch: { ignored: ["**/src-tauri/**"] },
  },

  // Expose VITE_* (e.g. the Google client id) and Tauri build env to the frontend.
  envPrefix: ["VITE_", "TAURI_ENV_"],

  build: {
    // WebView2 (Windows) is Chromium-based; WebKit elsewhere.
    target:
      process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari13",
    minify: process.env.TAURI_ENV_DEBUG ? false : "esbuild",
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },

  // Web Workers (spellcheck) should be bundled as ES modules.
  worker: { format: "es" },
});
