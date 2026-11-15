/**
 * The bare body: the fallback for a world with no object yet (plans/018). Today's phone screen, with the takes as a
 * plain row of words above it and the readout at the row's start. No world's materials: it is what an object looks
 * like before it is drawn.
 */
import type { PlayObjectBody, PlayObjectBodyProps } from "../body";
import { COMPACT_BOX, COMPACT_SCREEN, OBJECT_HEIGHT } from "../body";

const word =
  "litt-target relative h-control-sm shrink-0 cursor-pointer rounded-control px-2 text-small whitespace-nowrap text-fg-subtle " +
  "hover:text-fg aria-selected:text-fg aria-selected:underline aria-selected:underline-offset-4 pointer-coarse:h-control-md " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

function Row({ takes, selector, tab, readout, className }: Pick<PlayObjectBodyProps, "takes" | "selector" | "tab" | "readout"> & { className: string }) {
  return (
    <div className={"flex min-w-0 items-center gap-3 " + className}>
      <span {...readout.props} className="shrink-0 font-mono text-caption tabular-nums text-fg-muted">
        {readout.count}
      </span>
      <div {...selector} className="flex min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
        {takes.map((t, i) => (
          <button key={t.id} type="button" {...tab(i)} className={word}>
            {t.title}
          </button>
        ))}
      </div>
    </div>
  );
}

function BareBody({ takes, selector, tab, readout, screen, compact }: PlayObjectBodyProps) {
  if (compact) {
    return (
      <div className={COMPACT_BOX}>
        <Row takes={takes} selector={selector} tab={tab} readout={readout} className="shrink-0 border-b border-line px-gutter py-1" />
        {screen}
      </div>
    );
  }
  return (
    <div className={"mx-auto flex w-full max-w-sm flex-col gap-2 " + OBJECT_HEIGHT}>
      <Row takes={takes} selector={selector} tab={tab} readout={readout} className="shrink-0" />
      {screen}
    </div>
  );
}

export const bare: PlayObjectBody = {
  name: "bare",
  shape: (compact) => (compact ? COMPACT_SCREEN : "min-h-0 w-full flex-1 rounded-surface outline-1 -outline-offset-1 outline-line"),
  Body: BareBody,
};
