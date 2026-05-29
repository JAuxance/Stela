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

type MarkdownManager = {
  serialize?: (json: unknown) => string;
  parse?: (md: string) => unknown;
};
type AnyEditor = Editor & { markdown?: MarkdownManager };

const setContent = (editor: Editor, content: unknown) =>
  (editor.commands.setContent as unknown as (
    content: unknown,
    options: Record<string, unknown>,
  ) => boolean)(content, { emitUpdate: false });

/* ---------------------------------------------------------------------------
 * Custom-node <-> Markdown bridge.
 * @tiptap/markdown only knows standard nodes, so before serializing we "demote"
 * our custom nodes (math, media) to plain text/links, and after parsing we
 * "revive" those text patterns back into the rich nodes. This keeps the stored
 * .md fully portable (standard `$...$`, links) and the round-trip lossless.
 * ------------------------------------------------------------------------- */

interface Mark {
  type?: string;
  attrs?: Record<string, unknown>;
}
interface JSONNode {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Mark[];
  content?: JSONNode[];
}

// Inline math `$...$` (no surrounding spaces, single line).
const INLINE_MATH = /\$(?!\s)([^$\n]+?)(?<!\s)\$/g;
// Media is stored as a portable link to a reserved (non-resolving) host.
const MEDIA_BASE = "https://stela.invalid";

function mediaParagraph(label: string, path: string, params: URLSearchParams): JSONNode {
  return {
    type: "paragraph",
    content: [
      { type: "text", text: label, marks: [{ type: "link", attrs: { href: `${MEDIA_BASE}${path}?${params}` } }] },
    ],
  };
}

function demoteNode(node: JSONNode): JSONNode {
  if (node.type === "mathInline") {
    return { type: "text", text: `$${(node.attrs?.latex as string) ?? ""}$` };
  }
  if (node.type === "mathBlock") {
    const latex = (node.attrs?.latex as string) ?? "";
    return { type: "paragraph", content: [{ type: "text", text: `$$${latex}$$` }] };
  }
  if (node.type === "videoEmbed") {
    const a = node.attrs ?? {};
    const p = new URLSearchParams();
    p.set("provider", String(a.provider ?? "url"));
    if (a.fileId) p.set("fileId", String(a.fileId));
    if (a.src && a.provider !== "drive") p.set("src", String(a.src));
    if (a.mime) p.set("mime", String(a.mime));
    p.set("name", String(a.name ?? "Vidéo"));
    return mediaParagraph(`Vidéo : ${a.name ?? "Vidéo"}`, "/video", p);
  }
  if (node.type === "audioNote") {
    const a = node.attrs ?? {};
    const p = new URLSearchParams();
    if (a.fileId) p.set("fileId", String(a.fileId));
    if (a.mime) p.set("mime", String(a.mime));
    p.set("name", String(a.name ?? "Note vocale"));
    return mediaParagraph(`Note vocale : ${a.name ?? "Note vocale"}`, "/audio", p);
  }
  if (node.type === "imageNode") {
    const a = node.attrs ?? {};
    const p = new URLSearchParams();
    if (a.fileId) p.set("fileId", String(a.fileId));
    else if (a.src) p.set("src", String(a.src));
    if (a.mime) p.set("mime", String(a.mime));
    p.set("alt", String(a.alt ?? "Image"));
    return mediaParagraph(`Image : ${a.alt ?? ""}`, "/image", p);
  }
  if (node.type === "mermaidDiagram") {
    return {
      type: "codeBlock",
      attrs: { language: "mermaid" },
      content: [{ type: "text", text: String(node.attrs?.code ?? "") }],
    };
  }
  if (node.type === "chart") {
    const a = node.attrs ?? {};
    const json = JSON.stringify({ kind: a.kind, title: a.title, labels: a.labels, values: a.values });
    return { type: "codeBlock", attrs: { language: "chart" }, content: [{ type: "text", text: json }] };
  }
  if (node.content) return { ...node, content: node.content.map(demoteNode) };
  return node;
}

