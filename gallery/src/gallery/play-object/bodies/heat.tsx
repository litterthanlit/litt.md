/**
 * Heat's object, a night menu (plans/018, Heat's row; proposals/heat.md, after street-racing menus): a square black slab
 * (bleached sepia paper by day) banded top and bottom with diagonal hazard stripes and framed by four corner brackets.
 *
 * - Outer frame: four 16px corner brackets in the ink (`--fg`), seated inside a 2px-padded outer wrapper so they never
 *   cause sideways scroll.
 * - Header band (`order-1`, non-focusable): striped top band with the take's title, tabular count and a dashed level
 *   bar (amber dashes up to the current take, as in Heat's Audio scene).
 * - Screen (`order-2`): flush square stage between 1px rules, holding the take alone (`rail: false`).
 * - Menu selector & foot (`order-3`, DOM child 1): a horizontal strip of square cells where the active item takes four
 *   8px amber corner brackets and `‹ Title ›` chevrons (never an accent fill, R6), with Play and keycap hints along the
 *   foot above the closing striped band.
 */
import { useEffect, useRef } from "react";
import { Kbd } from "@/components/kbd";
import type { PlayObjectBody, PlayObjectBodyProps } from "../body";
import { COMPACT_BOX, COMPACT_SCREEN, SCREEN_HEIGHT } from "../body";

/* Four corner marks, each two 2px bars, in currentColor (after systems/heat.tsx). */
const MARKS =
  "pointer-events-none absolute bg-no-repeat " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom] ";

/* The slab's outer brackets: 16px marks just outside the slab, in the ink. */
const FRAME = MARKS + "[background-size:16px_2px,2px_16px,16px_2px,2px_16px,16px_2px,2px_16px,16px_2px,2px_16px] -inset-2 text-fg";
/* The active item's brackets: 8px marks in amber (or ink in light, via --accent-text). */
const SELECTED = MARKS + "[background-size:8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px] inset-0 text-accent-text";
/* Diagonal hazard stripes along the top and bottom bands. */
const STRIPES = "[background-image:repeating-linear-gradient(135deg,var(--surface-3)_0_6px,transparent_6px_12px)]";

const heatBtn =
  "litt-target relative inline-flex h-control-sm shrink-0 cursor-pointer items-center justify-center gap-1.5 border border-line bg-block text-small font-title " +
  "transition-colors duration-(--dur-instant) ease-litt hover:border-line-strong hover:bg-(--block-hover) " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus forced-colors:border";

function HeaderBand({
  readout,
  at,
  n,
  compact = false,
  className = "",
}: Pick<PlayObjectBodyProps, "readout"> & { at: number | null; n: number; compact?: boolean; className?: string }) {
  const lit = at === null ? 0 : at + 1;
  return (
    <div
      {...readout.props}
      className={
        "flex min-w-0 items-center justify-between gap-4 bg-surface-1 px-4 py-2 " +
        STRIPES +
        " " +
        className
      }
    >
      <div className="flex min-w-0 items-baseline gap-3 bg-canvas px-2 py-0.5">
        <span className="min-w-0 truncate text-small font-title text-fg">{readout.title}</span>{" "}
        <span className="shrink-0 font-mono text-caption tabular-nums text-accent-text">{readout.count}</span>
      </div>
      {!compact && (
        <span aria-hidden="true" className="flex h-2.5 w-36 shrink-0 items-center gap-1 bg-canvas px-1">
          {Array.from({ length: n }, (_, i) => (
            <span
              key={i}
              className={"h-1 flex-1 " + (i < lit ? "bg-accent-text forced-colors:bg-[Highlight]" : "bg-line-strong")}
            />
          ))}
        </span>
      )}
    </div>
  );
}

