import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { ThemeProvider } from "./theme/ThemeProvider";
import { I18nProvider } from "./i18n";
import "katex/dist/katex.min.css";
import "@excalidraw/excalidraw/index.css";
import "./styles/globals.css";
import "./styles/caret.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
