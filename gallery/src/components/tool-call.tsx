/**
 * Tool call: what an agent did, one row per call, a group that folds a run of them, and an approval that asks first
 * (components.md, "Tool call"; proposals/agents.md, decisions 4, 7 and 9).
 *
 * - Row: at least 32px tall (44px on a coarse pointer), in one line: the 16px StatusIcon, the action in words (small,
 *   fg-muted: "Read", "Ran", "Searched"), the target in mono (small, fg: "src/app.tsx", "npm test"), cut at the end with
 *   an ellipsis, then a word for the status when it has one and the time (mono caption, fg-subtle, tabular) at the row's
 *   end. A 16px slot at the very end holds the chevron, and stays empty on a call with no details, so the times of a
 *   run of calls line up.
 * - Status: the Timeline's marks through StatusIcon. Running is the half-filled circle in fg and never spins or pulses.
 *   Done is the check in fg-muted. Failed is the x in danger, with "Failed" in words. Waiting is the empty circle in
 *   fg-subtle with "Waiting for approval". Denied is the dashed circle with "Denied". Color is on the icon only, and every
 *   status is also said in hidden text: a done or running call has a hidden word, the others say it in the visible one.
 * - Details: with `input` or `output` the row is a disclosure button with a chevron that turns a quarter on the instant
 *   tier. The details are captioned blocks (the caption in fg-subtle) in mono at the caption size in fg on surface-2, with an
 *   inset line at the surface radius, padded space-3. Past 16rem a block scrolls inside, and it is focusable and labelled
 *   ("Output of npm test"). Output stays fg when the call failed: the status says it.
 * - Group: ToolCallGroup folds a run of calls under one row (the caller's summary, or "4 tool calls"). It is open while
 *   `running`, and closes itself when `running` goes false unless the reader toggled it. Its calls are a list.
 * - Approval: ToolApproval is a litt-raised panel in the flow (never glass, P3): a title (body, the title weight, fg), the command in mono on
 *   surface-2 at the control radius, one line in fg-subtle, an optional "always allow" Checkbox, then md actions, Allow
 *   (primary, the view's one accent fill because the Composer's Send is disabled while it waits) and Deny (ghost). It does
 *   not take focus when it appears: the person may be reading. A polite live region says "Waiting for your approval:
 *   <command>". With a `decision` it becomes a ToolCall row. If the buttons held focus when the choice was made, focus
 *   moves to the row, so a keyboard never falls back to the top of the page.
 * - Motion: the chevron's quarter turn is the instant tier (CSS). A call's details and a group's calls fade in and travel a
 *   quarter of the travel token on the responsive tier, and leave on the exit token. Their height snaps. A status mark
 *   swaps at once and colors fade on the instant tier. Nothing loops.
 * - Phones: rows grow to 44px on a coarse pointer, a long target is cut with an ellipsis, the command wraps instead of
 *   scrolling, and the actions wrap. A pressed row takes the hover color on a coarse pointer.
 */
