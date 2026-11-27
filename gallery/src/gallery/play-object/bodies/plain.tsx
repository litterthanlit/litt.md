/**
 * Plain's object, a document (plans/018, Plain's row; proposals/plain-studies.md, Subtraction): open white paper
 * framed by single 1px horizontal rules, Helvetica Neue tabular counts, and gliding four-corner brackets.
 *
 * - Above the page: a quiet running header line with the take's title and its tabular count in Helvetica Neue.
 * - The page: open `--canvas` between two crisp 1px horizontal rules (`border-y border-line-control`), holding the take
 *   alone (`rail: false`) without a heavy 4-sided box.
 * - Below the page: a row of quiet words (Index, then the set); the current word takes `--fg` inside four gliding 4px
 *   corner marks (`200ms` zero-bounce spring). Play sits at the row's end as a word, bracketed while on.
 * - DOM puts the controls (selector, then Play) before the screen, and the non-focusable header last, so Tab reaches
 *   slider -> play -> screen while flex order stacks header -> page -> controls.
 */
import { useEffect, useId, useRef } from "react";
import { LayoutGroup, motion, type Transition } from "motion/react";
import { useTransition } from "@/motion";
import type { PlayObjectBody, PlayObjectBodyProps } from "../body";
import { COMPACT_BOX, COMPACT_SCREEN, SCREEN_HEIGHT } from "../body";

const corner = "pointer-events-none absolute size-1 border-current";

/* Static 4px corner marks for the Play toggle, separate from the gliding take selector. */
const PLAY_BRACKETS =
  "pointer-events-none absolute -inset-x-2 -inset-y-1 bg-no-repeat " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:4px_1px,1px_4px,4px_1px,1px_4px,4px_1px,1px_4px,4px_1px,1px_4px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

const WORD =
  "litt-target relative inline-flex h-control-sm shrink-0 cursor-pointer items-center px-3 text-small font-normal whitespace-nowrap select-none " +
  "transition-colors duration-(--dur-instant) ease-litt pointer-coarse:h-control-md focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

function GlidingCorners({ enter }: { enter: Transition }) {
  return (
    <>
      <motion.span layoutId="play-plain-tl" transition={enter} aria-hidden="true" className={corner + " -top-1 -left-2 border-t border-l"} />
      <motion.span layoutId="play-plain-tr" transition={enter} aria-hidden="true" className={corner + " -top-1 -right-2 border-t border-r"} />
      <motion.span layoutId="play-plain-bl" transition={enter} aria-hidden="true" className={corner + " -bottom-1 -left-2 border-b border-l"} />
      <motion.span layoutId="play-plain-br" transition={enter} aria-hidden="true" className={corner + " -bottom-1 -right-2 border-b border-r"} />
    </>
  );
}

function WordRow({ takes, at, selector, pick, index, className = "" }: Pick<PlayObjectBodyProps, "takes" | "at" | "selector" | "pick" | "index"> & { className?: string }) {
  const row = useRef<HTMLDivElement>(null);
  const groupId = useId();
  const enter = useTransition("responsive");
  useEffect(() => {
    const r = row.current;
    const on = r?.querySelector<HTMLElement>("[data-chosen]");
    if (!r || !on || r.scrollWidth <= r.clientWidth) return;
    r.scrollTo({ left: on.offsetLeft - (r.clientWidth - on.offsetWidth) / 2 });
  }, [at]);

  return (
    <LayoutGroup id={groupId}>
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
            {at === null && <GlidingCorners enter={enter} />}
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
                  {active && <GlidingCorners enter={enter} />}
                  {t.title}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </LayoutGroup>
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
        {on && <span aria-hidden="true" className={PLAY_BRACKETS} />}
        Play
      </span>
    </button>
  );
}

function HeaderLine({ readout, className = "" }: Pick<PlayObjectBodyProps, "readout"> & { className?: string }) {
  return (
    <div {...readout.props} className={"flex min-w-0 items-baseline justify-between gap-4 text-small " + className}>
      <span className="min-w-0 truncate font-title text-fg">{readout.title}</span>{" "}
      <span className="shrink-0 text-caption font-normal tabular-nums text-fg-muted">{readout.count}</span>
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
      <div className="order-2 flex border-y border-line-control bg-canvas forced-colors:border">
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
