/**
 * Rack's object, a module (plans/018, Rack's row; proposals/rack.md, after Ableton Live): a grey device panel in a 1px
 * outline with a title bar, a live value bar readout, and a lane of clips, one per part in the set.
 *
 * - Outer module (`bg-surface-1`, 1px `--line-strong` outline, `rounded-surface`, `overflow-hidden`):
 *   - Title bar (non-focusable): module name, transport indicator dot, and a Rack value bar filled to the
 *     take's place in the set (`--slot` + `--slot-fill` + 2px `--fg` line) beside the tabular count and title.
 *   - Clip lane, under the title bar at every width, so focus runs top to bottom with the eye (plans/audits/rack.md,
 *     finding 7): a dense lane of clips, one per part in the set, each grey (`bg-block`) with a
 *     subtle seeded waveform silhouette in `--fg-subtle`; the active clip cuts cleanly to lit ink (`bg-fg text-canvas`,
 *     as Rack's Tabs do), beside square outlined transport keys. Color is owned, not dealt (plans/audits/rack.md,
 *     finding 4): a clip color in Rack stands for a track inside a take (Drums, Bass, a macro), so the lane, which
 *     holds parts, not tracks, takes none; a hue dealt by place would mean two things on one screen.
 *   - Screen bay: the screen recessed inside a 1px rule, holding the take alone (`rail: false`).
 * - Under a finger the lane's Index and its clips grow to 44px tall, a finger's target (a 44px ::before would be cut off
 *   by the lane's scroller), and the transport keys keep theirs with `litt-target relative`.
 * - Zero accent fill in the body (R6): yellow stays reserved for the take inside the screen; clip colors belong to the
 *   takes' tracks.
 * - Instant cuts only (`duration-(--dur-instant)`), nothing glides.
 * - Index (`RackHome`, plans/audits/rack.md, finding 9) is a session: the set as one column of grey clips on three
 *   tracks, the clip under the keys or the pointer launched in the ink, and its part live in a device panel beside it.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { PartScale, PlayObjectBody, PlayObjectBodyProps, PlayObjectHomeProps } from "../body";
import type { Take } from "../takes";
import { COMPACT_BOX, COMPACT_SCREEN, SCREEN_HEIGHT } from "../body";

/** Deterministic mini-waveform heights (4 bars per clip) seeded from take id. */
function clipBars(id: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return Array.from({ length: 5 }, (_, k) => {
    const v = ((h >>> (k * 5)) & 31) / 31;
    return Math.round((30 + v * 70));
  });
}

const rackKey =
  "litt-target relative inline-flex h-control-sm shrink-0 cursor-pointer items-center justify-center rounded-control bg-block text-fg " +
  "shadow-(--block-lift) transition-colors duration-(--dur-instant) ease-litt " +
  "hover:bg-(--block-hover) active:shadow-(--block-press) " +
  "aria-pressed:bg-fg aria-pressed:text-canvas " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
  "forced-colors:border forced-colors:aria-pressed:bg-[Highlight] forced-colors:aria-pressed:text-[HighlightText]";

function TitleBar({
  readout,
  at,
  n,
  playing,
  compact = false,
  className = "",
}: Pick<PlayObjectBodyProps, "readout"> & { at: number | null; n: number; playing: boolean; compact?: boolean; className?: string }) {
  const fillPct = at === null ? 0 : Math.round(((at + 1) / Math.max(1, n)) * 1000) / 10;
  return (
    <div
      className={
        "flex min-w-0 items-center justify-between gap-3 border-b border-line bg-surface-2 px-3 py-1.5 " +
        className
      }
    >
      <div className="flex shrink-0 items-center gap-2">
        <span
          aria-hidden="true"
          className={
            "size-2 rounded-pill border border-line-strong " +
            (playing ? "bg-fg forced-colors:bg-[Highlight]" : "bg-transparent")
          }
        />
        <span className="text-caption font-label text-fg-muted">Rack</span>
      </div>
      <div {...readout.props} className="flex min-w-0 flex-1 items-center justify-end gap-3">
        {!compact && (
          <span aria-hidden="true" className="relative h-3.5 w-28 shrink-0 overflow-hidden bg-slot shadow-(--slot-shade) forced-colors:border">
            <span className="absolute inset-y-0 left-0 bg-slot-fill forced-colors:bg-[Highlight]" style={{ width: `${fillPct}%` }} />
            <span className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-fg forced-colors:bg-[CanvasText]" style={{ left: `${fillPct}%` }} />
          </span>
        )}
        <span className="min-w-0 truncate text-small font-title text-fg">{readout.title}</span>{" "}
        <span className="shrink-0 font-mono text-caption tabular-nums text-fg-muted">{readout.count}</span>
      </div>
    </div>
  );
}