import { Children, createContext, isValidElement, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { ChevronRightIcon, StatusIcon, type StepStatus } from "@/components/icons";
import { useExit, useTransition, useTravel } from "@/motion";

/* ----------------------------------------------------------------- lookups */

/** Where a call stands. Waiting shows the empty circle and denied the dashed one. */
export type ToolCallStatus = "running" | "done" | "failed" | "waiting" | "denied";

/** What the person decided about an approval. Pending shows the panel; the other two show a row. */
export type ToolApprovalDecision = "pending" | "allowed" | "denied";

/** The mark each status draws. Literal strings, so Tailwind sees every class. */
const MARK: Record<ToolCallStatus, StepStatus> = { running: "running", done: "done", failed: "failed", waiting: "pending", denied: "skipped" };
const TONE: Record<ToolCallStatus, string> = {
  running: "text-fg",
  done: "text-fg-muted",
  failed: "text-danger",
  waiting: "text-fg-subtle",
  denied: "text-fg-subtle",
};
/** The visible word a status carries. Done and running have none: the mark and the hidden word say it. */
const WORD: Partial<Record<ToolCallStatus, string>> = { failed: "Failed", waiting: "Waiting for approval", denied: "Denied" };
const HIDDEN_WORD: Partial<Record<ToolCallStatus, string>> = { running: "running", done: "done" };

/* ----------------------------------------------------------------- time */

const tidy = (n: number) => (Number.isInteger(n) ? String(n) : n < 10 ? n.toFixed(1) : String(Math.round(n)));

/** "0.2s", "14s", "1m 12s". */
function formatSeconds(total: number): string {
  const s = Math.max(0, total);
  if ((s >= 10 ? Math.round(s) : s) < 60) return `${tidy(s)}s`;
  const whole = Math.round(s);
  const m = Math.floor(whole / 60);
  const r = whole - m * 60;
  return r ? `${m}m ${r}s` : `${m}m`;
}

/** "14 seconds": what a screen reader should say where the page shows "14s". */
function speakSeconds(total: number): string {
  const s = Math.max(0, total);
  if ((s >= 10 ? Math.round(s) : s) < 60) {
    const t = tidy(s);
    return `${t} ${t === "1" ? "second" : "seconds"}`;
  }
  const whole = Math.round(s);
  const m = Math.floor(whole / 60);
  const r = whole - m * 60;
  const minutes = `${m} ${m === 1 ? "minute" : "minutes"}`;
  return r ? `${minutes} ${r} ${r === 1 ? "second" : "seconds"}` : minutes;
}

/** A number is seconds and is formatted and spoken. A string is shown and spoken as it is. */
function readTime(value: number | string) {
  return typeof value === "number" ? { visual: formatSeconds(value), spoken: speakSeconds(value) } : { visual: value, spoken: value };
}

const given = (node: ReactNode) => node !== undefined && node !== null && node !== false && node !== "";

/* ----------------------------------------------------------------- shared pieces */

/** True inside a ToolCallGroup, where a call is a list item. */
const InGroup = createContext(false);

const ROW =
  "group/row flex min-h-8 w-full items-center gap-2 text-left pointer-coarse:min-h-11";
const ROW_BUTTON =
  "cursor-pointer rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
  "[-webkit-tap-highlight-color:transparent]";
/* Only a row that opens something brightens: a plain row has nothing to answer. A press does the same on a finger. */
const BRIGHTEN =
  "transition-colors duration-(--dur-instant) ease-litt group-hover/row:text-fg pointer-coarse:group-active/row:text-fg";

/** The chevron's slot, always 16px wide at the row's end so the times line up. It turns a quarter when open. */
function Chevron({ show, open }: { show: boolean; open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={
        "grid size-4 shrink-0 place-items-center text-fg-subtle transition-colors duration-(--dur-instant) ease-litt " +
        "group-hover/row:text-fg-muted pointer-coarse:group-active/row:text-fg-muted"
      }
    >
      {show && (
        <ChevronRightIcon className={"transition-[rotate] duration-(--dur-instant) ease-litt " + (open ? "rotate-90" : "rotate-0")} />
      )}
    </span>
  );
}

/** A time at the end of a row: mono caption in fg-subtle. The short form is hidden from screen readers, the spoken form is not. */
function Time({ value }: { value: number | string }) {
  const t = readTime(value);
  return (
    <span className="font-mono text-caption font-normal tabular-nums whitespace-nowrap text-fg-subtle">
      <span aria-hidden="true">{t.visual}</span>
      <span className="sr-only"> {t.spoken}</span>
    </span>
  );
}

/** The body of a disclosure: it fades in and travels a quarter of the travel token on the responsive tier, and leaves on the exit token. Its height snaps. */
function Reveal({ open, id, className = "", children }: { open: boolean; id: string; className?: string; children: ReactNode }) {
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const travel = useTravel();
  /* A body that is open on the first render appears without a fade. Not through AnimatePresence initial={false}:
     that reaches every motion component inside the body and swallows their own entrances (see tabs.tsx). */
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="body"
          id={id}
          className={className}
          initial={mounted.current ? { opacity: 0, y: -travel / 4 } : false}
          animate={{ opacity: 1, y: 0, transition: enter }}
          exit={{ opacity: 0, transition: exit }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Open and closed, controlled or not. */
function useDisclosure(openProp: boolean | undefined, defaultOpen: boolean, onOpenChange: ((open: boolean) => void) | undefined) {
  const [inner, setInner] = useState(defaultOpen);
  const open = openProp ?? inner;
  const set = (next: boolean) => {
    if (openProp === undefined) setInner(next);
    onOpenChange?.(next);
  };
  return [open, set] as const;
}

/** A captioned block of mono text: a surface-2 well with an inset line that scrolls inside past 16rem and can be focused. */
function Block({ caption, name, children }: { caption: string; name: string | undefined; children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-1">
      <p aria-hidden="true" className="text-caption text-fg-subtle">
        {caption}
      </p>
      <div
        role="region"
        tabIndex={0}
        aria-label={name ? `${caption} of ${name}` : caption}
        className={
          "max-h-64 overflow-auto rounded-surface bg-surface-2 p-3 font-mono text-caption font-normal text-fg " +
          "whitespace-pre-wrap [overflow-wrap:anywhere] shadow-[inset_0_0_0_1px_var(--line)] " +
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
        }
      >
        {children}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- ToolCall */

export type ToolCallProps = {
  /** Where the call stands. Waiting shows the empty circle and "Waiting for approval", denied the dashed circle and "Denied", failed the x and "Failed". */
  status?: ToolCallStatus;
  /** What the call did, in words: "Read", "Ran", "Searched". Use the present tense while it runs: "Running". */
  action: ReactNode;
  /** What it did it to, in mono: a file, a command or a query. It is cut at the end with an ellipsis, and a text target is the full text in a tooltip. */
  target?: ReactNode;
  /** How long it took. A number is seconds ("14s", read as "14 seconds"); a string is shown and read as given. Leave it out while the time is not known. */
  duration?: number | string;
  /** What the call was given, shown under an "Input" caption when the row is opened. Text or elements. */
  input?: ReactNode;
  /** What the call returned, shown under an "Output" caption when the row is opened. Text or elements. It stays the foreground color when the call failed. */
  output?: ReactNode;
  /** Names the call in the details' labels ("Output of npm test"). Defaults to the target when that is text, then to the action when that is text. */
  label?: string;
  /** Replaces the status word after the target, and what a screen reader hears for the status: "Allowed" for an approved call. Failed, waiting and denied have their own words. */
  statusLabel?: string;
  /** Whether the details are open, when you control it. Pair it with onOpenChange. A call with no input and no output has no details. */
  open?: boolean;
  /** Whether the details start open when you do not control them. */
  defaultOpen?: boolean;
  /** Called with the new state when the reader opens or closes the details. */
  onOpenChange?: (open: boolean) => void;
  /** Extra classes for the call, such as a top margin. */
  className?: string;
};

/**
 * One tool call as a row: a status mark, the action in words, the target in mono and the time. With an input or an output the
 * row is a button that opens them under it. In a ToolCallGroup it is a list item.
 */
export function ToolCall({
  status = "done",
  action,
  target,
  duration,
  input,
  output,
  label,
  statusLabel,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  className = "",
}: ToolCallProps) {
  const id = useId();
  const inGroup = useContext(InGroup);
  const [open, setOpen] = useDisclosure(openProp, defaultOpen, onOpenChange);

  const hasInput = given(input);
  const hasOutput = given(output);
  const details = hasInput || hasOutput;
  const name = label ?? (typeof target === "string" ? target : typeof action === "string" ? action : undefined);
  const word = statusLabel ?? WORD[status];

  const content = (
    <>
      <StatusIcon status={MARK[status]} className={"shrink-0 " + TONE[status]} />
      <span className={"shrink-0 whitespace-nowrap text-small text-fg-muted " + (details ? BRIGHTEN : "")}>{action}</span>
      {given(target) && (
        <span title={typeof target === "string" ? target : undefined} className="min-w-0 truncate font-mono text-small text-fg">
          {target}
        </span>
      )}
      <span className="ml-auto flex shrink-0 items-center gap-2">
        {word ? (
          <span className="whitespace-nowrap text-small text-fg-muted">{word}</span>
        ) : (
          HIDDEN_WORD[status] && <span className="sr-only">{HIDDEN_WORD[status]}</span>
        )}
        {duration !== undefined && <Time value={duration} />}
        <Chevron show={details} open={open} />
      </span>
    </>
  );

  return (
    <div role={inGroup ? "listitem" : undefined} className={"min-w-0 " + className}>
      {details ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          onClick={() => setOpen(!open)}
          className={ROW + " " + ROW_BUTTON}
        >
          {content}
        </button>
      ) : (
        <div className={ROW}>{content}</div>
      )}
      {details && (
        <Reveal open={open} id={id} className="grid gap-3 pt-1 pb-2 pl-6">
          {hasInput && (
            <Block caption="Input" name={name}>
              {input}
            </Block>
          )}
          {hasOutput && (
            <Block caption="Output" name={name}>
              {output}
            </Block>
          )}
        </Reveal>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- ToolCallGroup */

export type ToolCallGroupProps = {
  /** What the run did, in one line: "Read 3 files and ran the tests". Without one the row says "4 tool calls". */
  summary?: ReactNode;
  /** True while any call in the group runs. The group is open then, and closes itself when this goes false, unless the reader toggled it. */
  running?: boolean;
  /** How long the whole run took, at the end of the row. A number is seconds; a string is shown as given. */
  duration?: number | string;
  /** Whether the group is open, when you control it. Pair it with onOpenChange. This replaces the automatic open and close. */
  open?: boolean;
  /** Whether the group starts open or closed. It then stays as the reader leaves it, so it no longer follows `running`. */
  defaultOpen?: boolean;
  /** Called with the new state when the reader opens or closes the group. */
  onOpenChange?: (open: boolean) => void;
  /** The ToolCalls of the run. Keep an approval outside the group, so the panel is never hidden. */
  children: ReactNode;
  /** Extra classes for the group, such as a top margin. */
  className?: string;
};

/**
 * Folds a run of tool calls under one row. It is open while `running` and closes itself when the run ends, unless the reader
 * opened or closed it first: their choice always wins. The calls inside are a list.
 */
export function ToolCallGroup({
  summary,
  running = false,
  duration,
  open: openProp,
  defaultOpen,
  onOpenChange,
  children,
  className = "",
}: ToolCallGroupProps) {
  const id = useId();
  const summaryId = useId();
  /* The reader's own choice, once they make one (or the caller's defaultOpen). Until then the group follows `running`. */
  const [chosen, setChosen] = useState<boolean | null>(defaultOpen ?? null);
  const open = openProp ?? chosen ?? running;
  const toggle = () => {
    const next = !open;
    if (openProp === undefined) setChosen(next);
    onOpenChange?.(next);
  };
  const count = Children.toArray(children).filter(isValidElement).length;
  const said = summary ?? `${count} tool ${count === 1 ? "call" : "calls"}`;

  return (
    <div className={"min-w-0 " + className}>
      <button type="button" aria-expanded={open} aria-controls={open ? id : undefined} onClick={toggle} className={ROW + " " + ROW_BUTTON}>
        <span id={summaryId} className={"min-w-0 py-1 text-small text-fg-muted " + BRIGHTEN}>
          {said}
          {running && <span className="sr-only"> running</span>}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-2">
          {duration !== undefined && <Time value={duration} />}
          <Chevron show open={open} />
        </span>
      </button>
      <Reveal open={open} id={id} className="pt-1 pb-2 pl-6">
        <InGroup.Provider value>
          <div role="list" aria-labelledby={summaryId}>
            {children}
          </div>
        </InGroup.Provider>
      </Reveal>
    </div>
  );
}

/* ----------------------------------------------------------------- ToolApproval */

export type ToolApprovalProps = {
  /** The question, at the body size: "Run a command?". */
  title?: ReactNode;
  /** The call itself, in mono on a quiet well: "npm run deploy". It wraps rather than scrolls, so a phone can read all of it. */
  command: string;
  /** One line on what it touches, in the quiet tone: "Publishes the Halo site to halo.studio." */
  description?: ReactNode;
  /** Called when the person presses Allow, with whether they ticked the always-allow box. Set `decision` to "allowed" in it. */
  onAllow?: (details: { always: boolean }) => void;
  /** Called when the person presses Deny. Set `decision` to "denied" in it. */
  onDeny?: () => void;
  /** Shows a checkbox with this label, such as "Always allow npm run deploy", above the actions. Leave it out for a plain Allow and Deny. */
  alwaysAllowLabel?: string;
  /** What the person decided. Pending shows the panel, and allowed or denied show the call as a row, "Allowed" or "Denied". */
  decision?: ToolApprovalDecision;
  /** Extra classes, such as a top margin. */
  className?: string;
};

/**
 * Asks before a call runs: a raised panel in the flow with the command and Allow and Deny. It does not take focus when it
 * appears, and a polite live region says what it waits for. Once `decision` is set it becomes a tool call row.
 */
export function ToolApproval({
  title = "Run a command?",
  command,
  description,
  onAllow,
  onDeny,
  alwaysAllowLabel,
  decision = "pending",
  className = "",
}: ToolApprovalProps) {
  const titleId = useId();
  const root = useRef<HTMLDivElement>(null);
  const hadFocus = useRef(false);
  const [always, setAlways] = useState(false);
  const [said, setSaid] = useState("");

  /* The region exists before its words do, so a screen reader announces the change. After a choice made with focus in the
     panel, focus moves to the row instead: the row is read when it takes focus, and the region stays quiet. */
  useEffect(() => {
    if (decision === "pending") {
      setSaid(`Waiting for your approval: ${command}`);
      return;
    }
    if (hadFocus.current) {
      hadFocus.current = false;
      setSaid("");
      root.current?.focus({ preventScroll: true });
      return;
    }
    setSaid(`${decision === "allowed" ? "Allowed" : "Denied"}: ${command}`);
  }, [decision, command]);

  const decide = (choose: () => void) => {
    hadFocus.current = root.current?.contains(document.activeElement) ?? false;
    choose();
  };

  return (
    <div
      ref={root}
      tabIndex={-1}
      className={"min-w-0 rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " + className}
    >
      <div role="status" className="sr-only">
        {said}
      </div>
      {decision === "pending" ? (
        <div role="group" aria-labelledby={titleId} className="litt-raised grid gap-3 p-4">
          <p id={titleId} className="text-body font-title text-fg">
            {title}
          </p>
          <code className="block rounded-control bg-surface-2 px-3 py-2 font-mono text-small text-fg whitespace-pre-wrap [overflow-wrap:anywhere]">
            {command}
          </code>
          {given(description) && <p className="text-small text-fg-subtle">{description}</p>}
          {alwaysAllowLabel && <Checkbox label={alwaysAllowLabel} checked={always} onChange={(e) => setAlways(e.target.checked)} />}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button variant="primary" onClick={() => decide(() => onAllow?.({ always }))}>
              Allow
            </Button>
            <Button variant="ghost" onClick={() => decide(() => onDeny?.())}>
              Deny
            </Button>
          </div>
        </div>
      ) : (
        <ToolCall
          status={decision === "allowed" ? "done" : "denied"}
          statusLabel={decision === "allowed" ? "Allowed" : "Denied"}
          action="Run"
          target={command}
        />
      )}
    </div>
  );
}
