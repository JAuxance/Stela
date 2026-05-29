import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

/**
 * Drag-to-resize for media node views. The handle finds its `.media-node`
 * ancestor, updates its width live during the drag, and commits the final width
 * (persisted in the node's `width` attribute) on release.
 */
export function useResize(width: number | null, onCommit: (w: number) => void) {
  const onPointerDown = (e: ReactPointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = (e.currentTarget as HTMLElement).closest(".media-node") as HTMLElement | null;
    if (!el) return;
    const startX = e.clientX;
    const startW = el.offsetWidth;
    const clamp = (x: number) => Math.max(180, startW + (x - startX));
    const move = (ev: PointerEvent) => {
      el.style.width = `${clamp(ev.clientX)}px`;
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      onCommit(Math.round(clamp(ev.clientX)));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const style: CSSProperties = { width: width ? `${width}px` : undefined, maxWidth: "100%" };
  return { style, onPointerDown };
}

export function ResizeHandle({ onPointerDown }: { onPointerDown: (e: ReactPointerEvent) => void }) {
  return (
    <span
      className="resize-handle"
      title="↔"
      onMouseDown={(e) => e.preventDefault()}
      onPointerDown={onPointerDown}
    />
  );
}
