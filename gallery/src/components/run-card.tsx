/**
 * Run card: one agent run, such as "Creating your world", as a card that says what it is making, how far it has got
 * in words and in a ring, and which step it is on, and that folds into a block you press to open it again
 * (components.md, "Run card"). The steps are a Plan's; the card is the frame a run gets when it is the thing on
 * screen, and the block is the same run put aside while you keep working.
 *
 * - Anatomy, open: a flat card in the flow (litt-raised at the surface radius, padded 16px; never glass, R3) that fills
 *   its container. A header row: the title (body, the title weight, --fg) over the words (small, --fg-muted), then the
 *   ring, the figure (body, --fg, tabular), the caller's `actions` and Hide (a ghost button with a chevron, 44px on a
 *   finger). On a narrow card (a container query) the header is two rows: the title and the buttons, then the ring,
 *   the words and the figure. Under it "Activity" (caption, --fg-subtle) over the steps, a bare Plan (its marks, tones
 *   and hidden words; the card says the count and keeps the live region), and the `preview` beside them once the card
 *   is wide enough, under them when it is not.
 * - Anatomy, folded: the same box as the raised block (R3: --block, --block-lift, the control radius, md height, the
 *   width of its words and never wider than its container): a button with aria-expanded="false" holding the ring,
 *   the title over the words (the card's sizes on 16px lines, the title cut at the end), the figure and Expand with a
 *   chevron. On a phone the word Expand is for assistive tech only, so the title keeps the room; the chevron stays.
 *   The whole block is the button, so a finger anywhere on it opens the card.
 * - Words (R5): from the steps, never a dot or a color alone. A running step: "Step 2 of 3". A failed step: "Step 2
 *   failed". Every step done or skipped, one at least done: "Done". Nothing running: "Waiting". Never "2/3", never
 *   trailing dots.
 * - The ring is the Gauge's ticks, closed: 32 two-pixel ticks round a 32px ring, from the top and clockwise, lit in
 *   --fg up to the figure and --fg at 12% after it. The ticks are short (2.5px) on a wide radius, a band of marks, so
 *   the ring never reads as a loading spinner's spokes. Progress is one quantity, so it takes no hue (R7); a failed
 *   run's lit ticks are --danger, a status mark, as the Plan's x is. At least one tick is lit above zero, and the ring
 *   is full only at 100%. Decorative: the words and the figure say the same.
 * - The figure is `progress` (0 to 1) as a whole percent, rounded down so it never says more than the run has done,
 *   else the steps done over all the steps; a finished run is 100%. It rolls (Rolling number) when it changes, and
 *   its box is as wide as "100%", so nothing beside it shifts.
 * - Hand: the moment is a press, on Hide or on the block. The material swaps at once, as a press does, and the parts
 *   keep their places by transform: the ring travels between its two seats (a shared layoutId on a text-free part, as
 *   the Segmented's block does), the title, the words and the figure glide by layout="position" (text never
 *   stretches), all on the responsive tier. The box itself glides by its corner only (layout="position": its size
 *   snaps, its radius and shadow are never scaled), so in a parent that centers it the parts stay inside it. Folding,
 *   the steps leave on the exit token first, then the box becomes the block; opening, the card is back at once and
 *   the steps come in with a quarter of the travel token. The height snaps, as every disclosure's does. Press again
 *   mid-way and it turns round.
 * - Fun mode (motion/fun.tsx, a trial, off unless a <FunMode> is on): the ring travels on fun mode's swap spring and
 *   settles a hair past its seat (the glide spring, tuned for a segment's short hop, carries a ring crossing a card
 *   about 20px past and out of the block), and its ticks sweep to each new figure on the grow spring while the figure
 *   counts with them, as the Gauge's do, never past the figure. At rest it is the Calm card exactly; reduced motion
 *   turns it off.
 * - Keys and assistive tech: a group named by the title. Hide and the block are buttons with aria-expanded; Hide is
 *   named "Hide Creating your world", the block by what it shows ("Creating your world Step 1 of 3 12% Expand").
 *   Enter or Space folds and opens it. When the button you pressed had focus, focus moves to the one that replaces
 *   it (Tool approval's pattern), so a keyboard never falls back to the page. The steps are a list named "Activity".
 *   One polite status, outside the card and the block, says "Step 2 of 3: Populating your world", "Step 2 failed:
 *   Populating your world" and "Done: Creating your world" when they change, open or folded, and never on the first
 *   render.
 * - Motion: only transform and opacity move. The ticks and the figure change at once in Calm; colors fade on the
 *   instant tier; the block sinks --press-depth and its cast tightens (--block-press) at once while pressed.
 * - Touch: the block is 44px tall and Hide grows to 44px on a finger (useDevice). A pressed block takes its hover
 *   fill, so a press still shows under reduced motion.
 * - Disabled: nothing to disable. The run is the agent's; Hide and Expand always work.
 * - Forced colors: the block keeps a border, the lit ticks take CanvasText and the rest GrayText.
 */
