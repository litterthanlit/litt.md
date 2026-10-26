/**
 * NumberField: a number someone sets, such as seats on a plan, a limit or a price (components.md, "Number field").
 * The Input's field with − and + inside its end, a label above and a hint or an error below, like TextField.
 *
 * - Field: the Input's cut and sizes (sm 32, md 44, lg 56; sm grows to 44 on a touch screen): the --cut floor, the
 *   --line-control line and the top wall's shade (R3), the focus line and ring while the text is focus-visible, the
 *   danger line with an error, flat on surface-2 when disabled. The number at the text weight with tabular figures,
 *   so it does not shift as it changes, and an optional unit after it in --fg-subtle ("seats", "GB").
 * - Steppers: − then +, raised blocks (R3: --block, --block-lift) set 4px inside the field's end, 4px apart, square at
 *   the field's height less 8px (24, 36 or 48px), with corners the control radius less 2px so they stay concentric.
 *   You press them, so they stand up out of the cut; pressed, the cast tightens (--block-press) at once and the block
 *   sinks --press-depth, as a secondary Button does. At its bound a stepper is disabled and lies flat (no fill, no
 *   lift, --fg-disabled): nothing to push. A press steps once; held, it repeats after 400ms, every 70ms, until it
 *   lets go or reaches the bound. They are not Tab stops (the arrow keys do the same in the field), and pressing one
 *   leaves focus where it was.
 * - Typing is free: what is typed is read when the field is left or Enter is pressed, in the page's locale (group
 *   separators, a comma decimal). Then it is kept between min and max, put on the step, and shown formatted
 *   (Intl.NumberFormat, with `format` for a currency or a percent). Text that is not a number goes back to the last
 *   value. Empty is allowed unless `required`, and gives null.
 * - Keys: ↑ and ↓ step, Shift with them or Page Up and Page Down step ten times, Home and End go to min and max.
 * - Motion: none of its own. The line fades on the instant tier, as the Input's does; a stepper's sink and hover fill
 *   run on the instant tier; the value changes at once.
 * - Fun mode (motion/fun.tsx, a trial, off unless a <FunMode> is on): a step by a stepper or a key kicks the number
 *   the way it went (up from below for more, down from above for less) and it lands on fun mode's pop spring. The
 *   label can be dragged sideways to scrub the value, a step every 8px, and past min or max the number gives like a
 *   rubber band and springs back when let go. The steppers and keys still do everything a scrub does. Transform only,
 *   and the field rests exactly as it does without fun mode. Reduced motion turns it off.
 * - hideLabel keeps the label for screen readers only, where the row around the field already says what it counts (a
 *   cart line's quantity). A hidden label is not a scrub handle.
 * - Accessibility: the input is a spinbutton named by the label, with aria-valuenow, -valuemin, -valuemax and the
 *   formatted value and unit as aria-valuetext. The steppers are named "Decrease seats" and "Increase seats".
 */
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { animate } from "motion/react";
import { useFun } from "@/motion";
import { MinusIcon, PlusIcon } from "@/components/icons";

export type NumberFieldSize = "sm" | "md" | "lg";

/* The Input's cut (floor, line, shade), on a wrapper that holds the text and the steppers. The ring follows the text only. */
const FIELD =
  "relative flex w-full min-w-0 items-center rounded-control bg-cut font-normal text-fg " +
  "shadow-[inset_0_0_0_1px_var(--line-control),var(--cut-shade)] " +
  "transition-[box-shadow] duration-(--dur-instant) ease-litt " +
  "has-[input:focus-visible]:shadow-[inset_0_0_0_1px_var(--focus),var(--cut-shade),var(--focus-ring)] " +
  "data-[invalid]:shadow-[inset_0_0_0_1px_var(--danger),var(--cut-shade)] " +
  "data-[invalid]:has-[input:focus-visible]:shadow-[inset_0_0_0_1px_var(--danger),var(--cut-shade),var(--focus-ring)] " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:bg-surface-2 data-[disabled]:text-fg-disabled data-[disabled]:shadow-[inset_0_0_0_1px_var(--line)] " +
  "forced-colors:border forced-colors:has-[input:focus-visible]:outline-2 forced-colors:has-[input:focus-visible]:outline-solid forced-colors:has-[input:focus-visible]:outline-offset-2";

/* Height, the text's size and the air before it, and the steppers' size: the field's height less 8px, so each block
   sits 4px inside the field. */