/* Focus on the selector (finding 6): no ring round the lane, where the clips covered it; while the selector has the keys,
   the chosen clip (or Index) takes a 2px ring in --focus, 2px outside it and drawn over its neighbours, where the eye
   already is. The lane's 4px padding keeps the ring inside its scroller. Under forced colors the outline stays. */
const RING =
  "group-has-[[role=slider]:focus-visible]/lane:z-10 group-has-[[role=slider]:focus-visible]/lane:outline-2 " +
  "group-has-[[role=slider]:focus-visible]/lane:outline-offset-2 group-has-[[role=slider]:focus-visible]/lane:outline-focus";

/* The lane's cut edges (finding 13, as Heat's strip): where the lane has more to scroll, its edge fades out into the
   ground it sits on (`ground`, a `from-*` class), so the set visibly goes on. Drawn over the scroller, never in it; gone
   under forced colors, where the gradient would not hold. */
const CUT = "pointer-events-none absolute inset-y-0 w-8 to-transparent forced-colors:hidden";

function ClipLane({
  takes,
  at,
  selector,
  pick,
  index,
  ground,
}: Pick<PlayObjectBodyProps, "takes" | "at" | "selector" | "pick" | "index"> & { ground: string }) {
  const lane = useRef<HTMLDivElement>(null);
  /* Which ends have more to scroll to. */
  const [more, setMore] = useState({ start: false, end: false });
  const measure = () => {
    const l = lane.current;
    if (!l) return;
    const start = l.scrollLeft > 1;
    const end = l.scrollLeft + l.clientWidth < l.scrollWidth - 1;
    setMore((m) => (m.start === start && m.end === end ? m : { start, end }));
  };
  useEffect(() => {
    const l = lane.current;
    const on = l?.querySelector<HTMLElement>("[data-chosen]");
    if (l && on && l.scrollWidth > l.clientWidth) l.scrollTo({ left: on.offsetLeft - (l.clientWidth - on.offsetWidth) / 2 });
    measure();
  }, [at]);
  useEffect(() => {
    const l = lane.current;
    if (!l || typeof ResizeObserver === "undefined") return;
    const seen = new ResizeObserver(measure);
    seen.observe(l);
    return () => seen.disconnect();
  }, []);

  return (
    <div className="relative flex min-w-0 flex-1">
      <div ref={lane} onScroll={measure} className="group/lane flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto overscroll-x-contain p-1 [scrollbar-width:none]">
        <button
          {...index}
          aria-label={undefined}
          data-chosen={at === null ? "" : undefined}
          className={
            "relative inline-flex h-control-sm shrink-0 cursor-pointer items-center rounded-control px-2.5 text-caption font-title select-none pointer-coarse:h-control-md " +
            "shadow-(--block-lift) transition-colors duration-(--dur-instant) ease-litt " +
            (at === null
              ? "bg-fg text-canvas forced-colors:border forced-colors:bg-[Highlight] forced-colors:text-[HighlightText] " + RING
              : "bg-block text-fg-subtle hover:bg-(--block-hover) hover:text-fg forced-colors:border")
          }
        >
          Index
        </button>
        <div
          {...selector}
          className="flex shrink-0 items-stretch gap-1 outline-none"
        >
          {takes.map((t, i) => {
            const active = i === at;
            const bars = clipBars(t.id);
            return (
              <span
                key={t.id}
                aria-hidden="true"
                data-chosen={active ? "" : undefined}
                onClick={() => pick(i)}
                className={
                  "relative inline-flex h-control-sm shrink-0 cursor-pointer items-center gap-1.5 overflow-hidden rounded-control px-2.5 text-caption font-title whitespace-nowrap select-none pointer-coarse:h-control-md " +
                  "shadow-(--block-lift) transition-colors duration-(--dur-instant) ease-litt forced-colors:border " +
                  (active
                    ? "bg-fg text-canvas forced-colors:bg-[Highlight] forced-colors:text-[HighlightText] " + RING
                    : "bg-block text-fg-muted hover:bg-(--block-hover) hover:text-fg")
                }
              >
                <span aria-hidden="true" className="inline-flex h-3 items-end gap-px">
                  {bars.map((pct, b) => (
                    <span
                      key={b}
                      className={"w-0.5 " + (active ? "bg-canvas opacity-75" : "bg-fg-subtle")}
                      style={{ height: `${pct}%` }}
                    />
                  ))}
                </span>
                <span>{t.title}</span>
              </span>
            );
          })}
        </div>
      </div>
      {more.start && <span aria-hidden="true" data-rack-cut="start" className={CUT + " left-0 bg-linear-to-r " + ground} />}
      {more.end && <span aria-hidden="true" data-rack-cut="end" className={CUT + " right-0 bg-linear-to-l " + ground} />}
    </div>
  );
}

