import { useI18n } from "../i18n";

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
  const { t } = useI18n();
  if (tabs.length === 0) return null;
  return (
    <div className="tabs glass">
      <div className="tabs__strip">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab${tab.id === activeId ? " tab--active" : ""}`}
            onMouseDown={(e) => {
              // middle-click closes, like a browser
              if (e.button === 1) {
                e.preventDefault();
                onClose(tab.id);
              }
            }}
          >
            <button className="tab__label" title={tab.name} onClick={() => onSelect(tab.id)}>
              {tab.name.replace(/\.md$/i, "") || t("note.untitled")}
            </button>
            <button
              className="tab__close"
              aria-label={t("tabs.close")}
              onClick={(e) => {
                e.stopPropagation();
                onClose(tab.id);
              }}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <path d="M3 3 L9 9 M9 3 L3 9" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button className="tab__new" aria-label={t("tabs.new")} title={t("tabs.new")} onClick={onNew}>
        <svg width="13" height="13" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M7 2.5 V11.5 M2.5 7 H11.5" />
        </svg>
      </button>
    </div>
  );
}
