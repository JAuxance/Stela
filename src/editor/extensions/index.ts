import StarterKit from "@tiptap/starter-kit";
import { markdownExtension } from "./markdown";
import { taskExtensions } from "./tasks";
import { SmoothCaret } from "./smoothCaret";
import { TypingInk } from "./typingInk";
import { Spellcheck, type SpellContextInfo } from "./spellcheck";
import { MathInline, MathBlock } from "./math";
import { VideoEmbed } from "./video";
import { AudioNote } from "./audio";
import { ImageNode } from "./image";
import { ChartNode } from "./chart";
import { MermaidNode } from "./mermaid";
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
    MathInline,
    MathBlock,
    VideoEmbed,
    AudioNote,
    ImageNode,
    ChartNode,
    MermaidNode,
    markdownExtension(),
    SmoothCaret,
    TypingInk,
    Spellcheck.configure({
      defaultLang: options.defaultLang,
      enabled: true,
      onContextMenu: options.onSpellContextMenu,
    }),
  ];
}

export type { SpellContextInfo };
