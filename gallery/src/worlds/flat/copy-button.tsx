/**
 * Copy button, the Flat body (taste v1.22, "Flat is the studies"; the Flat studies, Copy button): the command in a
 * white pill on the grey ground, and the ink circle that copies it at the pill's end.
 *
 * - The pill: white paper (`bg-surface-1`, no edge and nothing cast) at the pill radius, 52px tall (60 from the sm
 *   breakpoint). The command sits in the mono after a muted `$`, cut with an ellipsis when it runs long; the full
 *   command is real text for a screen reader.
 * - The key: an ink circle (`bg-fg`) with the copy glyph in the paper's colour. A press shrinks it to --press-scale on
 *   the instant tier.
 * - Copied: the glyph crossfades to a check that draws itself, and the line swaps in Flat's way. The command leaves
 *   upward with no bounce while "Copied to clipboard" rises into its place on the expressive spring; when the hold ends
 *   they swap back, the command arriving from below. One thing moves at a time. A failed copy says so on the line.
 * - Nothing moves on its own (R4). Under reduced motion the line swaps at once and the check is simply there.
 */
import { AnimatePresence, animate, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { useExit, useMotionDial, useTransition } from "@/motion";
import type { CopyButtonBodyProps } from "@/components/copy-button";

const GLYPH = "col-start-1 row-start-1 size-4.5 transition-[opacity,scale] duration-(--dur-responsive) ease-responsive";

export function CopyButtonFlatBody({ label, shown, state, onPress, className }: CopyButtonBodyProps) {
  const { reduced } = useMotionDial();
  const arrive = useTransition("expressive");
  const leave = useExit("responsive");
  const draw = useTransition("responsive");
  const check = useRef<SVGPathElement>(null);
  const done = state === "copied";

  /* The check draws in when the key says Copied, as Device's does: its stroke offset runs from 1 to 0. */
  useEffect(() => {
    const path = check.current;
    if (!done || !path) return;
    if (reduced) {
      path.style.strokeDashoffset = "0";
      return;
    }
    const run = animate(path, { strokeDashoffset: [1, 0] }, draw);
    return () => {
      run.stop();
      path.style.strokeDashoffset = "";
    };
  }, [done, reduced, draw]);

  const line = state === "idle" ? "command" : state;
  return (
    <span
      className={
        "inline-flex h-13 w-full max-w-md min-w-0 items-center gap-3 rounded-pill bg-surface-1 ps-6 pe-2 text-fg select-none forced-colors:border sm:h-15 " +
        className
      }
    >
      <span className="relative grid h-full min-w-0 flex-1 items-center overflow-hidden text-body">
        <AnimatePresence initial={false}>
          <motion.span
            key={line}
            initial={reduced ? false : { y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: arrive }}
            exit={{ y: reduced ? 0 : -14, opacity: 0, transition: leave }}
            className="col-start-1 row-start-1 flex min-w-0 items-center gap-2.5"
          >
            {line === "command" ? (
              <>
                <span aria-hidden="true" className="text-fg-muted">
                  $
                </span>
                <code className="min-w-0 truncate font-mono text-fg">{shown}</code>
              </>
            ) : (
              <span aria-hidden="true" className="truncate font-label">
                {line === "copied" ? "Copied to clipboard" : "Copy failed: select it by hand"}
              </span>
            )}
          </motion.span>
        </AnimatePresence>
      </span>

      <button
        type="button"
        aria-label={label}
        onClick={onPress}
        className={
          "litt-target relative grid size-11 shrink-0 cursor-pointer place-items-center rounded-pill bg-fg text-canvas forced-colors:border forced-colors:text-[ButtonText] sm:size-12 " +
          "transition-transform duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] active:scale-[var(--press-scale)] " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        }
      >
        <span aria-hidden="true" className="grid place-items-center">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" className={GLYPH + (done ? " scale-80 opacity-0" : " scale-100 opacity-100")}>
            <rect x="5.5" y="5.5" width="8" height="8" rx="2" />
            <path d="M10.5 3.5v-.25A1.75 1.75 0 0 0 8.75 1.5h-5.5A1.75 1.75 0 0 0 1.5 3.25v5.5c0 .97.78 1.75 1.75 1.75h.25" />
          </svg>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={GLYPH + (done ? " scale-100 opacity-100" : " scale-80 opacity-0")}>
            <path ref={check} d="m3 8.5 3.2 3L13 4.5" pathLength={1} strokeDasharray={1} strokeDashoffset={1} />
          </svg>
        </span>
      </button>
    </span>
  );
}