const SIZE: Record<NumberFieldSize, { field: string; type: string; pad: string; step: string }> = {
  sm: { field: "h-control-sm pointer-coarse:h-control-md", type: "text-small", pad: "pl-control-pad-sm", step: "size-6 pointer-coarse:size-9" },
  md: { field: "h-control-md", type: "text-body", pad: "pl-control-pad-md", step: "size-9" },
  lg: { field: "h-control-lg", type: "text-(length:--control-text-lg)", pad: "pl-control-pad-lg", step: "size-12" },
};

/* Secondary Button's block, nested 4px in the field. The sink is transitioned as `translate`, which Tailwind's
   translate-y-* sets; the cast swaps at once (R2). */
const STEPPER =
  "grid shrink-0 place-items-center rounded-[calc(var(--radius-control)-2px)] select-none [-webkit-tap-highlight-color:transparent] " +
  "transition-[background-color,color,translate] duration-(--dur-instant) ease-litt " +
  "enabled:cursor-pointer enabled:bg-block enabled:text-fg enabled:shadow-(--block-lift) enabled:forced-colors:border " +
  "enabled:hover:bg-[color-mix(in_oklab,var(--block),var(--fg)_4%)] " +
  "enabled:active:shadow-(--block-press) enabled:active:translate-y-(--press-depth) " +
  "disabled:cursor-not-allowed disabled:text-fg-disabled";

const HOLD_DELAY = 400; // ms before a held stepper starts repeating
const HOLD_EVERY = 70; // ms between repeats
const SCRUB_PX = 8; // fun mode: px of sideways drag on the label per step
const SCRUB_SLOP = 4; // px before a press on the label is a scrub, not a click
const KICK = 4; // fun mode: px a step starts the number from, the way it went

/** The decimals a step has, so 0.1 + 0.2 lands on 0.3 and not 0.30000000000000004. */
const decimalsOf = (n: number) => {
  const s = String(n);
  if (s.includes("e-")) return Number(s.split("e-")[1]);
  return s.includes(".") ? s.split(".")[1]!.length : 0;
};

export type NumberFieldProps = {
  /** The label above the field. Required: it names the field and its steppers ("Increase seats"). */
  label: ReactNode;
  /** Hides the label from sight and keeps it for screen readers, where the row already says what the number is, such as a cart line's quantity. */
  hideLabel?: boolean;
  /** The value, or null when the field is empty. Pair it with onValueChange. Leave it out and the field keeps its own. */
  value?: number | null;
  /** The value to start with when you do not control it. */
  defaultValue?: number | null;
  /** Called with the new value after a step, a key or a typed number is read. */
  onValueChange?: (value: number | null) => void;
  /** The lowest value. − is disabled at it, and Home goes to it. */
  min?: number;
  /** The highest value. + is disabled at it, and End goes to it. */
  max?: number;
  /** How much one step moves, and the grid a typed value is put on (from min, or from 0). */
  step?: number;
  /** How the value is shown, as Intl.NumberFormat takes it: { style: "currency", currency: "EUR" }, { style: "percent" }, { maximumFractionDigits: 1 }. */
  format?: Intl.NumberFormatOptions;
  /** A word after the number, in the grey: "seats", "GB", "days". */
  unit?: string;
  /** A hint under the field. An error replaces it. */
  help?: ReactNode;
  /** Shown in the danger color under the field and linked to it. Also sets aria-invalid. Say how to fix it. */
  error?: ReactNode;
  /** Empty is not allowed: leaving the field empty goes back to the last value. */
  required?: boolean;
  /** Height on the shared control scale: sm is 32, md is 44, lg is 56. */
  size?: NumberFieldSize;
  disabled?: boolean;
  /** The field name a form sends the value under, as a plain number. */
  name?: string;
  /** The id of the input, when you need your own. */
  id?: string;
  /** Extra classes for the whole component, such as a max width. */
  className?: string;
};

