/**
 * Conversation, Message, MessageText and MessageActions: a chat between a person and an agent, read top to
 * bottom with the newest turn at the foot (components.md, "Conversation and message").
 *
 * - The agent's turn has no bubble. Its words sit on the page at the body size in --fg-muted, in a measure of
 *   about 68ch, because the answer is the content and a box around long prose cramps it. The parts of a turn
 *   (thinking, a plan, tool calls, the answer, its actions) are children of one Message and sit --space-3 apart.
 * - The person's turn is a bubble: right-aligned, `.litt-raised` at the surface radius, padding --space-3 and
 *   --space-4, text in --fg, at most 80% of the column (85% on compact screens) and 32rem. No tail and no accent
 *   fill: the accent stays on Send. Files the person sent sit above it.
 * - Who is speaking: the side says it. Each turn is an `article` named by a heading that is visually hidden ("You",
 *   or the agent's name). A `name` shows that heading instead, at the small size in --fg (never colored), with an
 *   optional sm Avatar beside it, for a thread with more than one agent or person.
 * - MessageText styles what a markdown renderer puts inside a turn, with no markdown library: paragraphs --space-3
 *   apart, headings at the body size in --fg, lists with the marker in --fg-subtle, links in --accent-text, inline
 *   code in the mono on fg 6% at the control radius, a `pre` as a quiet mono block on --surface-2, a blockquote
 *   with no rail, and strong text in --fg at the one weight (P9). It never bolds, and it never italicises, because the
 *   type is one face at one weight.
 * - MessageActions: sm ghost icon-only buttons with tooltips (Copy swaps to a check and a polite live region says
 *   "Copied", Retry, and the caller's own). They always show under the latest turn, on hover and focus-within under
 *   older ones, and always on a coarse pointer, where they grow to 44px. A streaming turn has none.
 * - Error: a turn that stopped says so on a line under its text: a 16px alert icon in --danger, the words in
 *   --fg-muted and a Retry sm secondary button. Status color is on the icon only. It has no actions row.
 * - Conversation: a labelled region that scrolls on its own and holds the turns in a column up to 48rem wide,
 *   centered, so the composer under it can share the column. It keeps the latest line in view while content grows
 *   (a ResizeObserver) unless the reader has scrolled up. Then a "Jump to latest" sm secondary button with an
 *   ArrowDown icon floats --space-4 above the bottom, centered, and jumps without a smooth scroll. It is aria-busy
 *   while the agent answers, and a polite live region says when a turn starts and ends, never the words.
 * - Motion (responsive tier, hooks only): a turn added after the Conversation mounted fades in and travels half of
 *   --travel upward, once. The turns that were there at the start, and a re-render, never animate. Nothing moves
 *   while text streams: there is no caret, no fade per word and no shimmer. The Jump button fades on the same
 *   tier. The actions' reveal is a color-family fade on the instant tier.
 * - Phones: the bubble is 85% wide on compact screens, the actions, the Retry and the Jump button are 44px on
 *   coarse pointers, and the actions are always visible there. Both signals come from useDevice, so
 *   <DeviceProvider mode="phone"> previews them with a mouse.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/button";
import { AlertIcon, ArrowDownIcon, CheckIcon, CopyIcon, RetryIcon } from "@/components/icons";
import { Tooltip } from "@/components/tooltip";
import { useDevice, useExit, useTransition, useTravel } from "@/motion";

/* ----------------------------------------------------------------- conversation */

type ConversationContextValue = {
  /** The agent's name: the hidden heading of an agent turn, and the live region's words. */
  agentName: string;
  /** False until the Conversation has mounted, so the turns that were already there never animate. */
  mounted: { current: boolean };
  /** Scrolls to the foot and keeps following, as when the person sends a message. */
  follow: () => void;
  /** A turn reported that it stopped, so the live region says so instead of "answered". */
  noteError: () => void;
};

const ConversationContext = createContext<ConversationContextValue | null>(null);

