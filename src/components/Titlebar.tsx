import { WindowControls } from "./WindowControls";

/**
 * Custom glassy titlebar. `data-tauri-drag-region` is applied directly to the
 * bar element (it does not propagate to children), so the window can be dragged
 * from empty areas while the buttons stay clickable.
 */
export function Titlebar({ noteName }: { noteName?: string }) {
  return (
    <div className="titlebar glass" data-tauri-drag-region>
      <div className="titlebar__brand" data-tauri-drag-region>
        <span className="titlebar__mark" />
        <span>Stela</span>
      </div>
      {noteName ? (
        <span className="note-item__meta" data-tauri-drag-region style={{ marginLeft: 6 }}>
          — {noteName}
        </span>
      ) : null}
      <div className="titlebar__spacer" data-tauri-drag-region />
      <WindowControls />
    </div>
  );
}
