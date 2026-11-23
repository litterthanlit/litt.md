/**
 * ToastStack, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): stacked notification cards that fan out
 * smoothly on hover, focus, or tap on Flat's expressive spring (0.28 bounce).
 *
 * - Collapsed, older cards tuck cleanly behind the newest notice with a crisp peek and gentle scale step; expanded,
 *   every card opens to full height with clear air between them.
 * - Each card carries a title, a quiet detail line, a timestamp and a quiet dismiss button. Zero auto-dismiss timers on mount (R4).
 */
import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useExit, useMotionDial, useTransition } from "@/motion";

export type StackNotice = {
  id: string;
  title: string;
  body: string;
  time: string;
};

export type ToastStackProps = {
  /** Initial notices shown in the stack (newest first). */
  defaultNotices?: StackNotice[];
  /** Maximum visible notices when collapsed. Default 3. */
  visible?: number;
  className?: string;
};

export const DEFAULT_NOTICES: StackNotice[] = [
  {
    id: "n-1",
    title: "Issue 14 sent",
    body: "Delivered to 1,204 subscribers with zero bounces.",
    time: "Just now",
  },
  {
    id: "n-2",
    title: "Voice guide updated",
    body: "Saved three new opening notes to Coastline draft.",
    time: "4m ago",
  },
  {
    id: "n-3",
    title: "Reader reply",
    body: "Maya left a note on The lighthouse chapter.",
    time: "18m ago",
  },
];

const EXTRA_NOTICES: Omit<StackNotice, "id">[] = [
  {
    title: "Draft snapshot saved",
    body: "Issue 15 synced cleanly before export.",
    time: "Just now",
  },
  {
    title: "12 new subscribers",
    body: "Morning links brought twelve readers overnight.",
    time: "Just now",
  },
  {
    title: "Images optimized",
    body: "Six coastal plates compressed for fast reading.",
    time: "Just now",
  },
];

/** Flat's stacked notification cards: tucked at rest, fanning out on hover, focus, or tap on Flat's 0.28 bounce. */
export function ToastStack({
  defaultNotices = DEFAULT_NOTICES,
  visible = 3,
  className = "",
}: ToastStackProps) {
  const { reduced } = useMotionDial();
  const spring = useTransition("expressive");
  const exit = useExit("responsive");
  const regionId = useId();

  const [notices, setNotices] = useState<StackNotice[]>(defaultNotices);
  const [hovered, setHovered] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [seq, setSeq] = useState(0);
  const [live, setLive] = useState("");

  const expanded = hovered || pinnedOpen;
  const shown = notices.slice(0, Math.max(1, visible));
  const hiddenCount = Math.max(0, notices.length - shown.length);

  function dismiss(item: StackNotice) {
    setNotices((cur) => cur.filter((n) => n.id !== item.id));
    setLive(`Dismissed ${item.title}.`);
  }

  function addNotice() {
    const template = EXTRA_NOTICES[seq % EXTRA_NOTICES.length]!;
    const next: StackNotice = {
      id: `extra-${seq + 1}`,
      title: template.title,
      body: template.body,
      time: template.time,
    };
    setSeq((n) => n + 1);
    setNotices((cur) => [next, ...cur]);
    setLive(`New notice: ${next.title}.`);
  }

  function restore() {
    setNotices(defaultNotices);
    setPinnedOpen(false);
    setLive(`Restored ${defaultNotices.length} notices.`);
  }

  // Collapsed deck height accommodates the front card plus subtle downward peeks
  const collapsedHeight = shown.length > 0 ? 84 + (shown.length - 1) * 12 : 84;

  return (
    <div
      className={"grid w-full max-w-sm min-w-0 gap-3 text-fg " + className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Stack surface */}
      <div
        id={regionId}
        role="region"
        aria-label="Recent notices"
        className="relative grid w-full min-w-0"
        style={expanded || shown.length <= 1 ? undefined : { minHeight: collapsedHeight }}
      >
        {shown.length === 0 ? (
          <div
            data-part="paper"
            className="litt-paper flex h-20 items-center justify-between gap-3 rounded-surface bg-surface-1 px-6 text-small text-fg-subtle forced-colors:border"
          >
            <span>All caught up</span>
            <button
              type="button"
              data-part="lettering"
              onClick={restore}
              className="litt-target relative cursor-pointer rounded-pill px-2 py-1 text-caption font-normal text-fg hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Restore
            </button>
          </div>
        ) : (
          <div className={expanded ? "grid gap-2" : "relative"} style={expanded ? undefined : { minHeight: collapsedHeight }}>
            <AnimatePresence initial={false}>
              {shown.map((item, i) => {
                const isCollapsed = !expanded && shown.length > 1;
                const scale = isCollapsed ? 1 - i * 0.045 : 1;
                const offsetY = isCollapsed ? i * 12 : 0;
                const opacity = isCollapsed ? Math.max(0.55, 1 - i * 0.18) : 1;

                return (
                  <motion.article
                    key={item.id}
                    layout={!reduced}
                    data-part="paper"
                    initial={reduced ? false : { opacity: 0, y: -12, scale: 0.96 }}
                    animate={{
                      opacity,
                      y: offsetY,
                      scale,
                    }}
                    exit={reduced ? undefined : { opacity: 0, y: -8, scale: 0.95, transition: exit }}
                    transition={spring}
                    className={
                      "litt-paper flex w-full min-w-0 items-start justify-between gap-3 rounded-surface bg-surface-1 p-4 shadow-float forced-colors:border " +
                      (isCollapsed && i > 0 ? "pointer-events-none absolute inset-x-0 top-0 origin-top" : "relative")
                    }
                    style={{ zIndex: shown.length - i }}
                  >
                    <div className="grid min-w-0 gap-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-small font-title text-fg">{item.title}</span>
                        <span className="shrink-0 text-caption font-normal tabular-nums text-fg-subtle">
                          {item.time}
                        </span>
                      </div>
                      <p className="m-0 truncate text-caption font-normal text-fg-subtle">{item.body}</p>
                    </div>

                    <button
                      type="button"
                      data-part="lettering"
                      aria-label={`Dismiss ${item.title}`}
                      tabIndex={isCollapsed && i > 0 ? -1 : 0}
                      onClick={() => dismiss(item)}
                      className="litt-target relative grid size-6 shrink-0 cursor-pointer place-items-center rounded-pill bg-transparent text-fg-subtle transition-colors duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    >
                      <svg width={12} height={12} viewBox="0 0 12 12" aria-hidden="true">
                        <path
                          d="M3 3 9 9M9 3 3 9"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Quiet stack controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <span data-part="lettering" className="text-caption font-normal tabular-nums text-fg-subtle">
          {notices.length} {notices.length === 1 ? "notice" : "notices"}
          {hiddenCount > 0 ? ` · ${hiddenCount} more` : ""}
        </span>
        <div className="flex items-center gap-1">
          {shown.length > 1 && (
            <button
              type="button"
              data-part="lettering"
              aria-expanded={expanded}
              aria-controls={regionId}
              onClick={() => setPinnedOpen((v) => !v)}
              className="litt-target relative inline-flex h-control-sm cursor-pointer items-center rounded-pill bg-transparent px-2 text-caption font-normal text-fg-subtle transition-colors duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              {expanded ? "Stack" : "Fan out"}
            </button>
          )}
          <button
            type="button"
            data-part="lettering"
            onClick={addNotice}
            className="litt-target relative inline-flex h-control-sm cursor-pointer items-center rounded-pill bg-transparent px-2 text-caption font-normal text-fg transition-colors duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Add notice
          </button>
        </div>
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