function MenuStrip({ takes, at, selector, pick, index }: Pick<PlayObjectBodyProps, "takes" | "at" | "selector" | "pick" | "index">) {
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const r = row.current;
    const on = r?.querySelector<HTMLElement>("[data-chosen]");
    if (!r || !on || r.scrollWidth <= r.clientWidth) return;
    r.scrollTo({ left: on.offsetLeft - (r.clientWidth - on.offsetWidth) / 2 });
  }, [at]);

  const itemBase =
    "relative inline-flex h-control-sm shrink-0 cursor-pointer items-center gap-1.5 px-3 text-small font-title whitespace-nowrap select-none " +
    "transition-colors duration-(--dur-instant) ease-litt pointer-coarse:h-control-md";

  return (
    <div ref={row} className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto overscroll-x-contain py-1 [scrollbar-width:none]">
      <button
        {...index}
        aria-label={undefined}
        data-chosen={at === null ? "" : undefined}
        className={
          itemBase +
          " " +
          (at === null
            ? "bg-surface-1 text-accent-text forced-colors:outline-2 forced-colors:-outline-offset-2 forced-colors:outline-[Highlight]"
            : "text-fg-muted hover:text-fg")
        }
      >
        {at === null && <span aria-hidden="true" className={SELECTED} />}
        {at === null && <span aria-hidden="true">‹</span>}
        <span>Home</span>
        {at === null && <span aria-hidden="true">›</span>}
      </button>
      <div
        {...selector}
        className="flex shrink-0 items-center gap-1 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
      >
        {takes.map((t, i) => {
          const active = i === at;
          return (
            <span
              key={t.id}
              aria-hidden="true"
              data-chosen={active ? "" : undefined}
              onClick={() => pick(i)}
              className={
                itemBase +
                " " +
                (active
                  ? "bg-surface-1 text-accent-text forced-colors:outline-2 forced-colors:-outline-offset-2 forced-colors:outline-[Highlight]"
                  : "text-fg-muted hover:text-fg")
              }
            >
              {active && <span aria-hidden="true" className={SELECTED} />}
              {active ? `‹ ${t.title} ›` : t.title}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function PlayHeatKey({ play }: { play: PlayObjectBodyProps["play"] }) {
  const on = play["aria-pressed"];
  return (
    <button
      {...play}
      className={
        heatBtn +
        " px-3 " +
        (on
          ? "text-accent-text forced-colors:outline-2 forced-colors:-outline-offset-2 forced-colors:outline-[Highlight]"
          : "text-fg")
      }
    >
      {on && <span aria-hidden="true" className={SELECTED} />}
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 fill-current">
        {on ? <path d="M4 3h3v10H4zM9 3h3v10H9z" /> : <path d="M5 3v10l8-5z" />}
      </svg>
      <span>Play</span>
    </button>
  );
}

function HeatBody({ takes, at, selector, pick, step, index, play, readout, screen, compact }: PlayObjectBodyProps) {
  if (compact) {
    return (
      <div className={COMPACT_BOX}>
        <div className="grid shrink-0 border-b border-line bg-canvas">
          <HeaderBand readout={readout} at={at} n={takes.length} compact />
          <div className="flex min-w-0 items-center gap-2 border-t border-line px-gutter py-1.5">
            <MenuStrip takes={takes} at={at} selector={selector} pick={pick} index={index} />
            <PlayHeatKey play={play} />
          </div>
        </div>
        {screen}
      </div>
    );
  }
  return (
    <div className="grid w-full min-w-0 gap-3 px-2 pt-2">
      <div className="relative min-w-0">
        <span aria-hidden="true" className={FRAME} />
        <div className="flex min-w-0 flex-col border border-line bg-canvas forced-colors:border">
          {/* DOM order: menu deck (selector -> Play) first, then screen, then non-focusable header band. */}
          <div className="order-3 flex min-w-0 flex-col">
            <div className="flex min-w-0 items-center gap-3 border-t border-line px-3 py-2">
              <MenuStrip takes={takes} at={at} selector={selector} pick={pick} index={index} />
              <div className="flex shrink-0 items-center gap-1.5">
                <button {...step(-1)} className={heatBtn + " px-2.5 text-fg"}>
                  <span aria-hidden="true">‹</span>
                </button>
                <PlayHeatKey play={play} />
                <button {...step(1)} className={heatBtn + " px-2.5 text-fg"}>
                  <span aria-hidden="true">›</span>
                </button>
              </div>
            </div>
            <div aria-hidden="true" className={"h-3 bg-surface-1 " + STRIPES} />
          </div>
          <div className="order-2 flex border-y border-line bg-canvas">
            {screen}
          </div>
          <HeaderBand readout={readout} at={at} n={takes.length} className="order-1" />
        </div>
      </div>
      {/* Keycap hints along the foot, as in Heat's street-racing menus. */}
      <div aria-hidden="true" className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1 text-caption text-fg-muted">
        <span className="inline-flex items-center gap-1.5">
          <Kbd>←</Kbd>
          <Kbd>→</Kbd>
          <span>Step</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Kbd>Home</Kbd>
          <span>Index</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Kbd>End</Kbd>
          <span>Last</span>
        </span>
      </div>
    </div>
  );
}

export const heat: PlayObjectBody = {
  name: "heat",
  shape: (compact) => (compact ? COMPACT_SCREEN : SCREEN_HEIGHT + " w-full rounded-none"),
  rail: false,
  Body: HeatBody,
};
