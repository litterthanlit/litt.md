import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AgentStatus, type AgentStatusAction, type AgentStatusState } from "@/components/agent-status";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "agent-status",
  title: "Agent status",
  lede: "Live run status, elapsed time and three latched phases on one quiet card.",
  order: 9.06,
  group: "Agents",
  verbs: ["watch", "press"],
  worlds: ["flat"],
  summary:
    "One paper card reporting an assistant run across seven states, with a frameless status dot, a standing elapsed figure and three horizontal phase pills that latch in order across the sequential ramp. It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "When the card first enters view, reached phase pills sweep open along X on the expressive spring (350ms), then hold completely still with no timer running at rest. Once a run enters a live phase (thinking, tool, or writing), the elapsed figure counts up, pauses while waiting for approval, and freezes on done, error, or stopped. State changes announce once in a polite status region without speaking on clock ticks, and under reduced motion every phase change settles at once.",
};

export const docs: PageDocs = {
  components: ["agent-status"],
  exports: ["AgentStatus"],
  usage: `import { AgentStatus } from "@/components/agent-status";

<AgentStatus
  state="done"
  elapsed={4.2}
/>`,
  use: [
    "Showing whether an editorial or research assistant is thinking, calling a tool, writing, waiting for approval, or finished.",
    "Pairing live run progress and elapsed time with one quiet control to stop, approve, or run again.",
  ],
  skip: [
    "Another world's page. AgentStatus is drawn on Flat's white paper card with frameless dots and latched phase pills; it needs data-material=\"flat\" on <html>.",
    "A single linear upload or download bar. Use Progress.",
    "A full transcript of every step and drafted paragraph. Use AgentRun or LogView.",
  ],
  keyboard: [
    [["Tab"], "Moves focus to the action pill when an onAction handler is provided."],
    [["Enter", "Space"], "Activates the visible action pill (Run, Stop, Approve, or Retry)."],
    [["Escape"], "Stops a live or waiting run when focus is inside the status card and onAction is provided."],
  ],
  a11y: [
    "The card exposes role=\"region\" with an accessible label and pairs every status dot with a plain state word so color never carries state alone.",
    "Each phase pill pairs its visible label (Think, Tool, Write) with a screen-reader status word (active, reached, or pending).",
    "State transitions announce once in a polite status region and never announce on elapsed timer ticks.",
    "Under reduced motion the arrival sweep and tap scale are skipped, and live elapsed counting steps in whole seconds.",
  ],
};

/* Literal CSS variable strings so gen-registry renames every data token cleanly. */
const SWITCH_STATES: { value: AgentStatusState; label: string; dot?: string }[] = [
  { value: "thinking", label: "Thinking", dot: "var(--data-violet)" },
  { value: "tool", label: "Tool", dot: "var(--data-blue)" },
  { value: "writing", label: "Writing", dot: "var(--data-teal)" },
  { value: "waiting", label: "Waiting", dot: "var(--data-amber)" },
  { value: "done", label: "Done", dot: "var(--data-teal)" },
  { value: "error", label: "Error", dot: "var(--data-rose)" },
  { value: "stopped", label: "Stopped" },
];

