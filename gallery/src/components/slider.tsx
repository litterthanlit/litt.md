/**
 * Slider (components.md, "Slider"): one value on a continuous range, such as the default
 * animation speed. Built on Radix Slider (one thumb), which gives the role, the keys and the
 * form value. litt owns the look, the hand, the label row and the end words. RangeSlider, in the
 * same file, is the same control with two ends for a span (see "Range" below).
 *
 * - A slab in a tray (material.md, 6, "Press"; Nick's frames 116 to 118, v0.x). The tray is the control's height
 *   (44, md), sunken: --tray with --tray-shade, at the control radius. The slab is the value: a raised block
 *   (--block, --block-round, --block-lift) set 2px in, that grows from the start to where the value is. Its corners
 *   are the control radius less those 2px, so the two stay concentric at every shape. Its leading end rolls away
 *   into shade (--block-roll), a little deeper the further it is pushed, as in the frames. Never the accent (P1): a
 *   form can hold many sliders, and the accent stays on the one primary action.
 * - The slab says its value: at its leading end, at the small size, --fg, in tabular figures. The slab is never
 *   shorter than that word (the widest of min and max) with its air, so the word always fits. showValue={false}
 *   leaves the slab plain and 32px at its shortest.
 * - Label: above, like the Input's. Words for the two ends sit under the tray ("Slower", "Faster").
 * - The label names the thumb (aria-labelledby), the help text describes it, and formatValue
 *   feeds both the visible value and aria-valuetext.
 * - Hand: press on the slab and it is held where it was taken, so it moves with the finger from there; press past
 *   its end and the end jumps to the finger. While held, its cast tightens (--block-press). The hand is this file's,
 *   not Radix's (Radix maps the pointer across the whole width, which would jump the slab's end under the finger).
 * - Motion: none on the value. The slab follows the pointer and the keys at once, because its length is the value
 *   and an eased jump would lag the input. Only its cast changes, on the instant tier.
 * - Keys: arrows step, Home and End go to the ends, Page Up and Page Down move about a tenth of
 *   the range (whole steps, never fewer than one). The focus ring is on the tray, for :focus-visible only.
 * - Touch: the tray is 44px tall. The slider owns horizontal drags: it is marked data-no-drag, so a sheet never
 *   moves under it, and its touch-action leaves vertical scrolling to the page.
 * - Disabled: the tray at --surface-2 with a hairline, the slab --surface-2 and flat, its word --fg-subtle. The
 *   label dims to --fg-disabled; the value and the end words stay at --fg-subtle, because they are still read.
 * - Forced colors drops box-shadow and background colors, so the tray and the slab get real borders and the slab
 *   takes the system highlight.
 *
 * Range (components.md, "Slider", the Range bullet): RangeSlider is one slab that spans [from, to], such as builds
 * that took between 20s and 80s in a table filter. Each end of it is a thumb, a 20px grip that rolls into shade, and
 * the span shows at the end of the label row ("20s to 80s") when showValue is on. It reuses the tray, the label row,
 * the help text, the end words and the disabled look above.
 * - Names: each thumb is named by the label and its end ("Build time, from", "Build time, to"), and
 *   gets its own aria-valuetext from formatValue. The shown value reads "20s to 80s": words, never a dash.
 *   The two thumbs sit in a group named by the label (and marked aria-disabled when it is), so a screen
 *   reader says they belong together, and the dimmed label of a disabled range is known to be inactive.
 * - Hand: a press takes the nearer end of the slab, held where it was taken, or jumps it to the finger when the press
 *   is past it. The focused end draws the focus ring inside itself, so you can tell which one the keys move.
 * - The thumbs never cross and stay minStepsBetweenThumbs steps apart. Radix would swap them (or
 *   mis-round a decimal step), so Radix keeps their order (preserveThumbOrder) and this file holds the gap.
 * - Keys act on the focused thumb. The arrows are Radix's. Home, End, Page Up and Page Down are
 *   handled here, because Radix sends Home to the first thumb and End to the last, whichever has focus.
 * - A form sends both values under name (FormData.getAll(name) is [from, to]), not under name[].
 */
