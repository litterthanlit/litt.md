/**
 * Segmented control, Heat's body: one raised block over empty bays in a tray, as Press drew it until 2026-11-16
 * (plans/022). Press went back to its first boards and dropped the bays (--cut-shade) and the block's lit edge
 * (--highlight); Heat keeps them, so nothing in Heat changed.
 *
 * - The tray is --tray with --tray-shade; each empty bay is a --cut-shade; the chosen block is --block with --block-lift
 *   and --highlight. It crosses by translate on the responsive tier, and a hand can drag it to the nearer option.
 * - The contract (props, the radios, the arrow keys) is segmented.tsx's.
 */
import { useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import { useFun } from "@/motion";
import type { SegmentedBodyProps, SegmentedOption, SegmentedSize } from "@/components/segmented";

/** What a finger holding an unselected segment shows: the fg 6% fill that rows and tabs share, and the hover text color. */
const PRESS = "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:text-fg";

const sizes: Record<SegmentedSize, { track: string; segment: string }> = {
  sm: { track: "h-control-sm pointer-coarse:h-control-md", segment: "px-control-pad-sm text-caption pointer-coarse:text-small" },
  md: { track: "h-control-md", segment: "px-control-pad-md text-small" },
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

/** Heat's body, blocks in a tray: one raised block rides the tray over empty bays, and a hand can drag it to the nearer option. */
export function SegmentedHeatBody({ legend, showLegend, name, value, options, size, block, disabled, className, select }: SegmentedBodyProps) {
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
    <fieldset data-body="heat" disabled={disabled} className={"m-0 min-w-0 border-0 p-0 " + className}>
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