import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion, useMotionValueEvent } from "motion/react";
import { Button } from "@/components/button";
import { ChevronDownIcon, ChevronUpIcon } from "@/components/icons";
import { Plan, type PlanStep } from "@/components/plan";
import { RollingNumber } from "@/components/rolling-number";
import { countText, useDevice, useExit, useFun, useFunValue, useTransition, useTravel } from "@/motion";

export type RunCardProps = {
  /** What the run is making, in a few words, sentence case and no trailing dots: "Creating your world". It titles the card and names its buttons. */
  title: string;
  /** The run's steps in order, as Plan takes them: a label, a status and an id, so a step keeps its place when the run changes. Update a status in place as the agent works. */
  steps: PlanStep[];
  /** How far the whole run has got, from 0 to 1, when the agent knows more than the steps say (0.12 is 12% into the first of three). Without it, the steps done over all the steps. */
  progress?: number;
  /** What the run is making so far, such as an image or a live preview. It sits beside the steps while the card is open, under them when the card is narrow, and is gone while folded. */
  preview?: ReactNode;
  /** Controls at the end of the header while the card is open, before Hide, such as a ghost sm Stop or Retry button. */
  actions?: ReactNode;
  /** Whether the card is open, when you control it. Pair it with onOpenChange. */
  open?: boolean;
  /** Whether it starts open when you do not control it. */
  defaultOpen?: boolean;
  /** Called with the next state when Hide or the folded block is pressed. */
  onOpenChange?: (open: boolean) => void;
  /** Extra classes for the box, open or folded, such as a max width. The open card fills its container; the folded block is the width of its words. */
  className?: string;
};

/* ----------------------------------------------------------------- what the steps say */

type Reading = {
  /** "Step 2 of 3", "Step 2 failed", "Done" or "Waiting". */
  words: string;
  /** The step the words are about: the failed one, else the running one, else none. */
  current: PlanStep | null;
  /** 0 to 1: the progress, else the steps done over all the steps; 1 once the run is done. */
  share: number;
  failed: boolean;
};

/** The figure's words, as Rolling number writes them. */
const PERCENT = new Intl.NumberFormat("en-GB", { style: "percent" });

const clamp01 = (n: number) => (n > 0 ? Math.min(1, n) : 0);

/** What the steps say about the run. One reading, so the card, the block and the live region never disagree. */
function readRun(steps: readonly PlanStep[], progress: number | undefined): Reading {
  const total = steps.length;
  const done = steps.filter((s) => s.status === "done").length;
  const finished = done > 0 && steps.every((s) => s.status === "done" || s.status === "skipped");
  const share = finished ? 1 : clamp01(progress ?? (total ? done / total : 0));
  const failedAt = steps.findIndex((s) => s.status === "failed");
  if (failedAt >= 0) return { words: `Step ${failedAt + 1} failed`, current: steps[failedAt], share, failed: true };
  const runningAt = steps.findIndex((s) => s.status === "running");
  if (runningAt >= 0) return { words: `Step ${runningAt + 1} of ${total}`, current: steps[runningAt], share, failed: false };
  return { words: finished ? "Done" : "Waiting", current: null, share, failed: false };
}

