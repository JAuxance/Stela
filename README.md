# Stela

Application de prise de notes **Markdown** desktop, minimaliste, **noir & blanc
glassy**, avec :

- ✍️ **Éditeur WYSIWYG inline** (TipTap / ProseMirror) — le Markdown se transforme en
  live pendant la frappe (titres, gras, listes, tâches `[ ]`, code, citations).
- 🌊 **Curseur animé fluide** qui glisse entre les positions.
- 🔤 **Correction orthographique FR / EN** 100 % locale (nspell + dictionnaires
  Hunspell), détection de langue automatique par paragraphe, menu de suggestions au
  clic droit (remplacer / ignorer / ajouter au dictionnaire).
- ☁️ **Google Drive comme source de vérité** : les notes sont des `.md` créés et lus
  dans un dossier **« Stela Notes »** de ton Drive ; écriture *write-through* debouncée
  + détection des changements distants.
- 🌗 **Thème clair/sombre** suivant le système, effet **Mica** glassy sous Windows 11.
- 🪟 Livré en **installeur `.exe` Windows** (NSIS, sans droits admin).

> Stack : **Tauri v2** (Rust) · **React 19 + TypeScript + Vite 7** · **TailwindCSS 4**
> · **TipTap 3**. Cible Windows uniquement (Linux hors scope).

---

## 1. Prérequis

- **Node 22+** et **pnpm 11+**
- **Rust** stable (toolchain MSVC sur Windows)
- Un **client OAuth Google** (voir §3) — nécessaire pour la synchro Drive
- Pour produire le `.exe` : un **dépôt GitHub** (le build tourne en CI, voir §5)

Le développement se fait sous **WSL2/Linux** mais le **build final Windows** se fait
en CI : Tauri ne sait pas cross-compiler de façon fiable un `.exe` depuis Linux.

---

## 2. Démarrage rapide (dev)

```bash
pnpm install                 # installe + copie les dictionnaires dans public/
cp .env.example .env         # puis renseigne tes identifiants Google (§3)
pnpm tauri dev               # lance l'app (WebKitGTK via WSLg en dev)
```

> Sous WSL, `tauri dev` utilise le moteur **WebKitGTK**, pas WebView2. C'est parfait
> pour itérer l'UI et la logique, mais l'effet **Mica** et le rendu final doivent être
> vérifiés sur une vraie machine Windows (ou via l'installeur produit en CI).

Sans `.env` configuré, l'app reste utilisable en **mode brouillon local** (sans
sauvegarde) : pratique pour tester l'éditeur, le correcteur et le curseur.

---

## 3. Configuration Google Cloud (OAuth Drive)

1. Va sur <https://console.cloud.google.com/> → crée (ou choisis) un projet.
2. **APIs & Services → Enable APIs** → active **Google Drive API**.
3. **OAuth consent screen** : type *External*, renseigne nom/email. Ajoute le scope
   **non sensible** `.../auth/drive.file`. Ajoute ton compte en *Test user*.
4. **Credentials → Create credentials → OAuth client ID** → type **Application de
   bureau (Desktop app)**. Récupère le **client ID** et le **client secret**.
5. Mets-les dans `.env` :

   ```env
   VITE_GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
   VITE_GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx
   ```

**Bon à savoir :**
- Le scope `drive.file` ne donne accès qu'aux fichiers **créés par l'app** → pas
  d'audit de sécurité Google requis. Stela crée son propre dossier « Stela Notes ».
- Tant que l'app est en statut *Testing*, le **refresh token expire au bout de
  7 jours** (ré-auth nécessaire) et un écran « application non vérifiée » apparaît.
  Passe l'app en *In production* pour des tokens longue durée.
- Le `client_secret` d'une app de bureau **n'est pas réellement secret** : c'est
  **PKCE (S256)** qui sécurise l'échange. Il reste hors du dépôt via `.env`.

Le flux d'auth utilise la **redirection loopback** (`http://127.0.0.1:<port>`) gérée
par `tauri-plugin-oauth` ; le **refresh token** est stocké dans le **trousseau de
l'OS** (Windows Credential Manager), jamais en clair.

---

## 4. Architecture

```
src/                      Frontend React/TS
  editor/                 TipTap + extensions (markdown, tâches, curseur, correcteur)
  spellcheck/             Web Worker nspell + détection eld + dictionnaires
  drive/                  client (invoke), cache, hook de synchro useDriveSync
  theme/                  thème dark/light suivant l'OS
  components/             titlebar glassy, sidebar, status bar, menu suggestions
src-tauri/                Backend Rust (Tauri v2)
  src/google/             OAuth PKCE + client Drive REST v3
  src/commands/           commandes exposées au frontend (auth, drive, window)
  src/secrets.rs          refresh token dans le trousseau OS (keyring)
scripts/                  copy-dicts (Hunspell) + gen-icon (icône PNG)
.github/workflows/        release.yml — build du .exe sur windows-latest
```

---

## 5. Produire le `.exe` Windows (CI)

Le build tourne sur un runner **Windows** via GitHub Actions.

1. Pousse le projet sur GitHub.
2. Dans **Settings → Secrets and variables → Actions**, ajoute :
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_GOOGLE_CLIENT_SECRET`
3. Crée un tag de version et pousse-le :

   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

4. Le workflow [`release.yml`](.github/workflows/release.yml) build l'app et publie un
   **brouillon de Release** GitHub contenant `Stela_0.1.0_x64-setup.exe`. Vérifie puis
   publie la Release. Tu peux aussi lancer le workflow manuellement (*workflow_dispatch*).

> **SmartScreen** : l'installeur n'étant pas signé, Windows affichera un avertissement
> « éditeur inconnu » (clic sur *Informations complémentaires → Exécuter quand même*).
> Pour le supprimer, signe avec un certificat **EV** ou **Azure Trusted Signing**.

---

## 6. Vérification

```bash
pnpm tsc --noEmit          # types frontend
pnpm build                 # build Vite de production
cargo check --manifest-path src-tauri/Cargo.toml   # backend Rust
```

À valider sur **Windows** (impossible sous WSL) : effet Mica/glassy, WebView2,
trousseau (keyring), et le flux Drive de bout en bout (créer → la note apparaît dans
« Stela Notes » sur drive.google.com → éditer → re-sync → conflit géré).

---

## 7. Limites connues

- `drive.file` ne voit pas les `.md` créés en dehors de l'app.
- Pas de signature de code par défaut → avertissement SmartScreen.
- Le rendu glassy (Mica) est optimal sous **Windows 11** ; fallback solide ailleurs.
- La coloration syntaxique des blocs de code est volontairement absente (design N&B) ;
  elle peut être ajoutée via une extension Shiki/lowlight ultérieurement.
