import { useEffect, useRef } from "react";

export interface SuggestionMenuProps {
  x: number;
  y: number;
  word: string;
  loading: boolean;
  suggestions: string[];
  onReplace: (suggestion: string) => void;
  onIgnore: () => void;
  onAdd: () => void;
  onClose: () => void;
}

export function SuggestionMenu({
  x,
  y,
  word,
  loading,
  suggestions,
  onReplace,
  onIgnore,
  onAdd,
  onClose,
}: SuggestionMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onEsc);
    };
  }, [onClose]);

  // Keep the menu within the viewport.
  const left = Math.min(x, window.innerWidth - 224);
  const top = Math.min(y, window.innerHeight - 240);

  return (
    <div className="menu" style={{ left, top }} ref={ref}>
      <div className="menu__label">« {word} »</div>
      {loading ? (
        <div className="menu__item menu__item--muted">Recherche…</div>
      ) : suggestions.length > 0 ? (
        suggestions.map((s) => (
          <button key={s} className="menu__item" onClick={() => onReplace(s)}>
            {s}
          </button>
        ))
      ) : (
        <div className="menu__item menu__item--muted">Aucune suggestion</div>
      )}
      <div className="menu__sep" />
      <button className="menu__item menu__item--muted" onClick={onIgnore}>
        Ignorer
      </button>
      <button className="menu__item menu__item--muted" onClick={onAdd}>
        Ajouter au dictionnaire
      </button>
    </div>
  );
}
