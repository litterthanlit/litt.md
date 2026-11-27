/**
 * Step sequencer, the Flat body (taste v1.22, "Flat is the studies"; the Flat studies, Step sequencer): a beat maker
 * as a grid of soft squares on one white paper.
 *
 * - The paper: white on the grey ground (`litt-paper bg-surface-1 rounded-surface`, no edge and nothing cast). At its
 *   top the tempo is the one large figure (`text-figure`, "112 BPM"), with − and + as grey circles and Play as the ink
 *   circle. Under it a row per lane: its name in the muted ink, then its steps.
 * - A step: a grey square (`bg-block`, 8px corners: the surface radius less 8, drawn 4px inside a 12px hit area) when
 *   empty, the ink when set. Monochrome first (v1.22): a lane carries no hue
 *   here, so the step under the playhead pops a little larger in the ink, and its lane's name takes the ink, while it
 *   fires. The playhead's column darkens its empty steps a shade.
 * - Steps: as many as the lanes carry (sixteen by default). Below 33rem it shows eight at a time and follows the
 *   playhead, with 1–8 and 9–16 to turn the page; a hand on the grid holds the page for three seconds.
 * - Tempo: drag the figure (right or up is faster, a beat per 4px), use the arrow keys on it (it is a slider), or press
 *   − and + (4 BPM a press). 60 to 180.
 * - Time: steps are queued a moment ahead on a steady clock (a 25ms scheduler with 100ms of lookahead), and the lights
 *   read the same queue on the frame, so the groove never drifts with the frame rate. Flat has no voice: the beat is
 *   seen, not heard.
 * - Nothing moves until Play (R4). Under reduced motion it still plays when asked, but nothing scales: the step under
 *   the playhead is simply the ink.
 * - Keys: the grid is one tab stop (the step focused last). Arrows move a step, Home and End go to the lane's ends (with Ctrl or ⌘, the grid's),
 *   Enter or Space toggles. Play says "Playing, 112 BPM" and "Stopped" in a polite status.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useMotionDial } from "@/motion";
import type { StepLane, StepSequencerProps } from "@/components/step-sequencer";

const BPM = { min: 60, max: 180 };
const PAGE = 8;
const LOOKAHEAD = 100;
const INTERVAL = 25;
const PIN = 3000;
/** The grid shows every step from this width up (px). */
const WIDE = 528;

/** Flat's own groove when no lanes are given: the player's own clicks, as the study has them. */
const GROOVE: [string, number[]][] = [
  ["Press", [0, 3, 8, 10]],
  ["Tick", [2, 6, 10, 14, 15]],
  ["Bump", [4, 12]],
  ["Select", [0, 7, 11]],
];
const FLAT_LANES: StepLane[] = GROOVE.map(([name, on]) => ({
  id: name.toLowerCase(),
  name,
  hue: "blue",
  steps: Array.from({ length: 16 }, (_, i) => on.includes(i)),
}));

const CIRCLE =
  "litt-target relative grid shrink-0 cursor-pointer place-items-center rounded-pill transition-transform duration-(--dur-instant) ease-litt " +
  "active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border [-webkit-tap-highlight-color:transparent]";