/* ----------------------------------------------------------------- the ring */

/* Short ticks on a wide radius, so the ring reads as a band of marks and never as a loading spinner's spokes. */
const TICKS = 32;
const RING = 32; // px, the ring's box
const OUTER = 15; // a tick runs from INNER to OUTER from the center, so its square end stays inside the box
const INNER = 12.5;

const round = (n: number) => Math.round(n * 100) / 100;
/** Tick i stands for the i-th of TICKS equal parts of the run, centered in it, from the top and clockwise. */
const TICK_PATHS = Array.from({ length: TICKS }, (_, i) => {
  const angle = (2 * Math.PI * (i + 0.5)) / TICKS;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const c = RING / 2;
  return `M${round(c + INNER * sin)} ${round(c - INNER * cos)}L${round(c + OUTER * sin)} ${round(c - OUTER * cos)}`;
});
const ticks = (from: number, to: number) => TICK_PATHS.slice(from, to).join("");

/** How many ticks a share lights: none at zero, at least one above it, all of them only when the run is done. */
const litFor = (share: number) => (share <= 0 ? 0 : share >= 1 ? TICKS : Math.min(TICKS - 1, Math.max(1, Math.round(share * TICKS))));

const REST = "stroke-[color-mix(in_oklab,var(--fg)_12%,transparent)] forced-colors:stroke-[GrayText]";
const LIT = "stroke-fg forced-colors:stroke-[CanvasText]";
const LIT_FAILED = "stroke-danger forced-colors:stroke-[CanvasText]";
const TICK_FADE = "transition-colors duration-(--dur-instant) ease-litt";

/** The ring: `lit` ticks in --fg (--danger when the run failed) and the rest at 12%. Decorative. */
function Ring({ lit, failed }: { lit: number; failed: boolean }) {
  return (
    <svg width={RING} height={RING} viewBox={`0 0 ${RING} ${RING}`} aria-hidden="true" focusable="false" className="block shrink-0">
      <g fill="none" strokeWidth={2} strokeLinecap="butt">
        {lit < TICKS && <path d={ticks(lit, TICKS)} className={REST} />}
        {lit > 0 && <path d={ticks(0, lit)} className={(failed ? LIT_FAILED : LIT) + " " + TICK_FADE} />}
      </g>
    </svg>
  );
}

/* ----------------------------------------------------------------- the box's two materials */

/** Folded: the raised block, a button the width of its words and never wider than its container, that sinks when pressed (Button's secondary). */
const BLOCK =
  "group/block flex h-control-md w-fit max-w-full cursor-pointer items-center gap-3 rounded-control bg-block pr-control-pad-sm pl-2 text-left " +
  "shadow-(--block-lift) select-none [-webkit-tap-highlight-color:transparent] forced-colors:border " +
  "transition-[background-color,translate] duration-(--dur-instant) ease-litt " +
  "hover:bg-[color-mix(in_oklab,var(--block),var(--fg)_4%)] pointer-coarse:active:bg-[color-mix(in_oklab,var(--block),var(--fg)_4%)] " +
  "active:translate-y-(--press-depth) active:shadow-(--block-press) " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/* ----------------------------------------------------------------- RunCard */