function PlayRackKey({ play, className = "" }: { play: PlayObjectBodyProps["play"]; className?: string }) {
  const on = play["aria-pressed"];
  return (
    <button {...play} className={rackKey + " " + className}>
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 fill-current">
        {on ? <path d="M4 3h3v10H4zM9 3h3v10H9z" /> : <path d="M5 3v10l8-5z" />}
      </svg>
    </button>
  );
}

function RackBody({ takes, at, selector, pick, step, index, play, readout, screen, compact }: PlayObjectBodyProps) {
  const playing = play["aria-pressed"];
  if (compact) {
    return (
      <div className={COMPACT_BOX}>
        <div className="grid shrink-0 border-b border-line-strong bg-surface-1">
          <TitleBar readout={readout} at={at} n={takes.length} playing={playing} compact />
          <div className="flex min-w-0 items-center gap-1.5 px-gutter py-2">
            <ClipLane takes={takes} at={at} selector={selector} pick={pick} index={index} ground="from-surface-1" />
            <PlayRackKey play={play} className="w-control-sm" />
          </div>
        </div>
        {screen}
      </div>
    );
  }
  return (
    <div className="flex w-full min-w-0 flex-col overflow-hidden rounded-surface border border-line-strong bg-surface-1">
      {/* Top to bottom, in the order read and the order tabbed, at every width (finding 7, as Heat's strip): the title
          bar (no tab stop), the clip lane and the transport (the selector, then Play), then the screen. */}
      <TitleBar readout={readout} at={at} n={takes.length} playing={playing} />
      <div data-rack-lane="" className="flex min-w-0 items-center gap-2 border-b border-line bg-surface-2 px-3 py-1">
        <ClipLane takes={takes} at={at} selector={selector} pick={pick} index={index} ground="from-surface-2" />
        <div className="flex shrink-0 items-center gap-1">
          <button {...step(-1)} className={rackKey + " w-control-sm"}>
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3 fill-current">
              <path d="M10.5 3.5 5 8l5.5 4.5z" />
            </svg>
          </button>
          <PlayRackKey play={play} className="w-control-sm" />
          <button {...step(1)} className={rackKey + " w-control-sm"}>
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3 fill-current">
              <path d="M5.5 3.5 11 8l-5.5 4.5z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex bg-canvas p-1.5">
        {screen}
      </div>
    </div>
  );
}

/* Index as a session (plans/audits/rack.md, finding 9): the set is a column of clips on tracks, grouped by what the
   parts are. The tracks are read off the set's order, a run of parts per track, so a set reordered in takes.ts still
   draws. Every part in Rack's set is named here, one id per string (test:playground reads this list and fails on a part
   in SET.rack that no track names); one that slips through still draws, on Controls. */
