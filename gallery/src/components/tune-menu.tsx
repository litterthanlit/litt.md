/**
 * TuneMenu, a Heat part (proposals/heat.md; taste/litt-principles.md, Heat): the keyboard-driven street-racing
 * performance tuning and settings menu.
 *
 * - Framed as a square black slab (`rounded-none border border-line-strong bg-canvas`) banded top and bottom with
 *   diagonal hazard stripes and four 16px outer ink corner brackets (inset inside a 2px-padded wrapper so the marks
 *   never cause horizontal overflow).
 * - Each row is a level (`kind: "level"`, 10 or 12 crisp square amber dashes in a dark channel, supporting both 0..max
 *   and bipolar −5..+5 balance scales) or a cycler (`kind: "choice"`, cycling named presets with `‹ value ›`).
 * - The focused/hovered row snaps four 8px amber corner brackets around itself, turns its label to `--accent-text`, and
 *   shows clickable `‹` and `›` chevrons. Drive it with `↑ ↓` between rows, `← →` to tune, `Home`/`End` for ends, or
 *   drag directly across the dashes.
 * - Foot displays keycap hints (`↑ ↓` Choose, `← →` Tune) and a `Defaults` reset button with a polite live status.
 */
import { useId, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { Button } from "@/components/button";
import { Kbd } from "@/components/kbd";

export type TuneParameter =
  | {
      id: string;
      label: string;
      kind: "level";
      min?: number;
      max: number;
      defaultValue: number;
      /** Optional label for the negative/left end (e.g. "Loose"). */
      minLabel?: string;
      /** Optional label for the positive/right end (e.g. "Tight"). */
      maxLabel?: string;
    }
  | {
      id: string;
      label: string;
      kind: "choice";
      options: string[];
      defaultValue: number;
    };

export type TuneMenuProps = {
  /** Header title printed on the top hazard-stripe band, e.g. "Performance tuning". */
  title?: ReactNode;
  /** Tuning parameters to display as rows. */
  parameters?: TuneParameter[];
  /** Controlled values keyed by parameter id. */
  values?: Record<string, number>;
  /** Called whenever a parameter changes or resets to defaults. */
  onValuesChange?: (values: Record<string, number>) => void;
  /** Extra classes on the outer wrapper. */
  className?: string;
};

export const DEFAULT_TUNE_PARAMETERS: TuneParameter[] = [
  { id: "steering", label: "Steering", kind: "level", min: -5, max: 5, defaultValue: 2, minLabel: "Soft", maxLabel: "Sharp" },
  { id: "handling", label: "Handling", kind: "level", min: -5, max: 5, defaultValue: 3, minLabel: "Drift", maxLabel: "Grip" },
  { id: "brakes", label: "Brakes", kind: "level", min: -5, max: 5, defaultValue: -1, minLabel: "Rear", maxLabel: "Front" },
  { id: "ride", label: "Ride height", kind: "level", min: -5, max: 5, defaultValue: -3, minLabel: "Low", maxLabel: "High" },
  { id: "aero", label: "Aerodynamics", kind: "level", min: 0, max: 10, defaultValue: 7 },
  { id: "nitrous", label: "Nitrous", kind: "choice", options: ["Duration", "Balanced", "Power"], defaultValue: 2 },
];

const MARKS =
  "pointer-events-none absolute bg-no-repeat " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom] ";

const FRAME =
  MARKS +
  "[background-size:16px_2px,2px_16px,16px_2px,2px_16px,16px_2px,2px_16px,16px_2px,2px_16px] -inset-2 text-fg";

const SELECTED =
  MARKS +
  "[background-size:8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px] inset-0 text-accent-text";

const STRIPES = "[background-image:repeating-linear-gradient(135deg,var(--surface-3)_0_6px,transparent_6px_12px)]";

const PRESS = "transition-transform duration-(--dur-instant) ease-litt active:scale-[var(--press-scale)]";

function defaultsOf(params: TuneParameter[]): Record<string, number> {
  return Object.fromEntries(params.map((p) => [p.id, p.defaultValue]));
}

function minOf(p: TuneParameter) {
  return p.kind === "level" ? (p.min ?? 0) : 0;
}

function maxOf(p: TuneParameter) {
  return p.kind === "level" ? p.max : p.options.length - 1;
}

function clampParam(p: TuneParameter, v: number) {
  if (p.kind === "choice") {
    const len = p.options.length;
    return ((v % len) + len) % len;
  }
  return Math.max(minOf(p), Math.min(maxOf(p), Math.round(v)));
}

