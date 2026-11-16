/**
 * The bare body: the fallback for a world with no object yet, or one whose body did not load (plans/018). The screen
 * as a plain window, and under it one line: the readout, a thin track with a tick per component, and Previous, Play
 * and Next as words. No world's materials: it is what an object looks like before it is drawn.
 */
import type { PlayObjectBody, PlayObjectBodyProps } from "../body";
import { COMPACT_BOX, COMPACT_SCREEN, SCREEN_HEIGHT } from "../body";
import { useScrub } from "../scrub";

const word =
  "litt-target inline-flex h-control-sm shrink-0 cursor-pointer items-center rounded-control px-2 text-small text-fg-muted " +
  "hover:text-fg aria-pressed:text-fg aria-pressed:underline aria-pressed:underline-offset-4 pointer-coarse:h-control-md " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

function Track({ n, at, shelves, selector, pick }: { n: number; at: number | null; shelves: PlayObjectBodyProps["shelves"]; selector: PlayObjectBodyProps["selector"]; pick: PlayObjectBodyProps["pick"] }) {
  const scrub = useScrub(n, pick);
  return (
    <div
      {...selector}
      onPointerDown={scrub}
      className="relative h-control-sm min-w-0 flex-1 cursor-ew-resize touch-pan-y rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus pointer-coarse:h-control-md"
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-line-strong" />
      {/* A short tick where each group starts. */}
      {shelves.slice(1).map((s) => (
        <span key={s.group} aria-hidden="true" className="absolute top-1/4 bottom-1/4 w-px bg-line-strong" style={{ left: `${(s.from / n) * 100}%` }} />
      ))}
      {at !== null && <span aria-hidden="true" className="absolute top-1 bottom-1 w-0.5 bg-fg forced-colors:bg-[CanvasText]" style={{ left: `${((at + 0.5) / n) * 100}%` }} />}
    </div>
  );
}

function Line(p: PlayObjectBodyProps & { className: string }) {
  return (
    <div className={"flex min-w-0 items-center gap-3 " + p.className}>
      <span {...p.readout.props} className="shrink-0 text-small text-fg">
        <span className="font-mono tabular-nums text-fg-muted">{p.readout.count}</span> {p.readout.group && <span className="text-fg-subtle">{p.readout.group} ·</span>} {p.readout.title}
      </span>
      <Track n={p.takes.length} at={p.at} shelves={p.shelves} selector={p.selector} pick={p.pick} />
      <button {...p.step(-1)} className={word + " max-sm:hidden"}>
        Previous
      </button>
      <button {...p.play} className={word}>
        Play
      </button>
      <button {...p.step(1)} className={word + " max-sm:hidden"}>
        Next
      </button>
    </div>
  );
}

function BareBody(p: PlayObjectBodyProps) {
  if (p.compact) {
    return (
      <div className={COMPACT_BOX}>
        <Line {...p} className="shrink-0 border-b border-line px-gutter py-1" />
        {p.screen}
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <Line {...p} className="order-2" />
      <div className="order-1 flex">{p.screen}</div>
    </div>
  );
}

export const bare: PlayObjectBody = {
  name: "bare",
  shape: (compact) => (compact ? COMPACT_SCREEN : SCREEN_HEIGHT + " w-full rounded-surface outline-1 -outline-offset-1 outline-line"),
  Body: BareBody,
};