const TRACKS: { name: string; ids: string[] }[] = [
  { name: "Only here", ids: ["agent-chain", "clip-launcher", "device-rack", "step-sequencer"] },
  { name: "Values", ids: ["slider", "curve-editor", "pad", "time-scrubber", "inspector", "number-field"] },
  { name: "Controls", ids: ["segmented", "switch"] },
];
function trackOf(id: string) {
  const k = TRACKS.findIndex((t) => t.ids.includes(id));
  return k < 0 ? TRACKS.length - 1 : k;
}

/** The set cut into runs of one track each, in the set's order: [track, first index, the takes]. */
function sessionOf(takes: Take[]) {
  const runs: { track: string; from: number; takes: Take[] }[] = [];
  takes.forEach((t, i) => {
    const track = TRACKS[trackOf(t.id)].name;
    const last = runs[runs.length - 1];
    if (last && last.track === track) last.takes.push(t);
    else runs.push({ track, from: i, takes: [t] });
  });
  return runs;
}

/* A clip slot. Clips touch, a 1px rule between them, so the pointer is always on one (test:gaps). The launched clip
   is the ink at once, with no transition: it cuts in on the frame, as a clip launches on the beat. Focus is always on
   the launched clip, and Rack's focus colour is the ink it is filled with, so its ring is drawn 4px inside it in the
   canvas colour, as Live frames the clip it has selected. Under forced colors the launched
   clip is Highlight and its triangle is filled where the others are outlined, so the shape tells it apart too. */
const CLIP =
  "litt-target relative grid h-control-sm w-full min-w-0 cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-line px-2.5 text-left text-caption font-title select-none pointer-coarse:h-control-md " +
  "focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-canvas forced-colors:border-b-[CanvasText] forced-colors:focus-visible:outline-[HighlightText]";
const CLIP_AT_REST = "bg-block text-fg-muted hover:bg-(--block-hover) hover:text-fg";
const CLIP_LAUNCHED = "bg-fg text-canvas forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]";

/* The live part's size: the largest the device panel holds whole, so the part reads as the main thing on the screen.
   It starts from the panel's width and steps down while the part overflows the panel (a tall part, such as the time
   scrubber's cue list), on the frame, before paint, so no size is ever seen to change. */
const SCALES: PartScale[] = [1.5, 1.25, 1];
const startFor = (width: number) => (width >= 760 ? 0 : width >= 600 ? 1 : 2);

