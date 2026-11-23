/**
 * StepSequencer, the Flat body (plans/027): an airy 4x8 pattern grid on a clean white paper card with no borders,
 * no beat ruler, and no hardware chrome.
 *
 * - Material order (Ground -> Paper -> Part): framed on a paper card (`litt-paper rounded-surface bg-surface-1 p-6`,
 *   `data-part="paper"`). The quiet pattern name (`data-part="lettering"`) sits opposite a frameless Next text button
 *   (`data-part="pill"`) and one crisp ink Play pill (`data-part="ink"`).
 * - Each row pairs a short frameless lane name (`data-part="lettering"`) with eight rounded step buttons: empty steps
 *   rest in `--block` (`data-part="pill"`) with zero borders, and lit steps fill with their lane's solid data hue
 *   (`data-part="mark"`).
 * - Motion (Rule 1): starts stopped. When it first enters view (`useInView`, once), lit steps settle in once on
 *   `useTransition("expressive")`, then stay completely still. Pressing a step compresses on `useTransition("instant")`
 *   and settles on `useTransition("expressive")`. While playing, active-column lit steps scale up smoothly and unlit
 *   steps highlight in `--slot`. Under reduced motion (`useMotionDial().reduced`), all scaling is skipped.
 * - Keys: one tab stop on the grid with roving focus; arrow keys move step by step without wrapping, Home and End jump
 *   along the lane (with Ctrl or Cmd, to the grid's corners), and Enter or Space toggles a step.
 */
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { motion, useInView } from "motion/react";
import { DEFAULT_LANES, type StepHue, type StepLane, type StepSequencerProps } from "@/components/step-sequencer";
import { useMotionDial, useTransition } from "@/motion";

const STEPS = 8;

/* Literal Tailwind token classes so gen-registry renames every data hue cleanly for host installs. */
const STEP_FILL: Record<StepHue, string> = {
  amber: "bg-data-amber",
  blue: "bg-data-blue",
  teal: "bg-data-teal",
  violet: "bg-data-violet",
  rose: "bg-data-rose",
};

const PATTERNS: { name: string; grid: Record<string, boolean[]> }[] = [
  {
    name: "House",
    grid: {
      kick: [true, false, true, false, true, false, true, false],
      snare: [false, false, true, false, false, false, true, false],
      hat: [false, true, false, true, false, true, false, true],
      bass: [true, false, false, true, false, true, false, false],
    },
  },
  {
    name: "Breakbeat",
    grid: {
      kick: [true, false, false, true, false, true, false, false],
      snare: [false, false, true, false, false, false, true, true],
      hat: [true, true, false, true, true, true, false, true],
      bass: [true, false, true, false, false, true, false, true],
    },
  },
  {
    name: "Minimal",
    grid: {
      kick: [true, false, false, false, true, false, false, false],
      snare: [false, false, false, true, false, false, false, false],
      hat: [false, true, true, false, false, true, false, true],
      bass: [true, false, false, false, false, true, true, false],
    },
  },
];