export type ConversationProps = {
  /** What the region is called for screen readers, such as "Conversation with Litt". Required, because it is a landmark. */
  label: string;
  /** True while the agent answers. It sets aria-busy on the region and makes the live region say the turn started and ended. */
  busy?: boolean;
  /** The agent's name, used in the live region ("Litt is answering", "Litt answered") and as the hidden heading of its turns. */
  agentName?: string;
  /** Extra classes for the whole conversation. Give it a height (h-96, or flex-1 min-h-0 in a column), because the region scrolls inside it. */
  className?: string;
  /** The turns: Message elements, in order. A first-use state, such as an Empty with suggestions, goes here too. */
  children?: ReactNode;
  /** The scrolling region, for a caller that needs to move it. */
  ref?: Ref<HTMLDivElement>;
};

/** How far from the foot still counts as the foot, in px. Fractional scroll positions land a pixel short. */
const NEAR_FOOT = 2;

/**
 * A chat's scrolling region and its centered column. It keeps the newest line in view while the answer grows, until the
 * reader scrolls up, and then offers "Jump to latest". Put Message elements inside it, and mark it busy while the agent answers.
 */
export function Conversation({ label, busy = false, agentName = "Litt", className = "", children, ref }: ConversationProps) {
  const scroller = useRef<HTMLDivElement | null>(null);
  const column = useRef<HTMLDivElement>(null);
  const stuck = useRef(true);
  const lastTop = useRef(0);
  const mounted = useRef(false);
  const errored = useRef(false);
  const wasBusy = useRef<boolean | null>(null);
  const [away, setAway] = useState(false);
  const [said, setSaid] = useState("");

  const { coarse } = useDevice();
  const enter = useTransition("responsive");
  const exit = useExit("responsive");

  const setScroller = useCallback(
    (el: HTMLDivElement | null) => {
      scroller.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );

  /* Start at the latest line, then follow the column and the frame as either one changes size. */
  useLayoutEffect(() => {
    const el = scroller.current;
    const col = column.current;
    if (!el || !col) return;
    mounted.current = true;
    el.scrollTop = el.scrollHeight;
    lastTop.current = el.scrollTop;
    const follow = () => {
      if (stuck.current) el.scrollTop = el.scrollHeight;
    };
    const watch = new ResizeObserver(follow);
    watch.observe(col);
    watch.observe(el);
    return () => watch.disconnect();
  }, []);

  /* At the foot means following. A step up, past the tolerance, means the reader has taken over. */
  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (gap < NEAR_FOOT) stuck.current = true;
    else if (el.scrollTop < lastTop.current) stuck.current = false;
    lastTop.current = el.scrollTop;
    setAway(!stuck.current);
  };

  const follow = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    stuck.current = true;
    el.scrollTop = el.scrollHeight;
    lastTop.current = el.scrollTop;
    setAway(false);
  }, []);

  const jump = () => {
    follow();
    /* The button is about to leave. Keep a keyboard where it was reading. */
    scroller.current?.focus({ preventScroll: true });
  };

  /* The start and the end of a turn, once each. The words never reach the live region. */
  useEffect(() => {
    if (busy) {
      errored.current = false;
      setSaid(`${agentName} is answering`);
    } else if (wasBusy.current) {
      setSaid(errored.current ? `${agentName} stopped answering` : `${agentName} answered`);
    }
    wasBusy.current = busy;
    /* The name is read when the turn starts or ends, and a change of name is no reason to say it again. */
  }, [busy]);

  const value = useMemo<ConversationContextValue>(
    () => ({ agentName, mounted, follow, noteError: () => void (errored.current = true) }),
    [agentName, follow],
  );

  return (
    <ConversationContext.Provider value={value}>
      <div className={`relative flex min-h-0 flex-col ${className}`}>
        <div
          ref={setScroller}
          role="region"
          aria-label={label}
          aria-busy={busy || undefined}
          tabIndex={0}
          onScroll={onScroll}
          className={
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 [scroll-behavior:auto] " +
            "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
          }
        >
          <div ref={column} className="mx-auto flex w-full max-w-[48rem] flex-col gap-8 py-6">
            {children}
          </div>
        </div>

        <AnimatePresence>
          {away && (
            <motion.div
              key="jump"
              className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: enter }}
              exit={{ opacity: 0, transition: exit }}
            >
              <Button
                size="sm"
                variant="secondary"
                icon={<ArrowDownIcon />}
                onClick={jump}
                data-coarse={coarse ? "" : undefined}
                className="pointer-events-auto pointer-coarse:h-control-md data-coarse:h-control-md"
              >
                Jump to latest
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {said}
        </p>
      </div>
    </ConversationContext.Provider>
  );
}

