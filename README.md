# Stela

Minimalist, glassy Markdown notes for Windows — synced to Google Drive.

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)
![Platform](https://img.shields.io/badge/platform-Windows-black)
![Tauri](https://img.shields.io/badge/Tauri-v2-black)
![Built with AI](https://img.shields.io/badge/built%20with-AI-black)

Black & white, iOS-style frosted glass, with a smooth animated caret. Notes are
plain `.md` files stored in your own Google Drive.

## Features

- WYSIWYG inline Markdown (headings, lists, tasks, code, quotes) — clean `.md` round-trip
- Smooth gliding caret and a soft fade-in as you type
- Bilingual FR/EN spell checking, fully local (selectable language)
- LaTeX math, charts (Chart.js) and diagrams (Mermaid)
- Images, video (YouTube/URL or upload), voice notes with waveform, drawings (Excalidraw)
- Browser-style tabs, light/dark theme (system or manual)
- Google Drive as the source of truth, with conflict handling

## Install (Windows)

1. Download `Stela_x.y.z_x64-setup.exe` from the [Releases](../../releases) page and run it.
2. Open Stela and click **Connect Google Drive**, then sign in.

No Google Cloud setup is required for users. (An unsigned installer triggers a
SmartScreen warning → *More info → Run anyway*.)

## Connecting Google Drive

Users only sign in. The developer sets up one OAuth client **once** and ships it
in the build (via CI secrets), so end users never touch Google Cloud.

Developer setup: in Google Cloud Console, enable the Drive API, create an
**OAuth client (Desktop app)** with the non-sensitive `drive.file` scope, add a
privacy policy URL (see [`docs/privacy.html`](docs/privacy.html)) and **publish**
the consent screen. Put the client id/secret in the GitHub Actions secrets
`VITE_GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_SECRET`.

## Development

Requires Node 22+, pnpm 11+, and Rust stable. Works under WSL2.

```bash
pnpm install
cp .env.example .env          # your own Google OAuth client id/secret
pnpm tauri dev
```

Without `.env`, the app runs as a local draft (no saving). Under WSL the dev
webview is WebKitGTK, so the glass effect, media playback and microphone must be
checked on the Windows build.

Checks: `pnpm build` (types + frontend) and
`cargo check --manifest-path src-tauri/Cargo.toml`.

## Build the installer

The `.exe` is built on Windows via GitHub Actions (Tauri can't reliably
cross-compile from Linux). Add the two `VITE_GOOGLE_*` secrets, then push a tag:

```bash
git tag v0.1.0 && git push origin v0.1.0
```

The [release workflow](.github/workflows/release.yml) builds the NSIS installer
and attaches it to a draft Release.

## Tech stack

Tauri v2 (Rust) · React · TypeScript · Vite · Tailwind · TipTap · KaTeX ·
Chart.js · Mermaid · Excalidraw · Google Drive API v3.

## License

[MIT](LICENSE) © 2026 Auxance Jourdan. Bundled Hunspell dictionaries keep their
upstream licenses (dictionary-fr: MPL-2.0, dictionary-en: MIT AND BSD).

Built with the help of a large language model (Anthropic's Claude); all changes
were reviewed by the author.
