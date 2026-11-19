/**
 * StepSequencer, a Rack part (proposals/rack.md; taste/litt-principles.md, Rack): an Ableton-style colorful 8-step
 * drum and bass pattern grid.
 *
 * - Four color-coded instrument lanes (`Kick` amber/orange, `Snare` rose/green, `Hat` teal/cyan, `Bass` blue) across
 *   8 quantized steps grouped into two 4-step beats (`1`–`4`, `5`–`8`).
 * - Active steps light up in their lane's rich Rack clip tint (`bg-data-*-tint`) with a crisp mark border and 2px top
 *   bar (`bg-data-*`); inactive steps rest in `--tray` with subtle beat-group alternation.
 * - Starts stopped (R2/R4: nothing animates on mount). Pressing `Play` steps the playhead column across the 8 beats at
 *   the current BPM; clicking any step toggles it immediately on the frame. Includes `Pattern` cycler and `Clear`.
 * - Zero `--accent` fills (R6).
 */
import { useEffect, useId, useState, type ReactNode } from "react";
import { Button } from "@/components/button";

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

/** Rack's Ableton-style colorful 8-step drum & bass pattern sequencer. */
export function StepSequencer({
  title = "Drum Rack · Pattern A",
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
          role="group"
          aria-labelledby={headingId}
          className="grid min-w-[22rem] gap-1.5"
          style={{ gridTemplateColumns: `4.5rem repeat(${STEPS}, minmax(0, 1fr))` }}
        >
          {/* Step index ruler */}
          <span className="self-center px-1 font-mono text-caption text-fg-subtle">Steps</span>
          {Array.from({ length: STEPS }, (_, i) => {
            const isNow = playing && cursor === i;
            return (
              <span
                key={i}
                aria-hidden="true"
                className={
                  "flex h-5 items-center justify-center rounded-control font-mono text-caption tabular-nums " +
                  (isNow ? "bg-fg font-title text-canvas" : i < 4 ? "bg-surface-2 text-fg-subtle" : "bg-canvas text-fg-subtle")
                }
              >
                {i + 1}
              </span>
            );
          })}

          {/* Instrument rows */}
          {lanes.map((lane) => {
            const tone = HUE[lane.hue];
            return (
              <div key={lane.id} className="contents">
                <span
                  className={
                    "flex items-center truncate rounded-control border px-2 text-caption font-title " +
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
                    <button
                      key={i}
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