/** Flat's color-and-geometry 8-step pattern sequencer on a clean paper card. */
export function StepSequencerFlat({
  title,
  bpm = 124,
  lanes: initialLanes = DEFAULT_LANES,
  className = "",
}: StepSequencerProps) {
  const headingId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const { reduced } = useMotionDial();
  const instant = useTransition("instant");
  const expressive = useTransition("expressive");
  const inView = useInView(rootRef, { once: true, amount: 0.2 });

  const [lanes, setLanes] = useState<StepLane[]>(initialLanes);
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [patternIdx, setPatternIdx] = useState(0);
  const [customTitle, setCustomTitle] = useState<ReactNode | undefined>(title);
  const [touched, setTouched] = useState(false);
  const [live, setLive] = useState("");
  /* One tab stop for the grid: the step focused last, by row (lane) and column (step). */
  const [stop, setStop] = useState({ r: 0, c: 0 });
  const cells = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    setCustomTitle(title);
  }, [title]);

  useEffect(() => {
    if (!playing) return;
    const stepMs = Math.round((60 / Math.max(60, bpm) / 2) * 1000);
    const id = window.setInterval(() => {
      setCursor((c) => (c + 1) % STEPS);
    }, stepMs);
    return () => window.clearInterval(id);
  }, [playing, bpm]);

  const arrived = inView || touched;
  const heading = customTitle ?? PATTERNS[patternIdx]!.name;
  const at = { r: Math.min(stop.r, Math.max(0, lanes.length - 1)), c: Math.min(stop.c, STEPS - 1) };

  const cellOf = (target: EventTarget | null) => {
    const el = (target as HTMLElement | null)?.closest?.("[data-r]") as HTMLElement | null;
    return el ? { r: Number(el.dataset.r), c: Number(el.dataset.c) } : null;
  };

  function onGridKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const from = cellOf(e.target);
    if (!from) return;
    const lastR = lanes.length - 1;
    const across = e.ctrlKey || e.metaKey;
    let to: { r: number; c: number } | null = null;
    if (e.key === "ArrowRight") to = { r: from.r, c: Math.min(STEPS - 1, from.c + 1) };
    else if (e.key === "ArrowLeft") to = { r: from.r, c: Math.max(0, from.c - 1) };
    else if (e.key === "ArrowDown") to = { r: Math.min(lastR, from.r + 1), c: from.c };
    else if (e.key === "ArrowUp") to = { r: Math.max(0, from.r - 1), c: from.c };
    else if (e.key === "Home") to = across ? { r: 0, c: 0 } : { r: from.r, c: 0 };
    else if (e.key === "End") to = across ? { r: lastR, c: STEPS - 1 } : { r: from.r, c: STEPS - 1 };
    if (!to) return;
    e.preventDefault();
    cells.current.get(`${to.r}:${to.c}`)?.focus();
  }

  function toggleStep(laneId: string, stepIdx: number) {
    setTouched(true);
    setLanes((cur) =>
      cur.map((l) => {
        if (l.id !== laneId) return l;
        const nextSteps = l.steps.map((v, i) => (i === stepIdx ? !v : v));
        const turnedOn = nextSteps[stepIdx];
        setLive(`${l.name}, step ${stepIdx + 1} ${turnedOn ? "on" : "off"}.`);
        return { ...l, steps: nextSteps };
      }),
    );
  }

  function cyclePattern() {
    setTouched(true);
    const nextIdx = (patternIdx + 1) % PATTERNS.length;
    const pat = PATTERNS[nextIdx]!;
    setPatternIdx(nextIdx);
    setCustomTitle(undefined);
    setLanes((cur) => cur.map((l) => ({ ...l, steps: pat.grid[l.id] ?? l.steps })));
    setLive(`${pat.name} pattern.`);
  }

  function togglePlay() {
    setTouched(true);
    const next = !playing;
    setPlaying(next);
    setLive(next ? "Playing." : "Stopped.");
  }

  return (
    <div
      ref={rootRef}
      data-body="flat"
      data-part="paper"
      className={"litt-paper grid w-full min-w-0 gap-4 rounded-surface bg-surface-1 p-6 forced-colors:border " + className}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <span id={headingId} data-part="lettering" className="text-body font-title text-fg">
          {heading}
        </span>
        <div className="flex items-center gap-1.5">
          <motion.button
            type="button"
            data-part="pill"
            onClick={cyclePattern}
            whileTap={reduced ? undefined : { scale: 0.96 }}
            transition={instant}
            className="litt-target relative inline-flex h-control-sm cursor-pointer items-center justify-center rounded-pill px-3 text-small font-normal text-fg-subtle select-none [-webkit-tap-highlight-color:transparent] transition-colors duration-(--dur-instant) ease-litt hover:bg-block hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border"
          >
            Next
          </motion.button>
          <motion.button
            type="button"
            data-part="ink"
            aria-pressed={playing}
            onClick={togglePlay}
            whileTap={reduced ? undefined : { scale: 0.96 }}
            transition={instant}
            className="litt-target relative inline-flex h-control-sm cursor-pointer items-center justify-center rounded-pill bg-fg px-4 text-small font-title text-canvas select-none [-webkit-tap-highlight-color:transparent] transition-opacity duration-(--dur-instant) ease-litt hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
          >
            {playing ? "Stop" : "Play"}
          </motion.button>
        </div>
      </header>

      <div
        role="grid"
        aria-labelledby={headingId}
        onKeyDown={onGridKeyDown}
        onFocus={(e) => {
          const c = cellOf(e.target);
          if (c && (c.r !== stop.r || c.c !== stop.c)) setStop(c);
        }}
        style={{ "--seq-steps": STEPS } as CSSProperties}
        className="grid w-full min-w-0 grid-cols-[2.75rem_repeat(var(--seq-steps),minmax(0,1fr))] items-center gap-x-1 gap-y-2 sm:grid-cols-[3.5rem_repeat(var(--seq-steps),minmax(0,1fr))] sm:gap-2"
      >
        {lanes.map((lane, laneIdx) => (
          <div key={lane.id} role="row" className="contents">
            <span
              role="rowheader"
              data-part="lettering"
              className="flex items-center truncate text-caption font-normal text-fg-subtle"
            >
              {lane.name}
            </span>
            {lane.steps.map((on, i) => {
              const isNow = playing && cursor === i;
              const targetScale = reduced ? 1 : !arrived && on ? 0.78 : isNow && on ? 1.12 : 1;
              return (
                <div key={i} role="gridcell" className="grid min-w-0 place-items-center">
                  <motion.button
                    ref={(el) => {
                      if (el) cells.current.set(`${laneIdx}:${i}`, el);
                      else cells.current.delete(`${laneIdx}:${i}`);
                    }}
                    data-r={laneIdx}
                    data-c={i}
                    data-part={on ? "mark" : "pill"}
                    tabIndex={at.r === laneIdx && at.c === i ? 0 : -1}
                    type="button"
                    aria-pressed={on}
                    aria-label={`${lane.name}, step ${i + 1}${on ? ", active" : ""}`}
                    onClick={() => toggleStep(lane.id, i)}
                    initial={false}
                    animate={{ scale: targetScale }}
                    whileTap={reduced ? undefined : { scale: 0.9, transition: instant }}
                    transition={expressive}
                    className={
                      "litt-target relative flex aspect-square min-h-7 w-full max-w-11 cursor-pointer items-center justify-center rounded-pill select-none [-webkit-tap-highlight-color:transparent] transition-colors duration-(--dur-instant) ease-litt " +
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
                      (on
                        ? STEP_FILL[lane.hue] + " forced-colors:border forced-colors:bg-[Highlight]"
                        : (isNow ? "bg-slot" : "bg-block hover:bg-slot") + " forced-colors:border")
                    }
                  >
                    {isNow && on && (
                      <span aria-hidden="true" className="size-1.5 rounded-pill bg-canvas forced-colors:bg-[HighlightText]" />
                    )}
                  </motion.button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
