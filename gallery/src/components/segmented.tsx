/**
 * Segmented control (components.md, "Segmented control"): a short choice of two to five
 * options, in one track. Built from a fieldset and native radio inputs, so the role, the
 * arrow keys and the form value come from the browser.
 *
 * - Track: a sunken tray (R3: --tray, --tray-shade) at the control radius, 2px padding, as the Switch's. The segments
 *   inside sit at the control radius less that inset, so the corners stay concentric.
 * - Flat (proposals/flat-pill.md): no tray at all; the selected word is a grey pill bubble (--block is --surface-3), and the others are --fg-muted words. Its forced-colors border stays.
 * - Segment: --fg-subtle, and --fg on hover. The selected one is the raised block (--block, --block-lift), in --fg:
 *   selected is raised, the same block as a switch's. Labels at the title weight (R8), and no segment changes size
 *   when selected.
 * - Sizes are on the control scale: sm is a 32px track with caption text (the spec), md is a
 *   44px track with small text, for forms beside 44px inputs. On touch screens sm grows to 44px.
 * - Segments share one width (the widest label), so the selected surface keeps its shape as
 *   it moves.
 * - Motion: the selected surface glides to the picked segment on the responsive tier (it
 *   moves through transform), as in Tabs (Press: a CSS translate, as the Switch's block; Flat: a layout glide). Color changes are instant. In fun mode (motion/fun.tsx, a trial, off unless
 *   a <FunMode> is on) it glides on fun mode's glide spring and settles a hair past the segment; reduced motion turns
 *   it off.
 * - Touch: there is no hover, so on a coarse pointer an unselected segment that is held down fills
 *   (PRESS: fg 6%, color only, instant tier) and takes the --fg text. The selected one needs no fill,
 *   its surface is the answer. The box never moves. The OS tap flash is off, so the two do not double.
 * - Bodies (proposals/worlds.md): this file resolves the state once into SegmentedBodyProps and renders the body the
 *   material picks (byWorld). Press, here, is blocks in a tray: one raised block over empty bays (the bays are a
 *   --cut-shade, the block --block with --block-lift and --highlight). It crosses by translate on the responsive tier,
 *   and a hand can take it and drag it one to one, as the Switch's block does: a press on it sinks it --press-depth on
 *   --block-press, a drag past 4px follows the finger, and it lands on the nearer enabled option when let go (a drag
 *   that ends where it started changes nothing). A click and the arrow keys stay as they were. Flat
 *   (bodies/segmented.flat.tsx) is words alone with a grey pill bubble sized to the chosen word, and no tray. Device
 *   (bodies/segmented.device.tsx) is a row of keys in one well, the chosen one latched down with its lamp lit, and
 *   nothing glides. The props, the radios and the arrow keys are the same in all three.
 * - The legend is visually hidden by default, as the spec says. Pass showLegend in a form.
 */