/* ----------------------------------------------------------------- message */

export type MessageProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  /** Who is speaking. The person's turn is a right-aligned bubble. The agent's turn has no bubble. */
  from?: "user" | "agent";
  /** A name shown above the turn, for a thread with more than one agent or person. It becomes the visible heading. Without it the heading is hidden: "You", or the Conversation's agentName. */
  name?: ReactNode;
  /** An sm Avatar beside the name. Pass it decorative, because the name is written next to it. */
  avatar?: ReactNode;
  /** Files the person sent, shown above their bubble, such as the Composer's file chips. */
  attachments?: ReactNode;
  /** The row under a finished agent turn, usually a MessageActions. It is left out while the turn streams or has stopped. */
  actions?: ReactNode;
  /** True while this turn's text is still arriving. The actions wait until it ends. */
  streaming?: boolean;
  /** Says the turn stopped, on a line under its text with a Retry button. Pass true for "The answer stopped.", or the reason as words. */
  error?: ReactNode;
  /** Called by the error line's Retry button. Without it the line has no button. */
  onRetry?: () => void;
  /** Marks the newest turn, so its actions always show. It is needed only when something other than a Message follows it in the column. */
  latest?: boolean;
  /** The level of the turn's heading. Three suits a page with a title and sections. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** The parts of the turn, in order: thinking, a plan, tool calls, then a MessageText. For the person's turn, the text they wrote. */
  children?: ReactNode;
  /** Extra classes for the article. */
  className?: string;
};

/**
 * One turn: an article named by a heading. The agent's words sit bare on the page, the person's in a raised bubble on the right.
 * A turn added after the Conversation mounted fades in once; the person's own turn also scrolls the Conversation to the foot.
 */
export function Message({
  from = "agent",
  name,
  avatar,
  attachments,
  actions,
  streaming = false,
  error,
  onRetry,
  latest,
  headingLevel = 3,
  className = "",
  children,
  ...rest
}: MessageProps) {
  const conversation = useContext(ConversationContext);
  const headingId = useId();
  const { compact, coarse } = useDevice();
  const enter = useTransition("responsive");
  const travel = useTravel();

  /* A turn that mounts with the Conversation is history. One that arrives later enters, once. The travel is 0 under
     reduced motion, so there it simply appears, with no frame at zero opacity. */
  const [fresh] = useState(() => conversation?.mounted.current ?? false);
  const follow = conversation?.follow;
  useLayoutEffect(() => {
    if (fresh && from === "user") follow?.();
    /* Only when the turn arrives. */
  }, []);

  const failed = error !== undefined && error !== null && error !== false;
  const noteError = conversation?.noteError;
  useEffect(() => {
    if (failed) noteError?.();
  }, [failed, noteError]);

  const person = from === "user";
  const Heading = `h${headingLevel}` as "h3";
  const hidden = person ? "You" : (conversation?.agentName ?? "Litt");
  const words = error === true ? "The answer stopped." : error;

  const header =
    name !== undefined && name !== null && name !== false ? (
      <div className={`flex items-center gap-2 ${person ? "justify-end" : ""}`}>
        {avatar}
        <Heading id={headingId} className="text-small text-fg">
          {name}
        </Heading>
      </div>
    ) : (
      <Heading id={headingId} className="sr-only">
        {hidden}
      </Heading>
    );

  return (
    <article
      {...rest}
      aria-labelledby={headingId}
      data-from={from}
      data-latest={latest ? "" : undefined}
      data-coarse={coarse ? "" : undefined}
      className={`group/turn ${className}`}
    >
      <motion.div
        initial={fresh && travel > 0 ? { opacity: 0, y: travel / 2 } : false}
        animate={{ opacity: 1, y: 0, transition: enter }}
        className={person ? "flex flex-col items-end gap-3" : "flex flex-col gap-3 text-body text-fg-muted"}
      >
        {header}

        {person ? (
          <>
            {attachments && <div className="flex max-w-full flex-wrap justify-end gap-2">{attachments}</div>}
            <div
              className={
                "litt-raised px-4 py-3 text-body text-fg whitespace-pre-wrap [overflow-wrap:anywhere] " +
                (compact ? "max-w-[min(85%,32rem)]" : "max-w-[min(80%,32rem)]")
              }
            >
              {children}
            </div>
          </>
        ) : (
          <>
            {children}

            {failed && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="flex min-w-0 items-start gap-2 text-small text-fg-muted">
                  <span className="flex h-[1lh] shrink-0 items-center text-danger">
                    <AlertIcon />
                  </span>
                  <span className="min-w-0">{words}</span>
                </p>
                {onRetry && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={onRetry}
                    data-coarse={coarse ? "" : undefined}
                    className="pointer-coarse:h-control-md data-coarse:h-control-md"
                  >
                    Retry
                  </Button>
                )}
              </div>
            )}

            {actions && !streaming && !failed && (
              <div
                className={
                  /* The first icon lines up with the text's edge, so the hover fill hangs out into the gutter. */
                  "-ms-2 pointer-coarse:-ms-3.5 group-data-coarse/turn:-ms-3.5 " +
                  "opacity-0 transition-[opacity] duration-(--dur-instant) ease-litt " +
                  "group-hover/turn:opacity-100 group-focus-within/turn:opacity-100 group-last/turn:opacity-100 " +
                  "group-data-latest/turn:opacity-100 group-data-coarse/turn:opacity-100 pointer-coarse:opacity-100"
                }
              >
                {actions}
              </div>
            )}
          </>
        )}
      </motion.div>
    </article>
  );
}

