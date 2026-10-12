/**
 * CodeBlock: highlighted source on a quiet surface.
 *
 * - Geist Mono at text-small. The colors come from app.css (.docs-code), which maps
 *   sugar-high's --sh-* variables onto the tokens, so both themes follow tokens.css.
 * - Long lines scroll sideways and long blocks scroll down inside the block, so the
 *   page never overflows. The scroller is focusable and labelled, so a keyboard user
 *   can scroll it with the arrow keys.
 * - "card" is a surface of its own (surface-2 and a hairline). "flush" sits inside a
 *   surface that already exists, like the stage, so it is not a box in a box.
 * - The copy button sits top right. On a phone the code starts below it (pt-12), because
 *   a line that is wider than the screen would otherwise run under the button.
 * - The copy button is the one control. It swaps its icon for a check and a polite
 *   live region says "Copied". No toast.
 */
import { useMemo } from "react";
import { highlight } from "sugar-high";
import { Button } from "@/components/button";
import { CheckIcon, CopyIcon } from "@/components/icons";
import { CopyStatus, useCopy } from "./copy";

export type CodeBlockProps = {
  code: string;
  /** Names the scroll area for screen readers, for example "Usage code". */
  label: string;
  tone?: "card" | "flush";
  className?: string;
};

export function CodeBlock({ code, label, tone = "card", className = "" }: CodeBlockProps) {
  /* sugar-high escapes the source itself, so its HTML is safe to inject. */
  const html = useMemo(() => highlight(code, { lang: "typescript" }), [code]);
  const [state, copy] = useCopy();
  const flush = tone === "flush";

  return (
    <div className={"relative min-w-0 " + className}>
      <pre
        tabIndex={0}
        role="group"
        aria-label={label}
        className={
          "docs-code overflow-auto rounded-surface font-mono text-small text-fg [tab-size:2] " +
          (flush
            ? /* The stage's own padding, so code and demo line up. */ "max-h-144 p-8 pt-12 focus-visible:-outline-offset-2 sm:p-12 sm:pr-16"
            : "max-h-112 bg-surface-2 p-4 pt-12 shadow-[inset_0_0_0_1px_var(--line)] sm:p-6 sm:pr-16")
        }
      >
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
      {/* The pill masks any code that scrolls under the button. */}
      <div className={"absolute top-2 right-2 rounded-pill " + (flush ? "bg-surface-1" : "bg-surface-2")}>
        <Button iconOnly variant="ghost" size="sm" aria-label="Copy code" onClick={() => copy(code)}>
          {state === "copied" ? <CheckIcon /> : <CopyIcon />}
        </Button>
      </div>
      <CopyStatus state={state} />
    </div>
  );
}