import { useId, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import type { Transition } from "motion/react";
import { byWorld, useFun, useMaterial, useTransition } from "@/motion";
import { SegmentedFlatBody } from "./bodies/segmented.flat";
import { SegmentedDeviceBody } from "./bodies/segmented.device";

export type SegmentedSize = "sm" | "md";
export type SegmentedOption<T extends string> = {
  /** What onValueChange gets and what a form sends. */
  value: T;
  /** The text in the segment. Keep it to a word or two. */
  label: ReactNode;
  /** Makes this one option unavailable. The others keep working. */
  disabled?: boolean;
};

export type SegmentedProps<T extends string> = {
  /** The group's name, read out with each option. Required. Hidden from sight unless you pass showLegend. */
  legend: ReactNode;
  /** Shows the legend as a label above the track, for a form. Off by default, because a switch in a toolbar is named by its options. */
  showLegend?: boolean;
  /** The radios' shared name, which is what makes the arrow keys move between them and what a form sends. Made up for you when left out. */
  name?: string;
  /** The value of the selected option, when you control it. Pair it with onValueChange. */
  value?: T;
  /** The option that starts selected when you do not control it. Without one, the first option starts selected. */
  defaultValue?: T;
  /** Called with the picked option's value each time the selection changes, by click, tap or arrow key. */
  onValueChange?: (value: T) => void;
  /** The choices, in order. Give it two to five. */
  options: SegmentedOption<T>[];
  /** Track height on the control scale: sm is 32 with 12px text, md is 44 with 13px text. Use md in forms. */
  size?: SegmentedSize;
  /** Fills the width of its container, with equal segments. */
  block?: boolean;
  /** Disables every option, through the fieldset. */
  disabled?: boolean;
  /** Extra classes for the fieldset, such as a width. */
  className?: string;
};

/** What a finger holding an unselected segment shows: the fg 6% fill that rows and tabs share, and the hover text color. */
const PRESS = "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:text-fg";

const sizes: Record<SegmentedSize, { track: string; segment: string }> = {
  sm: { track: "h-control-sm pointer-coarse:h-control-md", segment: "px-control-pad-sm text-caption pointer-coarse:text-small" },
  md: { track: "h-control-md", segment: "px-control-pad-md text-small" },
};

/** What a body gets: the state resolved once, and the radios' wiring. Every body renders the same fieldset of native radios. */
export type SegmentedBodyProps<T extends string = string> = {
  legend: ReactNode;
  showLegend: boolean;
  name: string;
  /** The selected option's value. */
  value: T | undefined;
  options: SegmentedOption<T>[];
  size: SegmentedSize;
  block: boolean;
  /** The whole control is disabled (the fieldset). */
  disabled: boolean;
  className: string;
  /** Selects an option: sets the inner state and calls onValueChange. */
  select: (value: T) => void;
  /** The LayoutGroup id, so two controls never share a gliding surface (Flat's bubble). */
  groupId: string;
  /** How the selected surface glides, for the bodies that glide with the layout engine (Flat). Press glides by CSS. */
  enter: Transition;
};

/** How far a finger moves before a press on the chosen block becomes a drag, in px (the Switch's). */
const SLOP = 4;

/* The block's crossing on the responsive tier, and its cast on the instant tier. While a hand drags it, it follows
   one to one, so only the cast keeps its fade. */
const crossing: CSSProperties = {
  transitionProperty: "translate, box-shadow",
  transitionDuration: "var(--dur-responsive), var(--dur-instant)",
  transitionTimingFunction: "var(--ease-responsive), var(--ease-out)",
};
const following: CSSProperties = {
  transitionProperty: "box-shadow",
  transitionDuration: "var(--dur-instant)",
  transitionTimingFunction: "var(--ease-out)",
};

/** Press, blocks in a tray: one raised block rides the tray over empty bays, and a hand can drag it to the nearer option. */
function PressBody({ legend, showLegend, name, value, options, size, block, disabled, className, select }: SegmentedBodyProps) {
  const look = sizes[size];
  const fun = useFun();
  const n = options.length;
  const at = options.findIndex((o) => o.value === value);
  /* A hand on the chosen block: where it took hold, and where the block is now (px from the first bay). A press becomes a drag past SLOP px. */
  const hand = useRef<{ id: number; x0: number; from: number; at: number; step: number; moved: boolean } | null>(null);
  const dropped = useRef(-1);
  const [held, setHeld] = useState(false);
  const [dragX, setDragX] = useState<number | null>(null);
  const dragging = dragX !== null;

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || at < 0 || (e.pointerType === "mouse" && e.button !== 0)) return;
    const seg = (e.target as HTMLElement).closest<HTMLElement>("label[data-chosen]");
    if (!seg) return;
    const tray = e.currentTarget;
    const scale = tray.getBoundingClientRect().width / (tray.offsetWidth || 1) || 1;
    const step = seg.offsetWidth;
    hand.current = { id: e.pointerId, x0: e.clientX / scale, from: at * step, at: at * step, step, moved: false };
    setHeld(true);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const h = hand.current;
    if (!h || h.id !== e.pointerId) return;
    const scale = e.currentTarget.getBoundingClientRect().width / (e.currentTarget.offsetWidth || 1) || 1;
    const dx = e.clientX / scale - h.x0;
    if (!h.moved) {
      if (Math.abs(dx) < SLOP) return;
      h.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    h.at = Math.min((n - 1) * h.step, Math.max(0, h.from + dx));
    setDragX(h.at);
  };
  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    const h = hand.current;
    if (!h || h.id !== e.pointerId) return;
    hand.current = null;
    setHeld(false);
    if (!h.moved) return;
    setDragX(null);
    if (e.type === "pointercancel") return;
    /* The click that follows a drag must not pick again: the drop already chose the nearer enabled option. */
    dropped.current = e.timeStamp;
    const best = nearest(options, h.at, h.step, at);
    if (best !== at) select(options[best].value);
  };
  const onClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    if (dropped.current >= 0 && e.timeStamp - dropped.current < 500) e.preventDefault();
    dropped.current = -1;
  };

  /* The option the block is over: the chosen one, or while dragging the nearer enabled one. */
  const over = dragging && hand.current ? nearest(options, dragX, hand.current.step, at) : at;

  const motion: CSSProperties = dragging
    ? following
    : fun
      ? {
          ...crossing,
          transitionDuration: `${fun.glideCss.duration}ms, var(--dur-instant)`,
          transitionTimingFunction: `${fun.glideCss.easing}, var(--ease-out)`,
        }
      : crossing;
  const sunk = (held || dragging) && !disabled;

  return (
    <fieldset data-body="press" disabled={disabled} className={"m-0 min-w-0 border-0 p-0 " + className}>
      <legend className={showLegend ? "mb-2 p-0 text-small font-title text-fg" : "sr-only"}>{legend}</legend>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClickCapture={onClickCapture}
        className={
          "relative touch-pan-y grid-flow-col auto-cols-fr rounded-control bg-tray p-0.5 shadow-(--tray-shade) forced-colors:border " +
          (block ? "grid w-full " : "inline-grid ") +
          look.track
        }
      >
        {/* The block: one bay wide, less the tray's 2px walls. It crosses by translate (a percent of its own width), or follows the hand in px. */}
        {at >= 0 && (
          <span
            aria-hidden="true"
            className={
              "pointer-events-none absolute inset-y-0.5 left-0.5 rounded-[calc(var(--radius-control)-2px)] forced-colors:border-2 " +
              (disabled ? "bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]" : sunk ? "bg-block shadow-[var(--highlight),var(--block-press)]" : "bg-block shadow-[var(--highlight),var(--block-lift)]")
            }
            style={{
              ...motion,
              width: `calc((100% - 4px) / ${n})`,
              translate: `${dragging ? `${dragX}px` : `${at * 100}%`} ${sunk ? "var(--press-depth)" : "0px"}`,
            }}
          />
        )}
        {options.map((o) => {
          const selected = value === o.value;
          const off = disabled || !!o.disabled;
          const here = o.value === options[over]?.value;
          return (
            <label
              key={o.value}
              data-chosen={selected ? "" : undefined}
              className={
                "litt-target relative z-1 grid h-full select-none place-items-center rounded-[calc(var(--radius-control)-2px)] font-title " +
                "transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
                look.segment +
                (off
                  ? " cursor-not-allowed text-fg-disabled"
                  : " cursor-pointer " + (here ? "text-fg" : "text-fg-subtle hover:text-fg " + PRESS))
              }
            >
              <input
                type="radio"
                className="peer sr-only"
                name={name}
                value={o.value}
                checked={selected}
                disabled={o.disabled}
                onChange={() => {
                  select(o.value);
                }}
              />
              {/* An empty bay: the cut the block can sit in, drawn as a shade and never a line. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-px inset-y-0 -z-1 rounded-[calc(var(--radius-control)-2px)] shadow-(--cut-shade)"
              />
              <span className="litt-trim relative">{o.label}</span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[calc(var(--radius-control)-2px)] peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-focus"
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** The index of the enabled option whose bay is nearest to the block at x px, or the fallback when none is. */
function nearest(options: SegmentedOption<string>[], x: number, step: number, fallback: number) {
  let best = fallback;
  let gap = Infinity;
  options.forEach((o, i) => {
    const d = Math.abs(i * step - x);
    if (!o.disabled && d < gap) {
      best = i;
      gap = d;
    }
  });
  return best;
}

/** A group of native radios in one track, for a short choice such as Viewer or Editor, or System, Light and Dark. */
export function Segmented<T extends string>({
  legend,
  showLegend = false,
  name: nameProp,
  value: valueProp,
  defaultValue,
  onValueChange,
  options,
  size = "md",
  block = false,
  disabled = false,
  className = "",
}: SegmentedProps<T>) {
  const auto = useId();
  const name = nameProp ?? auto;
  const responsive = useTransition("responsive");
  /* Fun mode (motion/fun.tsx, a trial): the selected surface glides on a springier spring and settles past its mark. */
  const fun = useFun();
  const enter = fun ? fun.glide : responsive;
  const [inner, setInner] = useState<T | undefined>(defaultValue ?? options.find((o) => !o.disabled)?.value);
  const value = valueProp ?? inner;
  const Body = byWorld(useMaterial(), { press: PressBody, flat: SegmentedFlatBody, device: SegmentedDeviceBody });

  return (
    <Body
      legend={legend}
      showLegend={showLegend}
      name={name}
      value={value}
      options={options as SegmentedOption<string>[]}
      size={size}
      block={block}
      disabled={disabled}
      className={className}
      groupId={auto}
      enter={enter}
      select={(v) => {
        setInner(v as T);
        onValueChange?.(v as T);
      }}
    />
  );
}
