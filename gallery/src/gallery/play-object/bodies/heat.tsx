/**
 * Heat's object, a night menu (plans/018, Heat's row; proposals/heat.md, after street-racing menus): a square black slab
 * (bleached sepia paper by day) banded top and bottom with diagonal hazard stripes and framed by four corner brackets.
 *
 * - Outer frame: four 16px corner brackets in the ink (`--fg`), seated inside a 2px-padded outer wrapper so they never
 *   cause sideways scroll.
 *
 * Top to bottom, in the order read and the order tabbed, at every width (plans/audits/heat-fixes.md, finding 4):
 * - Header band (non-focusable): striped top band with the take's title, tabular count and a dashed level bar (amber
 *   dashes up to the current take, as in Heat's Audio scene).
 * - Menu strip: a horizontal strip of square cells where the active item takes four 8px amber corner brackets and
 *   `‹ Title ›` chevrons (never an accent fill, R6), then Previous, Play and Next.
 * - Screen: flush square stage between 1px rules, holding the take alone (`rail: false`), then the closing striped band.
 *   Shorter than the other worlds' at desktop widths (SHORT_SCREEN_HEIGHT), so a take reads larger in it (finding 7).
 * - Keycap hints along the foot, under the slab, as in the references.
 *
 * Index, inside the screen, is Heat's menu (finding 1): a column of rows, the current one (under the keys or the
 * pointer) in amber inside the brackets, Up and Down to move and Enter to open, with that row's part live beside it and
 * its line under it. The contract owns the list, its keys and what a row opens (HeatHome only draws).
 */
import { useEffect, useRef, useState } from "react";
import { Kbd } from "@/components/kbd";
import type { PlayObjectBody, PlayObjectBodyProps, PlayObjectHomeProps } from "../body";
import { COMPACT_BOX, COMPACT_SCREEN, SHORT_SCREEN_HEIGHT } from "../body";

/* Four corner marks, each two 2px bars, in currentColor (after systems/heat.tsx). */
const MARKS =
  "pointer-events-none absolute bg-no-repeat " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom] ";

/* The slab's outer brackets: 16px marks just outside the slab, in the ink. */
const FRAME = MARKS + "[background-size:16px_2px,2px_16px,16px_2px,2px_16px,16px_2px,2px_16px,16px_2px,2px_16px] -inset-2 text-fg";
/* The active item's brackets: 8px marks in amber (or ink in light, via --accent-text). */
const SELECTED = MARKS + "[background-size:8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px] inset-0 text-accent-text";
/* Focus on the strip (finding 5): no ring round the strip; the chosen cell's brackets close into a full box in the focus
   colour while the selector has the keys, so focus shows where the eye already is. Under forced colours the cell keeps
   its outline and the box stands 2px outside it, so focused and not still differ. */
const FOCUSED =
  "pointer-events-none absolute inset-0 hidden border-2 border-focus group-has-[[role=slider]:focus-visible]/strip:block " +
  "forced-colors:-inset-0.5 forced-colors:border-[CanvasText]";
/* The strip's cut edges (finding 13): where the strip has more to scroll, its edge fades out of the canvas, so a phone
   shows that the set goes on. Drawn over the scroller, never in it; gone under forced colours, where the gradient would
   not hold. */