function valueTextOf(p: TuneParameter, v: number): string {
  if (p.kind === "choice") return p.options[v] ?? "";
  if (minOf(p) < 0) {
    if (v === 0) return "0 (Balanced)";
    const sign = v > 0 ? `+${v}` : `−${Math.abs(v)}`;
    const side = v > 0 ? p.maxLabel : p.minLabel;
    return side ? `${sign} ${side}` : sign;
  }
  return `${v} of ${p.max}`;
}

function DashBar({ param, value }: { param: Extract<TuneParameter, { kind: "level" }>; value: number }) {
  const min = param.min ?? 0;
  const max = param.max;
  const count = Math.max(1, max - min);
  const bipolar = min < 0 && max > 0;

  if (bipolar) {
    const half = Math.max(Math.abs(min), Math.abs(max));
    return (
      <span aria-hidden="true" className="flex h-3 w-full min-w-0 items-center gap-0.5 bg-tray px-1">
        {Array.from({ length: half * 2 }, (_, i) => {
          const step = i < half ? i - half : i - half + 1;
          const lit = value < 0 ? step < 0 && step >= value : value > 0 ? step > 0 && step <= value : false;
          const centerEdge = i === half ? " ml-1" : "";
          return (
            <span
              key={i}
              className={
                "h-1.5 flex-1 transition-colors duration-(--dur-instant) ease-litt" +
                centerEdge +
                " " +
                (lit ? "bg-accent-text forced-colors:bg-[Highlight]" : "bg-line-strong")
              }
            />
          );
        })}
      </span>
    );
  }

  return (
    <span aria-hidden="true" className="flex h-3 w-full min-w-0 items-center gap-1 bg-tray px-1">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={
            "h-1.5 flex-1 transition-colors duration-(--dur-instant) ease-litt " +
            (i < value - min ? "bg-accent-text forced-colors:bg-[Highlight]" : "bg-line-strong")
          }
        />
      ))}
    </span>
  );
}