function reviveInlineText(node: JSONNode): JSONNode[] {
  if (node.type !== "text" || !node.text || !node.text.includes("$")) return [node];
  const out: JSONNode[] = [];
  let last = 0;
  for (const m of node.text.matchAll(INLINE_MATH)) {
    const start = m.index ?? 0;
    if (start > last) out.push({ ...node, text: node.text.slice(last, start) });
    out.push({ type: "mathInline", attrs: { latex: m[1] } });
    last = start + m[0].length;
  }
  if (out.length === 0) return [node];
  if (last < node.text.length) out.push({ ...node, text: node.text.slice(last) });
  return out;
}

function reviveNode(node: JSONNode): JSONNode {
  // Fenced code blocks tagged mermaid/chart become their rich nodes.
  if (node.type === "codeBlock") {
    const lang = (node.attrs?.language as string | undefined) ?? "";
    const text = node.content?.map((c) => c.text ?? "").join("") ?? "";
    if (lang === "mermaid") return { type: "mermaidDiagram", attrs: { code: text } };
    if (lang === "chart") {
      try {
        const cfg = JSON.parse(text);
        return {
          type: "chart",
          attrs: {
            kind: cfg.kind ?? "bar",
            title: cfg.title ?? "",
            labels: Array.isArray(cfg.labels) ? cfg.labels : [],
            values: Array.isArray(cfg.values) ? cfg.values : [],
          },
        };
      } catch {
        /* leave as a normal code block */
      }
    }
    return node;
  }

  if (node.type === "paragraph" && node.content && node.content.length === 1) {
    const child = node.content[0];

    // Standalone `$$...$$` paragraph -> block math.
    const text = child?.text?.trim() ?? "";
    const block = /^\$\$([\s\S]+?)\$\$$/.exec(text);
    if (child?.type === "text" && block) {
      return { type: "mathBlock", attrs: { latex: block[1].trim() } };
    }

    // Media link paragraph -> video / audio node.
    const href = child?.marks?.find(
      (m) => m.type === "link" && typeof m.attrs?.href === "string" && (m.attrs.href as string).startsWith(MEDIA_BASE),
    )?.attrs?.href as string | undefined;
    if (child?.type === "text" && href) {
      const url = new URL(href);
      const p = url.searchParams;
      if (url.pathname === "/video") {
        return {
          type: "videoEmbed",
          attrs: {
            provider: p.get("provider") ?? "url",
            src: p.get("src") ?? "",
            fileId: p.get("fileId"),
            name: p.get("name") ?? "Vidéo",
            mime: p.get("mime") ?? "video/mp4",
          },
        };
      }
      if (url.pathname === "/audio") {
        return {
          type: "audioNote",
          attrs: {
            fileId: p.get("fileId"),
            src: "",
            name: p.get("name") ?? "Note vocale",
            mime: p.get("mime") ?? "audio/webm",
          },
        };
      }
      if (url.pathname === "/image") {
        return {
          type: "imageNode",
          attrs: {
            src: p.get("src") ?? "",
            fileId: p.get("fileId"),
            alt: p.get("alt") ?? "",
            mime: p.get("mime") ?? "image/png",
          },
        };
      }
    }
  }
  if (node.content) {
    const content = node.content.flatMap((child) =>
      child.type === "text" ? reviveInlineText(child) : [reviveNode(child)],
    );
    return { ...node, content };
  }
  return node;
}

/** Serialize the current document to Markdown via @tiptap/markdown's manager. */
export function getMarkdown(editor: Editor): string {
  const md = (editor as AnyEditor).markdown;
  if (md?.serialize) return md.serialize(demoteNode(editor.getJSON() as JSONNode));
  return editor.getText();
}

/** Load a Markdown string into the editor without emitting an update event. */
export function setMarkdown(editor: Editor, markdown: string): void {
  const md = (editor as AnyEditor).markdown;
  if (md?.parse) setContent(editor, reviveNode(md.parse(markdown) as JSONNode));
  else setContent(editor, markdown);
}
