import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useSystemTheme, type Theme } from "./useSystemTheme";

const ThemeContext = createContext<Theme>("light");

/** Single owner of the theme: mirrors the OS scheme onto <html data-theme>. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSystemTheme();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
