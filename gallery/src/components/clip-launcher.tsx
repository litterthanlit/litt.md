/**
 * ClipLauncher, a Rack part (proposals/rack.md; taste/litt-principles.md, Rack): Ableton Live's Session View clip
 * grid. Color belongs to the music (each track keeps one of Rack's five clip colors everywhere it shows), while the
 * surrounding module chrome stays quiet grey with 1px outlines.
 *
 * - Columns are color-coded tracks (`Drums` amber/orange, `Bass` blue, `Synth` violet/purple, `Keys` rose/green) with
 *   a clip header bar, and rows are scenes (`Intro`, `Verse`, `Drop`, `Break`) launched together from the Master column.
 * - Clicking any clip launches it immediately on the frame (stopping any other clip in that track); clicking a playing
 *   clip stops it. Clicking a scene button launches the entire row across every track at once.
 * - Active clips cut cleanly to lit ink (`bg-fg text-canvas`) with their track hue stripe preserved on the left rail,
 *   while resting clips show their rich Rack clip tint (`bg-data-*-tint`), text tone, and seeded mini-waveform bars.
 * - A clip's name wraps to two lines in a narrow panel and the row grows to hold them; a name that needs a third ends
 *   in an ellipsis there, and its accessible name carries it whole.
 * - Keys (principle 5, one tab stop per composite): the session is a grid (role grid, a row of column headers for the
 *   tracks and Master, then a row per scene) and one Tab stop, on the cell focused last (the first clip to start
 *   with). ← → ↑ ↓ move a cell at a time without wrapping, Home and End go to the row's ends, Ctrl (or ⌘) with them to
 *   the grid's first and last cell, Enter or Space launches or stops the clip, stops the track from an empty slot, or
 *   fires the scene from Master. Tab leaves the grid.
 * - Zero `--accent` fills (R6) and zero auto-animation on mount (R2/R4). Every launch announces once in a polite live
 *   status region.
 */
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "@/components/button";

export type ClipHue = "amber" | "blue" | "teal" | "violet" | "rose";

export type ClipSlot = {
  /** Unique id for this clip. */
  id: string;
  /** Short clip name, e.g. "Kick 4x4" or "Sub riff". */
  name: string;
  /** Bar length label, e.g. "4 bars". */
  bars: string;
};

export type ClipTrack = {
  /** Unique track id. */
  id: string;
  /** Track title shown in the colored column header. */
  name: string;
  /** One of Rack's five clip colors. */
  hue: ClipHue;
  /** One slot per scene row (null for an empty stop slot). */
  clips: (ClipSlot | null)[];
};

export type ClipLauncherProps = {
  /** Session title printed in the module header bar. */
  title?: ReactNode;
  /** Tempo readout in BPM. Defaults to 124. */
  bpm?: number;
  /** Scene names, one per row. */
  scenes?: string[];
  /** Track columns with their color-coded clips. */
  tracks?: ClipTrack[];
  /** Initial playing clip id per track id. */
  defaultPlaying?: Record<string, string | null>;
  /** Extra classes on the outer module. */
  className?: string;
};

const HUE: Record<ClipHue, { tint: string; text: string; bar: string; border: string }> = {
  amber: { tint: "bg-data-amber-tint", text: "text-data-amber-text", bar: "bg-data-amber", border: "border-data-amber" },
  blue: { tint: "bg-data-blue-tint", text: "text-data-blue-text", bar: "bg-data-blue", border: "border-data-blue" },
  teal: { tint: "bg-data-teal-tint", text: "text-data-teal-text", bar: "bg-data-teal", border: "border-data-teal" },
  violet: { tint: "bg-data-violet-tint", text: "text-data-violet-text", bar: "bg-data-violet", border: "border-data-violet" },
  rose: { tint: "bg-data-rose-tint", text: "text-data-rose-text", bar: "bg-data-rose", border: "border-data-rose" },
};

export const DEFAULT_SCENES = ["Intro", "Verse", "Drop", "Break"];

