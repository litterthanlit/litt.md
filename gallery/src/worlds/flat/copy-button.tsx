/**
 * CopyButton, Flat's body (plans/027): subtract all hardware chrome, leave only the line and one pill on white paper.
 *
 * - Material order (Ground -> Paper -> Part): a borderless white paper card (`litt-paper rounded-surface bg-surface-1`,
 *   `data-part="paper"`) carrying the selectable text line (`data-part="lettering"`) on the left and a single pill
 *   button on the right.
 * - At rest: Flat's single primary ink pill (`bg-accent text-accent-fg`, `data-part="ink"`) with the Copy icon and the
 *   word "Copy". Pressing answers immediately on pointerdown (`whileTap={{ scale: 0.96 }}` on the instant tier).
 * - Copied (1.8s hold): the line briefly dips and settles on the expressive spring while the pill flips into a soft
 *   teal confirmation (`data-part="bubble"`) with a drawing SVG check (`data-part="mark"`, `stroke-data-teal`) and the
 *   word "Copied".
 * - One arrival on first view (`useInView({ once: true })`) gently settles the card on the expressive spring, then
 *   stays still. Reduced motion skips the arrival, the dip, and the check draw.
 * - Accessibility: clipboard write with selection fallback, polite `sr-only` live region announcing "Copied" or
 *   "Select the text to copy", 44px touch target via `litt-target relative`, and forced-colors borders.
 */
import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, type AnimationPlaybackControls } from "motion/react";
import type { CopyButtonProps } from "@/components/copy-button";
import { CopyIcon } from "@/components/icons";
import { useMotionDial, useTransition } from "@/motion";

const HOLD_MS = 1800;

/** Fallback clipboard copy for contexts without navigator.clipboard.writeText. */
function copyBySelection(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    area.remove();
  }
}

/** Flat's CopyButton: white paper card, selectable line, and a single ink pill that flips to teal Copied. */
export function CopyButtonFlat({ text, label = "Copy command", command, className = "" }: CopyButtonProps) {
  const shown = command ?? text;
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const { reduced } = useMotionDial();
  const instant = useTransition("instant");
  const expressive = useTransition("expressive");

  const rootRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const holdRef = useRef(0);
  const lineAnimRef = useRef<AnimationPlaybackControls | null>(null);
  const touchedRef = useRef(false);
  const inView = useInView(rootRef, { once: true });
  const arrived = reduced || inView;

  useEffect(
    () => () => {
      window.clearTimeout(holdRef.current);
      lineAnimRef.current?.stop();
    },
    [],
  );

  const copied = () => {
    touchedRef.current = true;
    setState("copied");
    if (!reduced && lineRef.current) {
      lineAnimRef.current?.stop();
      lineAnimRef.current = animate(lineRef.current, { opacity: [0.45, 1] }, expressive);
    }
    window.clearTimeout(holdRef.current);
    holdRef.current = window.setTimeout(() => {
      setState("idle");
    }, HOLD_MS);
  };

  const failed = () => {
    const box = lineRef.current;
    if (box) window.getSelection()?.selectAllChildren(box);
    setState("failed");
  };

  const press = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(copied, () => (copyBySelection(text) ? copied() : failed()));
    } else if (copyBySelection(text)) {
      copied();
    } else {
      failed();
    }
  };

  const done = state === "copied";

  return (
    <motion.div
      ref={rootRef}
      data-body="flat"
      data-part="paper"
      initial={reduced ? false : { y: 4, scale: 0.985 }}
      animate={reduced ? undefined : { y: arrived ? 0 : 4, scale: arrived ? 1 : 0.985 }}
      transition={expressive}
      className={
        "litt-paper flex w-full max-w-lg min-w-0 items-center justify-between gap-3 rounded-surface bg-surface-1 p-4 sm:p-5 forced-colors:border " +
        className
      }
    >
      <span
        ref={lineRef}
        data-part="lettering"
        className="min-w-0 flex-1 truncate select-all text-small font-normal text-fg"
      >
        {shown}
      </span>

      <motion.button
        type="button"
        aria-label={label}
        data-part={done ? "bubble" : "ink"}
        onClick={press}
        whileTap={reduced ? undefined : { scale: 0.96 }}
        transition={instant}
        className={
          "litt-target relative inline-flex h-control-sm shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-pill px-4 text-small font-title select-none " +
          "[-webkit-tap-highlight-color:transparent] transition-colors duration-(--dur-instant) ease-litt " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border " +
          (done
            ? "bg-[color-mix(in_oklab,var(--data-teal)_22%,transparent)] text-fg forced-colors:border-[Highlight]"
            : "bg-accent text-accent-fg hover:bg-accent-hover enabled:pointer-coarse:active:bg-accent-hover")
        }
      >
        <motion.span
          key={done ? "copied" : "copy"}
          initial={reduced || !touchedRef.current ? false : { opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={expressive}
          className="inline-flex items-center gap-1.5"
        >
          {done ? (
            <>
              <svg
                width={16}
                height={16}
                viewBox="0 0 16 16"
                fill="none"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
                data-part="mark"
                className="shrink-0 stroke-data-teal forced-colors:stroke-[Highlight]"
              >
                <motion.path
                  d="m3.5 8.5 3 3 6-7"
                  initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={expressive}
                />
              </svg>
              <span data-part="lettering">Copied</span>
            </>
          ) : (
            <>
              <CopyIcon data-part="mark" className="shrink-0" />
              <span data-part="lettering">Copy</span>
            </>
          )}
        </motion.span>
      </motion.button>

      <span role="status" aria-live="polite" className="sr-only">
        {state === "copied" ? "Copied" : state === "failed" ? "Select the text to copy" : ""}
      </span>
    </motion.div>
  );
}
