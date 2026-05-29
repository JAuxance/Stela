import StarterKit from "@tiptap/starter-kit";
import { markdownExtension } from "./markdown";
import { taskExtensions } from "./tasks";
import { SmoothCaret } from "./smoothCaret";
import { Spellcheck, type SpellContextInfo } from "./spellcheck";
import type { Lang } from "../../lib/language";

export interface BuildOptions {
  defaultLang: Lang;
  onSpellContextMenu: (info: SpellContextInfo) => void;
}

/**
 * Composition root for the editor. StarterKit v3 already ships markdown-as-you-type
 * input rules (headings, bold/italic, lists, code blocks, blockquotes) plus Link,
 * Underline, and history; we layer tasks, Markdown round-trip, the smooth caret,
 * and the bilingual spellchecker on top.
 */
export function buildExtensions(options: BuildOptions) {
  return [
    StarterKit,
    ...taskExtensions(),
    markdownExtension(),
    SmoothCaret,
    Spellcheck.configure({
      defaultLang: options.defaultLang,
      enabled: true,
      onContextMenu: options.onSpellContextMenu,
    }),
  ];
}

export type { SpellContextInfo };
