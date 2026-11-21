/**
 * Flat's object, a page on the grey ground (plans/018, Flat's row; plans/024, Flat, phase 4 and leftovers), drawn only
 * from Flat's materials (taste/litt-principles.md, Flat's materials): the grey ground, white paper with no edge, pills
 * and circles, the ink. No body: grey is the object, after litt.design's work slider, and nothing is cast or outlined.
 *
 * - The screen is a sheet (`paper`) on the ground, as a wall tile is under Flat (.flat-screen in app.css: paper in light,
 *   the ground lifted a step in dark), at the object's radius (--object-radius, the surface's outside Device). It is
 *   filled, not framed: no ring of a second grey round it, since Flat outlines nothing (plans/024, Flat, leftovers). It
 *   holds the take alone: no rail (body.rail is false). The set is on Home, behind Index and on the pills.
 * - Above the screen, the caption (`lettering`), in the ink: the take's place as the one figure that stands up (call 8),
 *   over the size of the set, and the take's name.
 * - Under the caption, the selector: a row of pills, Index and then the set. On the ground, chosen is white (the bubble
 *   on the ground), so the current pill is paper with its name in the ink, and the paper travels from pill to pill on
 *   the expressive spring, Flat's 0.28 bounce: the view's one moment. Under reduced motion it lands at once. The rest
 *   are words in the quiet ink, with no pill drawn until a hand is on one. Each is a `pill`, the travelling paper `paper`,
 *   and the words are body size, never under it.
 * - Focus shows on the chosen pill alone (plans/audits/flat.md, finding 7): while the selector has the keys, the paper
 *   under the chosen pill takes the focus ring at its own radius, wherever it is, Index included. Nothing rings the row,
 *   since in Flat an outline round a group reads as off. Under forced colors the ring stands in CanvasText beside the
 *   chosen pill's Highlight edge, so focused and not still differ.
 * - Play is a `circle`, a key with one symbol, white on the ground.
 * - No fill in the ink (it is Flat's accent): the take on the screen holds the view's one primary action (R6).
 * - The caption, the selector and Play sit above the screen at every width, in the DOM and on screen, so focus runs as
 *   the eye reads: the top row, the selector, Play, then the screen (finding 6, as Heat's body does).
 */
import { useEffect, useId, useRef } from "react";
import { LayoutGroup, motion } from "motion/react";
import { useTransition } from "@/motion";
import type { PlayObjectBody, PlayObjectBodyProps } from "../body";
import { COMPACT_BOX, COMPACT_SCREEN, SCREEN_HEIGHT } from "../body";

/* A pill in the row: the words in the quiet ink, the ink under a hand or when chosen. */
const PILL =
  "relative isolate inline-flex h-control-sm shrink-0 cursor-pointer items-center rounded-control px-3.5 text-body whitespace-nowrap select-none " +
  "transition-colors duration-(--dur-instant) ease-litt pointer-coarse:h-control-md";
const QUIET = "text-fg-muted hover:bg-[color-mix(in_oklab,var(--block),transparent_40%)] hover:text-fg";

/* The chosen pill's focus ring, shown while the selector (in the same row, group/pills) has the keys. */
const FOCUSED =
  "group-has-[[role=slider]:focus-visible]/pills:outline-2 group-has-[[role=slider]:focus-visible]/pills:outline-offset-2 " +
  "group-has-[[role=slider]:focus-visible]/pills:outline-focus forced-colors:group-has-[[role=slider]:focus-visible]/pills:outline-[CanvasText]";

/** The paper under the current pill. One per row, so it travels between pills on the expressive spring. */
function Chosen({ id }: { id: string }) {
  const enter = useTransition("expressive");
  return (
    <motion.span
      layoutId={id}
      transition={enter}
      aria-hidden="true"
      data-part="paper"
      className={"absolute inset-0 -z-10 rounded-control bg-block forced-colors:border forced-colors:border-[Highlight] " + FOCUSED}
    />
  );
}