/** Heat's keyboard-driven performance tuning and settings menu slab. */
export function TuneMenu({
  title = "Performance tuning",
  parameters = DEFAULT_TUNE_PARAMETERS,
  values: valuesProp,
  onValuesChange,
  className = "",
}: TuneMenuProps) {
  const uid = useId();
  const [inner, setInner] = useState<Record<string, number>>(() => defaultsOf(parameters));
  const [active, setActive] = useState(0);
  const [live, setLive] = useState("");

  const values = valuesProp ?? inner;

  function setParam(p: TuneParameter, nextRaw: number) {
    const clamped = clampParam(p, nextRaw);
    const nextAll = { ...values, [p.id]: clamped };
    if (valuesProp === undefined) setInner(nextAll);
    onValuesChange?.(nextAll);
    setLive(`${p.label}: ${valueTextOf(p, clamped)}`);
  }

  function resetDefaults() {
    const nextAll = defaultsOf(parameters);
    if (valuesProp === undefined) setInner(nextAll);
    onValuesChange?.(nextAll);
    setLive("Tuning reset to defaults.");
  }

  function focusRow(from: Element, k: number) {
    const list = from.closest("ul");
    const target = list?.children[k]?.querySelector<HTMLElement>("[role=slider]");
    target?.focus();
  }

  const onKey = (i: number, p: TuneParameter) => (e: KeyboardEvent<HTMLDivElement>) => {
    const cur = values[p.id] ?? p.defaultValue;
    const step = { ArrowLeft: -1, ArrowRight: 1, PageDown: -2, PageUp: 2 }[e.key];
    const move = { ArrowUp: -1, ArrowDown: 1 }[e.key];
    if (step) setParam(p, p.kind === "level" ? cur + step : cur + Math.sign(step));
    else if (e.key === "Home") setParam(p, minOf(p));
    else if (e.key === "End") setParam(p, maxOf(p));
    else if (move) focusRow(e.currentTarget, Math.max(0, Math.min(parameters.length - 1, i + move)));
    else return;
    e.preventDefault();
  };

  const onPointer = (p: TuneParameter) => (e: PointerEvent<HTMLDivElement>) => {
    if (e.type === "pointermove" && !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    if (e.type === "pointerdown") {
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.focus();
      if (p.kind === "choice") return setParam(p, (values[p.id] ?? p.defaultValue) + 1);
    }
    if (p.kind !== "level") return;
    const r = e.currentTarget.getBoundingClientRect();
    const min = minOf(p);
    const max = maxOf(p);
    const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width)));
    setParam(p, Math.round(min + ratio * (max - min)));
  };

  const activeParam = parameters[active];
  const activeVal = activeParam ? (values[activeParam.id] ?? activeParam.defaultValue) : 0;

  return (
    <div data-body="heat" className={"grid w-full min-w-0 gap-3 p-2 " + className}>
      <div className="relative min-w-0">
        <span aria-hidden="true" className={FRAME} />
        <div role="group" aria-labelledby={`${uid}-head`} className="@container grid min-w-0 border border-line-strong bg-canvas forced-colors:border">
          <div className={"flex items-center justify-between gap-2 border-b border-line bg-surface-1 px-3 py-2 " + STRIPES}>
            <span id={`${uid}-head`} className="bg-canvas px-2 py-0.5 text-small font-title text-fg">
              {title}
            </span>
            {activeParam && (
              <span className="bg-canvas px-2 py-0.5 font-mono text-caption tabular-nums text-accent-text">
                {valueTextOf(activeParam, activeVal)}
              </span>
            )}
          </div>

          <ul className="grid py-1.5">
            {parameters.map((p, i) => {
              const on = i === active;
              const v = values[p.id] ?? p.defaultValue;
              const isLevel = p.kind === "level";
              const atMin = isLevel && v <= minOf(p);
              const atMax = isLevel && v >= maxOf(p);
              return (
                <li
                  key={p.id}
                  className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-1 px-3 py-1 @[24rem]:grid-cols-[minmax(0,1fr)_auto_minmax(6rem,10rem)_auto]"
                  onPointerEnter={(e) => {
                    if (e.currentTarget.parentElement?.contains(document.activeElement)) focusRow(e.currentTarget, i);
                    else setActive(i);
                  }}
                >
                  {on && <span aria-hidden="true" className={SELECTED} />}
                  <span
                    id={`${uid}-${p.id}`}
                    className={
                      "col-span-3 truncate px-7 text-small font-title @[24rem]:col-span-1 @[24rem]:px-0 @[24rem]:text-right " +
                      (on ? "text-accent-text" : "text-fg")
                    }
                  >
                    {p.label}
                  </span>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={`Lower ${p.label}`}
                    aria-disabled={atMin || undefined}
                    onClick={atMin ? undefined : () => setParam(p, v - 1)}
                    className={
                      "grid h-control-sm w-7 place-items-center text-h1 pointer-coarse:h-control-md " +
                      (!on ? "invisible " : "") +
                      (atMin ? "cursor-default text-fg-disabled" : "cursor-pointer text-accent-text " + PRESS)
                    }
                  >
                    ‹
                  </button>
                  <div
                    role="slider"
                    tabIndex={on ? 0 : -1}
                    aria-labelledby={`${uid}-${p.id}`}
                    aria-valuemin={minOf(p)}
                    aria-valuemax={maxOf(p)}
                    aria-valuenow={v}
                    aria-valuetext={valueTextOf(p, v)}
                    onFocus={() => setActive(i)}
                    onKeyDown={onKey(i, p)}
                    onPointerDown={onPointer(p)}
                    onPointerMove={onPointer(p)}
                    className="grid h-control-sm min-w-0 cursor-pointer touch-none select-none place-items-center outline-none pointer-coarse:h-control-md focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
                  >
                    {p.kind === "level" ? (
                      <DashBar param={p} value={v} />
                    ) : (
                      <span className="truncate text-small font-title text-fg">{p.options[v]}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={`Raise ${p.label}`}
                    aria-disabled={atMax || undefined}
                    onClick={atMax ? undefined : () => setParam(p, v + 1)}
                    className={
                      "grid h-control-sm w-7 place-items-center text-h1 pointer-coarse:h-control-md " +
                      (!on ? "invisible " : "") +
                      (atMax ? "cursor-default text-fg-disabled" : "cursor-pointer text-accent-text " + PRESS)
                    }
                  >
                    ›
                  </button>
                </li>
              );
            })}
          </ul>

          <div aria-hidden="true" className={"h-2.5 border-t border-line bg-surface-1 " + STRIPES} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-fg-muted">
        <span aria-hidden="true" className="inline-flex items-center gap-1.5">
          <Kbd>↑ ↓</Kbd>
          <span>Choose</span>
        </span>
        <span aria-hidden="true" className="inline-flex items-center gap-1.5">
          <Kbd>← →</Kbd>
          <span>Tune</span>
        </span>
        <Button variant="ghost" size="sm" onClick={resetDefaults}>
          Defaults
        </Button>
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
