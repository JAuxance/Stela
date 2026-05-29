/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_GOOGLE_CLIENT_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Third-party packages without bundled TypeScript types.
declare module "nspell" {
  interface NSpell {
    correct(word: string): boolean;
    suggest(word: string): string[];
    spell(word: string): { correct: boolean; forbidden: boolean; warn: boolean };
    add(word: string, model?: string): NSpell;
    remove(word: string): NSpell;
    wordCharacters(): string | undefined;
    dictionary(dic: string | Buffer): NSpell;
    personal(dic: string | Buffer): NSpell;
  }
  function nspell(aff: string | Buffer, dic?: string | Buffer): NSpell;
  function nspell(dictionary: { aff: string | Buffer; dic: string | Buffer }): NSpell;
  export default nspell;
  export type { NSpell };
}

declare module "eld" {
  export const eld: {
    detect(text: string): {
      language: string;
      getScores(): Record<string, number>;
      isReliable(): boolean;
    };
  };
}
