/**
 * Plain's object, a document (plans/018, Plain's row; proposals/plain.md, Quiet): one 1px line around the page, and
 * nothing else. No fills, no shadows, no frames, no motion.
 *
 * - Above the page: a single quiet running header line with the tabular count and the take's title.
 * - The page: one crisp square 1px line around the screen (`border-line-control`), holding the take alone (`rail: false`).
 * - Below the page: a row of quiet words (Index, then the set); only the current word takes the ink inside four 4px
 *   corner marks, matching Plain's Tabs and Segmented bodies. Play sits at the row's end as a word, bracketed while on.
 * - DOM puts the controls (selector, then Play) before the screen, and the non-focusable header last, so Tab reaches
 *   slider -> play -> screen while flex order stacks header -> page -> controls.
 */
import { useEffect, useRef } from "react";
import type { PlayObjectBody, PlayObjectBodyProps } from "../body";
import { COMPACT_BOX, COMPACT_SCREEN, SCREEN_HEIGHT } from "../body";

/* Four corner marks, each two 1px bars 4px long, in currentColor (after worlds/plain/tabs.tsx). */
const BRACKETS =
  "pointer-events-none absolute -inset-x-2 -inset-y-1 bg-no-repeat " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:4px_1px,1px_4px,4px_1px,1px_4px,4px_1px,1px_4px,4px_1px,1px_4px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

const WORD =
  "litt-target relative inline-flex h-control-sm shrink-0 cursor-pointer items-center px-3 text-small font-normal whitespace-nowrap select-none " +
  "pointer-coarse:h-control-md focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

function WordRow({ takes, at, selector, pick, index, className = "" }: Pick<PlayObjectBodyProps, "takes" | "at" | "selector" | "pick" | "index"> & { className?: string }) {
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const r = row.current;
    const on = r?.querySelector<HTMLElement>("[data-chosen]");
    if (!r || !on || r.scrollWidth <= r.clientWidth) return;
    r.scrollTo({ left: on.offsetLeft - (r.clientWidth - on.offsetWidth) / 2 });
  }, [at]);

  return (
    <div ref={row} className={"-mx-3 flex min-w-0 flex-1 items-center overflow-x-auto overscroll-x-contain [scrollbar-width:none] " + className}>
      <button
        {...index}
        aria-label={undefined}
        data-chosen={at === null ? "" : undefined}
        className={
          WORD +
          " " +
          (at === null
            ? "text-fg forced-colors:outline-2 forced-colors:-outline-offset-2 forced-colors:outline-[Highlight]"
            : "text-fg-muted hover:text-fg")
        }
      >
        <span className="litt-trim relative">
          {at === null && <span aria-hidden="true" className={BRACKETS} />}
          Index
        </span>
      </button>
      <div
        {...selector}
        className="flex shrink-0 items-center focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
      >
        {takes.map((t, i) => {
          const active = i === at;
          return (
            <span
              key={t.id}
              aria-hidden="true"
              data-chosen={active ? "" : undefined}
              onClick={() => pick(i)}
              className={
                WORD +
                " " +
                (active
                  ? "text-fg forced-colors:outline-2 forced-colors:-outline-offset-2 forced-colors:outline-[Highlight]"
                  : "text-fg-muted hover:text-fg")
              }
            >
              <span className="litt-trim relative">
                {active && <span aria-hidden="true" className={BRACKETS} />}
                {t.title}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function PlayWord({ play }: { play: PlayObjectBodyProps["play"] }) {
  const on = play["aria-pressed"];
  return (
    <button
      {...play}
      className={
        WORD +
        " shrink-0 " +
        (on
          ? "text-fg forced-colors:outline-2 forced-colors:-outline-offset-2 forced-colors:outline-[Highlight]"
          : "text-fg-muted hover:text-fg")
      }
    >
      <span className="litt-trim relative">
        {on && <span aria-hidden="true" className={BRACKETS} />}
        Play
      </span>
    </button>
  );
}

function HeaderLine({ readout, className = "" }: Pick<PlayObjectBodyProps, "readout"> & { className?: string }) {
  return (
    <div {...readout.props} className={"flex min-w-0 items-baseline justify-between gap-4 text-small " + className}>
      <span className="min-w-0 truncate font-title text-fg">{readout.title}</span>{" "}
      <span className="shrink-0 font-mono text-caption tabular-nums text-fg-muted">{readout.count}</span>
    </div>
  );
}

function PlainBody({ takes, at, selector, pick, index, play, readout, screen, compact }: PlayObjectBodyProps) {
  if (compact) {
    return (
      <div className={COMPACT_BOX}>
        <div className="grid shrink-0 gap-1 border-b border-line-control px-gutter py-2">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <HeaderLine readout={readout} className="min-w-0 flex-1" />
            <PlayWord play={play} />
          </div>
          <WordRow takes={takes} at={at} selector={selector} pick={pick} index={index} />
        </div>
        {screen}
      </div>
    );
  }
  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      {/* DOM order: controls (selector -> Play) first, then screen, then non-focusable header line. */}
      <div className="order-3 flex min-w-0 items-center justify-between gap-4">
        <WordRow takes={takes} at={at} selector={selector} pick={pick} index={index} />
        <PlayWord play={play} />
      </div>
      <div className="order-2 flex border border-line-control bg-canvas forced-colors:border">
        {screen}
      </div>
      <HeaderLine readout={readout} className="order-1" />
    </div>
  );
}

export const plain: PlayObjectBody = {
  name: "plain",
  shape: (compact) => (compact ? COMPACT_SCREEN : SCREEN_HEIGHT + " w-full rounded-none"),
  rail: false,
  Body: PlainBody,
};
