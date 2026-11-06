/**
 * LogView: the lines a build, a deploy or a job writes as it runs, as they arrive (components.md, "Log view"). The
 * CodeBlock's surface, for output instead of source.
 *
 * - Surface: --surface-2 with an inset --line hairline at the surface radius, as the CodeBlock's. A 32px header holds
 *   the label in the mono at the caption size in --fg-subtle, your actions, and Copy. The lines are the mono at the
 *   small size, padded 16px, under the header.
 * - A line: its number in a gutter (mono caption, --fg-subtle, never selected or copied), its time when it has one
 *   (in one right-aligned column as wide as the longest time, so the text stays in line as "+9.6s" becomes "+10.2s"),
 *   then the text. Info is --fg-muted, debug --fg-subtle. A warning's text is --warning and an error's --danger, each
 *   with the alert mark in the gutter and a hidden "Warning:" or "Error:" before it, so color is never the only
 *   signal; success is --success and says so in its own words.
 * - Following: while the view is at the bottom, new lines keep it there, as a terminal does. Scroll up to read and it
 *   stays put; a "Jump to latest" button appears at the bottom with how many lines came since, and takes you back
 *   (smoothly, or at once under reduced motion) and follows again.
 * - Long lines scroll sideways inside the view; `wrap` wraps them. Lines out of view skip their layout
 *   (content-visibility), so a few thousand stay cheap; past `maxLines` the oldest go.
 * - Accessibility: the scroller is a region named by the label and a Tab stop, so the arrow keys scroll it. Lines are
 *   an ordered list. New lines are not read out one by one; say how the run ended in your own status (a Progress, a
 *   Toast) when it does.
 * - Motion: none, apart from the jump back, which is the browser's own smooth scroll.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useMotionDial } from "@/motion";
import { Button } from "@/components/button";
import { AlertIcon, ArrowDownIcon, CheckIcon, CopyIcon } from "@/components/icons";

export type LogLevel = "debug" | "info" | "success" | "warn" | "error";

export type LogLine = {
  /** A stable key, when lines can be dropped or replaced. Default: its place in the list. */
  id?: string | number;
  /** When it was written, as you want it shown: "12:04:31", "+3.2s". */
  time?: string;
  /** How it reads: debug is quiet, info is the default, success, warn and error take their status color and words. */
  level?: LogLevel;
  /** The line itself. */
  text: string;
};

const TEXT: Record<LogLevel, string> = {
  debug: "text-fg-subtle",
  info: "text-fg-muted",
  success: "text-success",
  warn: "text-warning",
  error: "text-danger",
};
const SAID: Partial<Record<LogLevel, string>> = { warn: "Warning: ", error: "Error: " };

/** Within this many px of the bottom counts as at the bottom. */
const NEAR = 8;
const FEEDBACK_MS = 1600;

export type LogViewProps = {
  /** What wrote it, shown in the header and naming the region: "Build log". */
  label: string;
  /** The lines so far, oldest first. Append to it as the run writes. */
  lines: LogLine[];
  /** Keep the view at the newest line while it is at the bottom. */
  follow?: boolean;
  /** Wrap long lines instead of scrolling them sideways. */
  wrap?: boolean;
  /** Show the line numbers. */
  lineNumbers?: boolean;
  /** Keep only this many of the newest lines. */
  maxLines?: number;
  /** Shown when there are no lines yet. */
  empty?: ReactNode;
  /** Small ghost buttons for the header, before Copy: a filter, Download. */
  actions?: ReactNode;
  /** The height of the lines area, which scrolls inside: a number is px, a string any CSS length. "fill" takes what is left of the view's own height, so give the view one (h-full in a panel). */
  height?: number | string;
  /** Extra classes for the view. */
  className?: string;
};