import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode, type Ref, type RefObject } from "react";
import * as RadixSlider from "@radix-ui/react-slider";

export type SliderProps = {
  /** The label above the slider. Required, because it names the thumb for screen readers. */
  label: ReactNode;
  /** A hint under the slider, linked to the thumb with aria-describedby. */
  help?: ReactNode;
  /** The value, when you control it. Pair it with onValueChange. */
  value?: number;
  /** The value it starts at when you do not control it. Without one, it starts at min. */
  defaultValue?: number;
  /** Called with the new value on every move of the slab, by pointer or key. */
  onValueChange?: (value: number) => void;
  /** Called with the final value when a drag is released, or right after a key moves the slab. Use it to save. */
  onValueCommit?: (value: number) => void;
  /** The lowest value, with the slab at its shortest. */
  min?: number;
  /** The highest value, with the slab filling the tray. */
  max?: number;
  /** The gap between values. The slab snaps to it, and an arrow key moves one step. */
  step?: number;
  /** A word under the start of the tray, such as "Slower". Say which way is which. */
  minLabel?: ReactNode;
  /** A word under the end of the tray, such as "Faster". */
  maxLabel?: ReactNode;
  /** The slab says its value at its leading end. On by default; false leaves the slab plain. */
  showValue?: boolean;
  /** Turns a value into text, such as 1 into "1.0x". It feeds the shown value and aria-valuetext. Without it, the number is shown as it is. */
  formatValue?: (value: number) => string;
  /** Makes the slider unavailable: muted, skipped by Tab, and left out of a form, like a native field. */
  disabled?: boolean;
  /** The field name a form sends the value under. */
  name?: string;
  /** The id of the thumb, when you need your own. The label and the help text derive their ids from it. */
  id?: string;
  /** Extra classes for the wrapper, such as a width. */
  className?: string;
  /** The thumb, for focus or a form library. */
  ref?: Ref<HTMLSpanElement>;
};

export type RangeSliderProps = {
  /** The label above the slider. Required: each thumb is named by it and its end, such as "Build time, from". */
  label: ReactNode;
  /** A hint under the slider, linked to both thumbs with aria-describedby. */
  help?: ReactNode;
  /** The two values, [from, to], when you control them. Pair it with onValueChange. */
  value?: [number, number];
  /** The values it starts at when you do not control them. Without them, it starts open, at [min, max]. */
  defaultValue?: [number, number];
  /** Called with [from, to] on every move of either end, by pointer or key. */
  onValueChange?: (value: [number, number]) => void;
  /** Called with [from, to] when a drag is released, or right after a key moves an end. Use it to save or to run the filter. */
  onValueCommit?: (value: [number, number]) => void;
  /** The lowest value, at the start of the tray. */
  min?: number;
  /** The highest value, at the end of the tray. */
  max?: number;
  /** The gap between values. Both ends snap to it, and an arrow key moves the focused end one step. */
  step?: number;
  /** How many steps the ends stay apart. They never cross, and never meet unless you pass 0. */
  minStepsBetweenThumbs?: number;
  /** The words that finish each thumb's name, "<label>, from" and "<label>, to". Change them for another language or another meaning. */
  thumbLabels?: [string, string];
  /** A word under the start of the tray, such as "Faster". Say which way is which. */
  minLabel?: ReactNode;
  /** A word under the end of the tray, such as "Slower". */
  maxLabel?: ReactNode;
  /** Shows the span at the end of the label row, in tabular figures: "20s to 80s". Off by default. */
  showValue?: boolean;
  /** Turns one value into text, such as 20 into "20s". It feeds the shown span ("20s to 80s") and each thumb's aria-valuetext. Without it, the number is shown as it is. */
  formatValue?: (value: number) => string;
  /** Makes the slider unavailable: muted, skipped by Tab, and left out of a form, like a native field. */
  disabled?: boolean;
  /** The field name a form sends both values under: FormData.getAll(name) is [from, to]. */
  name?: string;
  /** The id of the from thumb, when you need your own. The label, the help text and the to thumb ("<id>-to") derive their ids from it. */
  id?: string;
  /** Extra classes for the wrapper, such as a width. */
  className?: string;
  /** The from thumb, for focus or a form library. */
  ref?: Ref<HTMLSpanElement>;
};

