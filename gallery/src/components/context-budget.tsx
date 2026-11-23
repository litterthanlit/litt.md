/**
 * ContextBudget, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): how full a writing assistant's context
 * window is, on one white paper on the grey ground.
 *
 * - A quiet title over one standing figure (the share used, `text-figure`), one ink bar for that share, and the
 *   sources as pills: an attached source is a grey pill with its name in the ink and its tokens beside it, a source
 *   left out is a bare pill reading "Off" (R5: the state is a word).
 * - Toggling a source moves the bar and lifts the figure on Flat's expressive spring, and announces the new total
 *   once. The ink is the only colour, no accent fill (R6), and nothing moves until a hand toggles (R4).
 */
import { useId, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useMotionDial, useTransition } from "@/motion";

export type ContextSource = {
  /** Stable identifier for the context source. */
  id: string;
  /** Friendly name shown on the pill, e.g. "Spring issue" or "Style notes". */
  label: string;
  /** Token count in raw tokens, e.g. 24000. */
  tokens: number;
  /** Whether the source starts attached in the window. Defaults to true. */
  included?: boolean;
};

export type ContextBudgetProps = {
  /** Quiet title printed above the standing figure. Defaults to "Draft context". */
  title?: ReactNode;
  /** Context sources the reader can attach or leave out. */
  sources?: ContextSource[];
  /** Total model context window in tokens. Defaults to 128000. */
  capacity?: number;
  /** Controlled set of included source ids. */
  includedIds?: string[];
  /** Called with the updated list of included source ids on change. */
  onIncludedChange?: (ids: string[]) => void;
  /** Extra classes on the outer card. */
  className?: string;
};

export const DEFAULT_CONTEXT_ITEMS: ContextSource[] = [
  { id: "guide", label: "Voice guide", tokens: 12000, included: true },
  { id: "draft", label: "Spring issue", tokens: 34000, included: true },
  { id: "notes", label: "Field notes", tokens: 22000, included: true },
  { id: "letters", label: "Reader letters", tokens: 14000, included: true },
  { id: "archive", label: "Issue 13 archive", tokens: 19000, included: false },
];

function formatTokens(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return String(Math.round(n));
}

