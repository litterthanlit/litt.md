/**
 * AgentChain, a Rack part (proposals/rack.md; taste/litt-principles.md, Rack): an Ableton Live-inspired modular agent
 * signal chain with five color-coded stages, per-stage bypass switches, 1:1 vertical-drag parameter boxes, tool toggles
 * and instant-cut pipeline presets.
 *
 * - Each stage keeps one of Rack's five clip hues (`amber`, `blue`, `teal`, `violet`, `rose`) across its header strip
 *   and filled value bar: one color means one stage, never repeated.
 * - Drag vertically on any parameter box (1:1 pointer capture), adjust with arrow keys (`role="slider"`), or
 *   double-click to reset to default. Bypass toggles and pipeline presets cut cleanly on the frame with zero easing.
 * - Zero drop shadows (only 1px crisp outlines), zero `--accent` fills (R6), and zero auto-animation on mount (R4).
 */
import { useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

export type ChainHue = "amber" | "blue" | "teal" | "violet" | "rose";

export type ChainNode = {
  /** Stable stage identifier. */
  id: string;
  /** Stage name printed in the colored header strip, e.g. "Router", "Coder". */
  name: string;
  /** Assigned clip hue from Rack's five track colors. */
  hue: ChainHue;
  /** Parameter label inside the draggable value box, e.g. "Depth", "Budget". */
  paramLabel: string;
  /** Minimum parameter value. */
  min: number;
  /** Maximum parameter value. */
  max: number;
  /** Step increment for keyboard arrows. */
  step: number;
  /** Default/home parameter value (double-click resets here). */
  defaultValue: number;
  /** Display unit suffix, e.g. "%", "k", "docs", "turns". */
  unit: string;
  /** Capability tag toggle at the foot of the module, e.g. "Web", "Shell". */
  toolLabel: string;
  /** Whether the stage starts enabled. Defaults to true. */
  enabled?: boolean;
  /** Whether the stage's tool starts armed. Defaults to true. */
  toolOn?: boolean;
  /** Base latency contribution in seconds when active. */
  latencySec: number;
  /** Base token contribution in thousands when active. */
  tokensK: number;
};

export type ChainPreset = {
  /** Short preset name in sentence case. */
  name: string;
  /** Per-node enabled overrides. */
  enabled: Record<string, boolean>;
  /** Per-node parameter value overrides. */
  values: Record<string, number>;
};

export type AgentChainProps = {
  /** Module title in the Rack header bar. Defaults to "Agent signal chain". */
  title?: ReactNode;
  /** Ordered stages in the signal chain (at most 5 hues without repeating). */
  nodes?: ChainNode[];
  /** Presets selectable from the header strip. */
  presets?: ChainPreset[];
  /** Extra classes on the outer Rack module. */
  className?: string;
};

export const DEFAULT_CHAIN_NODES: ChainNode[] = [
  { id: "router", name: "Router", hue: "amber", paramLabel: "Threshold", min: 50, max: 100, step: 5, defaultValue: 85, unit: "%", toolLabel: "Classify", enabled: true, toolOn: true, latencySec: 0.4, tokensK: 2 },
  { id: "research", name: "Research", hue: "blue", paramLabel: "Depth", min: 1, max: 12, step: 1, defaultValue: 6, unit: "docs", toolLabel: "Web", enabled: true, toolOn: true, latencySec: 1.4, tokensK: 8 },
  { id: "coder", name: "Coder", hue: "teal", paramLabel: "Budget", min: 4, max: 32, step: 2, defaultValue: 16, unit: "k", toolLabel: "Shell", enabled: true, toolOn: true, latencySec: 2.1, tokensK: 16 },
  { id: "verifier", name: "Verifier", hue: "violet", paramLabel: "Strictness", min: 20, max: 100, step: 10, defaultValue: 80, unit: "%", toolLabel: "Tests", enabled: true, toolOn: true, latencySec: 1.2, tokensK: 6 },
  { id: "memory", name: "Memory", hue: "rose", paramLabel: "Window", min: 2, max: 24, step: 2, defaultValue: 10, unit: "turns", toolLabel: "Cache", enabled: false, toolOn: false, latencySec: 0.3, tokensK: 4 },
];

export const DEFAULT_CHAIN_PRESETS: ChainPreset[] = [
  {
    name: "Ship feature",
    enabled: { router: true, research: true, coder: true, verifier: true, memory: false },
    values: { router: 85, research: 6, coder: 16, verifier: 80, memory: 10 },
  },
  {
    name: "Deep audit",
    enabled: { router: true, research: true, coder: true, verifier: true, memory: true },
    values: { router: 95, research: 10, coder: 24, verifier: 100, memory: 18 },
  },
  {
    name: "Fast triage",
    enabled: { router: true, research: true, coder: false, verifier: false, memory: true },
    values: { router: 70, research: 3, coder: 8, verifier: 50, memory: 6 },
  },
];

const HUE: Record<ChainHue, { header: string; fill: string; text: string; dot: string }> = {
  amber: { header: "bg-data-amber-tint text-data-amber-text", fill: "bg-data-amber", text: "text-data-amber-text", dot: "bg-data-amber" },
  blue: { header: "bg-data-blue-tint text-data-blue-text", fill: "bg-data-blue", text: "text-data-blue-text", dot: "bg-data-blue" },
  teal: { header: "bg-data-teal-tint text-data-teal-text", fill: "bg-data-teal", text: "text-data-teal-text", dot: "bg-data-teal" },
  violet: { header: "bg-data-violet-tint text-data-violet-text", fill: "bg-data-violet", text: "text-data-violet-text", dot: "bg-data-violet" },
  rose: { header: "bg-data-rose-tint text-data-rose-text", fill: "bg-data-rose", text: "text-data-rose-text", dot: "bg-data-rose" },
};

function formatParam(node: ChainNode, value: number): string {
  if (node.unit === "%") return `${Math.round(value)}%`;
  if (node.unit === "k") return `${Math.round(value)}k`;
  return `${Math.round(value)} ${node.unit}`;
}

function ParamBox({
  node,
  value,
  disabled,
  onChange,
}: {
  node: ChainNode;
  value: number;
  disabled: boolean;
  onChange: (next: number) => void;
}) {
  const dragRef = useRef<{ startY: number; startVal: number } | null>(null);
  const ratio = Math.max(0, Math.min(1, (value - node.min) / Math.max(1, node.max - node.min)));
  const tone = HUE[node.hue];

  const snap = (v: number) => {
    const stepped = Math.round((v - node.min) / node.step) * node.step + node.min;
    return Math.max(node.min, Math.min(node.max, stepped));
  };

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus();
    dragRef.current = { startY: e.clientY, startVal: value };
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (disabled || !dragRef.current || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const dy = dragRef.current.startY - e.clientY;
    const span = node.max - node.min;
    onChange(snap(dragRef.current.startVal + (dy / 96) * span));
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (dragRef.current && e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") onChange(snap(value + node.step));
    else if (e.key === "ArrowDown" || e.key === "ArrowLeft") onChange(snap(value - node.step));
    else if (e.key === "PageUp") onChange(snap(value + node.step * 3));
    else if (e.key === "PageDown") onChange(snap(value - node.step * 3));
    else if (e.key === "Home") onChange(node.min);
    else if (e.key === "End") onChange(node.max);
    else return;
    e.preventDefault();
  }

  return (
    <div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={`${node.name} ${node.paramLabel}`}
      aria-valuemin={node.min}
      aria-valuemax={node.max}
      aria-valuenow={value}
      aria-valuetext={formatParam(node, value)}
      aria-disabled={disabled}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={() => !disabled && onChange(node.defaultValue)}
      onKeyDown={onKeyDown}
      className={
        "litt-target relative grid gap-1 rounded-control border border-line-strong bg-cut px-2 py-1.5 select-none touch-none " +
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus forced-colors:border " +
        (disabled ? "cursor-not-allowed opacity-50" : "cursor-ns-resize")
      }
    >
      <div className="flex items-baseline justify-between gap-1 text-caption">
        <span className="truncate font-normal text-fg-subtle">{node.paramLabel}</span>
        <span className={"shrink-0 font-mono font-title tabular-nums " + (disabled ? "text-fg-disabled" : "text-fg")}>
          {formatParam(node, value)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-none bg-slot forced-colors:border">
        <div
          className={"h-full w-full origin-left forced-colors:bg-[Highlight] " + (disabled ? "bg-fg-disabled" : tone.fill)}
          style={{ transform: `scaleX(${ratio})` }}
        />
      </div>
    </div>
  );
}

/** Rack's modular agent signal chain: five clip-colored stages with bypass switches, draggable parameter boxes and instant presets. */
export function AgentChain({
  title = "Agent signal chain",
  nodes = DEFAULT_CHAIN_NODES,
  presets = DEFAULT_CHAIN_PRESETS,
  className = "",
}: AgentChainProps) {
  const titleId = useId();
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(nodes.map((n) => [n.id, n.enabled !== false])),
  );
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(nodes.map((n) => [n.id, n.defaultValue])),
  );
  const [tools, setTools] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(nodes.map((n) => [n.id, n.toolOn !== false])),
  );
  const [presetName, setPresetName] = useState<string>(presets[0]?.name ?? "Custom");
  const [live, setLive] = useState("");

  const activeNodes = nodes.filter((n) => enabledMap[n.id]);
  const estSec = activeNodes.reduce((sum, n) => sum + n.latencySec, 0);
  const estTokens = activeNodes.reduce((sum, n) => {
    const val = values[n.id] ?? n.defaultValue;
    return sum + (n.unit === "k" ? val : n.tokensK);
  }, 0);

  function toggleNode(node: ChainNode) {
    const next = !enabledMap[node.id];
    setEnabledMap((m) => ({ ...m, [node.id]: next }));
    setPresetName("Custom");
    setLive(`${node.name} ${next ? "active" : "bypassed"}.`);
  }

  function updateValue(node: ChainNode, next: number) {
    setValues((v) => ({ ...v, [node.id]: next }));
    setPresetName("Custom");
  }

  function toggleTool(node: ChainNode) {
    const next = !tools[node.id];
    setTools((t) => ({ ...t, [node.id]: next }));
    setLive(`${node.name} ${node.toolLabel} ${next ? "armed" : "off"}.`);
  }

  function applyPreset(p: ChainPreset) {
    setEnabledMap((prev) => ({ ...prev, ...p.enabled }));
    setValues((prev) => ({ ...prev, ...p.values }));
    setPresetName(p.name);
    const activeCount = nodes.filter((n) => p.enabled[n.id] ?? enabledMap[n.id]).length;
    setLive(`Preset ${p.name} loaded: ${activeCount} of ${nodes.length} stages active.`);
  }

  return (
    <div
      data-body="rack"
      className={"grid w-full min-w-0 overflow-hidden rounded-surface border border-line-strong bg-surface-1 text-fg forced-colors:border " + className}
    >
      {/* Module header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span id={titleId} className="truncate text-small font-title text-fg">
            {title}
          </span>
          <span className="shrink-0 font-mono text-caption font-normal tabular-nums text-fg-subtle">
            {activeNodes.length} / {nodes.length} active
          </span>
        </div>

        {/* Instant-cut preset keys */}
        {presets.length > 0 && (
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Chain presets">
            {presets.map((p) => {
              const chosen = presetName === p.name;
              return (
                <button
                  key={p.name}
                  type="button"
                  aria-pressed={chosen}
                  onClick={() => applyPreset(p)}
                  className={
                    "litt-target relative inline-flex h-6 cursor-pointer items-center rounded-control border px-2 text-caption select-none " +
                    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus forced-colors:border " +
                    (chosen
                      ? "border-fg bg-fg font-title text-canvas forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
                      : "border-line-strong bg-block font-normal text-fg hover:bg-surface-3")
                  }
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modular stage strip: sizes to its container, never the viewport */}
      <div
        role="list"
        aria-labelledby={titleId}
        className="grid grid-cols-[repeat(auto-fit,minmax(10.5rem,1fr))] gap-2 p-2.5"
      >
        {nodes.map((node) => {
          const on = Boolean(enabledMap[node.id]);
          const toolOn = Boolean(tools[node.id]);
          const val = values[node.id] ?? node.defaultValue;
          const tone = HUE[node.hue];
          return (
            <div
              key={node.id}
              role="listitem"
              className={
                "grid min-w-0 content-between gap-2 rounded-control border p-2 forced-colors:border " +
                (on ? "border-line-strong bg-surface-2" : "border-line bg-surface-3")
              }
            >
              {/* Color-coded stage strip with bypass power toggle */}
              <div className="flex items-center justify-between gap-1.5">
                <span
                  className={
                    "inline-flex min-w-0 flex-1 items-center gap-1.5 rounded-control px-2 py-0.5 text-caption font-label forced-colors:border " +
                    (on ? tone.header : "bg-surface-1 text-fg-subtle")
                  }
                >
                  <span
                    aria-hidden="true"
                    className={"size-1.5 shrink-0 rounded-none " + (on ? tone.dot : "bg-fg-disabled")}
                  />
                  <span className="truncate">{node.name}</span>
                </span>
                <button
                  type="button"
                  aria-pressed={on}
                  aria-label={`${node.name} stage ${on ? "on" : "bypassed"}`}
                  onClick={() => toggleNode(node)}
                  className={
                    "litt-target relative flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-control border text-caption font-mono " +
                    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus forced-colors:border " +
                    (on
                      ? "border-fg bg-fg text-canvas forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
                      : "border-line-strong bg-block text-fg-subtle")
                  }
                >
                  {on ? "I" : "O"}
                </button>
              </div>

              {/* Draggable Rack value box */}
              <ParamBox
                node={node}
                value={val}
                disabled={!on}
                onChange={(next) => updateValue(node, next)}
              />

              {/* Per-stage tool arm switch */}
              <div className="flex items-center justify-between gap-1 text-caption">
                <span className="shrink-0 text-fg-subtle">{on ? "Active" : "Bypassed"}</span>
                <button
                  type="button"
                  disabled={!on}
                  aria-pressed={toolOn}
                  onClick={() => toggleTool(node)}
                  className={
                    "litt-target relative inline-flex h-6 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-control border px-2 font-mono text-caption select-none " +
                    "disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus forced-colors:border " +
                    (toolOn && on
                      ? "border-line-strong bg-surface-1 font-title text-fg"
                      : "border-line bg-surface-3 font-normal text-fg-subtle")
                  }
                >
                  {node.toolLabel} {toolOn && on ? "On" : "Off"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live chain telemetry footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-surface-2 px-3 py-1.5 font-mono text-caption font-normal tabular-nums text-fg-subtle">
        <span>
          Chain: {activeNodes.length ? activeNodes.map((n) => n.name).join(" → ") : "All bypassed"}
        </span>
        <span>
          ~{estSec.toFixed(1)}s est · {estTokens}k token limit
        </span>
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