function AgentStatusDemo() {
  const { reduced } = useMotionDial();
  const [state, setState] = useState<AgentStatusState>("done");
  const [elapsed, setElapsed] = useState<number | undefined>(4.2);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  const startRun = useCallback(() => {
    clearTimers();
    if (reduced) {
      setElapsed(2.6);
      setState("waiting");
      return;
    }
    setElapsed(undefined);
    setState("thinking");
    schedule(() => setState("tool"), 1000);
    schedule(() => setState("waiting"), 2200);
  }, [clearTimers, reduced, schedule]);

  const resumeAfterApproval = useCallback(() => {
    clearTimers();
    if (reduced) {
      setElapsed(4.2);
      setState("done");
      return;
    }
    setElapsed(undefined);
    setState("writing");
    schedule(() => setState("done"), 1200);
  }, [clearTimers, reduced, schedule]);

  const handleAction = useCallback(
    (action: AgentStatusAction) => {
      if (action === "stop") {
        clearTimers();
        setState("stopped");
        return;
      }
      if (action === "approve") {
        resumeAfterApproval();
        return;
      }
      startRun();
    },
    [clearTimers, resumeAfterApproval, startRun],
  );

  const pickState = useCallback(
    (next: AgentStatusState) => {
      clearTimers();
      if (next === "thinking" || next === "tool" || next === "writing") {
        setElapsed(undefined);
      }
      setState(next);
    },
    [clearTimers],
  );

  const onSwitcherKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = SWITCH_STATES.length;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const radios = [...e.currentTarget.querySelectorAll<HTMLElement>("[role=radio]")];
    const focused = radios.indexOf(document.activeElement as HTMLElement);
    const at = focused >= 0 ? focused : Math.max(0, SWITCH_STATES.findIndex((item) => item.value === state));
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const fwd = e.key === "ArrowDown" || e.key === (rtl ? "ArrowLeft" : "ArrowRight");
    const back = e.key === "ArrowUp" || e.key === (rtl ? "ArrowRight" : "ArrowLeft");
    const to = fwd ? (at + 1) % n : back ? (at - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    const target = SWITCH_STATES[to];
    if (!target) return;
    pickState(target.value);
    radios[to]?.focus();
  };

  return (
    <div className="grid w-full max-w-sm min-w-0 gap-4">
      <AgentStatus state={state} elapsed={elapsed} onAction={handleAction} />

      <div
        role="radiogroup"
        aria-label="Preview state"
        onKeyDown={onSwitcherKeyDown}
        className="-mx-2 flex flex-wrap items-center gap-x-1 gap-y-1"
      >
        {SWITCH_STATES.map((item) => {
          const active = state === item.value;
          return (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              data-part="lettering"
              onClick={() => pickState(item.value)}
              className={
                "litt-target relative inline-flex h-control-sm cursor-pointer items-center gap-1.5 rounded-pill bg-transparent px-2 text-caption font-normal select-none " +
                "[-webkit-tap-highlight-color:transparent] transition-colors duration-(--dur-instant) ease-litt " +
                "hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] " +
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
                (active ? "text-fg" : "text-fg-subtle hover:text-fg")
              }
            >
              <span
                aria-hidden="true"
                data-part={active ? "circle" : "outline"}
                className={
                  "size-2 shrink-0 rounded-pill border-2 transition-colors duration-(--dur-instant) ease-litt forced-colors:border-[CanvasText] " +
                  (active
                    ? item.dot
                      ? "border-transparent"
                      : "border-transparent bg-fg-disabled"
                    : "border-fg-subtle bg-transparent")
                }
                style={active && item.dot ? { backgroundColor: item.dot } : undefined}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WaitingApprovalDemo() {
  const { reduced } = useMotionDial();
  const [state, setState] = useState<AgentStatusState>("waiting");
  const [elapsed, setElapsed] = useState<number | undefined>(2.6);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const handleAction = (action: AgentStatusAction) => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (action === "approve") {
      if (reduced) {
        setElapsed(3.8);
        setState("done");
        return;
      }
      setElapsed(undefined);
      setState("writing");
      timerRef.current = window.setTimeout(() => setState("done"), 1100);
      return;
    }
    if (action === "stop") {
      setState("stopped");
      return;
    }
    setElapsed(2.6);
    setState("waiting");
  };

  return <AgentStatus state={state} elapsed={elapsed} onAction={handleAction} className="max-w-sm" />;
}

function ReplayAgentStatus() {
  const { reduced } = useMotionDial();
  const [state, setState] = useState<AgentStatusState>(reduced ? "done" : "thinking");
  const [elapsed, setElapsed] = useState<number>(reduced ? 4.2 : 0.4);

  useEffect(() => {
    if (reduced) return;
    const t1 = window.setTimeout(() => {
      setState("tool");
      setElapsed(1.6);
    }, 700);
    const t2 = window.setTimeout(() => {
      setState("writing");
      setElapsed(3.1);
    }, 1400);
    const t3 = window.setTimeout(() => {
      setState("done");
      setElapsed(4.2);
    }, 2100);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [reduced]);

  return <AgentStatus state={state} elapsed={elapsed} className="max-w-sm" />;
}

export const study: PageStudy = {
  object: <AgentStatus state="done" elapsed={4.2} className="max-w-sm" />,
  parts: [
    { name: "The status dot", selector: "[data-part=circle]" },
    { name: "The state word", selector: "header [data-part=lettering]" },
    { name: "The elapsed time", selector: "[data-part=figure]" },
    { name: "A phase pill", selector: "[data-part=pill]" },
  ],
  states: {
    default: <AgentStatus state="done" elapsed={4.2} className="max-w-sm" />,
    loading: <AgentStatus state="waiting" elapsed={2.6} className="max-w-sm" />,
    error: <AgentStatus state="error" elapsed={3.1} className="max-w-sm" />,
    disabled: <AgentStatus state="stopped" elapsed={1.8} className="max-w-sm" />,
  },
  replay: {
    label: "Replay a run",
    caption: "Watch Think, Tool and Write latch across the sequential ramp as the run finishes.",
    run: () => <ReplayAgentStatus />,
  },
};

export default function AgentStatusPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      study={study}
      tile={<AgentStatus state="done" elapsed={4.2} className="max-w-sm" />}
    >
      <Stage
        title="Agent status"
        tier="expressive"
        code="AgentStatusDemo"
        caption="Starts settled at done with all three phases latched. Run steps through thinking, tool use and a paused approval check, or switch directly across all seven states below."
      >
        <AgentStatusDemo />
      </Stage>

      <Stage
        title="Waiting for approval"
        tier="expressive"
        code="WaitingApprovalDemo"
        caption="The elapsed clock pauses while waiting on an approval. Approving resumes through writing and freezes once done."
      >
        <WaitingApprovalDemo />
      </Stage>

      <TryIt
        of="AgentStatus"
        component={AgentStatus}
        props={{ state: "done", elapsed: 4.2, className: "max-w-sm" }}
        controls={[
          { name: "state", options: ["thinking", "tool", "writing", "waiting", "done", "error", "stopped"] },
          { name: "elapsed", type: "number", min: 0, max: 120, step: 0.5 },
        ]}
      />
    </Page>
  );
}
