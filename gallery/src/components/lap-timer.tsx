/**
 * LapTimer, a Heat part (proposals/heat.md; taste/litt-principles.md, Heat): a street-racing lap and sector split
 * timing slab.
 *
 * - Framed as a square black slab (`rounded-none border border-line-strong bg-canvas`) banded top and bottom with
 *   diagonal hazard stripes and four 16px outer ink corner brackets (inset inside a 2px-padded wrapper so the marks
 *   never cause horizontal overflow).
 * - Displays the tabular lap clock (`MM:SS.mmm`), overall delta in words and sign (`−0.248 s`, `+0.114 s`, or
 *   `Reference`), and a sector split table (`S1`, `S2`, `S3`) where the active sector takes Heat's 8px amber corner
 *   brackets.
 * - Never runs on its own on mount (R2/R4): starts ready with reference splits so the viewer can inspect sectors or
 *   press Start / Record split / Reset to step a live run. All controls use secondary/ghost Heat keys (zero accent
 *   fills, R6).
 */
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/button";
import { Kbd } from "@/components/kbd";
import { Tag, type TagStatus } from "@/components/tag";
import { useMotionDial } from "@/motion";

export type LapSector = {
  /** Short sector name, such as "S1", "S2", "S3". */
  id: string;
  /** Sector time in seconds, e.g. 24.118. */
  seconds: number;
  /** Delta against the reference lap in seconds (negative is faster). */
  delta: number;
};

export type LapTimerProps = {
  /** Track or event name shown in the striped header band. */
  track?: ReactNode;
  /** Current lap number. Defaults to 3. */
  lap?: number;
  /** Total laps in the session. Defaults to 5. */
  totalLaps?: number;
  /** Initial sector splits shown at rest before the user starts or records a new lap. */
  sectors?: LapSector[];
  /** Extra classes on the outer wrapper. */
  className?: string;
};

const DEFAULT_SECTORS: LapSector[] = [
  { id: "S1", seconds: 24.118, delta: -0.142 },
  { id: "S2", seconds: 26.804, delta: -0.186 },
  { id: "S3", seconds: 23.46, delta: 0.08 },
];

/* Reference splits for deterministic step-by-step split recording. */
const RECORDED_DELTAS = [-0.214, -0.068, 0.044];

const MARKS =
  "pointer-events-none absolute bg-no-repeat " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom] ";

const FRAME =
  MARKS +
  "[background-size:16px_2px,2px_16px,16px_2px,2px_16px,16px_2px,2px_16px,16px_2px,2px_16px] -inset-2 text-fg";

const SELECTED =
  MARKS +
  "[background-size:8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px] inset-0 text-accent-text";

const STRIPES = "[background-image:repeating-linear-gradient(135deg,var(--surface-3)_0_6px,transparent_6px_12px)]";

function formatClock(seconds: number): string {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const rem = safe - mins * 60;
  return `${String(mins).padStart(2, "0")}:${rem.toFixed(3).padStart(6, "0")}`;
}

function formatSector(seconds: number): string {
  return `${seconds.toFixed(3)} s`;
}

function formatDelta(delta: number): string {
  if (Math.abs(delta) < 0.0005) return "0.000 s";
  return `${delta < 0 ? "−" : "+"}${Math.abs(delta).toFixed(3)} s`;
}