/* The tray: sunken, the control's height, at the control radius. It clips what moves, so a cast never spills past its
   walls. A single slider's focus ring sits on it; a range draws its ring on the focused end instead. */
const trayBase =
  "relative flex h-control-md w-full cursor-pointer touch-pan-y select-none overflow-hidden rounded-control " +
  "bg-tray shadow-(--tray-shade) " +
  "data-disabled:cursor-not-allowed data-disabled:bg-surface-2 data-disabled:shadow-[inset_0_0_0_1px_var(--line)] " +
  "forced-colors:border";
const trayRing = "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus";

/* Inside the tray, 2px in: where the slab and the thumbs live. Radix positions the thumbs against it. */
const room = "absolute inset-0.5";

/* The slab, raised. Its corners are the control radius less the 2px it is set in. It reads the grip's width in the
   sans at the small size, as the thumb does, so the two agree to the pixel. */
const slabBase =
  "pointer-events-none absolute inset-y-0 rounded-[calc(var(--radius-control)-2px)] text-small " +
  "transition-[box-shadow] duration-(--dur-instant) ease-litt " +
  "forced-colors:border forced-colors:bg-[Highlight]";
const slabLook = (held: boolean, disabled: boolean) =>
  disabled
    ? "bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]"
    : held
      ? "bg-block shadow-[var(--block-round),var(--block-press)]"
      : "bg-block shadow-[var(--block-round),var(--block-lift)]";

/* A single slider's thumb: the grip at the slab's leading end, which says the value. The ring is the tray's. */
const gripOne =
  "flex h-10 w-(--grip) items-center justify-end pr-3 text-small tabular-nums text-fg focus-visible:outline-none " +
  "data-disabled:text-fg-subtle forced-colors:text-[HighlightText]";

/* A range's thumb: a 20px grip at one end of the slab. The focused one rings itself, so you can tell which end the keys move. */
const gripEnd =
  "block h-10 w-(--grip) rounded-[calc(var(--radius-control)-2px)] " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

/** How many digits a number needs after the point, so snapping to a step of 0.1 never leaves 0.30000000000000004. */
function places(n: number) {
  return (String(n).split(".")[1] ?? "").length;
}

/** The nearest value on the step grid, kept on the rail. */
function snapToStep(raw: number, min: number, max: number, step: number) {
  const snapped = Math.round((raw - min) / step) * step + min;
  return Math.min(max, Math.max(min, Number(snapped.toFixed(Math.max(places(step), places(min))))));
}

/** What Page Up and Page Down move: about a tenth of the range, in whole steps, never fewer than one. Radix moves ten steps. */
function pageSteps(min: number, max: number, step: number) {
  return Math.max(1, Math.round((max - min) / step / 10));
}

/** Hands an element to a ref the caller passed, of either kind. */
function setRef<T>(ref: Ref<T> | undefined, el: T | null) {
  if (typeof ref === "function") ref(el);
  else if (ref) (ref as RefObject<T | null>).current = el;
}

/** Where `p` (0 to 1) of the way along is, as a CSS length inside the room, for something whose start sits there. */
const along = (p: number) => `calc((100% - var(--grip)) * ${p})`;

/** The pointer inside the room, undoing any scale above it: its x, the room's width and the grip's. */
function measure(roomEl: HTMLElement, grip: HTMLElement | null | undefined, clientX: number) {
  const r = roomEl.getBoundingClientRect();
  const w = roomEl.offsetWidth || r.width;
  const scale = r.width / w || 1;
  return { x: (clientX - r.left) / scale, w, g: grip?.offsetWidth ?? 0 };
}

