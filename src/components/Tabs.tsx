export interface TabItem {
  id: string;
  name: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
}

export function Tabs({ tabs, activeId, onSelect, onClose, onNew }: TabsProps) {
  if (tabs.length === 0) return null;
  return (
    <div className="tabs glass">
      <div className="tabs__strip">
        {tabs.map((t) => (
          <div
            key={t.id}
            className={`tab${t.id === activeId ? " tab--active" : ""}`}
            onMouseDown={(e) => {
              // middle-click closes, like a browser
              if (e.button === 1) {
                e.preventDefault();
                onClose(t.id);
              }
            }}
          >
            <button className="tab__label" title={t.name} onClick={() => onSelect(t.id)}>
              {t.name.replace(/\.md$/i, "") || "Sans titre"}
            </button>
            <button
              className="tab__close"
              aria-label="Fermer l'onglet"
              onClick={(e) => {
                e.stopPropagation();
                onClose(t.id);
              }}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <path d="M3 3 L9 9 M9 3 L3 9" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button className="tab__new" aria-label="Nouvel onglet" title="Nouvelle note" onClick={onNew}>
        <svg width="13" height="13" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M7 2.5 V11.5 M2.5 7 H11.5" />
        </svg>
      </button>
    </div>
  );
}