function RackHome({ takes, current, list, row, everything, part, compact }: PlayObjectHomeProps) {
  const { children: words, ...link } = everything;
  const runs = sessionOf(takes);
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [box, setBox] = useState({ width: 0, height: 0 });
  /* The panel's content box. Seeded here, in a layout effect, so the re-render at the real size happens before the
     first paint (an observer's first callback lands after it, and its update with it, so the part would paint once
     at the smallest scale and then grow); the observer takes over from there. */
  useLayoutEffect(() => {
    const p = panel.current;
    if (!p) return;
    const keep = (width: number, height: number) => {
      const next = { width: Math.round(width), height: Math.round(height) };
      setBox((b) => (b.width === next.width && b.height === next.height ? b : next));
    };
    const s = getComputedStyle(p);
    keep(
      p.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight),
      p.clientHeight - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom),
    );
    if (typeof ResizeObserver === "undefined") return;
    const seen = new ResizeObserver(([e]) => keep(e.contentRect.width, e.contentRect.height));
    seen.observe(p);
    return () => seen.disconnect();
  }, [compact]);
  /* The steps down from the widest scale, held for one part at one panel size: a new part, or a new size, starts
     again from the widest scale the panel's width allows. */
  const key = `${current}:${box.width}:${box.height}`;
  const [held, setHeld] = useState({ key: "", step: 0 });
  const step = held.key === key ? held.step : startFor(box.width);
  /* Too big for the panel: one step smaller. Checked whenever the part, the panel's size or the step changes, and
     again when the part's own size changes (a part that loads late). */
  useLayoutEffect(() => {
    const p = panel.current;
    if (!p) return;
    const fit = () => {
      const over = p.scrollHeight > p.clientHeight + 1 || p.scrollWidth > p.clientWidth + 1;
      if (over && step < SCALES.length - 1) setHeld({ key, step: step + 1 });
    };
    fit();
    const live = p.firstElementChild;
    if (!live || typeof ResizeObserver === "undefined") return;
    const seen = new ResizeObserver(fit);
    seen.observe(live);
    return () => seen.disconnect();
  }, [key, step]);
  const scale = SCALES[step];
  const cued = takes[current];
  const pad = String(takes.length).length;

  const session = (
    <div className="flex min-h-0 min-w-0 flex-col gap-3">
      <nav {...list} className="min-w-0 overflow-hidden rounded-surface border border-line-strong bg-surface-1 forced-colors:border">
        {runs.map((run, r) => {
          const trackId = `rack-track-${r}`;
          return (
            <div key={run.track + run.from} className={"grid grid-cols-[5.5rem_minmax(0,1fr)] " + (r > 0 ? "border-t border-line-strong" : "")}>
              {/* The track: its name at the head of a column as tall as its clips, as Live's tracks stand. */}
              <div id={trackId} className="border-r border-line bg-surface-2 px-2.5 py-2 text-caption font-label text-fg-muted">
                {run.track}
              </div>
              <ul aria-labelledby={trackId} className="grid min-w-0 [&>li:last-child>button]:border-b-0">
                {run.takes.map((t, k) => {
                  const i = run.from + k;
                  const on = i === current;
                  return (
                    <li key={t.id} className="grid min-w-0">
                      <button {...row(i)} className={CLIP + " " + (on ? CLIP_LAUNCHED : CLIP_AT_REST)}>
                        <svg aria-hidden="true" viewBox="0 0 12 12" className="size-2.5 shrink-0">
                          {on ? (
                            <path d="M3 2v8l7-4z" className="fill-current" />
                          ) : (
                            <path d="M3.5 2.9v6.2L8.9 6z" className="fill-none stroke-current" strokeWidth={1} />
                          )}
                        </svg>
                        <span className="min-w-0 truncate">{t.title}</span>
                        <span aria-hidden="true" className="inline-flex h-3 items-end gap-px">
                          {clipBars(t.id).map((pct, b) => (
                            <span key={b} className={"w-0.5 " + (on ? "bg-canvas opacity-75" : "bg-fg-subtle")} style={{ height: `${pct}%` }} />
                          ))}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
      <a
        {...link}
        className="litt-target relative self-start text-small text-fg underline decoration-line-strong underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {words}
      </a>
    </div>
  );

  if (compact) return <div className="h-full min-h-0 overflow-auto overscroll-contain p-3">{session}</div>;

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,19rem)_minmax(0,1fr)] gap-4 overflow-auto overscroll-contain p-4">
      {session}
      {/* The device panel: the launched clip's part, live, as a device you have just selected, with its line. */}
      <section aria-labelledby={titleId} className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-surface border border-line-strong bg-surface-1 forced-colors:border">
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-line bg-surface-2 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span aria-hidden="true" className="size-2 shrink-0 rounded-pill bg-fg forced-colors:bg-[CanvasText]" />
            <span id={titleId} className="min-w-0 truncate text-small font-title text-fg">{cued?.title}</span>
          </div>
          <span className="shrink-0 text-caption text-fg-muted">
            {cued ? TRACKS[trackOf(cued.id)].name : ""} <span className="font-mono tabular-nums">{String(current + 1).padStart(pad, "0")}</span>
          </span>
        </div>
        <div ref={panel} className="grid min-h-0 flex-1 place-items-center overflow-auto overscroll-contain p-4">
          {part({ scale, className: "self-center" })}
        </div>
        <p className="border-t border-line bg-surface-2 px-3 py-2 text-small text-fg-muted">{cued?.lede}</p>
      </section>
    </div>
  );
}

export const rack: PlayObjectBody = {
  name: "rack",
  shape: (compact) => (compact ? COMPACT_SCREEN : SCREEN_HEIGHT + " w-full rounded-control"),
  rail: false,
  Body: RackBody,
  Home: RackHome,
  /* On a phone the session stands alone: a touch opens the take, and with no pointer to hover there, a part above the
     list would only ever show the first clip while pushing the clips down the screen. */
  phonePart: "none",
};
