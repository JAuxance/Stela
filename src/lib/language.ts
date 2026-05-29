export type Lang = "en" | "fr";

/** App UI / default spellcheck language, inferred from the OS locale. */
export function defaultLang(): Lang {
  const nav = typeof navigator !== "undefined" ? navigator.language : "en";
  return nav.toLowerCase().startsWith("fr") ? "fr" : "en";
}

export const LANG_LABEL: Record<Lang, string> = {
  en: "English",
  fr: "Français",
};

export type LangPref = Lang | "auto";
const PREF_KEY = "stela.lang";

export function getLangPref(): LangPref {
  try {
    const v = localStorage.getItem(PREF_KEY);
    return v === "fr" || v === "en" || v === "auto" ? v : "auto";
  } catch {
    return "auto";
  }
}

export function setLangPref(pref: LangPref): void {
  try {
    localStorage.setItem(PREF_KEY, pref);
  } catch {
    /* ignore */
  }
}

/** The spellcheck default language, honoring the user's preference (or OS auto). */
export function resolvedLang(): Lang {
  const pref = getLangPref();
  return pref === "auto" ? defaultLang() : pref;
}
