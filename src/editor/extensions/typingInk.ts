import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * "Ink" effect: freshly typed characters fade in from transparent to normal.
 * Each inserted text run gets a short-lived decoration carrying a CSS fade-in;
 * decorations are pruned once the animation is done so the DOM stays clean.
 */
const key = new PluginKey<DecorationSet>("stela-typing-ink");
const LIFETIME = 580; // ms — must exceed the CSS animation duration
const MAX_RUN = 12; // don't animate big inserts (paste / note load)

interface InkSpec {
  created: number;
}

export const TypingInk = Extension.create({
  name: "typingInk",
  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, set) {
            let next = set.map(tr.mapping, tr.doc);
            const now = Date.now();

            if (tr.docChanged) {
              const adds: Decoration[] = [];
              tr.steps.forEach((step, i) => {
                step.getMap().forEach((_fromA, _toA, fromB, toB) => {
                  if (toB <= fromB) return;
                  let from = fromB;
                  let to = toB;
                  for (let j = i + 1; j < tr.steps.length; j++) {
                    const m = tr.steps[j].getMap();
                    from = m.map(from);
                    to = m.map(to);
                  }
                  if (to > from && to - from <= MAX_RUN) {
                    adds.push(
                      Decoration.inline(from, to, { class: "stela-ink" }, { created: now } as InkSpec),
                    );
                  }
                });
              });
              if (adds.length) next = next.add(tr.doc, adds);
            }

            const expired = next.find().filter((d) => now - (d.spec as InkSpec).created > LIFETIME);
            if (expired.length) next = next.remove(expired);

            return next;
          },
        },
        props: {
          decorations(state) {
            return key.getState(state);
          },
        },
        view() {
          return {
            update(view) {
              const set = key.getState(view.state);
              if (set && set.find().length > 0) {
                setTimeout(() => {
                  if (view.isDestroyed) return;
                  view.dispatch(view.state.tr.setMeta(key, "prune"));
                }, LIFETIME + 40);
              }
            },
          };
        },
      }),
    ];
  },
});
