/**
 * ContextBudget, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): an airy context-window budget and memory
 * picker framed as a Flat paper card (or ink card) sitting on Flat's grey ground with no outline and nothing cast.
 *
 * - Material order (Ground -> Paper -> Bubble): framed in a white rounded paper card (`bg-surface-1
 *   rounded-surface`, black in dark) with generous 24px padding, or an optional `tone="ink"` ink card (`.litt-ink`).
 * - Pairs a quiet title with a crisp standing percentage (`text-figure`), one ink bar for the share used, and
 *   plain `font-normal` source rows: an attached source reads its label and token count in ink, an excluded one
 *   reads "Off" in the subtle ink (R5). No frame at rest, only a quiet tint on hover.
 * - Toggling any source bounces the percentage on Flat's expressive spring (0.28 bounce) and announces the updated
 *   token count once in a polite status region. Zero `--accent` fills (R6) and zero auto-animation on mount (R4).
 */
import { useId, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useMotionDial, useTransition } from "@/motion";

export type ContextSource = {
  /** Stable identifier for the context source. */
  id: string;
  /** Friendly name shown on the pill, e.g. "Coastline draft" or "Style notes". */
  label: string;
  /** Token count in raw tokens, e.g. 24000. */
  tokens: number;
  /** Whether the source starts attached in the window. Defaults to true. */
  included?: boolean;
};

export type ContextBudgetProps = {
  /** Quiet title printed above the standing figure. Defaults to "Draft context". */
  title?: ReactNode;
  /** Surface tone: white paper card on grey ground ("paper"), or Flat's contrasting ink card ("ink"). Defaults to "paper". */
  tone?: "paper" | "ink";
  /** Context sources the reader can attach or prune. */
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
  { id: "draft", label: "Coastline draft", tokens: 34000, included: true },
  { id: "notes", label: "Field notes", tokens: 22000, included: true },
  { id: "thread", label: "Recent replies", tokens: 14000, included: true },
  { id: "archive", label: "Issue 13 archive", tokens: 19000, included: false },
];

function formatTokens(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return String(Math.round(n));
}

/** Flat's interactive context-window card: paper or ink frame, crisp percentage, one bar and plain source rows. */
export function ContextBudget({
  title = "Draft context",
  tone = "paper",
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

  const ink = tone === "ink";
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
      `${src.label} ${on ? "excluded" : "attached"}: ${nextPct}% used, ${formatTokens(nextUsed)} of ${formatTokens(safeCap)} tokens.`,
    );
  }

  function trimOrRestore() {
    const allOn = activeSources.length === sources.length;
    if (allOn && activeSources.length > 1) {
      const largest = [...activeSources].sort((a, b) => b.tokens - a.tokens)[0]!;
      const next = activeSources.filter((s) => s.id !== largest.id).map((s) => s.id);
      const nextUsed = sources.filter((s) => next.includes(s.id)).reduce((sum, s) => sum + s.tokens, 0);
      commit(next, `Trimmed ${largest.label}: ${formatTokens(nextUsed)} of ${formatTokens(safeCap)} tokens.`);
    } else {
      const allIds = sources.map((s) => s.id);
      const allUsed = sources.reduce((sum, s) => sum + s.tokens, 0);
      commit(allIds, `Attached all ${sources.length} sources: ${formatTokens(allUsed)} of ${formatTokens(safeCap)} tokens.`);
    }
  }

  return (
    <div
      data-part={ink ? "ink-card" : "paper"}
      className={
        "grid w-full max-w-sm min-w-0 gap-4 rounded-surface p-6 text-fg forced-colors:border " +
        (ink ? "litt-ink " : "litt-paper bg-surface-1 ") +
        className
      }
    >
      {/* Quiet title over crisp standing percentage */}
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

      {/* One ink bar for the share used */}
      <div
        role="meter"
        aria-labelledby={headingId}
        aria-valuemin={0}
        aria-valuemax={safeCap}
        aria-valuenow={Math.min(usedTokens, safeCap)}
        aria-valuetext={`${pct}% of context window used, ${formatTokens(usedTokens)} of ${formatTokens(safeCap)} tokens`}
        data-part="bubble"
        className="h-2 w-full overflow-hidden rounded-pill forced-colors:border"
        style={{ backgroundColor: "color-mix(in oklab, var(--fg) 10%, transparent)" }}
      >
        <motion.span
          aria-hidden="true"
          data-part="mark"
          initial={false}
          animate={{ scaleX: pct / 100 }}
          transition={spring}
          className="block h-full origin-left rounded-pill bg-fg forced-colors:bg-[Highlight]"
        />
      </div>

      {/* Plain source rows: label and tokens, or Off */}
      <div role="group" aria-label="Attached context sources" className="-mx-2 flex flex-wrap gap-x-1 gap-y-1">
        {sources.map((src) => {
          const on = included.has(src.id);
          return (
            <button
              key={src.id}
              type="button"
              aria-pressed={on}
              data-part="lettering"
              onClick={() => toggleSource(src)}
              className={
                "litt-target relative inline-flex h-control-sm cursor-pointer items-center gap-2 rounded-pill bg-transparent px-2 text-caption font-normal select-none " +
                "[-webkit-tap-highlight-color:transparent] transition-colors duration-(--dur-instant) ease-litt " +
                "hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] " +
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
                (on ? "text-fg" : "text-fg-subtle hover:text-fg")
              }
            >
              <span className="truncate">{src.label}</span>
              <span className="tabular-nums text-fg-subtle">
                {on ? formatTokens(src.tokens) : "Off"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quiet footer summary and one-tap trim/restore */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <span data-part="lettering" className="text-caption font-normal tabular-nums text-fg-subtle">
          {overBudget ? "Over window · trim a source" : `${formatTokens(freeTokens)} free`} · {activeSources.length} of {sources.length} attached
        </span>
        {sources.length > 1 && (
          <button
            type="button"
            data-part="lettering"
            onClick={trimOrRestore}
            className="litt-target relative cursor-pointer rounded-control px-1.5 py-0.5 text-caption font-normal text-fg hover:text-fg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
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
