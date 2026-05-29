/// <reference lib="webworker" />
import nspell from "nspell";
import { eld } from "eld";
import { DICT_URLS } from "./dictionaries";
import type { Lang } from "../lib/language";

type Speller = import("nspell").NSpell;

interface Misspelling {
  from: number;
  to: number;
  word: string;
  lang: Lang;
}

type Req =
  | { type: "init"; personal: string[] }
  | { type: "check"; id: number; paragraphs: { from: number; text: string }[]; defaultLang: Lang }
  | { type: "suggest"; id: number; word: string; lang: Lang }
  | { type: "add"; word: string; lang: Lang };

const spellers: Partial<Record<Lang, Speller>> = {};
const loading: Partial<Record<Lang, Promise<Speller>>> = {};
const personal = new Set<string>();

// A "word": one or more letters, allowing internal apostrophes/hyphens (l'arbre, week-end).
const WORD_RE = /\p{L}[\p{L}\p{M}'’-]*\p{L}|\p{L}/gu;

async function getSpeller(lang: Lang): Promise<Speller> {
  const existing = spellers[lang];
  if (existing) return existing;
  if (!loading[lang]) {
    loading[lang] = (async () => {
      const urls = DICT_URLS[lang];
      const [aff, dic] = await Promise.all([
        fetch(urls.aff).then((r) => r.text()),
        fetch(urls.dic).then((r) => r.text()),
      ]);
      const speller = nspell(aff, dic);
      for (const word of personal) speller.add(word);
      spellers[lang] = speller;
      return speller;
    })();
  }
  return loading[lang]!;
}

function detect(text: string, fallback: Lang): Lang {
  const trimmed = text.trim();
  if (trimmed.length < 16) return fallback;
  try {
    const result = eld.detect(trimmed);
    const lang = result.language;
    if ((lang === "en" || lang === "fr") && result.isReliable()) return lang;
  } catch {
    /* detection is best-effort */
  }
  return fallback;
}

async function checkParagraph(
  text: string,
  from: number,
  defaultLang: Lang,
): Promise<Misspelling[]> {
  const lang = detect(text, defaultLang);
  const speller = await getSpeller(lang);
  const out: Misspelling[] = [];
  for (const match of text.matchAll(WORD_RE)) {
    const word = match[0];
    const index = match.index ?? 0;
    if (word.length < 2) continue;
    if (/\d/.test(word)) continue;
    if (word === word.toUpperCase() && word.length <= 4) continue; // skip short acronyms
    if (personal.has(word.toLowerCase())) continue;
    if (speller.correct(word)) continue;
    if (speller.correct(word.toLowerCase())) continue;
    out.push({ from: from + index, to: from + index + word.length, word, lang });
  }
  return out;
}

self.onmessage = async (event: MessageEvent<Req>) => {
  const msg = event.data;

  if (msg.type === "init") {
    for (const w of msg.personal) personal.add(w.toLowerCase());
    return;
  }

  if (msg.type === "add") {
    personal.add(msg.word.toLowerCase());
    const speller = spellers[msg.lang];
    if (speller) speller.add(msg.word);
    return;
  }

  if (msg.type === "check") {
    const all: Misspelling[] = [];
    for (const p of msg.paragraphs) {
      try {
        all.push(...(await checkParagraph(p.text, p.from, msg.defaultLang)));
      } catch {
        /* skip paragraph on error */
      }
    }
    (self as DedicatedWorkerGlobalScope).postMessage({
      type: "result",
      id: msg.id,
      misspellings: all,
    });
    return;
  }

  if (msg.type === "suggest") {
    let suggestions: string[] = [];
    try {
      const speller = await getSpeller(msg.lang);
      suggestions = speller.suggest(msg.word).slice(0, 7);
    } catch {
      /* none */
    }
    (self as DedicatedWorkerGlobalScope).postMessage({
      type: "suggestions",
      id: msg.id,
      suggestions,
    });
  }
};
