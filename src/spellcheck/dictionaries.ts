import type { Lang } from "../lib/language";

/**
 * URLs to the Hunspell dictionary assets. `scripts/copy-dicts.mjs` copies these
 * out of the dictionary-* packages into public/dictionaries on postinstall, so
 * they are served as plain static files (no Node-only ESM import in the webview).
 */
export const DICT_URLS: Record<Lang, { aff: string; dic: string }> = {
  en: { aff: "/dictionaries/en/index.aff", dic: "/dictionaries/en/index.dic" },
  fr: { aff: "/dictionaries/fr/index.aff", dic: "/dictionaries/fr/index.dic" },
};
