/**
 * StepSequencer, a Rack and Flat part (proposals/rack.md; taste/litt-principles.md, Rack; the Flat studies, Step
 * sequencer). Under Rack, below, an Ableton-style colorful 8-step drum and bass pattern grid; under Flat
 * (worlds/flat/step-sequencer.tsx), a monochrome grid of soft squares on white paper with the tempo as its figure.
 *
 * - Four color-coded instrument lanes (`Kick` amber/orange, `Snare` rose/green, `Hat` teal/cyan, `Bass` blue) across
 *   8 quantized steps grouped into two 4-step beats (`1`–`4`, `5`–`8`).
 * - Active steps light up in their lane's rich Rack clip tint (`bg-data-*-tint`) with a crisp mark border and 2px top
 *   bar (`bg-data-*`); inactive steps rest in `--tray` with subtle beat-group alternation.
 * - Under a finger (pointer: coarse) every step is 44 by 44, a finger's target, and the grid scrolls sideways inside
 *   its panel rather than shrink a step below that.
 * - Starts stopped (R2/R4: nothing animates on mount). Pressing `Play` steps the playhead column across the 8 beats at
 *   the current BPM; clicking any step toggles it immediately on the frame. Includes `Pattern` cycler and `Clear`.
 * - Keys (principle 5, one tab stop per composite): the steps are a grid (role grid, a row per lane, its name the row
 *   header) and one Tab stop, on the step focused last (the first to start with). ← → ↑ ↓ move a step at a time without
 *   wrapping, Home and End go to the lane's first and last step, Ctrl (or ⌘) with them to the grid's first and last
 *   step, Enter or Space toggles the step. Tab leaves the grid. The beat ruler above it is drawn for the eye only.
 * - Zero `--accent` fills (R6).
 */
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "@/components/button";
import { byWorld, useMaterial } from "@/motion";
import { StepSequencerFlatBody } from "@/worlds/flat/step-sequencer";

export type StepHue = "amber" | "blue" | "teal" | "violet" | "rose";

export type StepLane = {
  id: string;
  name: string;
  hue: StepHue;
  /** 8-step boolean pattern. */
  steps: boolean[];
};

export type StepSequencerProps = {
  /** Pattern title printed in the module header. */
  title?: ReactNode;
  /** Tempo in BPM. Defaults to 124. */
  bpm?: number;
  /** Initial lanes and their 8-step patterns. */
  lanes?: StepLane[];
  /** Extra classes on the outer module. */
  className?: string;
};