type FieldProps = {
  labelId: string;
  label: ReactNode;
  /** The value as it is shown at the end of the label row. Leave it out to show none. */
  shown?: string;
  helpId?: string;
  help?: ReactNode;
  minLabel?: ReactNode;
  maxLabel?: ReactNode;
  disabled: boolean;
  className: string;
  /** Marks the field as a group named by its label, for a control with more than one thumb. */
  group?: boolean;
  /** The tray, and anything that must sit inside the field. */
  children: ReactNode;
};

/** What the Slider and the RangeSlider share around the tray: the label row, the end words and the help text. */
function Field({ labelId, label, shown, helpId, help, minLabel, maxLabel, disabled, className, group = false, children }: FieldProps) {
  return (
    <div
      role={group ? "group" : undefined}
      aria-labelledby={group ? labelId : undefined}
      aria-disabled={group && disabled ? true : undefined}
      className={["grid gap-2", className].join(" ")}
    >
      <div className="flex items-baseline justify-between gap-4">
        <span id={labelId} className={"text-small font-title " + (disabled ? "text-fg-disabled" : "text-fg")}>
          {label}
        </span>
        {shown !== undefined && (
          /* Disabled, the value steps down to --fg-subtle, not --fg-disabled: it is still information, and it must stay readable. */
          <span aria-hidden="true" className={"text-small tabular-nums " + (disabled ? "text-fg-subtle" : "text-fg-muted")}>
            {shown}
          </span>
        )}
      </div>
      <div className="grid gap-1">
        {children}
        {(minLabel || maxLabel) && (
          <div className="flex justify-between gap-4 text-caption text-fg-subtle">
            <span>{minLabel}</span>
            <span className="text-right">{maxLabel}</span>
          </div>
        )}
      </div>
      {help && (
        <p id={helpId} className="text-small text-fg-subtle">
          {help}
        </p>
      )}
    </div>
  );
}

