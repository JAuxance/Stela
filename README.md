<div align="center">

# Stela

**Prise de notes Markdown, minimaliste et *glassy*, synchronisée à Google Drive.**

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)
![Platform](https://img.shields.io/badge/platform-Windows-black)
![Tauri](https://img.shields.io/badge/Tauri-v2-black)
![React](https://img.shields.io/badge/React-19-black)
![Rust](https://img.shields.io/badge/Rust-stable-black)

</div>

---

Stela est une app de bureau **noir & blanc, verre dépoli (iOS)**, pensée pour écrire
vite et joliment :

- ✍️ **Éditeur WYSIWYG inline** (TipTap / ProseMirror) — le Markdown se transforme en
  direct (titres, gras, listes, tâches `[ ]`, code, citations) et le fichier reste un
  `.md` propre.
- 🌊 **Curseur animé fluide** + **fondu d'écriture** (les lettres apparaissent en douceur).
- 🔤 **Correction orthographique FR / EN** 100 % locale (nspell + Hunspell), détection
  de langue par paragraphe, clic droit → suggestions / ignorer / ajouter au dictionnaire.
- 🧮 **LaTeX** — formules en ligne `$…$` et bloc `$$…$$` (rendu KaTeX, édition au clic).
- 🎙️ **Notes vocales** — enregistrement micro, **waveform**, lecteur ; audio stocké sur Drive.
- 🎬 **Vidéo** — embed YouTube / Vimeo / URL, ou upload d'un fichier local sur Drive.
- ☁️ **Google Drive = source de vérité** — `.md` créés/lus dans un dossier configurable,
  écriture *debouncée* + détection des changements distants + gestion des conflits.
- 🌗 **Thème clair/sombre** suivant le système, **Réglages** style iOS.
- ↩️ Undo/Redo, suppression des notes et des blocs média.

> **Plateforme :** Windows (installeur `.exe`). Linux/macOS hors périmètre.

---

## 📦 Installation (utilisateur final)

1. Va dans l'onglet **Releases** du dépôt et télécharge `Stela_x.y.z_x64-setup.exe`.
2. Lance-le (installation **par utilisateur**, sans droits admin).
3. Ouvre Stela → **« Connecter Google Drive »** → connecte-toi avec ton compte Google.

> **Aucune manipulation Google Cloud n'est nécessaire pour les utilisateurs.** Les
> identifiants OAuth sont **embarqués dans l'app** par le développeur (voir plus bas).
> Si l'installeur n'est pas signé, Windows SmartScreen affiche un avertissement
> « éditeur inconnu » → *Informations complémentaires → Exécuter quand même*.

---

## 🔐 Connexion Google : qui fait quoi ?

C'est la question clé. **Deux rôles distincts :**

| | Développeur (toi) — **une seule fois** | Utilisateur final — **à chaque appareil** |
|---|---|---|
| Action | Crée 1 client OAuth, le publie, le met dans la build | Clique « Connecter », se connecte à Google |
| Google Cloud | Oui (une fois) | **Jamais** |

L'app lit `VITE_GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_SECRET` **au build**. En CI, ils
viennent des **secrets GitHub** → le `.exe` distribué contient déjà le client. Le
`client_secret` d'une app de bureau n'est pas un vrai secret : c'est **PKCE (S256)** qui
sécurise l'échange.

### Côté développeur — rendre la connexion fluide (recommandé)

Pour que tes utilisateurs aient un **« Se connecter avec Google » propre** (sans écran
« app non vérifiée », sans plafond de 100 testeurs, et avec des jetons longue durée) :

1. **Google Cloud Console** → active **Google Drive API**.
2. **OAuth consent screen** : type *External*, renseigne nom + logo + e-mail de support
   + **lien vers une politique de confidentialité** (obligatoire pour publier).
3. **Scope** : uniquement `…/auth/drive.file` (non sensible → **pas d'audit de sécurité
   CASA**).
4. **Credentials** → **OAuth client ID** → **Desktop app** → récupère id + secret.
5. **Publishing status → PUBLISH APP** (passe en *In production*). Complète la
   **vérification de marque** (logo/domaine) pour retirer l'écran d'avertissement.
6. Mets l'id + le secret dans les **secrets GitHub** `VITE_GOOGLE_CLIENT_ID` /
   `VITE_GOOGLE_CLIENT_SECRET` (la CI les injecte dans le build).

> Tant que l'app est en *Testing*, seuls des comptes ajoutés en *test users* peuvent se
> connecter, et le refresh token **expire en 7 jours**. La publication lève ces limites.

---

## 🛠️ Développement

**Prérequis :** Node 22+, pnpm 11+, Rust stable. Dév possible sous **WSL2**.

```bash
pnpm install                 # installe + copie les dictionnaires Hunspell
cp .env.example .env         # renseigne VITE_GOOGLE_CLIENT_ID / _SECRET (ton client)
node scripts/env-from-google-json.mjs <client_secret.json>   # (raccourci depuis le JSON Google)
pnpm tauri dev               # lance l'app
```

> Sans `.env`, l'app reste utilisable en **brouillon local** (sans sauvegarde) — pratique
> pour tester l'éditeur, le correcteur et les animations.
>
> ⚠️ Sous WSL, `tauri dev` utilise le moteur **WebKitGTK** (pas WebView2) : l'effet glassy
> final, la lecture vidéo/audio et le micro se valident sur le **`.exe` Windows**.

Vérifications :

```bash
pnpm build                                          # type-check + build front
cargo check --manifest-path src-tauri/Cargo.toml    # backend Rust
```

---

## 🪟 Construire l'installateur Windows (.exe)

Tauri ne peut pas cross-compiler de façon fiable un build Windows depuis Linux/WSL → le
`.exe` est produit par **GitHub Actions** sur un runner Windows.

1. Pousse le projet sur GitHub.
2. **Settings → Secrets → Actions** : ajoute `VITE_GOOGLE_CLIENT_ID` et
   `VITE_GOOGLE_CLIENT_SECRET`.
3. Crée un tag de version :
   ```bash
   git tag v0.1.0 && git push origin v0.1.0
   ```
4. Le workflow [`release.yml`](.github/workflows/release.yml) build et publie un **brouillon
   de Release** avec `Stela_0.1.0_x64-setup.exe` (NSIS, par-utilisateur, FR/EN). Vérifie puis
   publie.

> Pour supprimer l'avertissement **SmartScreen**, signe l'installeur avec un certificat
> **EV** ou **Azure Trusted Signing**.

---

## 🗂️ Architecture

```
src/                      Frontend React / TypeScript
  editor/extensions/      TipTap : markdown, tâches, maths, vidéo, audio, curseur, fondu, correcteur
  spellcheck/             Web Worker nspell + détection eld + dictionnaires
  drive/                  client (invoke), cache, médias, hook de synchro useDriveSync
  components/             titlebar, sidebar, status bar, réglages, dialogues média
  theme/                  thème dark/light suivant l'OS
src-tauri/                Backend Rust (Tauri v2)
  src/google/             OAuth PKCE + client Drive REST v3 (texte + binaire)
  src/commands/           commandes exposées au frontend
  src/secrets.rs          refresh token dans le trousseau OS
.github/workflows/        release.yml — build du .exe sur windows-latest
```

**Pile :** Tauri v2 (Rust) · React 19 · TypeScript · Vite 7 · Tailwind v4 · TipTap 3 ·
KaTeX · nspell + Hunspell · Google Drive API v3.

---

## ⚠️ Limites connues

- `drive.file` ne voit que les fichiers créés par l'app (choisir un dossier Drive
  arbitraire nécessiterait le Google Picker).
- Installeur non signé → avertissement SmartScreen.
- Rendu glassy optimal sous Windows 11 ; lecture média et micro non testables sous WSL.

---

## 📄 Licence

[MIT](LICENSE) © 2026 Auxance Jourdan.

Les dictionnaires Hunspell embarqués conservent leur licence d'origine : **dictionary-fr**
(MPL-2.0), **dictionary-en** (MIT AND BSD).
