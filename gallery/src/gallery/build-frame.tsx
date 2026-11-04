/**
 * The Build page's stage frame: one window onto a screen, scrolling inside itself at AppFrame's height, with the
 * screen's links kept put (kit.tsx, stayPut). A new screen swaps in soft focus (SoftSwap, R4) and opens at its top.
 */
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { Framed } from "@/components/framed";
import { SoftSwap } from "@/motion";
import { stayPut } from "./kit";

/** `swapKey` names what the frame shows: a new one swaps it in soft focus, scrolled to its top. */
export function BuildFrame({ label, swapKey, children }: { label: string; swapKey: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
  }, [swapKey]);
  return (
    <div
      ref={ref}
      role="region"
      aria-label={label}
      tabIndex={0}
      onClickCapture={stayPut}
      data-build-frame=""
      className={
        "h-176 w-full overflow-y-auto overscroll-contain rounded-surface bg-canvas outline-1 -outline-offset-1 outline-line " +
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
      }
    >
      <Framed>
        <SoftSwap swapKey={swapKey}>{children}</SoftSwap>
      </Framed>
    </div>
  );
}