export const DEFAULT_TRACKS: ClipTrack[] = [
  {
    id: "drums",
    name: "Drums",
    hue: "amber",
    clips: [
      { id: "d1", name: "Hat pulse", bars: "2" },
      { id: "d2", name: "Rim groove", bars: "4" },
      { id: "d3", name: "Full kit", bars: "4" },
      { id: "d4", name: "Half-time", bars: "2" },
    ],
  },
  {
    id: "bass",
    name: "Bass",
    hue: "blue",
    clips: [
      null,
      { id: "b2", name: "Sub pulse", bars: "4" },
      { id: "b3", name: "Acid line", bars: "4" },
      { id: "b4", name: "Long root", bars: "8" },
    ],
  },
  {
    id: "synth",
    name: "Synth",
    hue: "violet",
    clips: [
      { id: "s1", name: "Air pad", bars: "8" },
      { id: "s2", name: "Arp 1/16", bars: "4" },
      { id: "s3", name: "Lead stab", bars: "4" },
      { id: "s4", name: "Filter swell", bars: "4" },
    ],
  },
  {
    id: "keys",
    name: "Keys",
    hue: "rose",
    clips: [
      { id: "k1", name: "Rhodes VII", bars: "4" },
      { id: "k2", name: "Chord chop", bars: "4" },
      { id: "k3", name: "Octave run", bars: "4" },
      null,
    ],
  },
];

/** Deterministic 6-bar mini waveform silhouette from clip id. */
function miniWave(id: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return Array.from({ length: 6 }, (_, k) => {
    const v = ((h >>> (k * 4)) & 15) / 15;
    return Math.round(28 + v * 72);
  });
}