/** A labelled number with − and + in the field: steps by key, by press or by hold, and reads what is typed in the page's locale. */
export function NumberField({
  label,
  hideLabel = false,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  min,
  max,
  step = 1,
  format,
  unit,
  help,
  error,
  required = false,
  size = "md",
  disabled = false,
  name,
  id: idProp,
  className = "",
}: NumberFieldProps) {
  const auto = useId();
  const id = idProp ?? auto;
  const noteId = `${id}-note`;
  const note = error ?? help;
  const [inner, setInner] = useState<number | null>(defaultValue);
  const value = valueProp !== undefined ? valueProp : inner;
  const input = useRef<HTMLInputElement>(null);

  const formatter = useMemo(() => new Intl.NumberFormat(undefined, format), [format]);
  /* The page locale's own marks, so "1.234,5" reads as 1234.5 in German and "1,234.5" in English. */
  const marks = useMemo(() => {
    const parts = new Intl.NumberFormat(undefined).formatToParts(-12345.6);
    const of = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    return { group: of("group"), decimal: of("decimal") || "." };
  }, []);
  const percent = format?.style === "percent";
  const show = (n: number | null) => (n === null ? "" : formatter.format(n));

  /* While someone types, the field holds their text; otherwise it shows the value, formatted. */
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? show(value);

  const fit = (n: number) => {
    const base = min ?? 0;
    const places = Math.max(decimalsOf(step), decimalsOf(base));
    let v = Math.round((n - base) / step) * step + base;
    v = Number(v.toFixed(places));
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  };

  const set = (next: number | null) => {
    if (valueProp === undefined) setInner(next);
    if (next !== value) onValueChange?.(next);
  };

  const parse = (raw: string): number | null | undefined => {
    let s = raw.trim();
    if (!s) return null;
    if (marks.group) s = s.split(marks.group).join("");
    s = s.replace(/[\s  ]/g, "").split(marks.decimal).join(".");
    s = s.replace(/[−‒–]/g, "-").replace(/[^\d.-]/g, "");
    if (!s || s === "-" || s === ".") return undefined;
    const n = Number(s);
    if (!Number.isFinite(n)) return undefined;
    return percent ? n / 100 : n;
  };

  const commit = () => {
    if (draft === null) return;
    const n = parse(draft);
    setDraft(null);
    if (n === undefined || (n === null && required)) return; // not a number: back to the last value
    set(n === null ? null : fit(n));
  };

  /* Fun mode: the number lands from the way it went. */
  const fun = useFun();
  const kick = (dir: number) => {
    if (fun && input.current && dir) void animate(input.current, { y: [dir > 0 ? KICK : -KICK, 0] }, fun.pop);
  };

  const stepBy = (times: number) => {
    const from = value ?? (times > 0 ? (min ?? 0) - step : (max ?? 0) + step);
    setDraft(null);
    const next = fit(from + times * step);
    set(next);
    if (fun) kick(Math.sign(next - (value ?? next - times)));
  };

  const atMin = min !== undefined && value !== null && value <= min;
  const atMax = max !== undefined && value !== null && value >= max;

  const jumpTo = (bound: number) => {
    setDraft(null);
    set(bound);
    if (fun) kick(Math.sign(bound - (value ?? bound)));
  };

  /* Fun mode: scrub by dragging the label sideways. Past a bound the number gives like a rubber band. */
  const scrub = (e: ReactPointerEvent<HTMLLabelElement>) => {
    if (!fun || disabled || (e.pointerType === "mouse" && e.button !== 0)) return;
    const el = e.currentTarget;
    const id0 = e.pointerId;
    const x0 = e.clientX;
    const start = value ?? min ?? 0;
    let last = value;
    let claimed = false;
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== id0) return;
      const dx = ev.clientX - x0;
      if (!claimed) {
        if (Math.abs(dx) < SCRUB_SLOP) return;
        claimed = true;
        try {
          el.setPointerCapture(id0);
        } catch {
          /* the pointer is already gone */
        }
      }
      const raw = start + Math.round(dx / SCRUB_PX) * step;
      const next = fit(raw);
      if (next !== last) {
        /* Told directly, not through set(): set compares with the value this render saw, which a scrub has moved on from. */
        last = next;
        setDraft(null);
        if (valueProp === undefined) setInner(next);
        onValueChange?.(next);
      }
      const over = raw === next ? 0 : ((raw - next) / step) * SCRUB_PX;
      if (input.current) input.current.style.translate = over ? `${fun.rubber(over)}px` : "";
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== id0) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (!claimed) return;
      /* The click that ends a scrub is not a press on the label, which would focus the text. */
      const swallow = (c: Event) => {
        c.stopPropagation();
        c.preventDefault();
      };
      window.addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(() => window.removeEventListener("click", swallow, true), 0);
      const field = input.current;
      const pulled = field ? parseFloat(field.style.translate) || 0 : 0;
      if (field && pulled) void animate(pulled, 0, { ...fun.throw, onUpdate: (v) => (field.style.translate = v ? `${v}px` : "") });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const times = e.shiftKey ? 10 : 1;
    switch (e.key) {
      case "ArrowUp":
        stepBy(times);
        break;
      case "ArrowDown":
        stepBy(-times);
        break;
      case "PageUp":
        stepBy(10);
        break;
      case "PageDown":
        stepBy(-10);
        break;
      case "Home":
        if (min === undefined) return;
        jumpTo(min);
        break;
      case "End":
        if (max === undefined) return;
        jumpTo(max);
        break;
      case "Enter":
        commit();
        return;
      default:
        return;
    }
    e.preventDefault();
  };

  /* Held steppers repeat. The latest stepBy is read through a ref, so a repeat sees the value the last one set. */
  const latest = useRef(stepBy);
  latest.current = stepBy;
  const timers = useRef<{ delay?: number; every?: number }>({});
  const stop = () => {
    window.clearTimeout(timers.current.delay);
    window.clearInterval(timers.current.every);
    timers.current = {};
  };
  useEffect(() => stop, []);
  useEffect(() => {
    if (atMin || atMax) stop(); // the bound ends a hold
  }, [atMin, atMax]);
  /* A press with a pointer steps on pointerdown; the click that follows must not step again. */
  const pointerStep = useRef(false);

  const stepper = (dir: 1 | -1) => {
    const bound = dir < 0 ? atMin : atMax;
    const word = dir < 0 ? "Decrease" : "Increase";
    return (
      <button
        type="button"
        tabIndex={-1}
        aria-label={typeof label === "string" ? `${word} ${label.toLowerCase()}` : word}
        aria-controls={id}
        disabled={disabled || bound}
        className={STEPPER + " " + SIZE[size].step}
        onPointerDown={(e: ReactPointerEvent<HTMLButtonElement>) => {
          if (e.button !== 0) return;
          e.preventDefault(); // focus stays where it was
          pointerStep.current = true;
          latest.current(dir);
          timers.current.delay = window.setTimeout(() => {
            timers.current.every = window.setInterval(() => latest.current(dir), HOLD_EVERY);
          }, HOLD_DELAY);
        }}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onClick={() => {
          /* A screen reader or a keyboard activates without a pointer. */
          if (pointerStep.current) pointerStep.current = false;
          else stepBy(dir);
        }}
      >
        {dir < 0 ? <MinusIcon /> : <PlusIcon />}
      </button>
    );
  };

  const valueText = value === null ? undefined : `${show(value)}${unit ? ` ${unit}` : ""}`;

  return (
    <div className={"grid gap-2 " + className}>
      <label
        htmlFor={id}
        onPointerDown={fun && !hideLabel ? scrub : undefined}
        className={"text-small font-title " + (disabled ? "text-fg-disabled" : "text-fg") + (hideLabel ? " sr-only" : fun && !disabled ? " w-fit cursor-ew-resize touch-pan-y select-none" : "")}
      >
        {label}
      </label>
      <div
        data-invalid={error ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        className={FIELD + " pr-1 " + SIZE[size].field}
        onClick={(e) => {
          /* A press on the field's air focuses the text; a press on a stepper leaves focus where it was, so a phone's
             keyboard does not open under a thumb that is only stepping. */
          if (!(e.target as Element).closest("button")) input.current?.focus();
        }}
      >
        <input
          ref={input}
          id={id}
          type="text"
          inputMode={(format?.maximumFractionDigits ?? 0) > 0 || decimalsOf(step) > 0 || percent ? "decimal" : "numeric"}
          role="spinbutton"
          autoComplete="off"
          spellCheck={false}
          aria-valuenow={value ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={valueText}
          aria-invalid={error ? true : undefined}
          aria-describedby={note ? noteId : undefined}
          aria-required={required || undefined}
          disabled={disabled}
          value={text}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
          className={
            "h-full min-w-0 flex-1 bg-transparent tabular-nums outline-none placeholder:text-fg-subtle disabled:cursor-not-allowed " +
            "pointer-coarse:text-(length:--control-text-lg) " +
            SIZE[size].pad +
            " " +
            SIZE[size].type
          }
        />
        {unit && (
          <span aria-hidden="true" className={"shrink-0 pr-2 pl-1 pointer-coarse:text-(length:--control-text-lg) " + (disabled ? "text-fg-disabled " : "text-fg-subtle ") + SIZE[size].type}>
            {unit}
          </span>
        )}
        <span className="flex shrink-0 items-center gap-1">
          {stepper(-1)}
          {stepper(1)}
        </span>
      </div>
      {name && <input type="hidden" name={name} value={value ?? ""} />}
      {note && (
        <p id={noteId} className={"text-small " + (error ? "text-danger" : "text-fg-subtle")}>
          {note}
        </p>
      )}
    </div>
  );
}