const HUE: Record<StepHue, { tint: string; text: string; bar: string; border: string }> = {
  amber: { tint: "bg-data-amber-tint", text: "text-data-amber-text", bar: "bg-data-amber", border: "border-data-amber" },
  blue: { tint: "bg-data-blue-tint", text: "text-data-blue-text", bar: "bg-data-blue", border: "border-data-blue" },
  teal: { tint: "bg-data-teal-tint", text: "text-data-teal-text", bar: "bg-data-teal", border: "border-data-teal" },
  violet: { tint: "bg-data-violet-tint", text: "text-data-violet-text", bar: "bg-data-violet", border: "border-data-violet" },
  rose: { tint: "bg-data-rose-tint", text: "text-data-rose-text", bar: "bg-data-rose", border: "border-data-rose" },
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

export const DEFAULT_LANES: StepLane[] = [
  { id: "kick", name: "Kick", hue: "amber", steps: PATTERNS[0]!.grid.kick! },
  { id: "snare", name: "Snare", hue: "rose", steps: PATTERNS[0]!.grid.snare! },
  { id: "hat", name: "Hi-hat", hue: "teal", steps: PATTERNS[0]!.grid.hat! },
  { id: "bass", name: "Bass", hue: "blue", steps: PATTERNS[0]!.grid.bass! },
];

const STEPS = 8;

/** One contract, two bodies: Rack's, below, is the default; worlds/flat/step-sequencer.tsx is Flat's. Each keeps its own pattern. */
export function StepSequencer(props: StepSequencerProps) {
  const Body = byWorld(useMaterial(), { press: RackBody, flat: StepSequencerFlatBody });
  return <Body {...props} />;
}

/** Rack's Ableton-style colorful 8-step drum & bass pattern sequencer. */
function RackBody({
  title = "Drum rack · Pattern A",
  bpm = 124,
  lanes: initialLanes = DEFAULT_LANES,
  className = "",
}: StepSequencerProps) {
  const headingId = useId();
  const [lanes, setLanes] = useState<StepLane[]>(initialLanes);
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState<number>(0);
  const [patternIdx, setPatternIdx] = useState(0);
  const [live, setLive] = useState("");
  /* The grid's one tab stop: the step focused last, as row (lane) and column (step). */
  const [stop, setStop] = useState({ r: 0, c: 0 });
  const cells = useRef(new Map<string, HTMLButtonElement>());
  const at = { r: Math.min(stop.r, Math.max(0, lanes.length - 1)), c: Math.min(stop.c, STEPS - 1) };
  const cellOf = (target: EventTarget | null) => {
    const el = (target as HTMLElement | null)?.closest?.("[data-r]") as HTMLElement | null;
    return el ? { r: Number(el.dataset.r), c: Number(el.dataset.c) } : null;
  };
  /* Arrows a step at a time without wrapping, Home and End along the lane, Ctrl or ⌘ with them across the grid. */
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

  useEffect(() => {
    if (!playing) return;
    const stepMs = Math.round((60 / Math.max(60, bpm) / 2) * 1000);
    const id = window.setInterval(() => {
      setCursor((c) => (c + 1) % STEPS);
    }, stepMs);
    return () => window.clearInterval(id);
  }, [playing, bpm]);

  const activeHits = lanes.reduce((sum, l) => sum + l.steps.filter(Boolean).length, 0);

  function toggleStep(laneId: string, stepIdx: number) {
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
    const nextIdx = (patternIdx + 1) % PATTERNS.length;
    const pat = PATTERNS[nextIdx]!;
    setPatternIdx(nextIdx);
    setLanes((cur) => cur.map((l) => ({ ...l, steps: pat.grid[l.id] ?? l.steps })));
    setLive(`Loaded ${pat.name} pattern.`);
  }

  function clearAll() {
    setLanes((cur) => cur.map((l) => ({ ...l, steps: Array.from({ length: STEPS }, () => false) })));
    setLive("Cleared all steps.");
  }

  return (
    <div
      data-body="rack"
      className={"grid w-full min-w-0 overflow-hidden rounded-surface border border-line-strong bg-surface-1 forced-colors:border " + className}
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2 px-3 py-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={"size-2 rounded-pill border border-line-strong " + (playing ? "bg-fg forced-colors:bg-[Highlight]" : "bg-transparent")}
          />
          <span id={headingId} className="text-small font-title text-fg">
            {title}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-control border border-line bg-canvas px-2 py-0.5 font-mono text-caption tabular-nums text-fg-muted">
            {bpm} BPM · 1.{cursor + 1}
          </span>
          <Button
            size="sm"
            variant="secondary"
            aria-pressed={playing}
            onClick={() => {
              const next = !playing;
              setPlaying(next);
              setLive(next ? "Sequencer playing." : "Sequencer stopped.");
            }}
          >
            {playing ? "Stop" : "Play"}
          </Button>
          <Button size="sm" variant="secondary" onClick={cyclePattern}>
            {PATTERNS[patternIdx]!.name}
          </Button>
          <Button size="sm" variant="ghost" disabled={activeHits === 0} onClick={clearAll}>
            Clear
          </Button>
        </div>
      </div>

      {/* Step grid */}
      <div className="overflow-x-auto p-2">
        <div
          role="grid"
          aria-labelledby={headingId}
          onKeyDown={onGridKeyDown}
          onFocus={(e) => {
            const c = cellOf(e.target);
            if (c && (c.r !== stop.r || c.c !== stop.c)) setStop(c);
          }}
          style={{ "--seq-steps": STEPS } as CSSProperties}
          className={
            "grid min-w-[17rem] gap-1 sm:min-w-[22rem] sm:gap-1.5 " +
            /* The lane's name, then STEPS steps (`--seq-steps`, so the columns follow the constant). Under a finger each step
               keeps 44px, and the grid scrolls sideways inside its panel instead of shrinking them. */
            "grid-cols-[minmax(3.25rem,4.5rem)_repeat(var(--seq-steps),minmax(1.375rem,1fr))] pointer-coarse:grid-cols-[minmax(3.25rem,4.5rem)_repeat(var(--seq-steps),minmax(2.75rem,1fr))]"
          }
        >
          {/* Step index ruler, for the eye: each step's name says its number */}
          <div aria-hidden="true" className="contents">
            <span className="self-center px-1 font-mono text-caption text-fg-subtle">Steps</span>
            {Array.from({ length: STEPS }, (_, i) => {
              const isNow = playing && cursor === i;
              return (
                <span
                  key={i}
                  className={
                    "flex h-5 items-center justify-center rounded-control font-mono text-caption tabular-nums " +
                    (isNow ? "bg-fg font-title text-canvas" : i < 4 ? "bg-surface-2 text-fg-subtle" : "bg-canvas text-fg-subtle")
                  }
                >
                  {i + 1}
                </span>
              );
            })}
          </div>

          {/* Instrument rows */}
          {lanes.map((lane, laneIdx) => {
            const tone = HUE[lane.hue];
            return (
              <div key={lane.id} role="row" className="contents">
                <span
                  role="rowheader"
                  className={
                    "flex items-center truncate rounded-control border px-1.5 text-caption font-title sm:px-2 " +
                    tone.tint +
                    " " +
                    tone.border +
                    " " +
                    tone.text
                  }
                >
                  {lane.name}
                </span>
                {lane.steps.map((on, i) => {
                  const isNow = playing && cursor === i;
                  return (
                    <div key={i} role="gridcell" className="grid min-w-0">
                      <button
                        ref={(el) => {
                          if (el) cells.current.set(`${laneIdx}:${i}`, el);
                          else cells.current.delete(`${laneIdx}:${i}`);
                        }}
                        data-r={laneIdx}
                        data-c={i}
                        tabIndex={at.r === laneIdx && at.c === i ? 0 : -1}
                        type="button"
                        aria-pressed={on}
                        aria-label={`${lane.name}, step ${i + 1}${on ? ", active" : ""}`}
                        onClick={() => toggleStep(lane.id, i)}
                        className={
                          "relative flex h-control-sm min-w-0 cursor-pointer items-center justify-center overflow-hidden rounded-control border transition-colors duration-(--dur-instant) ease-litt pointer-coarse:h-control-md " +
                          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus forced-colors:border " +
                          (on
                            ? isNow
                              ? "border-fg bg-fg text-canvas forced-colors:bg-[Highlight]"
                              : `${tone.tint} ${tone.border} hover:border-fg`
                            : isNow
                              ? "border-fg bg-surface-2"
                              : i < 4
                                ? "border-line bg-tray hover:border-line-strong"
                                : "border-line bg-canvas hover:border-line-strong")
                        }
                      >
                        {on && !isNow && <span aria-hidden="true" className={"absolute inset-x-0 top-0 h-1 " + tone.bar} />}
                        {on && <span aria-hidden="true" className={"size-1.5 rounded-pill " + (isNow ? "bg-canvas" : tone.bar)} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
