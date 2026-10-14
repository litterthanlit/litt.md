/**
 * Drag to dismiss (foundations.md, section 6): a sheet dragged down, a toast swiped sideways.
 *
 * STUB. The lead fixed this API so the Dialog sheet, the Popover sheet and the Toast can build on it in parallel.
 * The sheet agent implements it; the signature below is the contract. Rules it must follow:
 * - While a finger is down the surface follows it one to one, with no easing.
 * - On release it leaves if it has travelled `readDismiss().distance` of its size (height for "down", width
 *   sideways) or moves faster than `readDismiss().velocity` px per ms, carrying on from where it is, on the exit
 *   token for its tier. Otherwise it springs back on the responsive tier and never bounces.
 * - Pulled the wrong way it resists and stops at `--space-6`.
 * - A drag cannot start in a slider (`input[type=range]`, `[role=slider]`), in `[data-no-drag]`, in a text field
 *   or a scrolling region that is not at its top, or in the first 500ms after the surface opened.
 * - Reduced motion: the drag still follows the finger, and the release is instant.
 * - Transform only. Every gesture has a button that does the same thing; this hook never replaces it.
 */
import type { PointerEvent as ReactPointerEvent } from "react";
import type { MotionValue } from "motion/react";

export type DismissDirection = "down" | "left" | "right" | "sideways";

export type DismissDragOptions = {
  /** Which way the surface leaves. A sheet is "down"; a toast is "sideways" (either way). */
  direction: DismissDirection;
  /** Called once the release decides to leave. The caller closes the surface (its exit then plays from here). */
  onDismiss: () => void;
  /** Off when the surface is closed or a drag makes no sense (for example on fine pointers for a toast). Default true. */
  enabled?: boolean;
  /** The tier whose exit token the leave uses. Default "expressive" for "down", "responsive" sideways. */
  tier?: "responsive" | "expressive";
};

export type DismissDrag = {
  /** Spread on the moving `motion` element. */
  panel: Record<string, unknown>;
  /** Put on the element a drag may start from (the whole panel, or a handle); the guards above apply. */
  onPointerDown: (event: ReactPointerEvent) => void;
  /** The offset along the drag axis, in px, for anything that should follow the drag (a scrim's opacity). */
  offset: MotionValue<number>;
};

export function useDismissDrag(_options: DismissDragOptions): DismissDrag {
  throw new Error("useDismissDrag is a stub: the sheet agent implements it");
}