/** An agent run as a card with a ring, its words and its steps, and Hide; folded, the same run as a raised block with Expand. */
export function RunCard({
  title,
  steps,
  progress,
  preview,
  actions,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  className = "",
}: RunCardProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const bodyId = `${id}-body`;
  const { coarse } = useDevice();

  const [inner, setInner] = useState(defaultOpen);
  const open = openProp ?? inner;

  /* What is on screen. Opening shows the card at once; folding keeps the card until its steps have left, then shows
     the block. State that follows a prop, set while rendering (React's pattern), so the card is back in the same render. */
  const [shown, setShown] = useState<"card" | "block">(open ? "card" : "block");
  if (open && shown === "block") setShown("card");
  const openNow = useRef(open);
  openNow.current = open;

  const run = readRun(steps, progress);
  const percent = Math.floor(run.share * 100 + 1e-9);
  const lit = litFor(run.share);

  /* Motion: the parts glide on the responsive tier; in fun mode the ring travels on the swap spring (see the header). */
  const fun = useFun();
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const travel = useTravel();
  const ringMove = fun ? fun.swap : enter;

  /* Fun mode: the ticks sweep and the figure counts (the Gauge's recipe). Held here, not in the ring, so the sweep
     survives the swap between card and block and never replays its arrival on a fold. */
  const sweep = useFunValue(lit, { count: percent });
  const [swept, setSwept] = useState(lit);
  useMotionValueEvent(sweep.value, "change", (t) => setSwept(Math.max(0, Math.min(TICKS, Math.round(t)))));
  /* Counting from the render the target changes in, not from the sweep's first frame, so the new figure never
     flashes before the sweep sets off. */
  const counting = !!fun && (sweep.moving || swept !== lit);
  const ringLit = counting ? swept : lit;
  const figure = counting ? (
    <span className="tabular-nums">{countText(PERCENT.format(percent / 100), percent, sweep.shown)}</span>
  ) : (
    <RollingNumber value={percent / 100} format={{ style: "percent" }} />
  );

  /* The body enters with a drop only after the first render: a card that loads open just appears. Not through
     AnimatePresence initial={false}, which would swallow the Plan's own entrances (see tool-call.tsx). */
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);

  /* The button pressed is replaced by its opposite, which takes focus when the pressed one had it. */
  const hadFocus = useRef(false);
  const hideRef = useRef<HTMLButtonElement>(null);
  const blockRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!hadFocus.current) return;
    hadFocus.current = false;
    (shown === "block" ? blockRef : hideRef).current?.focus({ preventScroll: true });
  }, [shown]);
  const toggle = (e: MouseEvent<HTMLButtonElement>) => {
    hadFocus.current = e.currentTarget === document.activeElement;
    const next = !open;
    if (openProp === undefined) setInner(next);
    onOpenChange?.(next);
  };

  /* One voice, open or folded: the words and the step they are about, when either changes. Quiet on the first render. */
  const [said, setSaid] = useState("");
  const heard = useRef<string | null>(null);
  const line = `${run.words}: ${run.current ? run.current.label : title}`;
  useEffect(() => {
    const before = heard.current;
    heard.current = line;
    if (before !== null && before !== line) setSaid(line);
  }, [line]);

  /* The ring and the figure are the same parts in both seats; `place` puts them in the card's header grid. */
  const ring = (place: string) => (
    <motion.span layoutId="ring" transition={ringMove} className={"block shrink-0 " + place}>
      <Ring lit={ringLit} failed={run.failed} />
    </motion.span>
  );
  const figureBox = (place: string) => (
    <motion.span layoutId="figure" layout="position" transition={enter} className={"inline-grid shrink-0 text-body tabular-nums text-fg " + place}>
      {/* As wide as the widest figure, so a count or a roll never moves its neighbours. */}
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">
        {PERCENT.format(1)}
      </span>
      <span className="col-start-1 row-start-1">{figure}</span>
    </motion.span>
  );

  return (
    /* The root fills its container whatever the parent's alignment: the open card measures itself (a container
       query), so it has no width of its own to shrink to. The folded block inside stays the width of its words. */
    <div className="w-full min-w-0">
      <LayoutGroup id={id}>
        {shown === "card" ? (
          /* The box keeps its place by transform too (its corner, never its size), so in a parent that centers it the
             parts still glide inside it. */
          <motion.div
            layoutId="box"
            layout="position"
            transition={enter}
            role="group"
            aria-labelledby={titleId}
            className={"litt-raised @container grid gap-4 p-4 " + className}
          >
            {/* One row when the card has room: the title over the words, then the ring, the figure and the buttons.
                Narrow, two: the title and the buttons, then the ring, the words and the figure in a row of their own
                (a wrapper that is `contents` when wide, so its parts take the grid's columns). */}
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 @sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] @sm:gap-y-0">
              <motion.p layoutId="title" layout="position" transition={enter} id={titleId} className="row-start-1 text-body font-title text-fg">
                {title}
              </motion.p>
              <div className="col-span-2 row-start-2 flex items-center gap-3 @sm:contents">
                {ring("@sm:col-start-2 @sm:row-span-2 @sm:row-start-1")}
                <motion.p
                  layoutId="words"
                  layout="position"
                  transition={enter}
                  className="w-fit text-small whitespace-nowrap text-fg-muted @sm:col-start-1 @sm:row-start-2"
                >
                  {run.words}
                </motion.p>
                {figureBox("@sm:col-start-3 @sm:row-span-2 @sm:row-start-1")}
              </div>
              <div className="col-start-2 row-start-1 -mr-2 flex items-center gap-1 @sm:col-start-4 @sm:row-span-2">
                {actions}
                <Button
                  ref={hideRef}
                  variant="ghost"
                  size={coarse ? "md" : "sm"}
                  aria-expanded={open}
                  aria-controls={open ? bodyId : undefined}
                  aria-label={`Hide ${title}`}
                  iconRight={<ChevronDownIcon />}
                  onClick={toggle}
                >
                  Hide
                </Button>
              </div>
            </div>
            <AnimatePresence onExitComplete={() => !openNow.current && setShown("block")}>
              {open && (
                <motion.div
                  key="body"
                  id={bodyId}
                  initial={mounted.current ? { opacity: 0, y: -travel / 4 } : false}
                  animate={{ opacity: 1, y: 0, transition: enter }}
                  exit={{ opacity: 0, transition: exit }}
                >
                  <div className="grid gap-4 @md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="grid content-start gap-1">
                      <p aria-hidden="true" className="text-caption text-fg-subtle">
                        Activity
                      </p>
                      <Plan label="Activity" steps={steps} bare />
                    </div>
                    {preview != null && preview !== false && <div className="min-w-0">{preview}</div>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.button
            ref={blockRef}
            layoutId="box"
            layout="position"
            transition={enter}
            type="button"
            aria-expanded={false}
            onClick={toggle}
            className={BLOCK + " " + className}
          >
            {ring("")}
            {/* The title over the words, as in the card, so the two glide together and never cross. The same sizes on
                16px lines, so the pair fits the block and no glyph changes size on the way. */}
            <span className="grid min-w-0">
              <motion.span layoutId="title" layout="position" transition={enter} className="truncate text-body/4 font-title text-fg">
                {title}
              </motion.span>
              <motion.span layoutId="words" layout="position" transition={enter} className="truncate text-small/4 text-fg-muted">
                {run.words}
              </motion.span>
            </span>
            {figureBox("")}
            <span
              className={
                "flex shrink-0 items-center gap-1 text-small font-title text-fg-muted transition-colors duration-(--dur-instant) ease-litt " +
                "group-hover/block:text-fg pointer-coarse:group-active/block:text-fg"
              }
            >
              {/* On a phone the word gives its room to the title; the chevron stays, and the block is still named "Expand". */}
              <span className="max-sm:sr-only">Expand</span>
              <ChevronUpIcon />
            </span>
          </motion.button>
        )}
      </LayoutGroup>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {said}
      </div>
    </div>
  );
}
