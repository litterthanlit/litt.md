/**
 * Press's object, a bench instrument (plans/018, Press's row; taste/litt-principles.md, Press): a warm stone plate that
 * stands on the page and casts, lit along its top edge, holding the screen as a window cut into the casing.
 *
 * - The plate (`bg-surface-1`, lit top edge `--highlight` + `--plate-lift`, `rounded-surface`) holds the screen inside
 *   a subtle cut bay (`bg-tray`, `--tray-shade`) at concentric radius, with no rail inside the screen (`rail: false`).
 * - Under the screen, the instrument deck:
 *   - Readout: a value, so it is set into the plate as a cut (`bg-cut`, `--cut-shade` inside a `--line` hairline), not
 *     raised: in Press raised means press, and the readout does nothing when pressed (plans/audits/press.md,
 *     finding 7). It carries the tabular count and the take's title.
 *   - Selector: a recessed tray (`bg-tray`, `--tray-shade`) holding Index and the 12 takes as stepped blocks; the
 *     current take stands up as a raised block (`bg-block`, `--block-lift`), and dragging along the tray scrubs takes.
 *   - Transport: tactile raised blocks for Previous, Play (sinks into the tray while running) and Next.
 * - No accent fill in the body (R6): the take on the screen holds the view's one primary fill.
 * - DOM puts the deck (selector, then Play) before the screen so Tab reaches slider -> play -> screen; flex order puts
 *   the screen on top.
 */
import type { PlayObjectBody, PlayObjectBodyProps } from "../body";
import { COMPACT_BOX, COMPACT_SCREEN, SCREEN_HEIGHT } from "../body";
import { useScrub } from "../scrub";

const keyBase =
  "litt-target relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-control bg-block text-fg " +
  "shadow-[var(--highlight),var(--block-lift)] transition-[background-color,box-shadow,transform] duration-(--dur-instant) ease-litt " +
  "hover:bg-(--block-hover) active:shadow-(--block-press) active:[transform:translateY(var(--press-depth))] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border";

const keyLatched =
  "aria-pressed:bg-tray aria-pressed:shadow-(--tray-shade) aria-pressed:[transform:translateY(var(--press-depth))] " +
  "forced-colors:aria-pressed:border-[Highlight]";

function Readout({ readout, compact = false, className = "" }: Pick<PlayObjectBodyProps, "readout"> & { compact?: boolean; className?: string }) {
  return (
    <div
      {...readout.props}
      data-part="cut"
      className={
        "flex min-w-0 items-baseline gap-2.5 rounded-control bg-cut text-fg shadow-[inset_0_0_0_1px_var(--line),var(--cut-shade)] forced-colors:border " +
        (compact ? "px-2.5 py-1.5" : "px-3.5 py-2") +
        " " +
        className
      }
    >
      <span className="shrink-0 font-mono text-caption tabular-nums text-fg-muted">{readout.count}</span>{" "}
      <span className="min-w-0 truncate text-small font-title text-fg">{readout.title}</span>
    </div>
  );
}

function TraySelector({ takes, at, selector, pick, index, compact = false }: Pick<PlayObjectBodyProps, "takes" | "at" | "selector" | "pick" | "index"> & { compact?: boolean }) {
  const n = takes.length;
  const scrub = useScrub(n, pick);
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1 rounded-control bg-tray p-0.5 shadow-(--tray-shade) forced-colors:border">
      <button
        {...index}
        aria-label={undefined}
        title="Index"
        className={
          "inline-flex h-7 shrink-0 cursor-pointer items-center justify-center rounded-[calc(var(--radius-control)-2px)] px-2 text-caption font-title select-none " +
          "transition-[background-color,color,box-shadow] duration-(--dur-instant) ease-litt " +
          (at === null
            ? "bg-block text-fg shadow-[var(--highlight),var(--block-lift)] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
            : "text-fg-muted hover:text-fg")
        }
      >
        Index
      </button>
      <div
        {...selector}
        onPointerDown={scrub}
        className={
          "grid min-w-0 flex-1 cursor-ew-resize touch-pan-y grid-flow-col auto-cols-fr items-stretch gap-0.5 rounded-[calc(var(--radius-control)-2px)] select-none " +
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
        }
      >
        {takes.map((t, i) => {
          const active = i === at;
          return (
            <span
              key={t.id}
              aria-hidden="true"
              title={t.title}
              onClick={() => pick(i)}
              className={
                "grid h-7 min-w-0 place-items-center rounded-[calc(var(--radius-control)-2px)] font-mono text-caption tabular-nums " +
                "transition-[background-color,color,box-shadow] duration-(--dur-instant) ease-litt " +
                (active
                  ? "bg-block font-title text-fg shadow-[var(--highlight),var(--block-lift)] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
                  : "text-fg-subtle hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg")
              }
            >
              {compact ? <span className={"h-2 w-0.5 " + (active ? "bg-fg" : "bg-line-strong")} /> : String(i + 1).padStart(2, "0")}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function PlayBlock({ play, className = "" }: { play: PlayObjectBodyProps["play"]; className?: string }) {
  const on = play["aria-pressed"];
  return (
    <button {...play} className={keyBase + " " + keyLatched + " gap-1.5 text-small font-title " + className}>
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 fill-current">
        {on ? <path d="M4 3h3v10H4zM9 3h3v10H9z" /> : <path d="M5 3v10l8-5z" />}
      </svg>
    </button>
  );
}

function PressBody({ takes, at, selector, pick, step, index, play, readout, screen, compact }: PlayObjectBodyProps) {
  if (compact) {
    return (
      <div className={COMPACT_BOX}>
        <div className="grid shrink-0 gap-2 border-b border-line bg-surface-1 px-gutter py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <Readout readout={readout} compact className="min-w-0 flex-1" />
            <PlayBlock play={play} className="size-9" />
          </div>
          <TraySelector takes={takes} at={at} selector={selector} pick={pick} index={index} compact />
        </div>
        {screen}
      </div>
    );
  }
  return (
    <div className="flex w-full min-w-0 flex-col gap-3 rounded-surface bg-surface-1 p-3 shadow-[var(--highlight),var(--plate-lift)] forced-colors:border">
      {/* DOM order: deck (selector, then Play) before screen so Tab reaches slider -> play -> screen. */}
      <div className="order-2 flex min-w-0 flex-wrap items-center gap-3">
        <Readout readout={readout} className="w-48 shrink-0" />
        <TraySelector takes={takes} at={at} selector={selector} pick={pick} index={index} />
        <div className="flex shrink-0 items-center gap-1.5">
          <button {...step(-1)} className={keyBase + " size-control-sm"}>
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3 fill-current">
              <path d="M10.5 3.5 5 8l5.5 4.5z" />
            </svg>
          </button>
          <PlayBlock play={play} className="size-control-sm" />
          <button {...step(1)} className={keyBase + " size-control-sm"}>
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3 fill-current">
              <path d="M5.5 3.5 11 8l-5.5 4.5z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="order-1 flex rounded-control bg-tray p-0.5 shadow-(--tray-shade) forced-colors:border">
        {screen}
      </div>
    </div>
  );
}

export const press: PlayObjectBody = {
  name: "press",
  shape: (compact) => (compact ? COMPACT_SCREEN : SCREEN_HEIGHT + " w-full rounded-[calc(var(--radius-control)-2px)]"),
  rail: false,
  Body: PressBody,
};