function Pills({ takes, at, selector, pick, index, className }: Pick<PlayObjectBodyProps, "takes" | "at" | "selector" | "pick" | "index"> & { className: string }) {
  const id = useId();
  const row = useRef<HTMLDivElement>(null);
  /* Where the row scrolls (a phone), the current pill stays in view. */
  useEffect(() => {
    const r = row.current;
    const on = r?.querySelector<HTMLElement>("[data-chosen]");
    if (!r || !on || r.scrollWidth <= r.clientWidth) return;
    r.scrollTo({ left: on.offsetLeft - (r.clientWidth - on.offsetWidth) / 2 });
  }, [at]);
  return (
    <LayoutGroup id={id}>
      <div ref={row} className={"group/pills flex min-w-0 items-center gap-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] " + className}>
        {/* Index, the first place on the selector: its key, out of the tab order like the take pills. */}
        <button {...index} aria-label={undefined} data-part="pill" data-chosen={at === null ? "" : undefined} className={PILL + " " + (at === null ? "text-fg" : QUIET)}>
          {at === null && <Chosen id={id} />}
          Index
        </button>
        <div {...selector} className="flex shrink-0 items-center gap-1 outline-none">
          {takes.map((t, i) => (
            <span key={t.id} aria-hidden="true" data-part="pill" data-chosen={i === at ? "" : undefined} onClick={() => pick(i)} className={PILL + " " + (i === at ? "text-fg" : QUIET)}>
              {i === at && <Chosen id={id} />}
              {t.title}
            </span>
          ))}
        </div>
      </div>
    </LayoutGroup>
  );
}

function Caption({ readout, compact = false, className = "" }: Pick<PlayObjectBodyProps, "readout"> & { compact?: boolean; className?: string }) {
  const [now, of] = readout.count.split(" / ");
  return (
    <p {...readout.props} data-part="lettering" className={"flex min-w-0 items-baseline gap-4 text-fg " + className}>
      <span className="shrink-0 tabular-nums">
        <span className={compact ? "text-h3" : "text-figure"}>{now}</span> <span className="text-small text-fg-muted">/ {of}</span>
      </span>{" "}
      <span className={"min-w-0 truncate " + (compact ? "text-body" : "text-h3")}>{readout.title}</span>
    </p>
  );
}

function PlayCircle({ play, className }: { play: PlayObjectBodyProps["play"]; className: string }) {
  const on = play["aria-pressed"];
  return (
    <button
      {...play}
      data-part="circle"
      className={
        "grid shrink-0 cursor-pointer place-items-center rounded-pill bg-block text-fg transition-[background-color,scale] duration-(--dur-instant) ease-litt " +
        "hover:bg-(--block-hover) active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
        "forced-colors:border forced-colors:aria-pressed:border-[Highlight] " +
        className
      }
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 fill-current">
        {on ? <path d="M4.5 3h2.5v10H4.5zM9 3h2.5v10H9z" /> : <path d="M5.5 2.8v10.4L13.5 8z" />}
      </svg>
    </button>
  );
}

function FlatBody({ takes, at, selector, pick, index, play, readout, screen, compact }: PlayObjectBodyProps) {
  if (compact) {
    return (
      <div className={COMPACT_BOX}>
        <div className="grid shrink-0 gap-2 px-gutter pt-1 pb-3">
          <div className="flex items-center gap-3">
            <Caption readout={readout} compact className="flex-1" />
            <PlayCircle play={play} className="size-11" />
          </div>
          <Pills takes={takes} at={at} selector={selector} pick={pick} index={index} className="-mx-gutter -my-1 px-gutter py-1" />
        </div>
        {screen}
      </div>
    );
  }
  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      <div className="flex min-w-0 flex-col gap-4 px-1">
        <Caption readout={readout} />
        <div className="flex min-w-0 items-center justify-between gap-6">
          <Pills takes={takes} at={at} selector={selector} pick={pick} index={index} className="-m-1 p-1" />
          <PlayCircle play={play} className="size-control-md" />
        </div>
      </div>
      <div data-part="paper" className="flex rounded-[var(--object-radius)] forced-colors:border">
        {screen}
      </div>
    </div>
  );
}

export const flat: PlayObjectBody = {
  name: "flat",
  shape: (compact) => "flat-screen " + (compact ? COMPACT_SCREEN : SCREEN_HEIGHT + " w-full rounded-[var(--object-radius)]"),
  rail: false,
  Body: FlatBody,
};
