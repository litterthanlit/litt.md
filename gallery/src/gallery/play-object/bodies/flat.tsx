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
 *
 * Index, inside the screen, is a table of pills on the ground (plans/audits/flat.md, finding 2; flat-fixes.md, The front
 * door): the grey ground as a rounded table on the sheet, the set on it as white pills in two columns, each a part's
 * name, and the pill under the keys or the pointer in the ink (what is on). Beside the table, on the sheet, that pill's
 * part stands live at one and a half times its size (one and a quarter on a short screen) with its line under it,
 * springing up on Flat's expressive spring (0.28) each time the hand moves to another pill; nothing moves on load and,
 * under reduced motion, it simply appears.
 * Color arrives with the part: the table is grey, white and the ink, and holds no accent fill, so the view's one is the
 * part's own. On a phone the table is the whole screen and stands alone (`phonePart` "none"): a touch on a pill opens
 * its take, so a live part above would only push the set down. The contract owns the list, its keys, the pick and the
 * link (FlatHome only draws).
 */
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { LayoutGroup, motion } from "motion/react";
import { useMotionDial, useTransition, useTravel } from "@/motion";
import type { PartScale, PlayObjectBody, PlayObjectBodyProps, PlayObjectHomeProps } from "../body";
import { COMPACT_BOX, COMPACT_SCREEN, SCREEN_HEIGHT } from "../body";

/* A pill in the row: the words in the quiet ink, the ink under a hand or when chosen. */
const PILL =
  "relative isolate inline-flex h-control-sm shrink-0 cursor-pointer items-center rounded-control px-3.5 text-body whitespace-nowrap select-none " +
  "transition-colors duration-(--dur-instant) ease-litt pointer-coarse:h-control-md";
const QUIET = "text-fg-muted hover:bg-[color-mix(in_oklab,var(--block),transparent_40%)] hover:text-fg";

/* The chosen pill's focus ring, shown while the selector (in the same row, group/pills) has the keys. It reaches 4px past
   the pill (a 2px outline at a 2px offset), and the row clips (overflow-x-auto), so each Pills row is padded by exactly
   4px (p-1, or py-1 with the gutter) and pulled back by the same margin: change the ring and that padding together. */
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
          {/* -my-1 py-1: the 4px the focus ring needs inside the clipping row (FOCUSED). */}
          <Pills takes={takes} at={at} selector={selector} pick={pick} index={index} className="-mx-gutter -my-1 px-gutter py-1" />
        </div>
        {screen}
      </div>
    );
  }
  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      <div data-flat-controls="" className="flex min-w-0 flex-col gap-4 px-1">
        <Caption readout={readout} />
        <div className="flex min-w-0 items-center justify-between gap-6">
          {/* -m-1 p-1: the 4px the focus ring needs inside the clipping row (FOCUSED). */}
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

/* A cell of Index's table: the whole cell is the button, so cells touch and a pointer between two pills is on one
   (test:gaps); the pill is drawn inside it. */
const CELL =
  "group/cell litt-target relative grid w-full min-w-0 cursor-pointer p-1 text-left outline-none select-none";
/* The pill: white on the ground (paper), its name at body size. */
const TABLE_PILL =
  "flex h-control-sm min-w-0 items-center rounded-control px-4 text-body whitespace-nowrap " +
  "transition-colors duration-(--dur-instant) ease-litt pointer-coarse:h-control-md " +
  "group-focus-visible/cell:outline-2 group-focus-visible/cell:outline-offset-2 group-focus-visible/cell:outline-focus " +
  "forced-colors:group-focus-visible/cell:outline-[CanvasText]";
/* The current pill is in the ink, its words in paper. Under forced colors the fills go, so it keeps a Highlight edge
   inside it and its neighbours none. */
const PILL_ON = "bg-fg text-(--flat-paper) forced-colors:border-2 forced-colors:border-[Highlight]";
const PILL_OFF = "bg-(--flat-paper) text-fg";

/** The current pill's part, live, springing up as the hand reaches its pill. Still on the first draw. */
function LivePart({ id, still, children }: { id: string; still: boolean; children: ReactNode }) {
  const enter = useTransition("expressive");
  const travel = useTravel();
  return (
    <motion.div
      key={id}
      initial={still ? false : { scale: 0.9, y: travel }}
      animate={{ scale: 1, y: 0 }}
      transition={enter}
      className="grid w-full min-w-0 origin-bottom justify-items-center"
    >
      {children}
    </motion.div>
  );
}

function FlatHome({ takes, current, list, row, everything, part, compact }: PlayObjectHomeProps) {
  const { children: words, ...link } = everything;
  const { reduced } = useMotionDial();
  /* Nothing moves on load: the first part (and the one shown when Index is reached from a take) is simply there. */
  const drawn = useRef(false);
  useEffect(() => void (drawn.current = true), []);
  /* The part reads as the main thing at one and a half times its size; where the screen is short (a laptop's 30rem) or
     narrow (a tablet's), at one and a quarter, so the tallest (Card) and the widest still stand whole on it, and at
     real size where the screen is narrower still. */
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<PartScale>(1.5);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth < 800 ? 1 : el.clientHeight < 600 || el.clientWidth < 1000 ? 1.25 : 1.5));
    ro.observe(el);
    return () => ro.disconnect();
  }, [compact]);
  const take = takes[current];
  const half = Math.ceil(takes.length / 2);
  const table = (
    <div className={"grid min-w-0 content-start gap-3 p-3 " + (compact ? "" : "self-center rounded-surface bg-(--flat-ground)")}>
      <nav {...list}>
        {/* Down runs down a column, then on to the next, as the keys move. */}
        <ul className="grid grid-flow-col grid-cols-2" style={{ gridTemplateRows: `repeat(${half}, auto)` }}>
          {takes.map((t, i) => (
            <li key={t.id} className="grid min-w-0">
              <button {...row(i)} className={CELL}>
                <span className={TABLE_PILL + " " + (i === current ? PILL_ON : PILL_OFF)}>
                  <span className="min-w-0 truncate">{t.title}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <a
        {...link}
        className="litt-target relative justify-self-start rounded-control px-4 py-1 text-small text-fg underline decoration-line-strong underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {words}
      </a>
    </div>
  );
  if (compact) return <div className="h-full min-h-0 overflow-auto overscroll-contain bg-(--flat-ground)">{table}</div>;
  return (
    <div ref={box} className="grid h-full min-h-0 grid-cols-[minmax(0,22rem)_minmax(0,1fr)] gap-6 overflow-auto overscroll-contain p-6">
      {table}
      <div className="grid min-h-0 min-w-0 content-center justify-items-center gap-6 py-4">
        {take && (
          <LivePart id={take.id} still={reduced || !drawn.current}>
            {part({ scale })}
          </LivePart>
        )}
        <p className="max-w-[44ch] text-center text-body text-fg-muted">{take?.lede}</p>
      </div>
    </div>
  );
}

export const flat: PlayObjectBody = {
  name: "flat",
  shape: (compact) => "flat-screen " + (compact ? COMPACT_SCREEN : SCREEN_HEIGHT + " w-full rounded-[var(--object-radius)]"),
  rail: false,
  Body: FlatBody,
  Home: FlatHome,
  phonePart: "none",
};
