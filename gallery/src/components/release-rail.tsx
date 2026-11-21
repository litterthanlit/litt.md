/**
 * ReleaseRail, a Press part (plans/024, Press; press-round2.tsx): a minimal tactile release selector built directly
 * on Nick's Press round-2 direction — rows sit quietly in ONE recessed stone tray instead of raising every row, and
 * only the selected release lifts up as a single raised stone block (`--highlight, --block-lift`).
 *
 * - Sits directly on Press's ground with no extra card frame.
 * - Clicking any release lifts it out of the tray so you can inspect its commit, region, and build time, and promote
 *   an older release back to live with a single tactile raised key.
 * - Zero button outlines, zero decorative status colors, zero `--accent` fills (R6), and zero auto-animation on mount.
 * - Keys: the releases are one tab stop, on the selected release (a roving tab index). The arrow keys move to the next
 *   or previous release and select it, wrapping at the ends; Home and End go to the newest and the oldest. Enter and
 *   Space select the focused one. Promote to live is its own tab stop after the group.
 */
import { useId, useState, type KeyboardEvent, type ReactNode } from "react";

export type ReleaseEntry = {
  /** Short commit SHA, e.g. "4f9c2e1". */
  sha: string;
  /** Commit summary in plain sentence case. */
  summary: string;
  /** Relative age, e.g. "12m ago". */
  age: string;
  /** Build duration, e.g. "1m 25s". */
  duration: string;
};

export type ReleaseRailProps = {
  /** Project name printed on the quiet top line. Defaults to "harbor-web". */
  project?: ReactNode;
  /** Ordered list of recent releases (newest first). */
  releases?: ReleaseEntry[];
  /** SHA of the release currently serving production traffic. Defaults to the first release. */
  defaultLiveSha?: string;
  /** Called when the operator promotes a release to live. */
  onPromote?: (sha: string) => void;
  /** Extra classes on the root wrapper. */
  className?: string;
};

export const DEFAULT_RELEASES: ReleaseEntry[] = [
  { sha: "4f9c2e1", summary: "Add pricing page", age: "12m ago", duration: "1m 25s" },
  { sha: "9a2b810", summary: "Tighten cache headers", age: "3h ago", duration: "1m 18s" },
  { sha: "c71d044", summary: "Fix OAuth callback", age: "Yesterday", duration: "1m 31s" },
  { sha: "3e8f129", summary: "Upgrade edge runtime", age: "2d ago", duration: "1m 42s" },
];

/** Press's tactile release rail: quiet rows inside one recessed stone tray, lifting only the selected release. */
export function ReleaseRail({
  project = "harbor-web",
  releases = DEFAULT_RELEASES,
  defaultLiveSha,
  onPromote,
  className = "",
}: ReleaseRailProps) {
  const headingId = useId();
  const initialLive = defaultLiveSha ?? releases[0]?.sha ?? "";
  const [liveSha, setLiveSha] = useState(initialLive);
  const [selectedSha, setSelectedSha] = useState(initialLive);
  const [liveMsg, setLiveMsg] = useState("");

  const selected = releases.find((r) => r.sha === selectedSha) ?? releases[0]!;
  const isViewingLive = selected.sha === liveSha;

  function select(entry: ReleaseEntry) {
    setSelectedSha(entry.sha);
    setLiveMsg(`Selected ${entry.sha}, ${entry.summary}, ${entry.sha === liveSha ? "live" : entry.age}.`);
  }

  /** The radio group's keys: arrows move and select, wrapping; Home and End go to the ends. */
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const at = releases.findIndex((r) => r.sha === selected.sha);
    const n = releases.length;
    if (n === 0) return;
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const fwd = e.key === "ArrowDown" || e.key === (rtl ? "ArrowLeft" : "ArrowRight");
    const back = e.key === "ArrowUp" || e.key === (rtl ? "ArrowRight" : "ArrowLeft");
    const to = fwd ? (at + 1) % n : back ? (at - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0 || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    const entry = releases[to]!;
    if (entry.sha !== selected.sha) select(entry);
    e.currentTarget.querySelectorAll<HTMLElement>("[role=radio]")[to]?.focus();
  }

  function promote() {
    setLiveSha(selected.sha);
    onPromote?.(selected.sha);
    setLiveMsg(`Promoted ${selected.sha}, ${selected.summary}, to live.`);
  }

  return (
    <div data-body="press" className={"grid w-full max-w-md min-w-0 gap-3 text-fg " + className}>
      {/* Quiet top line */}
      <div className="flex items-baseline justify-between gap-3">
        <span id={headingId} data-part="lettering" className="truncate text-small font-title text-fg">
          Releases · {project}
        </span>
        <span data-part="lettering" className="shrink-0 font-mono text-caption tabular-nums text-fg-subtle">
          live {liveSha}
        </span>
      </div>

      {/* Single recessed stone tray — only the selected row lifts as a block */}
      <div
        role="radiogroup"
        aria-labelledby={headingId}
        onKeyDown={onKeyDown}
        data-part="tray"
        className="grid gap-1 rounded-surface bg-tray p-1 shadow-(--tray-shade) forced-colors:border"
      >
        {releases.map((entry) => {
          const isSelected = entry.sha === selected.sha;
          const isLive = entry.sha === liveSha;
          return (
            <button
              key={entry.sha}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              data-part={isSelected ? "block" : "tray"}
              onClick={() => select(entry)}
              className={
                "litt-target relative flex min-h-control-md w-full min-w-0 cursor-pointer items-center justify-between gap-3 rounded-control px-3 py-2 text-left select-none " +
                "transition-[background-color,color,box-shadow,transform] duration-(--dur-instant) ease-litt " +
                "active:[transform:translateY(var(--press-depth))] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus forced-colors:border " +
                (isSelected
                  ? "bg-block text-fg shadow-[var(--highlight),var(--block-lift)] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
                  : "bg-transparent text-fg-muted hover:text-fg")
              }
            >
              <span className="flex min-w-0 items-baseline gap-2.5">
                <span className="shrink-0 font-mono text-caption tabular-nums text-fg-subtle">{entry.sha}</span>
                <span className={"truncate text-small " + (isSelected ? "font-title text-fg" : "")}>{entry.summary}</span>
              </span>
              <span className="shrink-0 text-caption tabular-nums text-fg-subtle">
                {isLive ? "Live" : entry.age}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quiet action footer */}
      <div className="flex items-center justify-between gap-3">
        <span data-part="lettering" className="truncate font-mono text-caption tabular-nums text-fg-subtle">
          {selected.sha} · {selected.duration}
        </span>
        {isViewingLive ? (
          <span data-part="lettering" className="text-caption font-title text-fg-muted">
            Serving production
          </span>
        ) : (
          <button
            type="button"
            data-part="block"
            onClick={promote}
            className={
              "litt-target relative inline-flex h-control-sm cursor-pointer items-center justify-center rounded-control bg-block px-3 text-caption font-title text-fg select-none " +
              "shadow-[var(--highlight),var(--block-lift)] transition-[background-color,box-shadow,transform] duration-(--dur-instant) ease-litt " +
              "hover:bg-(--block-hover) active:shadow-(--block-press) active:[transform:translateY(var(--press-depth))] " +
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border"
            }
          >
            Promote to live
          </button>
        )}
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {liveMsg}
      </span>
    </div>
  );
}
