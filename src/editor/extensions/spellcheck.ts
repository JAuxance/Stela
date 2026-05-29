import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, type EditorState } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";
import { checkParagraphs } from "../../spellcheck/proofreader";
import type { Lang } from "../../lib/language";

export interface SpellContextInfo {
  word: string;
  lang: Lang;
  from: number;
  to: number;
  x: number;
  y: number;
}

export interface SpellcheckOptions {
  defaultLang: Lang;
  enabled: boolean;
  onContextMenu: ((info: SpellContextInfo) => void) | null;
}

interface SpellState {
  deco: DecorationSet;
  ignored: Set<string>;
}

interface SpellMeta {
  decorations?: DecorationSet;
  ignore?: string;
}

export const spellKey = new PluginKey<SpellState>("stela-spellcheck");

/** Debounced background pass: collect block texts, check off-thread, draw squiggles. */
class SpellcheckView {
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private view: EditorView,
    private options: SpellcheckOptions,
  ) {
    this.schedule();
  }

  update(view: EditorView, prev: EditorState) {
    if (!view.state.doc.eq(prev.doc)) this.schedule();
  }

  private schedule() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.run(), 450);
  }

  private async run() {
    if (!this.options.enabled) return;

    const paragraphs: { from: number; text: string }[] = [];
    this.view.state.doc.descendants((node, pos) => {
      if (node.type.name === "codeBlock") return false;
      if (node.isTextblock) {
        const text = node.textContent;
        if (text.trim().length > 0) paragraphs.push({ from: pos + 1, text });
        return false;
      }
      return true;
    });

    if (paragraphs.length === 0) {
      this.view.dispatch(this.view.state.tr.setMeta(spellKey, { decorations: DecorationSet.empty }));
      return;
    }

    const results = await checkParagraphs(paragraphs, this.options.defaultLang);

    // The document may have changed while awaiting — build against the live doc.
    const live = this.view.state;
    const ignored = spellKey.getState(live)?.ignored ?? new Set<string>();
    const docSize = live.doc.content.size;

    const decorations = results
      .filter((m) => m.to <= docSize && !ignored.has(m.word.toLowerCase()))
      .map((m) =>
        Decoration.inline(
          m.from,
          m.to,
          { class: "stela-misspell" },
          { word: m.word, lang: m.lang },
        ),
      );

    const deco = DecorationSet.create(live.doc, decorations);
    this.view.dispatch(live.tr.setMeta(spellKey, { decorations: deco }));
  }

  destroy() {
    if (this.timer) clearTimeout(this.timer);
  }
}

export const Spellcheck = Extension.create<SpellcheckOptions>({
  name: "stelaSpellcheck",

  addOptions() {
    return { defaultLang: "en", enabled: true, onContextMenu: null };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    return [
      new Plugin<SpellState>({
        key: spellKey,
        state: {
          init: () => ({ deco: DecorationSet.empty, ignored: new Set<string>() }),
          apply(tr, value) {
            let deco = value.deco.map(tr.mapping, tr.doc);
            let ignored = value.ignored;
            const meta = tr.getMeta(spellKey) as SpellMeta | undefined;

            if (meta?.decorations) deco = meta.decorations;

            if (meta?.ignore) {
              const word = meta.ignore;
              ignored = new Set(ignored);
              ignored.add(word);
              const stale = deco.find(
                undefined,
                undefined,
                (spec) => (spec.word as string | undefined)?.toLowerCase() === word,
              );
              deco = deco.remove(stale);
            }

            return { deco, ignored };
          },
        },
        props: {
          decorations(state) {
            return spellKey.getState(state)?.deco;
          },
          handleDOMEvents: {
            contextmenu: (view, event) => {
              if (!options.onContextMenu) return false;
              const at = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (!at) return false;
              const hits = spellKey.getState(view.state)?.deco.find(at.pos, at.pos) ?? [];
              const hit = hits[0];
              if (!hit) return false;
              event.preventDefault();
              options.onContextMenu({
                word: (hit.spec.word as string) ?? "",
                lang: (hit.spec.lang as Lang) ?? options.defaultLang,
                from: hit.from,
                to: hit.to,
                x: event.clientX,
                y: event.clientY,
              });
              return true;
            },
          },
        },
        view: (view) => new SpellcheckView(view, options),
      }),
    ];
  },
});
