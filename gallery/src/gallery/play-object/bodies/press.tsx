/**
 * Press's object, a bench instrument (plans/018, Press's row; taste/litt-principles.md, Press): a warm stone plate that
 * stands on the page and casts, lit along its top edge, holding the screen as a window cut into the casing.
 *
 * - The plate (`bg-surface-1`, lit top edge `--highlight` + `--plate-lift`, `rounded-surface`) holds the screen inside
 *   a subtle cut bay (`bg-tray`, `--tray-shade`) at concentric radius, with no rail inside the screen (`rail: false`).
 *
 * Top to bottom, in the order read and the order tabbed, at every width (plans/audits/press.md, finding 6), the deck
 * sits above the screen (`data-press-deck`, which `test:playground` holds above it):
 * - Readout: a value, so it is set into the plate as a cut (`bg-cut`, `--cut-shade` inside a `--line` hairline), not
 *   raised: in Press raised means press, and the readout does nothing when pressed (finding 7). It carries the tabular
 *   count and the take's title.
 * - Selector: a recessed tray (`bg-tray`, `--tray-shade`) holding Index and the 12 takes; the current take stands up as
 *   a raised block (`bg-block`, `--block-lift`), and a press or a drag along the tray picks the take under the hand.
 *   Where the tray has the room (desktop widths) each cell carries its part's name, so a hand can aim at a part; where
 *   it has not, the cells carry their numbers, as the readout counts (finding 11). Index has a 44px touch target
 *   (finding 12). Then the transport: Previous, Play (sinks into the tray while running) and Next, as raised blocks.
 * - Then the screen.
 * - No accent fill in the body (R6): the take on the screen holds the view's one primary fill.
 */
import { useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { useHand } from "@/motion/hand";
import type { PartScale, PlayObjectBody, PlayObjectBodyProps, PlayObjectHomeProps } from "../body";
import { COMPACT_BOX, COMPACT_SCREEN, SCREEN_HEIGHT } from "../body";

const keyBase =
  "litt-target relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-control bg-block text-fg " +
  "shadow-[var(--highlight),var(--block-lift)] transition-[background-color,box-shadow,transform] duration-(--dur-instant) ease-litt " +
  "hover:bg-(--block-hover) active:shadow-(--block-press) active:[transform:translateY(var(--press-depth))] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border";

const keyLatched =
  "aria-pressed:bg-tray aria-pressed:shadow-(--tray-shade) aria-pressed:[transform:translateY(var(--press-depth))] " +
  "forced-colors:aria-pressed:border-[Highlight]";

/** Scrubbing the selector by its cells: a press picks the cell under it and a drag picks every cell it passes. The
    cells are as wide as their names, so the take under the hand is found by the cells' own edges, not by dividing the
    tray evenly (scrub.ts does that for equal cells). */
function useCellScrub(pick: (i: number) => void) {
  const hand = useHand();
  return (e: PointerEvent<HTMLElement>) => {
    const cells = Array.from(e.currentTarget.children, (c) => c.getBoundingClientRect());
    const under = (x: number) => {
      let i = 0;
      cells.forEach((r, k) => {
        if (x >= r.left) i = k;
      });
      return i;
    };
    const x0 = e.clientX;
    hand.begin(e, {
      axis: "x",
      slop: 2,
      onMove: (p) => pick(under(p.x)),
      onRelease: (r) => {
        if (!r.cancelled && !r.claimed) pick(under(x0));
      },
    });
  };
}

function Readout({ readout, compact = false, className = "" }: Pick<PlayObjectBodyProps, "readout"> & { compact?: boolean; className?: string }) {
  return (
    <div
      {...readout.props}
      data-part="cut"
      className={
        "flex min-w-0 items-baseline gap-2.5 rounded-control bg-cut text-fg shadow-[inset_0_0_0_1px_var(--line),var(--cut-shade)] forced-colors:border " +
        (compact ? "px-2.5 py-1.5" : "px-3.5 py-2") +
        " " +
        className
      }
    >
      <span className="shrink-0 font-mono text-caption tabular-nums text-fg-muted">{readout.count}</span>{" "}
      <span className="min-w-0 truncate text-small font-title text-fg">{readout.title}</span>
    </div>
  );
}

function TraySelector({ takes, at, selector, pick, index, compact = false }: Pick<PlayObjectBodyProps, "takes" | "at" | "selector" | "pick" | "index"> & { compact?: boolean }) {
  const scrub = useCellScrub(pick);
  return (
    <div className="@container flex min-w-0 flex-1 items-center gap-1 rounded-control bg-tray p-0.5 shadow-(--tray-shade) forced-colors:border">
      <button
        {...index}
        aria-label={undefined}
        title="Index"
        className={
          "litt-target relative inline-flex h-7 shrink-0 cursor-pointer items-center justify-center rounded-[calc(var(--radius-control)-2px)] px-2 text-caption font-title select-none " +
          "transition-[background-color,color,box-shadow] duration-(--dur-instant) ease-litt " +
          (at === null
            ? "bg-block text-fg shadow-[var(--highlight),var(--block-lift)] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
            : "text-fg-muted hover:text-fg")
        }
      >
        Index
      </button>
      <div
        {...selector}
        onPointerDown={scrub}
        className={
          "grid min-w-0 flex-1 cursor-ew-resize touch-pan-y grid-flow-col auto-cols-fr items-stretch gap-0.5 rounded-[calc(var(--radius-control)-2px)] select-none " +
          (compact ? "" : "@min-[57rem]:auto-cols-auto ") +
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
        }
      >
        {takes.map((t, i) => {
          const active = i === at;
          const number = String(i + 1).padStart(2, "0");
          return (
            <span
              key={t.id}
              aria-hidden="true"
              title={t.title}
              onClick={() => pick(i)}
              className={
                "grid h-7 min-w-0 place-items-center rounded-[calc(var(--radius-control)-2px)] text-caption whitespace-nowrap " +
                "transition-[background-color,color,box-shadow] duration-(--dur-instant) ease-litt " +
                (active
                  ? "bg-block font-title text-fg shadow-[var(--highlight),var(--block-lift)] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
                  : "text-fg-subtle hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg")
              }
            >
              {compact ? (
                <span className="font-mono tabular-nums">{number}</span>
              ) : (
                <>
                  <span className="font-mono tabular-nums @min-[57rem]:hidden">{number}</span>
                  <span className="hidden px-2 @min-[57rem]:inline">{t.title}</span>
                </>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function PlayBlock({ play, className = "" }: { play: PlayObjectBodyProps["play"]; className?: string }) {
  const on = play["aria-pressed"];
  return (
    <button {...play} className={keyBase + " " + keyLatched + " gap-1.5 text-small font-title " + className}>
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 fill-current">
        {on ? <path d="M4 3h3v10H4zM9 3h3v10H9z" /> : <path d="M5 3v10l8-5z" />}
      </svg>
    </button>
  );
}

function PressBody({ takes, at, selector, pick, step, index, play, readout, screen, compact }: PlayObjectBodyProps) {
  if (compact) {
    return (
      <div className={COMPACT_BOX}>
        <div className="grid shrink-0 gap-2 border-b border-line bg-surface-1 px-gutter py-2.5">
          <Readout readout={readout} compact />
          <div className="flex min-w-0 items-center gap-2">
            <TraySelector takes={takes} at={at} selector={selector} pick={pick} index={index} compact />
            <PlayBlock play={play} className="size-9" />
          </div>
        </div>
        {screen}
      </div>
    );
  }
  return (
    <div className="flex w-full min-w-0 flex-col gap-3 rounded-surface bg-surface-1 p-3 shadow-[var(--highlight),var(--plate-lift)] forced-colors:border">
      {/* Top to bottom, as the order read and the order tabbed: the readout, the selector, the transport, the screen. */}
      <div data-press-deck="" className="grid min-w-0 gap-2">
        <Readout readout={readout} />
        <div className="flex min-w-0 items-center gap-3">
          <TraySelector takes={takes} at={at} selector={selector} pick={pick} index={index} />
          <div className="flex shrink-0 items-center gap-1.5">
            <button {...step(-1)} className={keyBase + " size-control-sm"}>
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3 fill-current">
                <path d="M10.5 3.5 5 8l5.5 4.5z" />
              </svg>
            </button>
            <PlayBlock play={play} className="size-control-sm" />
            <button {...step(1)} className={keyBase + " size-control-sm"}>
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3 fill-current">
                <path d="M5.5 3.5 11 8l-5.5 4.5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className="flex rounded-control bg-tray p-0.5 shadow-(--tray-shade) forced-colors:border">
        {screen}
      </div>
    </div>
  );
}

/* A row of Index's tray: the full width of the tray's floor, 2px in from its wall, so its corners are the tray's less
   2px (concentric). At rest it lies on the floor in the muted ink; current, it is raised as a block (lit top edge and
   its cast), as the selected cell of every Press tray is; pressed, it sinks by the press depth. No outline. */
const HOME_ROW =
  "litt-target relative flex h-control-sm w-full min-w-0 cursor-pointer items-center gap-3 rounded-[calc(var(--radius-control)-2px)] px-3 text-left text-small select-none " +
  "transition-[background-color,color,box-shadow,transform] duration-(--dur-instant) ease-litt motion-reduce:transition-none " +
  "active:shadow-(--block-press) active:[transform:translateY(var(--press-depth))] " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus pointer-coarse:h-control-md forced-colors:border";
const ROW_AT_REST = "bg-transparent font-normal text-fg-muted forced-colors:border-transparent";
const ROW_RAISED =
  "bg-block font-title text-fg shadow-[var(--highlight),var(--block-lift)] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]";

/* How large the live part stands: the largest size the kit offers at which the part and its line still fit the space
   beside the tray, read from that space and the part itself, never the window. Each part starts at the largest and
   steps down before it paints (a layout effect), so a table stands smaller than a switch and nothing is cut off. */
const SCALES: PartScale[] = [1.5, 1.25, 1, 0.75];
function useStageScale(take: string, compact: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ take: string; scale: PartScale }>({ take, scale: SCALES[0] });
  const scale = fit.take === take ? fit.scale : SCALES[0];
  useLayoutEffect(() => {
    const stage = ref.current;
    if (!stage) return;
    const over = () => stage.scrollHeight > stage.clientHeight + 1 || stage.scrollWidth > stage.clientWidth + 1;
    const smaller = () => {
      if (!over()) return;
      const next = SCALES[SCALES.indexOf(scale) + 1];
      if (next) setFit({ take, scale: next });
    };
    smaller();
    /* A part that loads late, or a stage that changes size, is fitted again: from the top when the stage resizes. */
    let size = `${stage.clientWidth}x${stage.clientHeight}`;
    const seen = new ResizeObserver(() => {
      const now = `${stage.clientWidth}x${stage.clientHeight}`;
      if (now !== size) {
        size = now;
        setFit({ take, scale: SCALES[0] });
      } else smaller();
    });
    seen.observe(stage);
    const live = stage.querySelector("[data-play-live]");
    if (live) seen.observe(live);
    return () => seen.disconnect();
  }, [take, scale, compact]);
  return [ref, scale] as const;
}

/**
 * Index, Press's way (plans/audits/press.md, finding 4): the set as rows seated in one recessed tray, the current row
 * raised out of it as a block, and that part standing live on the screen's floor beside the tray, with its line under
 * it. The contract owns the list, its keys, the pick and the link; this only draws. On a phone the tray stands alone
 * (`phonePart` "none"): a touch on a row opens its take at once, so a live part above would only push the list down.
 */
function PressHome({ takes, current, list, row, everything, part, compact }: PlayObjectHomeProps) {
  const { children: words, ...link } = everything;
  const cued = takes[current];
  const [stage, scale] = useStageScale(cued?.id ?? "", compact);
  return (
    <div
      className={
        "grid h-full min-h-0 overflow-auto overscroll-contain " +
        (compact ? "content-start gap-4 p-4" : "grid-cols-[minmax(0,17rem)_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] gap-8 p-6 lg:gap-12")
      }
    >
      {/* The tray and the link fit the screen's floor (30rem) with nothing over them: the readout and the top row already
          name the world. */}
      <div className="flex min-h-0 min-w-0 flex-col gap-3">
        <nav {...list} data-part="tray" className="rounded-control bg-tray p-0.5 shadow-(--tray-shade) forced-colors:border">
          <ul className="grid">
            {takes.map((t, i) => {
              const on = i === current;
              return (
                <li key={t.id} className="grid min-w-0">
                  <button {...row(i)} data-part={on ? "block" : "tray"} className={HOME_ROW + " " + (on ? ROW_RAISED : ROW_AT_REST)}>
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    <span aria-hidden="true" className={"shrink-0 font-mono text-caption tabular-nums " + (on ? "text-fg-muted forced-colors:text-[HighlightText]" : "text-fg-subtle")}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <a
          {...link}
          className="litt-target relative mt-auto self-start rounded-control px-1 text-small text-fg underline decoration-line-strong underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {words}
        </a>
      </div>
      {!compact && (
        <div ref={stage} className="grid min-h-0 min-w-0 content-center justify-items-center gap-6">
          {part({ scale })}
          <div className="grid max-w-[52ch] justify-items-center gap-1 text-center">
            <p className="text-body font-title text-fg">{cued?.title}</p>
            <p className="text-small text-fg-muted">{cued?.lede}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export const press: PlayObjectBody = {
  name: "press",
  shape: (compact) => (compact ? COMPACT_SCREEN : SCREEN_HEIGHT + " w-full rounded-[calc(var(--radius-control)-2px)]"),
  rail: false,
  Body: PressBody,
  Home: PressHome,
  phonePart: "none",
};
