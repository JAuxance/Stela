import { Markdown } from "@tiptap/markdown";
import type { Editor } from "@tiptap/core";

/** Official bidirectional Markdown extension (CommonMark + GFM). */
export function markdownExtension() {
  return Markdown.configure({
    html: false,
    breaks: false,
    linkify: true,
    transformPastedText: true,
  } as Record<string, unknown>);
}

type AnyEditor = Editor & {
  getMarkdown?: () => string;
  markdown?: { serialize?: (doc: unknown) => string };
  storage?: { markdown?: { getMarkdown?: () => string } };
};

/** Serialize the current document to Markdown, across @tiptap/markdown API shapes. */
export function getMarkdown(editor: Editor): string {
  const ed = editor as AnyEditor;
  if (typeof ed.getMarkdown === "function") return ed.getMarkdown();
  if (ed.storage?.markdown?.getMarkdown) return ed.storage.markdown.getMarkdown();
  if (ed.markdown?.serialize) return ed.markdown.serialize(editor.state.doc);
  return editor.getText();
}

/** Load a Markdown string into the editor without emitting an update event. */
export function setMarkdown(editor: Editor, md: string): void {
  try {
    (editor.commands.setContent as unknown as (
      content: string,
      options: Record<string, unknown>,
    ) => boolean)(md, { contentType: "markdown", emitUpdate: false });
  } catch {
    editor.commands.setContent(md, { emitUpdate: false } as Record<string, unknown>);
  }
}