/** Heat's street-racing lap and sector timer slab with amber-bracketed sector rows. */
export function LapTimer({
  track = "Camden Beach sprint",
  lap = 3,
  totalLaps = 5,
  sectors: initialSectors = DEFAULT_SECTORS,
  className = "",
}: LapTimerProps) {
  const titleId = useId();
  const { reduced } = useMotionDial();

  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(() => initialSectors.reduce((sum, s) => sum + s.seconds, 0));
  const [sectors, setSectors] = useState<LapSector[]>(initialSectors);
  const [activeIdx, setActiveIdx] = useState<number>(initialSectors.length - 1);
  const [currentLap, setCurrentLap] = useState(lap);
  const [live, setLive] = useState("");

  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now() - elapsed * 1000;
    if (reduced) {
      const id = window.setInterval(() => {
        setElapsed((performance.now() - startRef.current) / 1000);
      }, 250);
      return () => window.clearInterval(id);
    }
    const tick = (now: number) => {
      setElapsed((now - startRef.current) / 1000);
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [running, reduced]);

  const totalDelta = sectors.reduce((sum, s) => sum + s.delta, 0);
  const statusTag: { word: string; status: TagStatus } = running
    ? { word: "Live", status: "warning" }
    : totalDelta < 0
      ? { word: "Best lap", status: "success" }
      : { word: "Ready", status: "neutral" };

  function toggleRun() {
    if (running) {
      setRunning(false);
      setLive(`Paused at ${formatClock(elapsed)}.`);
    } else {
      setElapsed(0);
      setActiveIdx(0);
      setRunning(true);
      setLive(`Lap ${currentLap} started.`);
    }
  }

  function recordSplit() {
    const nextIdx = (activeIdx + 1) % sectors.length;
    const base = initialSectors[nextIdx] ?? DEFAULT_SECTORS[nextIdx % DEFAULT_SECTORS.length]!;
    const delta = RECORDED_DELTAS[(nextIdx + currentLap) % RECORDED_DELTAS.length]!;
    const nextSeconds = Math.max(10, base.seconds + delta);
    const updated = sectors.map((s, i) => (i === nextIdx ? { ...s, seconds: nextSeconds, delta } : s));
    const sum = updated.reduce((acc, s) => acc + s.seconds, 0);
    setSectors(updated);
    setActiveIdx(nextIdx);
    if (!running) setElapsed(sum);
    if (nextIdx === sectors.length - 1) {
      setCurrentLap((l) => (l >= totalLaps ? 1 : l + 1));
    }
    setLive(`${base.id} recorded: ${formatSector(nextSeconds)}, ${formatDelta(delta)}.`);
  }

  function reset() {
    setRunning(false);
    setSectors(initialSectors);
    setActiveIdx(initialSectors.length - 1);
    setElapsed(initialSectors.reduce((sum, s) => sum + s.seconds, 0));
    setCurrentLap(lap);
    setLive("Timer reset to reference lap.");
  }

  return (
    <div data-body="heat" className={"grid w-full min-w-0 gap-3 p-2 " + className}>
      <div className="relative min-w-0">
        <span aria-hidden="true" className={FRAME} />
        <div className="grid min-w-0 border border-line-strong bg-canvas forced-colors:border">
          {/* Striped header band */}
          <div className={"flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-1 px-3 py-2 " + STRIPES}>
            <span id={titleId} className="bg-canvas px-2 py-0.5 text-small font-title text-fg">
              {track}
            </span>
            <div className="flex items-center gap-2 bg-canvas px-2 py-0.5">
              <span className="font-mono text-caption tabular-nums text-fg-muted">
                Lap {currentLap} / {totalLaps}
              </span>
              <Tag status={statusTag.status}>{statusTag.word}</Tag>
            </div>
          </div>

          {/* Primary lap readout */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-4 py-3">
            <div className="grid gap-0.5">
              <span className="text-caption text-fg-subtle">Lap time</span>
              <span className="font-mono text-h1 font-title tabular-nums text-fg">{formatClock(elapsed)}</span>
            </div>
            <div className="grid justify-items-end gap-0.5">
              <span className="text-caption text-fg-subtle">Delta</span>
              <span
                className={
                  "font-mono text-h3 font-title tabular-nums " +
                  (totalDelta < 0 ? "text-success" : totalDelta > 0 ? "text-danger" : "text-fg-muted")
                }
              >
                {formatDelta(totalDelta)}
              </span>
            </div>
          </div>

          {/* Sector split rows */}
          <ul aria-labelledby={titleId} className="grid divide-y divide-line">
            {sectors.map((s, i) => {
              const on = i === activeIdx;
              const faster = s.delta < 0;
              return (
                <li key={s.id} className="relative">
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => setActiveIdx(i)}
                    className={
                      "relative flex min-h-control-sm w-full cursor-pointer items-center justify-between gap-3 px-4 py-2 text-left transition-colors duration-(--dur-instant) ease-litt pointer-coarse:min-h-control-md " +
                      "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
                      (on ? "bg-surface-1" : "bg-canvas hover:bg-surface-1")
                    }
                  >
                    {on && <span aria-hidden="true" className={SELECTED} />}
                    <span className={"font-mono text-small font-title tabular-nums " + (on ? "text-accent-text" : "text-fg")}>
                      {on ? `‹ ${s.id} ›` : s.id}
                    </span>
                    <span className="font-mono text-small tabular-nums text-fg">{formatSector(s.seconds)}</span>
                    <span
                      className={
                        "min-w-[8ch] text-right font-mono text-caption font-title tabular-nums " +
                        (faster ? "text-success" : s.delta > 0 ? "text-danger" : "text-fg-subtle")
                      }
                    >
                      {formatDelta(s.delta)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <Button size="sm" variant="secondary" onClick={toggleRun}>
                {running ? "Pause" : "Start lap"}
              </Button>
              <Button size="sm" variant="secondary" onClick={recordSplit}>
                Record split
              </Button>
            </div>
            <Button size="sm" variant="ghost" onClick={reset}>
              Reset
            </Button>
          </div>

          <div aria-hidden="true" className={"h-2.5 border-t border-line bg-surface-1 " + STRIPES} />
        </div>
      </div>

      <div aria-hidden="true" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-fg-muted">
        <span className="inline-flex items-center gap-1.5">
          <Kbd>Start</Kbd>
          <span>Run clock</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Kbd>Split</Kbd>
          <span>Log sector</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Kbd>Reset</Kbd>
          <span>Reference</span>
        </span>
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
