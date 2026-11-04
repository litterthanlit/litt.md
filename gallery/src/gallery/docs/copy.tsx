/**
 * Copy to the clipboard, with feedback that needs no toast: the trigger swaps its
 * icon for a check, and a polite live region says "Copied" for two seconds.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/button";
import { CheckIcon, CopyIcon } from "@/components/icons";

type CopyState = "idle" | "copied" | "failed";

/* The same look as Button's ghost, sm: a link that leaves the site, beside a copy button. Button renders a
   <button>, and a link needs an <a> to be a link (middle click, "open in new tab"). */
export const ghostSm =
  "relative inline-flex h-control-sm shrink-0 items-center justify-center gap-control rounded-control px-control-pad-sm " +
  "whitespace-nowrap select-none text-small font-title text-fg-muted " +
  "cursor-pointer transition-[background-color,color,translate] duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
  "hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg active:translate-y-(--press-depth) " +
  "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:text-fg " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

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

/**
 * An sm button that copies `text` and says Copied, in words, for two seconds, with its announcement beside it. `text`
 * may be a function, read at the click: for text that follows the address, which a page may write after it renders.
 */
export function CopyButton({ text, children, variant = "secondary", icon = <CopyIcon /> }: { text: string | (() => string); children: string; variant?: "primary" | "secondary" | "ghost"; icon?: ReactNode }) {
  const [state, copy] = useCopy();
  const copied = state === "copied";
  return (
    <>
      <Button size="sm" variant={variant} icon={copied ? <CheckIcon /> : icon} onClick={() => copy(typeof text === "function" ? text() : text)}>
        {/* Both labels share one cell, so the button keeps its width while it says Copied. */}
        <span className="grid">
          <span className={"col-start-1 row-start-1 " + (copied ? "opacity-0" : "")}>{children}</span>
          <span aria-hidden="true" className={"col-start-1 row-start-1 justify-self-start " + (copied ? "" : "opacity-0")}>Copied</span>
        </span>
      </Button>
      <CopyStatus state={state} />
    </>
  );
}