/** One slider: a label above, a slab in a tray that says its value, and optional words under its ends. Every value is a number, and a form sends it under name. */
export function Slider({
  label,
  help,
  value: valueProp,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  minLabel,
  maxLabel,
  showValue = true,
  formatValue,
  disabled = false,
  name,
  id: idProp,
  className = "",
  ref,
}: SliderProps) {
  const auto = useId();
  const id = idProp ?? auto;
  const labelId = `${id}-label`;
  const helpId = help ? `${id}-help` : undefined;

  /* The slider keeps its own value when you do not control it, because Page Up and the hand need to read it. */
  const [inner, setInner] = useState(defaultValue ?? min);
  const value = valueProp ?? inner;
  const fmt = (v: number) => (formatValue ? formatValue(v) : String(v));
  const text = fmt(value);
  const p = (value - min) / (max - min || 1);
  /* The grip holds the widest word the slider can say (a figure is 1ch; the slack covers a wider sign such as %), so the slab's shortest never changes as it moves. */
  const chars = Math.max(fmt(min).length, fmt(max).length, fmt(snapToStep(min + step, min, max, step)).length);
  const grip = showValue ? `calc(${chars}ch + 1.75rem)` : "2rem";

  const latest = useRef(value);
  latest.current = value;
  const change = (next: number | undefined) => {
    if (next === undefined || next === latest.current) return;
    latest.current = next;
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  };

  /* Radix moves ten steps on Page Up and Page Down. The spec says about a tenth of the range, in whole steps. */
  const pageKeys = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (disabled || (event.key !== "PageUp" && event.key !== "PageDown")) return;
    event.preventDefault();
    const raw = value + (event.key === "PageUp" ? 1 : -1) * pageSteps(min, max, step) * step;
    const next = snapToStep(raw, min, max, step);
    if (next === value) return;
    change(next);
    onValueCommit?.(next);
  };

  /* The hand. A press on the slab holds it where it was taken (offset); a press past its end jumps the end there.
     Each handler calls preventDefault, so Radix's own pointer handling stays out. */
  const roomRef = useRef<HTMLSpanElement>(null);
  const thumbRef = useRef<HTMLSpanElement | null>(null);
  const hand = useRef<{ id: number; offset: number } | null>(null);
  const [held, setHeld] = useState(false);
  const to = (clientX: number, offset: number) => {
    const m = measure(roomRef.current!, thumbRef.current, clientX);
    const at = (m.x + offset - m.g) / (m.w - m.g || 1);
    change(snapToStep(min + Math.min(1, Math.max(0, at)) * (max - min), min, max, step));
  };
  const onPointerDown = (e: PointerEvent<HTMLSpanElement>) => {
    if (disabled || (e.pointerType === "mouse" && e.button !== 0) || !roomRef.current) return;
    e.preventDefault();
    const m = measure(roomRef.current, thumbRef.current, e.clientX);
    const end = m.g + p * (m.w - m.g);
    const offset = m.x <= end + 8 ? end - m.x : 0;
    hand.current = { id: e.pointerId, offset };
    e.currentTarget.setPointerCapture(e.pointerId);
    thumbRef.current?.focus({ preventScroll: true });
    setHeld(true);
    to(e.clientX, offset);
  };
  const onPointerMove = (e: PointerEvent<HTMLSpanElement>) => {
    const h = hand.current;
    if (!h || h.id !== e.pointerId) return;
    e.preventDefault();
    to(e.clientX, h.offset);
  };
  const onPointerEnd = (e: PointerEvent<HTMLSpanElement>) => {
    const h = hand.current;
    if (!h || h.id !== e.pointerId) return;
    e.preventDefault();
    hand.current = null;
    setHeld(false);
    if (e.type === "pointerup") onValueCommit?.(latest.current);
  };

  /* The leading end rolls away into shade, a little deeper the further the slab is pushed (Nick's 116 to 118). */
  const roll: CSSProperties = disabled
    ? {}
    : {
        backgroundImage: `linear-gradient(to right, transparent calc(100% - ${(1.5 + 3 * p).toFixed(2)}px), color-mix(in oklab, var(--block-roll) ${Math.round(25 + 60 * p)}%, transparent))`,
      };

  return (
    <Field
      labelId={labelId}
      label={label}
      helpId={helpId}
      help={help}
      minLabel={minLabel}
      maxLabel={maxLabel}
      disabled={disabled}
      className={className}
    >
      <RadixSlider.Root
        /* The slab grows from the left and the hand is measured from the left, so Radix places the thumb from the left too, under any DirectionProvider. */
        dir="ltr"
        name={disabled ? undefined : name}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        value={[value]}
        onValueChange={(v) => change(v[0])}
        onValueCommit={(v) => v[0] !== undefined && onValueCommit?.(v[0])}
        onKeyDown={pageKeys}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        data-no-drag=""
        className={trayBase + " " + trayRing}
      >
        <RadixSlider.Track ref={roomRef} className={room} style={{ "--grip": grip } as CSSProperties}>
          <span aria-hidden="true" className={slabBase + " left-0 " + slabLook(held, disabled)} style={{ width: `calc(var(--grip) + ${along(p)})`, ...roll }} />
          <RadixSlider.Thumb
            ref={(el: HTMLSpanElement | null) => {
              thumbRef.current = el;
              setRef(ref, el);
            }}
            id={id}
            aria-labelledby={labelId}
            aria-describedby={helpId}
            aria-valuetext={formatValue ? text : undefined}
            className={gripOne}
          >
            {showValue && <span aria-hidden="true">{text}</span>}
          </RadixSlider.Thumb>
        </RadixSlider.Track>
      </RadixSlider.Root>
    </Field>
  );
}

