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