/** Rack's Ableton-style Session View clip launcher with color-coded tracks and scene triggers. */
export function ClipLauncher({
  title = "Ghost town · Session",
  bpm = 124,
  scenes = DEFAULT_SCENES,
  tracks = DEFAULT_TRACKS,
  defaultPlaying = { drums: "d3", bass: "b3", synth: "s3", keys: "k3" },
  className = "",
}: ClipLauncherProps) {
  const headingId = useId();
  const [playing, setPlaying] = useState<Record<string, string | null>>(defaultPlaying);
  const [activeScene, setActiveScene] = useState<number | null>(() => {
    const idx = scenes.findIndex((_, rowIdx) =>
      tracks.every((t) => (t.clips[rowIdx]?.id ?? null) === (defaultPlaying[t.id] ?? null)),
    );
    return idx >= 0 ? idx : null;
  });
  const [live, setLive] = useState("");
  /* The grid's one tab stop: the cell focused last, as row (scene) and column (track, then Master). */
  const [stop, setStop] = useState({ r: 0, c: 0 });
  const cells = useRef(new Map<string, HTMLButtonElement>());
  const cols = tracks.length + 1;
  const at = { r: Math.min(stop.r, Math.max(0, scenes.length - 1)), c: Math.min(stop.c, cols - 1) };
  const cellRef = (r: number, c: number) => (el: HTMLButtonElement | null) => {
    if (el) cells.current.set(`${r}:${c}`, el);
    else cells.current.delete(`${r}:${c}`);
  };
  const cellOf = (target: EventTarget | null) => {
    const el = (target as HTMLElement | null)?.closest?.("[data-r]") as HTMLElement | null;
    return el ? { r: Number(el.dataset.r), c: Number(el.dataset.c) } : null;
  };
  /* Arrows a cell at a time without wrapping, Home and End along the row, Ctrl or ⌘ with them across the grid. */
  function onGridKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const from = cellOf(e.target);
    if (!from) return;
    const lastR = scenes.length - 1;
    const across = e.ctrlKey || e.metaKey;
    let to: { r: number; c: number } | null = null;
    if (e.key === "ArrowRight") to = { r: from.r, c: Math.min(cols - 1, from.c + 1) };
    else if (e.key === "ArrowLeft") to = { r: from.r, c: Math.max(0, from.c - 1) };
    else if (e.key === "ArrowDown") to = { r: Math.min(lastR, from.r + 1), c: from.c };
    else if (e.key === "ArrowUp") to = { r: Math.max(0, from.r - 1), c: from.c };
    else if (e.key === "Home") to = across ? { r: 0, c: 0 } : { r: from.r, c: 0 };
    else if (e.key === "End") to = across ? { r: lastR, c: cols - 1 } : { r: from.r, c: cols - 1 };
    if (!to) return;
    e.preventDefault();
    cells.current.get(`${to.r}:${to.c}`)?.focus();
  }
  const cellProps = (r: number, c: number) => ({
    ref: cellRef(r, c),
    "data-r": r,
    "data-c": c,
    tabIndex: at.r === r && at.c === c ? 0 : -1,
  });

  const playingCount = Object.values(playing).filter(Boolean).length;

  function toggleClip(track: ClipTrack, clip: ClipSlot) {
    const isOn = playing[track.id] === clip.id;
    setPlaying((cur) => ({ ...cur, [track.id]: isOn ? null : clip.id }));
    setActiveScene(null);
    setLive(isOn ? `Stopped ${track.name}, ${clip.name}.` : `Launched ${track.name}, ${clip.name}.`);
  }

  function stopTrack(track: ClipTrack) {
    setPlaying((cur) => ({ ...cur, [track.id]: null }));
    setActiveScene(null);
    setLive(`Stopped ${track.name} track.`);
  }

  function launchScene(rowIdx: number) {
    const next: Record<string, string | null> = {};
    let count = 0;
    for (const t of tracks) {
      const c = t.clips[rowIdx] ?? null;
      next[t.id] = c ? c.id : null;
      if (c) count++;
    }
    setPlaying(next);
    setActiveScene(rowIdx);
    setLive(`Launched ${scenes[rowIdx] ?? `Scene ${rowIdx + 1}`}: ${count} ${count === 1 ? "clip" : "clips"} playing.`);
  }

  function stopAll() {
    const next: Record<string, string | null> = {};
    for (const t of tracks) next[t.id] = null;
    setPlaying(next);
    setActiveScene(null);
    setLive("Stopped all clips.");
  }

  return (
    <div
      data-body="rack"
      className={"grid w-full min-w-0 overflow-hidden rounded-surface border border-line-strong bg-surface-1 forced-colors:border " + className}
    >
      {/* Module title bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2 px-3 py-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={"size-2 rounded-pill border border-line-strong " + (playingCount > 0 ? "bg-fg forced-colors:bg-[Highlight]" : "bg-transparent")}
          />
          <span id={headingId} className="text-small font-title text-fg">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-control border border-line bg-canvas px-2 py-0.5 font-mono text-caption tabular-nums text-fg-muted">
            {bpm} BPM
          </span>
          <span className="font-mono text-caption tabular-nums text-fg-subtle">
            {playingCount} / {tracks.length} live
          </span>
          <Button size="sm" variant="secondary" disabled={playingCount === 0} onClick={stopAll}>
            Stop all
          </Button>
        </div>
      </div>

      {/* Scrollable session grid */}
      <div className="overflow-x-auto p-2">
        <div
          role="grid"
          aria-labelledby={headingId}
          onKeyDown={onGridKeyDown}
          onFocus={(e) => {
            const c = cellOf(e.target);
            if (c && (c.r !== stop.r || c.c !== stop.c)) setStop(c);
          }}
          className="grid min-w-[26rem] gap-1"
          style={{ gridTemplateColumns: `repeat(${tracks.length}, minmax(0, 1fr)) minmax(4.75rem, 6rem)` }}
        >
          {/* Track color headers */}
          <div role="row" className="contents">
            {tracks.map((t) => {
              const tone = HUE[t.hue];
              const isTrackLive = Boolean(playing[t.id]);
              return (
                <div
                  key={t.id}
                  role="columnheader"
                  className={"flex items-center justify-between gap-1.5 rounded-control border px-2 py-1.5 " + tone.tint + " " + tone.border}
                >
                  <span className={"truncate text-caption font-title " + tone.text}>{t.name}</span>
                  <span
                    aria-hidden="true"
                    className={"size-1.5 shrink-0 rounded-pill " + (isTrackLive ? tone.bar : "bg-line-strong opacity-60")}
                  />
                </div>
              );
            })}
            <div role="columnheader" className="flex items-center justify-center rounded-control border border-line bg-surface-2 px-2 py-1.5 text-caption font-label text-fg-muted">
              Master
            </div>
          </div>

          {/* Scene rows */}
          {scenes.map((scene, rowIdx) => {
            const isSceneActive = activeScene === rowIdx;
            return (
              <div key={scene} role="row" className="contents">
                {tracks.map((track, colIdx) => {
                  const clip = track.clips[rowIdx] ?? null;
                  const tone = HUE[track.hue];
                  if (!clip) {
                    return (
                      <div key={track.id + rowIdx} role="gridcell" className="grid min-w-0">
                        <button
                          {...cellProps(rowIdx, colIdx)}
                          type="button"
                          aria-label={`Stop ${track.name} in ${scene}`}
                          onClick={() => stopTrack(track)}
                          className="group flex min-h-control-sm min-w-0 cursor-pointer items-center justify-center rounded-control border border-line bg-tray text-fg-subtle transition-colors duration-(--dur-instant) ease-litt pointer-coarse:min-h-control-md hover:border-line-strong hover:text-fg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus forced-colors:border"
                        >
                          <span aria-hidden="true" className="size-2 border border-current opacity-50 group-hover:opacity-100" />
                        </button>
                      </div>
                    );
                  }
                  const isOn = playing[track.id] === clip.id;
                  const wave = miniWave(clip.id);
                  return (
                    <div key={clip.id} role="gridcell" className="grid min-w-0">
                      <button
                        {...cellProps(rowIdx, colIdx)}
                        type="button"
                        aria-pressed={isOn}
                        aria-label={`${track.name}, ${clip.name}, ${clip.bars} bars${isOn ? ", playing" : ""}`}
                        onClick={() => toggleClip(track, clip)}
                        className={
                          "relative flex min-h-control-sm min-w-0 cursor-pointer items-center gap-1.5 overflow-hidden rounded-control border py-1 pr-2 pl-2 text-left transition-colors duration-(--dur-instant) ease-litt pointer-coarse:min-h-control-md " +
                          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus forced-colors:border " +
                          (isOn
                            ? "border-fg bg-fg text-canvas forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
                            : `${tone.tint} ${tone.border} ${tone.text} hover:border-fg`)
                        }
                      >
                        <span aria-hidden="true" className={"absolute inset-y-0 left-0 w-1 " + tone.bar} />
                        <svg aria-hidden="true" viewBox="0 0 12 12" className="size-2.5 shrink-0 fill-current">
                          {isOn ? <rect x="2.5" y="2.5" width="7" height="7" /> : <path d="M3 2v8l7-4z" />}
                        </svg>
                        <span className="line-clamp-2 min-w-0 flex-1 text-caption font-title break-words">{clip.name}</span>
                        <span aria-hidden="true" className="hidden h-3 shrink-0 items-end gap-px sm:inline-flex">
                          {wave.map((pct, k) => (
                            <span
                              key={k}
                              className={"w-0.5 " + (isOn ? "bg-canvas opacity-75" : tone.bar)}
                              style={{ height: `${pct}%` }}
                            />
                          ))}
                        </span>
                      </button>
                    </div>
                  );
                })}

                {/* Master scene launch button */}
                <div role="gridcell" className="grid min-w-0">
                  <button
                    {...cellProps(rowIdx, tracks.length)}
                    type="button"
                    aria-pressed={isSceneActive}
                    aria-label={`Launch scene ${scene}`}
                    onClick={() => launchScene(rowIdx)}
                    className={
                      "flex min-h-control-sm min-w-0 cursor-pointer items-center justify-between gap-1 rounded-control border px-2 text-caption font-title transition-colors duration-(--dur-instant) ease-litt pointer-coarse:min-h-control-md " +
                      "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus forced-colors:border " +
                      (isSceneActive
                        ? "border-fg bg-fg text-canvas forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
                        : "border-line-strong bg-block text-fg hover:bg-(--block-hover)")
                    }
                  >
                    <svg aria-hidden="true" viewBox="0 0 12 12" className="size-2.5 shrink-0 fill-current">
                      <path d="M3 2v8l7-4z" />
                    </svg>
                    <span className="min-w-0 truncate">{scene}</span>
                  </button>
                </div>
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