/* ----------------------------------------------------------------- message text */

/* What a markdown renderer puts inside an answer. Every rule is a descendant selector, so any renderer works, and each
   color, size and radius is a litt token. Weight stays 400: the base layer resets headings, b, strong and th. */
const PROSE = [
  "flex min-w-0 max-w-[68ch] flex-col gap-3 text-body [&>*]:min-w-0 [&_p]:text-pretty",
  /* Headings: the body size in --fg. The step in color is the hierarchy, as everywhere. */
  "[&_:is(h1,h2,h3,h4)]:text-body [&_:is(h1,h2,h3,h4)]:text-fg [&>:is(h1,h2,h3,h4):not(:first-child)]:mt-2",
  /* Lists: the marker steps back to --fg-subtle. A nested list tucks under its item. */
  "[&_ul]:list-disc [&_ol]:list-decimal [&_:is(ul,ol)]:ps-6 [&_li+li]:mt-1 [&_li::marker]:text-fg-subtle [&_li_:is(ul,ol)]:mt-1",
  /* Links: accent text, always underlined, so color is never the only mark. */
  "[&_a]:text-accent-text [&_a]:underline [&_a]:decoration-[color-mix(in_oklab,var(--accent-text)_40%,transparent)] [&_a]:underline-offset-2 [&_a:hover]:decoration-accent-text",
  /* Strong and emphasis step to --fg. No bold and no italic: one face at one weight (P9). */
  "[&_:is(strong,b)]:[font-weight:var(--weight)] [&_:is(strong,b)]:text-fg [&_:is(em,i)]:not-italic [&_:is(em,i)]:text-fg",
  /* Inline code: the mono on fg 6% at the control radius. A pre resets it below. */
  "[&_code]:rounded-control [&_code]:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-small [&_code]:text-fg [&_code]:box-decoration-clone [&_code]:[overflow-wrap:anywhere]",
  /* A pre: a quiet mono block on --surface-2. It wraps, so it never needs a scrollbar. CodeBlock is for code to read or copy. */
  "[&_pre]:whitespace-pre-wrap [&_pre]:rounded-surface [&_pre]:bg-surface-2 [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-small [&_pre]:text-fg [&_pre]:shadow-[inset_0_0_0_1px_var(--line)] [&_pre]:[overflow-wrap:anywhere] [&_pre]:[tab-size:2]",
  "[&_pre_code]:rounded-none [&_pre_code]:bg-transparent [&_pre_code]:p-0",
  /* A blockquote: indented and a step quieter. No rail and no tint. */
  "[&_blockquote]:grid [&_blockquote]:gap-3 [&_blockquote]:ps-4 [&_blockquote]:text-fg-subtle",
  "[&_hr]:my-1 [&_hr]:border-line",
  "[&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-surface",
  /* A table: hairlines between rows, headings in --fg, cells that wrap instead of scrolling. */
  "[&_table]:w-full [&_table]:border-collapse [&_table]:text-small [&_tr]:border-b [&_tr]:border-line",
  "[&_th]:py-2 [&_th]:pe-4 [&_th]:text-start [&_th]:text-fg [&_td]:py-2 [&_td]:pe-4 [&_td]:align-top [&_:is(th,td)]:[overflow-wrap:anywhere]",
].join(" ");

