/**
 * Copy to the clipboard, with feedback that needs no toast: the trigger swaps its
 * icon for a check, and a polite live region says "Copied" for two seconds.
 */
import { useCallback, useEffect, useRef, useState } from "react";

type CopyState = "idle" | "copied" | "failed";

const FEEDBACK_MS = 2000; // how long "Copied" stays up (feedback, not animation)

/** Old route for pages without the async clipboard API (plain http). Must run inside the click. */
function copyWithSelection(text: string): boolean {
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

/**
 * `copy(text)` must be called straight from a click handler with text that is already
 * in hand. Safari drops the user gesture across an await, so nothing is awaited first.
 */
export function useCopy(): [CopyState, (text: string) => void] {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback((text: string) => {
    const settle = (next: CopyState) => {
      setState(next);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setState("idle"), FEEDBACK_MS);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => settle("copied"),
        () => settle("failed"),
      );
    } else settle(copyWithSelection(text) ? "copied" : "failed");
  }, []);

  return [state, copy];
}

/** Screen-reader announcement for a copy button. Keep it mounted so the change is announced. */
export function CopyStatus({ state }: { state: CopyState }) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {state === "copied" ? "Copied" : state === "failed" ? "Copy failed. Select the text and copy it by hand." : ""}
    </span>
  );
}