const CUT = "pointer-events-none absolute inset-y-0 w-8 from-canvas to-transparent forced-colors:hidden";
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
  /* Which ends have more to scroll to. */
  const [more, setMore] = useState({ start: false, end: false });
  const measure = () => {
    const r = row.current;
    if (!r) return;
    const start = r.scrollLeft > 1;
    const end = r.scrollLeft + r.clientWidth < r.scrollWidth - 1;
    setMore((m) => (m.start === start && m.end === end ? m : { start, end }));
  };
  useEffect(() => {
    const r = row.current;
    const on = r?.querySelector<HTMLElement>("[data-chosen]");
    if (r && on && r.scrollWidth > r.clientWidth) r.scrollTo({ left: on.offsetLeft - (r.clientWidth - on.offsetWidth) / 2 });
    measure();
  }, [at]);
  useEffect(() => {
    const r = row.current;
    if (!r) return;
    const seen = new ResizeObserver(measure);
    seen.observe(r);
    return () => seen.disconnect();
  }, []);

  const itemBase =
    "relative inline-flex h-control-sm shrink-0 cursor-pointer items-center gap-1.5 px-3 text-small font-title whitespace-nowrap select-none " +
    "transition-colors duration-(--dur-instant) ease-litt pointer-coarse:h-control-md";

  return (
    <div className="group/strip relative flex min-w-0 flex-1">
      <div
        ref={row}
        onScroll={measure}
        data-heat-scroller=""
        className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto overscroll-x-contain py-1 [scrollbar-width:none]"
      >
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
          {at === null && <span aria-hidden="true" className={FOCUSED} />}
          {at === null && <span aria-hidden="true">‹</span>}
          <span>Index</span>
          {at === null && <span aria-hidden="true">›</span>}
        </button>
        <div
          {...selector}
          className="flex shrink-0 items-center gap-1 outline-none"
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
                {active && <span aria-hidden="true" className={FOCUSED} />}
                {active ? `‹ ${t.title} ›` : t.title}
              </span>
            );
          })}
        </div>
      </div>
      {more.start && <span aria-hidden="true" data-heat-cut="start" className={CUT + " left-0 bg-linear-to-r"} />}
      {more.end && <span aria-hidden="true" data-heat-cut="end" className={CUT + " right-0 bg-linear-to-l"} />}
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
          {/* Top to bottom, as the order read and the order tabbed: the striped band with the readout, the menu strip
              (selector, then Play), the screen, and the closing band. */}
          <HeaderBand readout={readout} at={at} n={takes.length} />
          <div data-heat-strip="" className="flex min-w-0 items-center gap-3 border-t border-line px-3 py-2">
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
          <div className="flex border-y border-line bg-canvas">{screen}</div>
          <div aria-hidden="true" className={"h-3 bg-surface-1 " + STRIPES} />
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

/* A row of Index's menu: a cell like the strip's, the full width of the column. */
const HOME_ROW =
  "group/row litt-target relative flex h-control-sm w-full min-w-0 cursor-pointer items-center gap-2 px-3 text-left text-small font-title outline-none select-none " +
  "transition-colors duration-(--dur-instant) ease-litt pointer-coarse:h-control-md";
/* A row's focus: its brackets close into a full box in the focus colour, as on the strip (finding 5). */
const ROW_FOCUSED =
  "pointer-events-none absolute inset-0 hidden border-2 border-focus group-focus-visible/row:block " +
  "forced-colors:-inset-0.5 forced-colors:border-[CanvasText]";

function HeatHome({ world, takes, current, list, row, everything, part, compact }: PlayObjectHomeProps) {
  const { children: words, ...link } = everything;
  return (
    <div
      className={
        "grid h-full min-h-0 overflow-auto overscroll-contain p-6 " +
        (compact ? "content-start gap-6" : "grid-cols-[minmax(0,16rem)_minmax(0,1fr)] gap-10")
      }
    >
      <div className="flex min-h-0 min-w-0 flex-col gap-3">
        <h2 className="px-3 text-caption text-fg-muted">{world.name}</h2>
        <nav {...list}>
          <ul className="grid gap-0.5">
            {takes.map((t, i) => {
              const on = i === current;
              return (
                <li key={t.id} className="grid min-w-0">
                  <button
                    {...row(i)}
                    className={
                      HOME_ROW +
                      " " +
                      (on
                        ? "bg-surface-1 text-accent-text forced-colors:outline-2 forced-colors:-outline-offset-2 forced-colors:outline-[Highlight]"
                        : "text-fg-muted")
                    }
                  >
                    <span className="min-w-0 truncate">{t.title}</span>
                    {on && <span aria-hidden="true" className={SELECTED} />}
                    <span aria-hidden="true" className={ROW_FOCUSED} />
                    {on && (
                      <span aria-hidden="true" className="ms-auto">
                        ›
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <a
          {...link}
          className="mt-auto self-start px-3 text-small text-fg underline decoration-line-strong underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {words}
        </a>
      </div>
      {!compact && (
        <div className="grid min-h-0 min-w-0 content-center justify-items-center gap-4">
          {part}
          <p className="max-w-[48ch] text-center text-small text-fg-muted">{takes[current]?.lede}</p>
        </div>
      )}
    </div>
  );
}

export const heat: PlayObjectBody = {
  name: "heat",
  shape: (compact) => (compact ? COMPACT_SCREEN : SHORT_SCREEN_HEIGHT + " w-full rounded-none"),
  rail: false,
  Body: HeatBody,
  Home: HeatHome,
};