/** A run's output as it arrives: numbered lines, warnings and errors marked in words, and following the newest line. */
export function LogView({
  label,
  lines: allLines,
  follow = true,
  wrap = false,
  lineNumbers = true,
  maxLines = 5000,
  empty = "Waiting for output.",
  actions,
  height = "20rem",
  className = "",
}: LogViewProps) {
  const { reduced } = useMotionDial();
  const lines = useMemo(() => (allLines.length > maxLines ? allLines.slice(-maxLines) : allLines), [allLines, maxLines]);
  const firstNumber = allLines.length - lines.length + 1;
  const scroller = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const bottom = useRef(true);
  /* How many lines there were when the person scrolled away, to say how many came since. */
  const [seen, setSeen] = useState(allLines.length);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const now = el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR;
    if (now !== bottom.current) {
      bottom.current = now;
      setAtBottom(now);
      if (!now) setSeen(allLines.length);
    }
  };

  /* New lines while at the bottom keep the view there. */
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || !follow || !bottom.current) return;
    el.scrollTop = el.scrollHeight;
  }, [allLines.length, follow]);

  const toLatest = () => {
    const el = scroller.current;
    if (!el) return;
    bottom.current = true;
    setAtBottom(true);
    el.scrollTo({ top: el.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  };

  const fresh = Math.max(0, allLines.length - seen);
  const digits = String(firstNumber + lines.length).length;
  /* The times share one column, as wide as the longest and right-aligned, so "+9.6s" and "+10.2s" keep the text in line. */
  const timeWidth = lines.reduce((w, l) => Math.max(w, l.time?.length ?? 0), 0);

  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = useCallback(() => {
    const text = lines.map((l) => (l.time ? `${l.time}  ${l.text}` : l.text)).join("\n");
    const done = (state: "copied" | "failed") => {
      setCopied(state);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied("idle"), FEEDBACK_MS);
    };
    if (!navigator.clipboard?.writeText) return done("failed");
    navigator.clipboard.writeText(text).then(
      () => done("copied"),
      () => done("failed"),
    );
  }, [lines]);

  return (
    <div className={"relative grid min-w-0 max-w-full grid-rows-[auto_minmax(0,1fr)] rounded-surface bg-surface-2 " + className}>
      <div className="flex h-control-sm items-center justify-between gap-2 pr-1 pl-4 pointer-coarse:h-control-md">
        <span className="min-w-0 truncate text-caption font-normal text-fg-subtle">{label}</span>
        <div className="flex shrink-0 items-center gap-1">
          {actions}
          <Button
            iconOnly
            variant="ghost"
            size="sm"
            aria-label="Copy log"
            disabled={!lines.length}
            onClick={copy}
            className="focus-visible:outline-offset-[-2px] pointer-coarse:h-control-md pointer-coarse:w-control-md"
          >
            {copied === "copied" ? <CheckIcon /> : <CopyIcon />}
          </Button>
        </div>
      </div>

      <div
        ref={scroller}
        role="region"
        aria-label={label}
        tabIndex={0}
        onScroll={onScroll}
        style={height === "fill" ? undefined : { height }}
        className="min-h-0 overflow-auto overscroll-contain rounded-b-surface py-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
      >
        {lines.length === 0 ? (
          <p className="px-4 font-mono text-small font-normal text-fg-subtle">{empty}</p>
        ) : (
          <ol
            style={{ "--log-gutter": `${digits}ch`, "--log-time": `${timeWidth}ch` } as CSSProperties}
            className={"m-0 list-none p-0 font-mono text-small font-normal " + (wrap ? "w-full" : "w-max min-w-full")}
          >
            {lines.map((line, i) => {
              const level = line.level ?? "info";
              const marked = level === "warn" || level === "error";
              return (
                <li key={line.id ?? firstNumber + i} className="flex items-baseline gap-3 px-4 [contain-intrinsic-size:auto_1.25rem] [content-visibility:auto]">
                  {/* The gutter: the number, then a 12px cell for a warning's or an error's mark. */}
                  <span aria-hidden="true" className="flex shrink-0 items-baseline gap-1.5 select-none">
                    {lineNumbers && <span className="w-(--log-gutter) text-right text-caption text-fg-subtle tabular-nums">{firstNumber + i}</span>}
                    <span className={"inline-grid w-3 translate-y-0.5 place-items-center " + TEXT[level]}>{marked && <AlertIcon size={12} />}</span>
                  </span>
                  {timeWidth > 0 && <span className="w-(--log-time) shrink-0 text-right text-caption text-fg-subtle tabular-nums">{line.time}</span>}
                  <span className={"min-w-0 grow " + TEXT[level] + " " + (wrap ? "whitespace-pre-wrap [overflow-wrap:anywhere]" : "whitespace-pre")}>
                    {SAID[level] && <span className="sr-only select-none">{SAID[level]}</span>}
                    {line.text}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {!atBottom && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <Button size="sm" icon={<ArrowDownIcon />} onClick={toLatest} className="pointer-events-auto">
            {fresh > 0 ? `${fresh} new ${fresh === 1 ? "line" : "lines"}` : "Jump to latest"}
          </Button>
        </div>
      )}

      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-surface shadow-[inset_0_0_0_1px_var(--line)]" />
      <span role="status" aria-live="polite" className="sr-only">
        {copied === "copied" ? "Copied" : copied === "failed" ? "Copy failed. Select the lines and copy them by hand." : ""}
      </span>
    </div>
  );
}
