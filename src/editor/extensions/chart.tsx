import { Node, mergeAttributes, type Editor } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { NodeDelete } from "./video";
import { useI18n } from "../../i18n";

Chart.register(...registerables);

type Kind = "bar" | "line" | "pie" | "doughnut" | "radar";

function parseData(text: string): { labels: string[]; values: number[] } {
  const labels: string[] = [];
  const values: number[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const idx = line.lastIndexOf(",") >= 0 ? line.lastIndexOf(",") : line.lastIndexOf(";");
    if (idx < 0) continue;
    labels.push(line.slice(0, idx).trim());
    values.push(Number(line.slice(idx + 1).trim().replace(",", ".")) || 0);
  }
  return { labels, values };
}

function toText(labels: string[], values: number[]): string {
  return labels.map((l, i) => `${l}, ${values[i] ?? 0}`).join("\n");
}

function palette(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const light = 32 + Math.round((i / Math.max(n - 1, 1)) * 52);
    return `hsl(225 7% ${light}%)`;
  });
}

// Chart.js's per-type generics are intractable here, so the config is built loosely.
function buildConfig(kind: Kind, title: string, labels: string[], values: number[]): any {
  const perPoint = kind === "pie" || kind === "doughnut" || kind === "radar";
  const config = {
    type: kind,
    data: {
      labels,
      datasets: [
        {
          label: title || "Données",
          data: values,
          backgroundColor: perPoint ? palette(values.length) : "rgba(120,120,135,0.5)",
          borderColor: "rgba(120,120,135,0.95)",
          borderWidth: 1.2,
          fill: kind === "line" ? false : undefined,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: perPoint },
        title: { display: !!title, text: title },
      },
    },
  };
  return config;
}

function ChartView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const { t } = useI18n();
  const kind: Kind = node.attrs.kind ?? "bar";
  const title: string = node.attrs.title ?? "";
  const labels: string[] = node.attrs.labels ?? [];
  const values: number[] = node.attrs.values ?? [];

  const [editing, setEditing] = useState(values.length === 0);
  const [draftKind, setDraftKind] = useState<Kind>(kind);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftData, setDraftData] = useState(toText(labels, values));

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (editing || !canvasRef.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, buildConfig(kind, title, labels, values)) as unknown as Chart;
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, kind, title, JSON.stringify(labels), JSON.stringify(values)]);

  const commit = () => {
    const { labels: L, values: V } = parseData(draftData);
    updateAttributes({ kind: draftKind, title: draftTitle, labels: L, values: V });
    setEditing(false);
  };

  if (editing) {
    return (
      <NodeViewWrapper as="div" className="media-node chart-node">
        <div className="chart-edit">
          <div className="chart-edit-row">
            <select className="settings-select" value={draftKind} onChange={(e) => setDraftKind(e.target.value as Kind)}>
              <option value="bar">{t("chart.bar")}</option>
              <option value="line">{t("chart.line")}</option>
              <option value="pie">{t("chart.pie")}</option>
              <option value="doughnut">{t("chart.doughnut")}</option>
              <option value="radar">{t("chart.radar")}</option>
            </select>
            <input
              className="dialog-input"
              placeholder={t("chart.titlePlaceholder")}
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
            />
          </div>
          <textarea
            className="chart-data"
            rows={5}
            placeholder={t("chart.dataPlaceholder")}
            value={draftData}
            onChange={(e) => setDraftData(e.target.value)}
          />
          <div className="chart-edit-actions">
            <button className="btn btn--primary settings-btn" onClick={commit}>
              {t("action.show")}
            </button>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper as="div" className="media-node chart-node">
      <NodeDelete onDelete={deleteNode} />
      <button
        className="node-edit"
        title="Modifier"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          setDraftKind(kind);
          setDraftTitle(title);
          setDraftData(toText(labels, values));
          setEditing(true);
        }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 2.5 13.5 5 5.5 13 2.5 13.5 3 10.5 Z" />
        </svg>
      </button>
      <div className="chart-canvas-wrap">
        <canvas ref={canvasRef} />
      </div>
    </NodeViewWrapper>
  );
}

export const ChartNode = Node.create({
  name: "chart",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes: () => ({
    kind: { default: "bar" },
    title: { default: "" },
    labels: { default: [] },
    values: { default: [] },
  }),
  parseHTML: () => [{ tag: "div[data-chart]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-chart": "" })],
  addNodeView() {
    return ReactNodeViewRenderer(ChartView);
  },
});

export function insertChart(editor: Editor) {
  editor.chain().focus().insertContent({ type: "chart", attrs: { kind: "bar", title: "", labels: [], values: [] } }).run();
}