export type MessageTextProps = {
  /** What a markdown renderer produced (p, h1 to h4, ul, ol, li, a, code, pre, blockquote, strong, em, hr, table), or a plain string, which becomes one paragraph. */
  children?: ReactNode;
  /** Extra classes for the text block. */
  className?: string;
};

/**
 * The prose of an answer: a column of at most 68ch with the markdown elements styled in litt's tokens. Give it your renderer's
 * output, or a string for one paragraph.
 */
export function MessageText({ children, className = "" }: MessageTextProps) {
  return <div className={`${PROSE} ${className}`}>{typeof children === "string" ? <p>{children}</p> : children}</div>;
}

/* ----------------------------------------------------------------- message actions */

/** Puts text on the clipboard. The async API needs a secure context and a permission, so a hidden field and execCommand stand behind it. */
async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    /* fall through to the older route */
  }
  const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.setAttribute("aria-hidden", "true");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    const ok = document.execCommand("copy");
    field.remove();
    return ok;
  } catch {
    return false;
  } finally {
    focused?.focus({ preventScroll: true });
  }
}

export type MessageActionsProps = {
  /** The text the Copy button puts on the clipboard. Without it there is no Copy button. */
  copyText?: string;
  /** Called by the Retry button. Without it there is no Retry button. */
  onRetry?: () => void;
  /** The group's name for screen readers. */
  label?: string;
  /** Your own buttons, after Copy and Retry: sm ghost icon-only Buttons, each in a Tooltip and with an aria-label. */
  children?: ReactNode;
  /** Extra classes for the row. */
  className?: string;
};

/** How long the check stays in place of the copy icon, in ms. An interaction delay, not an animation. */
const COPIED_FOR = 2000;

/**
 * The row under a finished agent turn: Copy (it swaps to a check and says "Copied" politely), Retry, and your own buttons.
 * Pass it to a Message's actions, which shows it under the latest turn, on hover and focus under older ones, and always on touch.
 */
export function MessageActions({ copyText, onRetry, label = "Message actions", children, className = "" }: MessageActionsProps) {
  const { coarse } = useDevice();
  const [copied, setCopied] = useState(false);
  const [said, setSaid] = useState("");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    if (copyText === undefined) return;
    const ok = await writeClipboard(copyText);
    window.clearTimeout(timer.current);
    setCopied(ok);
    setSaid(ok ? "Copied" : "Could not copy");
    timer.current = window.setTimeout(() => {
      setCopied(false);
      setSaid("");
    }, COPIED_FOR);
  }

  return (
    <div
      role="group"
      aria-label={label}
      data-coarse={coarse ? "" : undefined}
      className={
        "flex flex-wrap items-center gap-1 " +
        "pointer-coarse:[&_button]:h-control-md pointer-coarse:[&_button]:w-control-md " +
        "data-coarse:[&_button]:h-control-md data-coarse:[&_button]:w-control-md " +
        className
      }
    >
      {copyText !== undefined && (
        <Tooltip content={copied ? "Copied" : "Copy"}>
          <Button size="sm" variant="ghost" iconOnly aria-label="Copy" onClick={copy}>
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
        </Tooltip>
      )}
      {onRetry && (
        <Tooltip content="Retry">
          <Button size="sm" variant="ghost" iconOnly aria-label="Retry" onClick={onRetry}>
            <RetryIcon />
          </Button>
        </Tooltip>
      )}
      {children}
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {said}
      </span>
    </div>
  );
}