/** Two values on one tray, [from, to]: one slab that spans them. The ends never cross, each is named by the label and its end, and a form sends both under name. */
export function RangeSlider({
  label,
  help,
  value: valueProp,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  minStepsBetweenThumbs = 1,
  thumbLabels = ["from", "to"],
  minLabel,
  maxLabel,
  showValue = false,
  formatValue,
  disabled = false,
  name,
  id: idProp,
  className = "",
  ref,
}: RangeSliderProps) {
  const auto = useId();
  const id = idProp ?? auto;
  const labelId = `${id}-label`;
  const helpId = help ? `${id}-help` : undefined;
  const thumbId = (i: 0 | 1) => (i === 0 ? id : `${id}-to`);
  const nameId = (i: 0 | 1) => `${id}-${i === 0 ? "from" : "to"}-name`;

  /* The slider keeps its own values when you do not control them, because Page Up and the hand need to read them. They
     are sorted and kept on the tray, so a stray default can never draw the ends outside it or crossed. */
  const [inner, setInner] = useState<[number, number]>(defaultValue ?? [min, max]);
  const given = valueProp ?? inner;
  const from = Math.min(max, Math.max(min, Math.min(given[0], given[1])));
  const to = Math.min(max, Math.max(min, Math.max(given[0], given[1])));
  const values: [number, number] = [from, to];
  const fmt = (v: number) => (formatValue ? formatValue(v) : String(v));
  const text = `${fmt(from)} to ${fmt(to)}`;
  const span = max - min || 1;
  const pf = (from - min) / span;
  const pt = (to - min) / span;

  /* Radix keeps the thumbs in order (preserveThumbOrder) and could hold the gap too, but it rounds a decimal step badly
     (0.2 plus 0.1 is 0.30000000000000004). So Radix gets no gap, and the thumb that moved is held here, on the step grid.
     A thumb is never pushed back past where it already was. */
  const digits = Math.max(places(step), places(min));
  const gap = Math.max(0, minStepsBetweenThumbs) * step;
  const down = (n: number) => Number((Math.floor((n - min) / step + 1e-9) * step + min).toFixed(digits));
  const up = (n: number) => Number((Math.ceil((n - min) / step - 1e-9) * step + min).toFixed(digits));
  const hold = (next: number[]): [number, number] => {
    let [a = from, b = to] = next;
    if (a !== from) a = Math.min(a, Math.max(from, down(to - gap)));
    else if (b !== to) b = Math.max(b, Math.min(to, up(from + gap)));
    return [a, b];
  };
  const same = (a: number[], b: number[]) => a[0] === b[0] && a[1] === b[1];

  const latest = useRef(values);
  latest.current = values;
  const change = (next: number[]) => {
    const held = hold(next);
    if (same(held, latest.current)) return;
    latest.current = held;
    if (valueProp === undefined) setInner(held);
    onValueChange?.(held);
  };

  /* Radix commits a key press with the move it wanted. When the other thumb held it back, nothing moved, so nothing is saved.
     A released drag commits the values as they are, which are always whole. */
  const commit = (next: number[]) => {
    const held = hold(next);
    if (!same(next, values) && same(held, values)) return;
    onValueCommit?.(held);
  };

  /* The keys act on the focused thumb. Radix sends Home to the first thumb and End to the last, whichever has focus, and
     moves ten steps on Page Up and Page Down. The spec says Home and End go to the end of the tray (the other thumb stops
     them) and the pages are about a tenth of the range, in whole steps. */
  const thumbKeys = (i: 0 | 1) => (event: KeyboardEvent<HTMLSpanElement>) => {
    if (disabled) return;
    const at = values[i];
    let target: number;
    if (event.key === "Home") target = min;
    else if (event.key === "End") target = max;
    else if (event.key === "PageUp") target = at + pageSteps(min, max, step) * step;
    else if (event.key === "PageDown") target = at - pageSteps(min, max, step) * step;
    else return;
    event.preventDefault();
    const snapped = snapToStep(target, min, max, step);
    const held = hold(i === 0 ? [snapped, to] : [from, snapped]);
    if (same(held, values)) return;
    change(held);
    onValueCommit?.(held);
  };

  /* The hand: a press takes the nearer end of the slab, held where it was taken when the press is on the slab, or
     jumped to the finger when it is past it. Each handler calls preventDefault, so Radix's pointer handling stays out. */
  const roomRef = useRef<HTMLSpanElement>(null);
  const thumbs = useRef<(HTMLSpanElement | null)[]>([]);
  const hand = useRef<{ id: number; end: 0 | 1; offset: number } | null>(null);
  const [held, setHeld] = useState(false);
  const moveEnd = (end: 0 | 1, clientX: number, offset: number) => {
    const m = measure(roomRef.current!, thumbs.current[0], clientX);
    const at = (m.x + offset - (end === 1 ? m.g : 0)) / (m.w - m.g || 1);
    const v = snapToStep(min + Math.min(1, Math.max(0, at)) * span, min, max, step);
    const [a, b] = latest.current;
    change(end === 0 ? [v, b] : [a, v]);
  };
  const onPointerDown = (e: PointerEvent<HTMLSpanElement>) => {
    if (disabled || (e.pointerType === "mouse" && e.button !== 0) || !roomRef.current) return;
    e.preventDefault();
    const m = measure(roomRef.current, thumbs.current[0], e.clientX);
    const left = pf * (m.w - m.g);
    const right = m.g + pt * (m.w - m.g);
    const end: 0 | 1 = m.x < (left + right) / 2 ? 0 : 1;
    const edge = end === 0 ? left : right;
    const on = m.x >= left - 8 && m.x <= right + 8;
    const offset = on ? edge - m.x : 0;
    hand.current = { id: e.pointerId, end, offset };
    e.currentTarget.setPointerCapture(e.pointerId);
    thumbs.current[end]?.focus({ preventScroll: true });
    setHeld(true);
    moveEnd(end, e.clientX, offset);
  };
  const onPointerMove = (e: PointerEvent<HTMLSpanElement>) => {
    const h = hand.current;
    if (!h || h.id !== e.pointerId) return;
    e.preventDefault();
    moveEnd(h.end, e.clientX, h.offset);
  };
  const onPointerEnd = (e: PointerEvent<HTMLSpanElement>) => {
    const h = hand.current;
    if (!h || h.id !== e.pointerId) return;
    e.preventDefault();
    hand.current = null;
    setHeld(false);
    if (e.type === "pointerup") onValueCommit?.(latest.current);
  };

  /* Both ends roll away into shade. A range's span is not one push from the start, so the roll stays as it is. */
  const roll: CSSProperties = disabled
    ? {}
    : {
        backgroundImage:
          "linear-gradient(to right, color-mix(in oklab, var(--block-roll) 45%, transparent), transparent 3px, transparent calc(100% - 3px), color-mix(in oklab, var(--block-roll) 45%, transparent))",
      };

  return (
    <Field
      labelId={labelId}
      label={label}
      shown={showValue ? text : undefined}
      helpId={helpId}
      help={help}
      minLabel={minLabel}
      maxLabel={maxLabel}
      disabled={disabled}
      className={className}
      group
    >
      <RadixSlider.Root
        dir="ltr" // as the Slider's: the slab and the hand run from the left
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        value={values}
        preserveThumbOrder
        onValueChange={change}
        onValueCommit={commit}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        data-no-drag=""
        className={trayBase}
      >
        <RadixSlider.Track ref={roomRef} className={room} style={{ "--grip": "1.25rem" } as CSSProperties}>
          <span
            aria-hidden="true"
            className={slabBase + " " + slabLook(held, disabled)}
            style={{ left: along(pf), width: `calc(var(--grip) + ${along(pt - pf)})`, ...roll }}
          />
          {([0, 1] as const).map((i) => (
            <RadixSlider.Thumb
              key={i}
              ref={(el: HTMLSpanElement | null) => {
                thumbs.current[i] = el;
                if (i === 0) setRef(ref, el);
              }}
              id={thumbId(i)}
              /* A form sends both values under the same name (Radix would add [] to it). */
              name={disabled ? undefined : name}
              aria-labelledby={nameId(i)}
              aria-describedby={helpId}
              aria-valuetext={formatValue ? fmt(values[i]) : undefined}
              onKeyDown={thumbKeys(i)}
              className={gripEnd}
            />
          ))}
        </RadixSlider.Track>
      </RadixSlider.Root>
      {/* The names: the label and the end, as one string, so a screen reader says "Build time, from". Hidden text still names a thumb. */}
      {([0, 1] as const).map((i) => (
        <span key={i} id={nameId(i)} hidden>
          {label}, {thumbLabels[i]}
        </span>
      ))}
    </Field>
  );
}
