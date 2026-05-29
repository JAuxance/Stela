import SpellcheckWorker from "./spellcheck.worker.ts?worker";
import type { Lang } from "../lib/language";

export interface Misspelling {
  from: number;
  to: number;
  word: string;
  lang: Lang;
}

const PERSONAL_KEY = "stela.personal-dict";

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, (data: any) => void>();

function loadPersonal(): string[] {
  try {
    const raw = localStorage.getItem(PERSONAL_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function getWorker(): Worker {
  if (worker) return worker;
  worker = new SpellcheckWorker();
  worker.onmessage = (e: MessageEvent<{ id: number }>) => {
    const resolve = pending.get(e.data.id);
    if (resolve) {
      pending.delete(e.data.id);
      resolve(e.data);
    }
  };
  worker.postMessage({ type: "init", personal: loadPersonal() });
  return worker;
}

/** Check the given block texts; positions in results are absolute doc positions. */
export function checkParagraphs(
  paragraphs: { from: number; text: string }[],
  defaultLang: Lang,
): Promise<Misspelling[]> {
  const id = nextId++;
  return new Promise((resolve) => {
    pending.set(id, (data) => resolve((data.misspellings as Misspelling[]) ?? []));
    getWorker().postMessage({ type: "check", id, paragraphs, defaultLang });
  });
}

export function suggest(word: string, lang: Lang): Promise<string[]> {
  const id = nextId++;
  return new Promise((resolve) => {
    pending.set(id, (data) => resolve((data.suggestions as string[]) ?? []));
    getWorker().postMessage({ type: "suggest", id, word, lang });
  });
}

export function addWord(word: string, lang: Lang): void {
  const set = new Set(loadPersonal());
  set.add(word.toLowerCase());
  try {
    localStorage.setItem(PERSONAL_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore quota errors */
  }
  getWorker().postMessage({ type: "add", word, lang });
}
