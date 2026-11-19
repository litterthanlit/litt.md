/**
 * Rack's object, a module (plans/018, Rack's row; proposals/rack.md, after Ableton Live): a grey device panel in a 1px
 * outline with a title bar, a live value bar readout, and a lane of color-coded clips.
 *
 * - Outer module (`bg-surface-1`, 1px `--line-strong` outline, `rounded-surface`, `overflow-hidden`):
 *   - Title bar (`order-1`, non-focusable): module name, transport indicator dot, and a Rack value bar filled to the
 *     take's place in the set (`--slot` + `--slot-fill` + 2px `--fg` line) beside the tabular count and title.
 *   - Screen bay (`order-2`): the screen recessed inside a 1px rule, holding the take alone (`rail: false`).
 *   - Clip lane (`order-3`, DOM child 1): a dense lane of clips in Rack's five clip colors (`--data-*-tint` / `-text` /
 *     mark), each with a subtle seeded waveform silhouette; the active clip cuts cleanly to lit ink (`bg-fg text-canvas`,
 *     as Rack's Tabs do), beside square outlined transport keys.
 * - Zero accent fill in the body (R6): yellow stays reserved for the take inside the screen; clip colors belong to data.
 * - Instant cuts only (`duration-(--dur-instant)`), nothing glides.
 */
import { useEffect, useRef } from "react";
import type { PlayObjectBody, PlayObjectBodyProps } from "../body";
import { COMPACT_BOX, COMPACT_SCREEN, SCREEN_HEIGHT } from "../body";

const CLIP_HUES = [
  { bg: "bg-data-amber-tint", ink: "text-data-amber-text", bar: "bg-data-amber" },
  { bg: "bg-data-blue-tint", ink: "text-data-blue-text", bar: "bg-data-blue" },
  { bg: "bg-data-teal-tint", ink: "text-data-teal-text", bar: "bg-data-teal" },
  { bg: "bg-data-violet-tint", ink: "text-data-violet-text", bar: "bg-data-violet" },
  { bg: "bg-data-rose-tint", ink: "text-data-rose-text", bar: "bg-data-rose" },
] as const;

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
  "litt-target inline-flex h-control-sm shrink-0 cursor-pointer items-center justify-center rounded-control bg-block text-fg " +
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

function ClipLane({ takes, at, selector, pick, index }: Pick<PlayObjectBodyProps, "takes" | "at" | "selector" | "pick" | "index">) {
  const lane = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const l = lane.current;
    const on = l?.querySelector<HTMLElement>("[data-chosen]");
    if (!l || !on || l.scrollWidth <= l.clientWidth) return;
    l.scrollTo({ left: on.offsetLeft - (l.clientWidth - on.offsetWidth) / 2 });
  }, [at]);

  return (
    <div ref={lane} className="flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto overscroll-x-contain py-0.5 [scrollbar-width:none]">
      <button
        {...index}
        aria-label={undefined}
        data-chosen={at === null ? "" : undefined}
        className={
          "inline-flex h-control-sm shrink-0 cursor-pointer items-center rounded-control px-2.5 text-caption font-title select-none " +
          "shadow-(--block-lift) transition-colors duration-(--dur-instant) ease-litt " +
          (at === null
            ? "bg-fg text-canvas forced-colors:border forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
            : "bg-block text-fg-subtle hover:bg-(--block-hover) hover:text-fg forced-colors:border")
        }
      >
        Home
      </button>
      <div
        {...selector}
        className="flex shrink-0 items-stretch gap-1 rounded-control focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
      >
        {takes.map((t, i) => {
          const active = i === at;
          const hue = CLIP_HUES[i % CLIP_HUES.length]!;
          const bars = clipBars(t.id);
          return (
            <span
              key={t.id}
              aria-hidden="true"
              data-chosen={active ? "" : undefined}
              onClick={() => pick(i)}
              className={
                "relative inline-flex h-control-sm shrink-0 cursor-pointer items-center gap-1.5 overflow-hidden rounded-control px-2.5 text-caption font-title whitespace-nowrap select-none " +
                "shadow-(--block-lift) transition-colors duration-(--dur-instant) ease-litt forced-colors:border " +
                (active
                  ? "bg-fg text-canvas forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
                  : `${hue.bg} ${hue.ink} hover:shadow-(--block-press)`)
              }
            >
              <span aria-hidden="true" className="inline-flex h-3 items-end gap-px">
                {bars.map((pct, b) => (
                  <span
                    key={b}
                    className={"w-0.5 " + (active ? "bg-canvas opacity-75" : hue.bar)}
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
            <ClipLane takes={takes} at={at} selector={selector} pick={pick} index={index} />
            <PlayRackKey play={play} className="w-control-sm" />
          </div>
        </div>
        {screen}
      </div>
    );
  }
  return (
    <div className="flex w-full min-w-0 flex-col overflow-hidden rounded-surface bg-surface-1 shadow-[inset_0_0_0_1px_var(--line-strong)] forced-colors:border">
      {/* DOM order: clip lane + transport (selector -> Play) first, then screen, then non-focusable title bar. */}
      <div className="order-3 flex min-w-0 items-center gap-2 border-t border-line bg-surface-2 px-3 py-2">
        <ClipLane takes={takes} at={at} selector={selector} pick={pick} index={index} />
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
      <div className="order-2 flex bg-canvas p-1.5">
        {screen}
      </div>
      <TitleBar readout={readout} at={at} n={takes.length} playing={playing} className="order-1" />
    </div>
  );
}

export const rack: PlayObjectBody = {
  name: "rack",
  shape: (compact) => (compact ? COMPACT_SCREEN : SCREEN_HEIGHT + " w-full rounded-control"),
  rail: false,
  Body: RackBody,
};
