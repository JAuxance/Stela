// Copies the Hunspell .aff/.dic files out of the (ESM, Node-only) dictionary-*
// packages into public/dictionaries/{en,fr} so the spellcheck Web Worker can
// fetch them as plain static assets in the webview. Runs on postinstall.
//
// It is intentionally non-fatal: if the packages aren't installed yet (e.g. a
// partial/offline install) it warns and exits 0 so it never blocks `pnpm install`.

import { mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** package name -> output language folder */
const DICTS = [
  { pkg: "dictionary-en", out: "en" },
  { pkg: "dictionary-fr", out: "fr" },
];

let copied = 0;
for (const { pkg, out } of DICTS) {
  const outDir = resolve(root, "public", "dictionaries", out);
  mkdirSync(outDir, { recursive: true });
  for (const file of ["index.aff", "index.dic"]) {
    const src = resolve(root, "node_modules", pkg, file);
    if (!existsSync(src)) {
      console.warn(`[copy-dicts] ${pkg}/${file} not found — skipping (run after install).`);
      continue;
    }
    copyFileSync(src, resolve(outDir, file));
    copied++;
  }
}

console.log(`[copy-dicts] copied ${copied} dictionary file(s) into public/dictionaries/`);