export function StepSequencerFlatBody({ title = "Step sequencer", bpm: initialBpm = 112, lanes: given, className = "" }: StepSequencerProps) {
  const { reduced } = useMotionDial();
  const hint = useId();
  const [lanes, setLanes] = useState<StepLane[]>(() => given ?? FLAT_LANES);
  const steps = lanes[0]?.steps.length ?? 16;
  const [bpm, setBpm] = useState(Math.min(BPM.max, Math.max(BPM.min, initialBpm)));
  const [playing, setPlaying] = useState(false);
  const [head, setHead] = useState({ step: -1, bar: 0 });
  const [page, setPage] = useState(0);
  const [wide, setWide] = useState(true);
  const [stop, setStop] = useState({ r: 0, c: 0 });
  const [live, setLive] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const cells = useRef(new Map<string, HTMLButtonElement>());
  const pinned = useRef(0);
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;

  const paged = !wide && steps > PAGE;
  const cols = useMemo(
    () => (paged ? Array.from({ length: PAGE }, (_, i) => page * PAGE + i).filter((c) => c < steps) : Array.from({ length: steps }, (_, i) => i)),
    [paged, page, steps],
  );

  /* Every step once there is room for them. */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWide(e.contentRect.width >= WIDE));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* The scheduler queues steps a moment ahead on a steady clock; the frame loop lights what is due. */
  useEffect(() => {
    if (!playing) return;
    let at = performance.now() + 40;
    let next = 0;
    const queue: { step: number; at: number }[] = [];
    const schedule = () => {
      const now = performance.now();
      if (at < now - 250) at = now + 20; // back from a hidden tab: pick the beat up from here
      while (at < now + LOOKAHEAD) {
        queue.push({ step: next, at });
        next = (next + 1) % steps;
        at += 60000 / bpmRef.current / 4;
      }
    };
    schedule();
    const timer = window.setInterval(schedule, INTERVAL);
    let frame = requestAnimationFrame(function tick(now) {
      let shown = -1;
      while (queue.length && queue[0].at <= now) shown = queue.shift()!.step;
      if (shown >= 0) {
        setHead((h) => ({ step: shown, bar: shown === 0 ? h.bar + 1 : h.bar }));
        if (now > pinned.current) setPage(Math.floor(shown / PAGE));
      }
      frame = requestAnimationFrame(tick);
    });
    return () => {
      window.clearInterval(timer);
      cancelAnimationFrame(frame);
    };
  }, [playing, steps]);

  const toggle = (r: number, c: number) => {
    pinned.current = performance.now() + PIN;
    setStop({ r, c });
    setLanes((ls) => ls.map((l, i) => (i === r ? { ...l, steps: l.steps.map((on, j) => (j === c ? !on : on)) } : l)));
  };

  const onGridKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-r]");
    if (!el) return;
    let r = Number(el.dataset.r);
    let c = Number(el.dataset.c);
    if (e.key === "ArrowRight") c++;
    else if (e.key === "ArrowLeft") c--;
    else if (e.key === "ArrowDown") r++;
    else if (e.key === "ArrowUp") r--;
    else if (e.key === "Home") {
      c = 0;
      if (e.ctrlKey || e.metaKey) r = 0;
    } else if (e.key === "End") {
      c = steps - 1;
      if (e.ctrlKey || e.metaKey) r = lanes.length - 1;
    } else return;
    e.preventDefault();
    if (r < 0 || r >= lanes.length || c < 0 || c >= steps) return;
    pinned.current = performance.now() + PIN;
    setStop({ r, c });
    if (paged) setPage(Math.floor(c / PAGE));
    requestAnimationFrame(() => cells.current.get(`${r}:${c}`)?.focus({ preventScroll: true }));
  };

  const setTempo = useCallback((n: number) => setBpm(Math.min(BPM.max, Math.max(BPM.min, Math.round(n)))), []);
  const onTempoKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const d = ({ ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 } as Record<string, number>)[e.key];
    if (d) setTempo(bpm + d);
    else if (e.key === "Home") setTempo(BPM.min);
    else if (e.key === "End") setTempo(BPM.max);
    else return;
    e.preventDefault();
  };
  const drag = useRef<{ id: number; x: number; y: number; from: number } | null>(null);
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, from: bpm };
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d && d.id === e.pointerId) setTempo(d.from + (e.clientX - d.x - (e.clientY - d.y)) / 4);
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id === e.pointerId) drag.current = null;
  };

  const play = () => {
    if (playing) {
      setPlaying(false);
      setHead({ step: -1, bar: 0 });
      setLive("Stopped");
    } else {
      setPlaying(true);
      setLive(`Playing, ${bpm} BPM`);
    }
  };

  const lit = playing ? head.step : -1;
  const at = { r: Math.min(stop.r, lanes.length - 1), c: cols.includes(stop.c) ? stop.c : cols[0] };
  const template = { gridTemplateColumns: `minmax(3.2em, 4em) repeat(${cols.length}, minmax(0, 1fr))` };

  return (
    <div ref={root} role="group" aria-label={typeof title === "string" ? title : "Step sequencer"} className={"w-full max-w-xl min-w-0 " + className}>
      <div className="litt-paper grid gap-4 rounded-surface bg-surface-1 p-4 text-fg select-none forced-colors:border sm:p-5">
        <div className="flex items-center gap-2">
          <div
            role="slider"
            tabIndex={0}
            aria-label="Tempo"
            aria-describedby={hint}
            aria-valuemin={BPM.min}
            aria-valuemax={BPM.max}
            aria-valuenow={bpm}
            aria-valuetext={`${bpm} BPM`}
            onKeyDown={onTempoKey}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className="me-auto flex cursor-ew-resize touch-none items-baseline gap-1.5 rounded-control px-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <b aria-hidden="true" className="text-figure tabular-nums">
              {bpm}
            </b>
            <span aria-hidden="true" className="text-small text-fg-muted">
              BPM
            </span>
          </div>
          <button type="button" aria-label="Slower" onClick={() => setTempo(bpm - 4)} className={CIRCLE + " size-10 bg-block text-fg"}>
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M4 8h8" />
            </svg>
          </button>
          <button type="button" aria-label="Faster" onClick={() => setTempo(bpm + 4)} className={CIRCLE + " size-10 bg-block text-fg"}>
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M4 8h8M8 4v8" />
            </svg>
          </button>
          <button type="button" aria-label={playing ? "Stop" : "Play"} aria-pressed={playing} onClick={play} className={CIRCLE + " ms-1 size-12 bg-fg text-canvas forced-colors:text-[ButtonText]"}>
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="currentColor">
              {playing ? <rect x="3.5" y="3.5" width="9" height="9" rx="2" /> : <path d="M5 2.8 13 8l-8 5.2z" />}
            </svg>
          </button>
        </div>

        <div role="grid" aria-label="Pattern" onKeyDown={onGridKey} className="grid gap-1.5">
          {lanes.map((lane, r) => (
            <div key={lane.id} role="row" className="grid items-center gap-1" style={template}>
              <span role="rowheader" className={"truncate text-small " + (lit >= 0 && lane.steps[lit] ? "text-fg" : "text-fg-muted")}>
                {lane.name}
              </span>
              {cols.map((c) => {
                const on = lane.steps[c];
                const firing = on && c === lit;
                return (
                  <span key={c} role="gridcell" className="min-w-0">
                    <button
                      ref={(el) => {
                        if (el) cells.current.set(`${r}:${c}`, el);
                        else cells.current.delete(`${r}:${c}`);
                      }}
                      type="button"
                      data-r={r}
                      data-c={c}
                      tabIndex={r === at.r && c === at.c ? 0 : -1}
                      aria-pressed={on}
                      aria-label={`${lane.name}, step ${c + 1}`}
                      onClick={() => toggle(r, c)}
                      className="group/step relative block h-9 w-full cursor-pointer rounded-[calc(var(--radius-surface)-4px)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus [-webkit-tap-highlight-color:transparent] sm:h-10"
                    >
                      <i
                        className={
                          "absolute inset-1 rounded-[calc(var(--radius-surface)-8px)] transition-transform duration-(--dur-instant) ease-litt group-active/step:scale-90 forced-colors:border " +
                          (on ? "bg-fg forced-colors:bg-[CanvasText] " : c === lit ? "bg-[color-mix(in_oklab,var(--block),var(--fg)_12%)] " : "bg-block ") +
                          (firing && !reduced ? "scale-110" : "")
                        }
                      />
                    </button>
                  </span>
                );
              })}
            </div>
          ))}
        </div>

        {paged && (
          <div className="flex items-center justify-end gap-1">
            <span aria-hidden="true" className="me-auto text-small text-fg-muted tabular-nums">
              {playing ? `Bar ${Math.max(1, head.bar)}, beat ${(Math.max(0, lit) >> 2) + 1}` : "Stopped"}
            </span>
            {[0, 1].map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={page === p}
                aria-label={`Steps ${p * PAGE + 1} to ${p * PAGE + PAGE}`}
                onClick={() => {
                  pinned.current = performance.now() + PIN;
                  setPage(p);
                }}
                className={
                  "litt-target relative h-9 cursor-pointer rounded-pill px-4 text-small font-label tabular-nums transition-colors duration-(--dur-instant) ease-litt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
                  (page === p ? "bg-block text-fg" : "text-fg-muted hover:text-fg")
                }
              >
                {p * PAGE + 1}–{p * PAGE + PAGE}
              </button>
            ))}
          </div>
        )}
        <p id={hint} className="sr-only">
          Drag the tempo, or use the arrow keys, to set it.
        </p>
        <p role="status" className="sr-only">
          {live}
        </p>
      </div>
    </div>
  );
}
