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
  private host: HTMLElement;
  private raf = 0;
  private everShown = false;
  private readonly onFocusChange = () => this.schedule();

  constructor(private view: EditorView) {
    // Mount the caret in the editor's WRAPPER (outside the contenteditable) so
    // ProseMirror never reconciles it away on edits, and it isn't itself editable.
    this.host = (view.dom.parentElement as HTMLElement | null) ?? view.dom;
    if (getComputedStyle(this.host).position === "static") {
      this.host.style.position = "relative";
    }

    this.caret = document.createElement("div");
    this.caret.className = "stela-caret";
    this.caret.contentEditable = "false";
    this.caret.setAttribute("aria-hidden", "true");
    this.host.appendChild(this.caret);

    view.dom.addEventListener("focus", this.onFocusChange);
    view.dom.addEventListener("blur", this.onFocusChange);
    document.addEventListener("selectionchange", this.onFocusChange);
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

    const rect = this.host.getBoundingClientRect();
    const left = coords.left - rect.left;
    const top = coords.top - rect.top;
    const height = Math.max(coords.bottom - coords.top, 14);

    // Only the very first appearance snaps into place (no corner glide). Every
    // later move — including clicks and refocus — glides via the CSS transition,
    // so the caret never teleports.
    const firstEver = !this.everShown;
    if (firstEver) this.caret.style.transition = "none";

    this.caret.style.height = `${height}px`;
    this.caret.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    this.caret.style.opacity = "1";

    if (firstEver) {
      void this.caret.offsetWidth; // commit the no-transition placement
      this.caret.style.transition = ""; // restore the glide from the stylesheet
      this.everShown = true;
    }

    // Restart the soft blink only after the cursor settles, so movement reads as
    // a continuous glide rather than a flicker.
    this.caret.classList.remove("is-blinking");
    if (this.blinkTimer) clearTimeout(this.blinkTimer);
    this.blinkTimer = setTimeout(() => this.caret.classList.add("is-blinking"), 180);
  }

  private blinkTimer: ReturnType<typeof setTimeout> | null = null;

  destroy() {
    cancelAnimationFrame(this.raf);
    if (this.blinkTimer) clearTimeout(this.blinkTimer);
    this.view.dom.removeEventListener("focus", this.onFocusChange);
    this.view.dom.removeEventListener("blur", this.onFocusChange);
    document.removeEventListener("selectionchange", this.onFocusChange);
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
