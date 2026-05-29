import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

/**
 * Renders a custom caret overlay that glides between positions. The native caret
 * is hidden via CSS (`caret-color: transparent`). The overlay is a child of the
 * `.ProseMirror` element, so it scrolls naturally with the content; we only
 * recompute on selection/transaction changes.
 *
 * Robustness notes (per ProseMirror caret pitfalls):
 *  - hidden while composing (IME) so we never fight composition,
 *  - hidden for non-empty selections (native selection takes over),
 *  - `side` passed to coordsAtPos to land on the right line at wrap boundaries.
 */
class CaretView {
  private caret: HTMLDivElement;
  private raf = 0;
  private readonly onFocusChange = () => this.schedule();

  constructor(private view: EditorView) {
    this.caret = document.createElement("div");
    this.caret.className = "stela-caret";
    this.caret.setAttribute("aria-hidden", "true");
    view.dom.appendChild(this.caret);
    view.dom.addEventListener("focus", this.onFocusChange);
    view.dom.addEventListener("blur", this.onFocusChange);
    this.schedule();
  }

  update() {
    this.schedule();
  }

  private schedule() {
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this.draw());
  }

  private hide() {
    this.caret.style.opacity = "0";
    this.caret.classList.remove("is-blinking");
  }

  private draw() {
    const { view } = this;
    const sel = view.state.selection;
    const composing = (view as unknown as { composing: boolean }).composing;

    if (!sel.empty || !view.hasFocus() || composing) {
      this.hide();
      return;
    }

    const head = sel.head;
    const side = sel.$head.parentOffset === 0 ? 1 : -1;
    let coords: { left: number; top: number; bottom: number };
    try {
      coords = view.coordsAtPos(head, side);
    } catch {
      this.hide();
      return;
    }

    const rect = view.dom.getBoundingClientRect();
    const left = coords.left - rect.left;
    const top = coords.top - rect.top;
    const height = Math.max(coords.bottom - coords.top, 14);

    this.caret.style.height = `${height}px`;
    this.caret.style.transform = `translate(${left}px, ${top}px)`;
    this.caret.style.opacity = "1";

    // Restart the blink animation on every move (VS Code / CodeMirror behavior).
    this.caret.classList.remove("is-blinking");
    void this.caret.offsetWidth;
    this.caret.classList.add("is-blinking");
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.view.dom.removeEventListener("focus", this.onFocusChange);
    this.view.dom.removeEventListener("blur", this.onFocusChange);
    this.caret.remove();
  }
}

export const SmoothCaret = Extension.create({
  name: "smoothCaret",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("smoothCaret"),
        view: (view) => new CaretView(view),
      }),
    ];
  },
});
