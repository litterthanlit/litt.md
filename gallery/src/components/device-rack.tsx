/**
 * DeviceRack, a Rack part (proposals/rack.md; taste/litt-principles.md, Rack): an Ableton Live audio effect rack with
 * color-coded rotary macro dials, a device power bypass toggle, and instant preset recall.
 *
 * - Each macro dial is a compact square parameter box (`bg-surface-2 border border-line rounded-control`) holding a
 *   color-coded SVG rotary arc (`amber`, `blue`, `teal`, `violet`, `rose`), a crisp indicator needle, and its tabular
 *   value in words underneath. Give each macro its own hue: one color means one thing (Rack), so five macros is the
 *   most a device colors without repeating one.
 * - Drag vertically on any dial (1:1 pointer capture, just like Live), step with arrow keys (`role="slider"`), or
 *   double-click to reset to its default value. Presets cut all dials to their stored values on the frame ("on the
 *   beat", zero bounce).
 * - The bypass is a 24px dot that keeps a 44px target for a finger (`litt-target`).
 * - Zero `--accent` fills (R6) and zero auto-animation on mount; every coordinate is rounded to 2 decimals for SSR.
 */
import { useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

export type MacroHue = "amber" | "blue" | "teal" | "violet" | "rose";

export type DeviceMacro = {
  /** Unique macro id. */
  id: string;
  /** Short parameter name, e.g. "Cutoff" or "Feedback". */
  label: string;
  /** Macro color in Rack's five clip hues. */
  hue: MacroHue;
  /** Minimum value. */
  min: number;
  /** Maximum value. */
  max: number;
  /** Step increment for keyboard arrows. */
  step?: number;
  /** Initial/home value (double-click resets here). */
  defaultValue: number;
  /** Unit suffix or formatter, e.g. "%" or "Hz". */
  unit?: string;
};

export type DevicePreset = {
  name: string;
  values: Record<string, number>;
};

export type DeviceRackProps = {
  /** Device title in the rack header, e.g. "Dub echo rack". */
  title?: ReactNode;
  /** Macro dials to render in the device strip. */
  macros?: DeviceMacro[];
  /** Presets selectable from the header strip. */
  presets?: DevicePreset[];
  /** Extra classes on the outer module. */
  className?: string;
};

/* Each macro its own clip color (one color means one thing, Rack's line): five macros, Rack's five hues. */
export const DEFAULT_MACROS: DeviceMacro[] = [
  { id: "cutoff", label: "Cutoff", hue: "amber", min: 80, max: 12000, step: 120, defaultValue: 3400, unit: "Hz" },
  { id: "res", label: "Resonance", hue: "blue", min: 0, max: 100, step: 2, defaultValue: 38, unit: "%" },
  { id: "feedback", label: "Feedback", hue: "teal", min: 0, max: 100, step: 2, defaultValue: 54, unit: "%" },
  { id: "drive", label: "Drive", hue: "rose", min: 0, max: 24, step: 1, defaultValue: 6, unit: "dB" },
  { id: "drywet", label: "Dry/Wet", hue: "violet", min: 0, max: 100, step: 2, defaultValue: 42, unit: "%" },
];

export const DEFAULT_PRESETS: DevicePreset[] = [
  { name: "Dub tape", values: { cutoff: 3400, res: 38, feedback: 54, drive: 6, drywet: 42 } },
  { name: "Warm wash", values: { cutoff: 1800, res: 24, feedback: 76, drive: 4, drywet: 64 } },
  { name: "Acid ping", values: { cutoff: 6200, res: 74, feedback: 62, drive: 14, drywet: 50 } },
  { name: "Init", values: { cutoff: 12000, res: 0, feedback: 0, drive: 0, drywet: 0 } },
];

const HUE: Record<MacroHue, { stroke: string; badge: string; text: string }> = {
  amber: { stroke: "stroke-data-amber", badge: "bg-data-amber-tint text-data-amber-text", text: "text-data-amber-text" },
  blue: { stroke: "stroke-data-blue", badge: "bg-data-blue-tint text-data-blue-text", text: "text-data-blue-text" },
  teal: { stroke: "stroke-data-teal", badge: "bg-data-teal-tint text-data-teal-text", text: "text-data-teal-text" },
  violet: { stroke: "stroke-data-violet", badge: "bg-data-violet-tint text-data-violet-text", text: "text-data-violet-text" },
  rose: { stroke: "stroke-data-rose", badge: "bg-data-rose-tint text-data-rose-text", text: "text-data-rose-text" },
};

const round = (n: number) => Math.round(n * 100) / 100;
const START_DEG = 135;
const SWEEP_DEG = 270;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: round(cx + r * Math.cos(rad)), y: round(cy + r * Math.sin(rad)) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M${s.x} ${s.y} A${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

function formatMacro(m: DeviceMacro, v: number): string {
  if (m.unit === "Hz" && v >= 1000) return `${(v / 1000).toFixed(1)} kHz`;
  if (m.unit === "dB") return `+${Math.round(v)} dB`;
  if (m.unit === "%") return `${Math.round(v)}%`;
  return m.unit ? `${Math.round(v)} ${m.unit}` : String(Math.round(v));
}

function MacroDial({
  macro,
  value,
  disabled,
  onChange,
}: {
  macro: DeviceMacro;
  value: number;
  disabled: boolean;
  onChange: (next: number) => void;
}) {
  const dragRef = useRef<{ startY: number; startVal: number } | null>(null);
  const ratio = Math.max(0, Math.min(1, (value - macro.min) / Math.max(1, macro.max - macro.min)));
  const endDeg = START_DEG + ratio * SWEEP_DEG;
  const cx = 24;
  const cy = 24;
  const r = 17;
  const tip = polar(cx, cy, r - 4, endDeg);
  const base = polar(cx, cy, 4, endDeg);
  const tone = HUE[macro.hue];
  const step = macro.step ?? Math.max(1, Math.round((macro.max - macro.min) / 50));

  const clamp = (v: number) => {
    const snapped = Math.round((v - macro.min) / step) * step + macro.min;
    return Math.max(macro.min, Math.min(macro.max, snapped));
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
    const span = macro.max - macro.min;
    onChange(clamp(dragRef.current.startVal + (dy / 120) * span));
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (dragRef.current && e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") onChange(clamp(value + step));
    else if (e.key === "ArrowDown" || e.key === "ArrowLeft") onChange(clamp(value - step));
    else if (e.key === "PageUp") onChange(clamp(value + step * 5));
    else if (e.key === "PageDown") onChange(clamp(value - step * 5));
    else if (e.key === "Home") onChange(macro.min);
    else if (e.key === "End") onChange(macro.max);
    else return;
    e.preventDefault();
  }

  const shown = formatMacro(macro, value);

  return (
    <div
      className={
        "flex flex-col items-center gap-1.5 rounded-control border border-line bg-surface-2 px-2 py-2.5 transition-opacity duration-(--dur-instant) ease-litt " +
        (disabled ? "opacity-50" : "")
      }
    >
      <span className={"max-w-full truncate rounded-control px-1.5 py-0.5 text-caption font-title " + (disabled ? "bg-surface-3 text-fg-disabled" : tone.badge)}>
        {macro.label}
      </span>

      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={macro.label}
        aria-disabled={disabled || undefined}
        aria-valuemin={macro.min}
        aria-valuemax={macro.max}
        aria-valuenow={value}
        aria-valuetext={shown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={() => !disabled && onChange(macro.defaultValue)}
        onKeyDown={onKeyDown}
        className={
          "grid size-12 touch-none select-none place-items-center rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
          (disabled ? "cursor-not-allowed" : "cursor-ns-resize")
        }
      >
        <svg width={48} height={48} viewBox="0 0 48 48" aria-hidden="true" className="block">
          {/* Recessed dial face */}
          <circle cx={cx} cy={cy} r={13} className="fill-tray stroke-line-strong" strokeWidth={1} />
          {/* Background arc track */}
          <path d={arcPath(cx, cy, r, START_DEG, START_DEG + SWEEP_DEG)} fill="none" strokeWidth={3} strokeLinecap="butt" className="stroke-line-strong" />
          {/* Lit value arc */}
          {ratio > 0.005 && (
            <path
              d={arcPath(cx, cy, r, START_DEG, endDeg)}
              fill="none"
              strokeWidth={3}
              strokeLinecap="butt"
              className={(disabled ? "stroke-fg-disabled" : tone.stroke) + " forced-colors:stroke-[Highlight]"}
            />
          )}
          {/* Needle */}
          <line x1={base.x} y1={base.y} x2={tip.x} y2={tip.y} strokeWidth={2} strokeLinecap="square" className="stroke-fg forced-colors:stroke-[CanvasText]" />
        </svg>
      </div>

      <span className="font-mono text-caption tabular-nums text-fg">{shown}</span>
    </div>
  );
}

/** Rack's Ableton-style audio effect rack with rotary macro dials, bypass toggle, and instant preset recall. */
export function DeviceRack({
  title = "Dub echo rack",
  macros = DEFAULT_MACROS,
  presets = DEFAULT_PRESETS,
  className = "",
}: DeviceRackProps) {
  const headingId = useId();
  const [enabled, setEnabled] = useState(true);
  const [presetIdx, setPresetIdx] = useState(0);
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(macros.map((m) => [m.id, presets[0]?.values[m.id] ?? m.defaultValue])),
  );
  const [live, setLive] = useState("");

  function updateMacro(id: string, next: number) {
    setValues((cur) => ({ ...cur, [id]: next }));
  }

  function applyPreset(idx: number) {
    const p = presets[idx];
    if (!p) return;
    setPresetIdx(idx);
    setValues(Object.fromEntries(macros.map((m) => [m.id, p.values[m.id] ?? m.defaultValue])));
    setLive(`Loaded preset ${p.name}.`);
  }

  return (
    <div
      data-body="rack"
      className={"grid w-full min-w-0 overflow-hidden rounded-surface border border-line-strong bg-surface-1 forced-colors:border " + className}
    >
      {/* Device title bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2 px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-pressed={enabled}
            aria-label={enabled ? `Bypass ${typeof title === "string" ? title : "device"}` : `Enable ${typeof title === "string" ? title : "device"}`}
            onClick={() => {
              const next = !enabled;
              setEnabled(next);
              setLive(next ? "Device active." : "Device bypassed.");
            }}
            className={
              "litt-target relative grid size-6 cursor-pointer place-items-center rounded-pill border transition-colors duration-(--dur-instant) ease-litt " +
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border " +
              (enabled ? "border-fg bg-fg text-canvas forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]" : "border-line-strong bg-canvas text-fg-subtle")
            }
          >
            <span aria-hidden="true" className="size-2 rounded-pill bg-current" />
          </button>
          <span id={headingId} className="text-small font-title text-fg">
            {title}
          </span>
          <span className="text-caption text-fg-subtle">{enabled ? "Active" : "Bypassed"}</span>
        </div>

        {/* Preset strip */}
        {presets.length > 0 && (
          <div role="group" aria-label="Presets" className="flex flex-wrap items-center gap-1">
            {presets.map((p, i) => {
              const active = i === presetIdx;
              return (
                <button
                  key={p.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => applyPreset(i)}
                  className={
                    "h-control-sm cursor-pointer rounded-control border px-2 text-caption font-title transition-colors duration-(--dur-instant) ease-litt pointer-coarse:h-control-md " +
                    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus forced-colors:border " +
                    (active
                      ? "border-fg bg-fg text-canvas forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
                      : "border-line bg-block text-fg-muted hover:border-line-strong hover:text-fg")
                  }
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Macro dials grid */}
      <div
        role="group"
        aria-labelledby={headingId}
        className={
          "grid gap-1.5 p-2 " +
          (macros.length <= 4
            ? "grid-cols-2 sm:grid-cols-4"
            : macros.length === 5
              ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
              : "grid-cols-2 sm:grid-cols-3 md:grid-cols-6")
        }
      >
        {macros.map((m) => (
          <MacroDial
            key={m.id}
            macro={m}
            value={values[m.id] ?? m.defaultValue}
            disabled={!enabled}
            onChange={(next) => updateMacro(m.id, next)}
          />
        ))}
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
