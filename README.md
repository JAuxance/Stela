<div align="center">

# Stela

**Minimalist, glassy Markdown note-taking — synced to Google Drive.**

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)
![Platform](https://img.shields.io/badge/platform-Windows-black)
![Tauri](https://img.shields.io/badge/Tauri-v2-black)
![React](https://img.shields.io/badge/React-19-black)
![Rust](https://img.shields.io/badge/Rust-stable-black)
![Built with AI](https://img.shields.io/badge/built%20with-AI-black)

</div>

---

Stela is a **black & white, iOS-style frosted-glass** desktop app, built for writing
fast and beautifully:

- ✍️ **Inline WYSIWYG editor** (TipTap / ProseMirror) — Markdown transforms live as you
  type (headings, bold, lists, tasks `[ ]`, code, quotes) and the file stays clean `.md`.
- 🌊 **Smooth animated caret** + **ink fade-in** (characters appear softly as you type).
- 🔤 **Bilingual FR / EN spell checking**, fully local (nspell + Hunspell), per-paragraph
  language detection, right-click → suggestions / ignore / add to dictionary.
- 🧮 **LaTeX** — inline `$…$` and block `$$…$$` math (KaTeX rendering, click to edit).
- 🎙️ **Voice notes** — microphone recording, **waveform**, player; audio stored on Drive.
- 🎬 **Video** — YouTube / Vimeo / URL embeds, or upload a local file to Drive.
- ☁️ **Google Drive as the source of truth** — `.md` files created/read in a configurable
  folder, debounced write-through, remote-change detection, and conflict handling.
- 🌗 **Light/dark theme** following the OS, **iOS-style Settings** panel.
- ↩️ Undo/redo, deletion of notes and media blocks.

> **Platform:** Windows (`.exe` installer). Linux/macOS are out of scope.

---

## 📦 Installation (end users)

1. Open the repository's **Releases** tab and download `Stela_x.y.z_x64-setup.exe`.
2. Run it (per-user install, no admin rights required).
3. Open Stela → **"Connect Google Drive"** → sign in with your Google account.

> **End users never touch Google Cloud.** The OAuth credentials are **baked into the app**
> by the developer (see below). If the installer is unsigned, Windows SmartScreen shows an
> "unknown publisher" warning → *More info → Run anyway*.

---

## 🔐 Google sign-in: who does what?

This is the key point. **Two distinct roles:**

| | Developer (you) — **once** | End user — **per device** |
|---|---|---|
| Action | Create 1 OAuth client, publish it, bake it into the build | Click "Connect", sign in to Google |
| Google Cloud | Yes (once) | **Never** |

The app reads `VITE_GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_SECRET` **at build time**. In CI
they come from **GitHub secrets** → the distributed `.exe` already contains the client. A
desktop app's `client_secret` isn't truly secret: **PKCE (S256)** secures the exchange.

### Developer — make sign-in seamless (recommended)

So your users get a **clean "Sign in with Google"** (no "unverified app" screen, no 100-user
cap, and long-lived tokens):

1. **Google Cloud Console** → enable the **Google Drive API**.
2. **OAuth consent screen**: type *External*; set app name + logo + support email +
   **a privacy policy URL** (required to publish — see [`docs/privacy.html`](docs/privacy.html)).
3. **Scope**: only `…/auth/drive.file` (non-sensitive → **no CASA security assessment**).
4. **Credentials** → **OAuth client ID** → **Desktop app** → copy the id + secret.
5. **Publishing status → PUBLISH APP** (move to *In production*). Complete **brand
   verification** (logo/domain) to remove the warning screen.
6. Put the id + secret into the **GitHub secrets** `VITE_GOOGLE_CLIENT_ID` /
   `VITE_GOOGLE_CLIENT_SECRET` (CI injects them into the build).

> While the app is in *Testing*, only accounts added as *test users* can sign in, and the
> refresh token **expires after 7 days**. Publishing removes these limits.

---

## 🛠️ Development

**Requirements:** Node 22+, pnpm 11+, Rust stable. Development works under **WSL2**.

```bash
pnpm install                 # installs deps + copies the Hunspell dictionaries
cp .env.example .env         # set VITE_GOOGLE_CLIENT_ID / _SECRET (your client)
node scripts/env-from-google-json.mjs <client_secret.json>   # (shortcut from the Google JSON)
pnpm tauri dev               # run the app
```

> Without `.env`, the app still works as a **local draft** (no saving) — handy for testing
> the editor, spell checker and animations.
>
> ⚠️ Under WSL, `tauri dev` uses the **WebKitGTK** engine (not WebView2): the final glass
> effect, video/audio playback and the microphone must be validated on the **Windows `.exe`**.

Checks:

```bash
pnpm build                                          # type-check + front build
cargo check --manifest-path src-tauri/Cargo.toml    # Rust backend
```

---

## 🪟 Build the Windows installer (.exe)

Tauri can't reliably cross-compile a Windows build from Linux/WSL → the `.exe` is produced
by **GitHub Actions** on a Windows runner.

1. Push the project to GitHub.
2. **Settings → Secrets → Actions**: add `VITE_GOOGLE_CLIENT_ID` and
   `VITE_GOOGLE_CLIENT_SECRET`.
3. Create a version tag:
   ```bash
   git tag v0.1.0 && git push origin v0.1.0
   ```
4. The [`release.yml`](.github/workflows/release.yml) workflow builds and publishes a **draft
   Release** with `Stela_0.1.0_x64-setup.exe` (NSIS, per-user, EN/FR). Review, then publish.

> To remove the **SmartScreen** warning, sign the installer with an **EV certificate** or
> **Azure Trusted Signing**.

---

## 🗂️ Architecture

```
src/                      React / TypeScript frontend
  editor/extensions/      TipTap: markdown, tasks, math, video, audio, caret, ink, spellcheck
  spellcheck/             Web Worker nspell + eld detection + dictionaries
  drive/                  client (invoke), cache, media, useDriveSync hook
  components/             titlebar, sidebar, status bar, settings, media dialogs
  theme/                  OS-following dark/light theme
src-tauri/                Rust backend (Tauri v2)
  src/google/             OAuth PKCE + Drive REST v3 client (text + binary)
  src/commands/           commands exposed to the frontend
  src/secrets.rs          refresh token in the OS keychain
.github/workflows/        release.yml — builds the .exe on windows-latest
```

**Stack:** Tauri v2 (Rust) · React 19 · TypeScript · Vite 7 · Tailwind v4 · TipTap 3 ·
KaTeX · nspell + Hunspell · Google Drive API v3.

---

## ⚠️ Known limitations

- `drive.file` only sees files the app created (picking an arbitrary existing Drive folder
  would require the Google Picker).
- An unsigned installer triggers a SmartScreen warning.
- The glass effect is best on Windows 11; media playback and microphone can't be tested
  under WSL.

---

## 🤖 Built with AI

Stela was designed and built with the help of a large language model
(Anthropic's **Claude**), used for architecture, code generation and documentation. All
choices were reviewed by the author. Contributions and fixes are welcome.

---

## 📄 License

[MIT](LICENSE) © 2026 Auxance Jourdan.

The bundled Hunspell dictionaries keep their upstream licenses: **dictionary-fr** (MPL-2.0),
**dictionary-en** (MIT AND BSD).