/** Flat's context-window card: the share used as one figure and one ink bar, and the sources as pills to tap in or out. */
export function ContextBudget({
  title = "Draft context",
  sources = DEFAULT_CONTEXT_ITEMS,
  capacity = 128000,
  includedIds: includedProp,
  onIncludedChange,
  className = "",
}: ContextBudgetProps) {
  const headingId = useId();
  const [innerIds, setInnerIds] = useState<string[]>(() =>
    sources.filter((s) => s.included !== false).map((s) => s.id),
  );
  const [live, setLive] = useState("");
  const spring = useTransition("expressive");
  const { reduced } = useMotionDial();

  const included = new Set(includedProp ?? innerIds);
  const safeCap = Math.max(1, capacity);
  const activeSources = sources.filter((s) => included.has(s.id));
  const usedTokens = activeSources.reduce((sum, s) => sum + Math.max(0, s.tokens), 0);
  const freeTokens = Math.max(0, safeCap - usedTokens);
  const pct = Math.min(100, Math.round((usedTokens / safeCap) * 100));
  const overBudget = usedTokens > safeCap;

  function commit(nextList: string[], note: string) {
    if (includedProp === undefined) setInnerIds(nextList);
    onIncludedChange?.(nextList);
    setLive(note);
  }

  function toggleSource(src: ContextSource) {
    const on = included.has(src.id);
    const next = on ? sources.filter((s) => included.has(s.id) && s.id !== src.id).map((s) => s.id) : [...included, src.id];
    const nextUsed = sources.filter((s) => next.includes(s.id)).reduce((sum, s) => sum + s.tokens, 0);
    const nextPct = Math.min(100, Math.round((nextUsed / safeCap) * 100));
    commit(
      next,
      `${src.label} ${on ? "left out" : "attached"}: ${nextPct}% used, ${formatTokens(nextUsed)} of ${formatTokens(safeCap)} tokens.`,
    );
  }

  function trimOrRestore() {
    const allOn = activeSources.length === sources.length;
    if (allOn && activeSources.length > 1) {
      const largest = [...activeSources].sort((a, b) => b.tokens - a.tokens)[0]!;
      const next = activeSources.filter((s) => s.id !== largest.id).map((s) => s.id);
      const nextUsed = sources.filter((s) => next.includes(s.id)).reduce((sum, s) => sum + s.tokens, 0);
      commit(next, `Left out ${largest.label}: ${formatTokens(nextUsed)} of ${formatTokens(safeCap)} tokens.`);
    } else {
      const allIds = sources.map((s) => s.id);
      const allUsed = sources.reduce((sum, s) => sum + s.tokens, 0);
      commit(allIds, `Attached all ${sources.length} sources: ${formatTokens(allUsed)} of ${formatTokens(safeCap)} tokens.`);
    }
  }

  return (
    <div
      data-part="paper"
      className={"litt-paper grid w-full max-w-sm min-w-0 gap-4 rounded-surface bg-surface-1 p-6 text-fg forced-colors:border " + className}
    >
      {/* A quiet title over the one standing figure */}
      <header className="grid gap-1">
        <span id={headingId} data-part="lettering" className="truncate text-small text-fg-subtle">
          {title}
        </span>
        <p className="flex flex-wrap items-baseline gap-2 text-fg">
          <motion.span
            key={pct}
            data-part="figure"
            initial={reduced ? false : { scale: 0.92 }}
            animate={{ scale: 1 }}
            transition={spring}
            className="inline-block origin-left text-figure tabular-nums"
          >
            {pct}%
          </motion.span>
          <span data-part="lettering" className="text-small tabular-nums text-fg-subtle">
            {formatTokens(usedTokens)} of {formatTokens(safeCap)} tokens
          </span>
        </p>
      </header>

      {/* One ink bar for the share used, on the grey bubble */}
      <div
        role="meter"
        aria-labelledby={headingId}
        aria-valuemin={0}
        aria-valuemax={safeCap}
        aria-valuenow={Math.min(usedTokens, safeCap)}
        aria-valuetext={`${pct}% of context window used, ${formatTokens(usedTokens)} of ${formatTokens(safeCap)} tokens`}
        data-part="bubble"
        className="h-2 w-full overflow-hidden rounded-pill bg-block forced-colors:border"
      >
        <motion.span
          aria-hidden="true"
          data-part="mark"
          initial={false}
          animate={{ x: `${pct - 100}%` }}
          transition={spring}
          className="block h-full rounded-pill bg-fg forced-colors:bg-[Highlight]"
        />
      </div>

      {/* The sources as pills: grey when attached, bare and "Off" when left out */}
      <div role="group" aria-label="Context sources" className="flex flex-wrap gap-1.5">
        {sources.map((src) => {
          const on = included.has(src.id);
          return (
            <button
              key={src.id}
              type="button"
              aria-pressed={on}
              data-part="pill"
              onClick={() => toggleSource(src)}
              className={
                "litt-target relative inline-flex h-control-sm max-w-full min-w-0 cursor-pointer items-center gap-2 rounded-pill px-3 text-small select-none " +
                "[-webkit-tap-highlight-color:transparent] transition-[background-color,color,transform] duration-(--dur-instant) ease-litt motion-safe:active:scale-97 " +
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border " +
                (on ? ON_PILL : OFF_PILL)
              }
            >
              <span className="truncate">{src.label}</span>
              <span className="shrink-0 font-normal tabular-nums text-fg-subtle">{on ? formatTokens(src.tokens) : "Off"}</span>
            </button>
          );
        })}
      </div>

      {/* A quiet summary, and one tap to trim the largest or attach all */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span data-part="lettering" className="text-small tabular-nums text-fg-subtle">
          {overBudget ? "Over the window, trim a source" : `${formatTokens(freeTokens)} free`} · {activeSources.length} of{" "}
          {sources.length} attached
        </span>
        {sources.length > 1 && (
          <button
            type="button"
            data-part="pill"
            onClick={trimOrRestore}
            className="litt-target relative -mr-3 inline-flex h-control-sm cursor-pointer items-center rounded-pill bg-transparent px-3 text-small font-title text-fg transition-[background-color,transform] duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] motion-safe:active:scale-97 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {activeSources.length === sources.length ? "Trim largest" : "Attach all"}
          </button>
        )}
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}

/* An attached source is the grey bubble with its name in the ink; one left out is bare, its words quiet. */
const ON_PILL = "bg-block font-title text-fg hover:bg-(--block-hover)";
const OFF_PILL = "bg-transparent font-normal text-fg-subtle hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg";
