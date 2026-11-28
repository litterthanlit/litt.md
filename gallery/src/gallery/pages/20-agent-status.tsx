import { useCallback, useEffect, useRef, useState } from "react";
import { AgentStatus, type AgentRunState, type AgentStep } from "@/components/agent-status";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";
import { useSelfRun } from "../self-run";

export const meta: PageMeta = {
  id: "agent-status",
  title: "Agent status",
  lede: "An agent's run on one paper: what it is doing, and for how long.",
  order: 1.005,
  group: "Agents",
  verbs: ["press", "watch"],
  worlds: ["flat"],
  summary:
    "One agent run on a white paper: the task and its state in words, the time the run has been live as the one large figure, what it is doing now, three pills for the phases it passes through, and only the actions that apply (Run, Stop, Allow, Try again). It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "Nothing moves until you press Run. The clock counts in tenths only while the run is live, holds while a call waits on your OK, and starts from 0 on a new run. Each new line of what it is doing rises in on Flat's expressive spring while the old one leaves up with no bounce. The phase pills change color at once: outlined until reached, grey once passed, ink while it is there. Allow grows in beside Stop when a call needs your OK. Under reduced motion the clock shows whole seconds and the lines change in place.",
};

export const docs: PageDocs = {
  components: ["agent-status"],
  exports: ["AgentStatus"],
  usage: `import { AgentStatus } from "@/components/agent-status";

<AgentStatus
  task="Tidy the drafts"
  state={run.state}
  step={run.step}
  tokens={run.tokens}
  onRun={start}
  onStop={stop}
  onAllow={allow}
/>`,
  use: [
    "One agent task a person started and may need to stop or approve: a tidy-up, a send, a summary.",
    "When how long it has been working matters as much as what it is doing, so the time is the figure.",
  ],
  skip: [
    "Another world's page. AgentStatus belongs to Flat's grey ground, white paper and ink pills, and needs data-material=\"flat\" on <html>.",
    "A whole turn with its steps and the answer it wrote. Use AgentRun.",
    "Many runs at once. Use RunList.",
    "Only a word for what it is doing, inline. Use AssistantStatus.",
  ],
  keyboard: [
    [["Tab"], "Moves between the actions that apply: Run, or Stop and Allow."],
    [["Enter", "Space"], "Presses the focused action."],
    [["Escape"], "Stops the run while it can be stopped. Otherwise Escape goes to the page."],
  ],
  a11y: [
    "The card is a group named by the task. The state and what it is doing are said once each time they change, in a polite status; an error is said in an alert.",
    "The ticking time is hidden from a screen reader, so nothing is read every tenth of a second.",
    "Allow is described by the line, so a screen reader hears what it allows.",
    "The state is always a word (Thinking, Needs your OK, Didn't finish), never a color or a mark alone.",
    "A button that goes away while it has focus hands focus to the one that stays.",
  ],
};

/* ---------------------------------------------------------------- the scripted agent (the demo's app, not the part) */

type Cue = { wait: number; state: AgentRunState; step: AgentStep };
type Script = { task: string; cues: Cue[]; retry?: Cue[] };

const cue = (wait: number, state: AgentRunState, verb: string, target?: string): Cue => ({ wait, state, step: { verb, target } });

const TIDY: Script = {
  task: "Tidy the drafts",
  cues: [
    cue(0, "thinking", "Planning", "the tidy-up"),
    cue(950, "tool", "Reading", "12 drafts"),
    cue(600, "tool", "Looking for", "duplicates"),
    cue(600, "thinking", "Comparing", "two drafts"),
    cue(650, "tool", "Delete", "“Spring notes (copy)”"),
    cue(120, "waiting", "Delete", "“Spring notes (copy)”"),
    cue(0, "tool", "Delete", "“Spring notes (copy)”"),
    cue(600, "tool", "Retitling", "“Untitled 4”"),
    cue(600, "writing", "Writing", "a note for you"),
    cue(1700, "done", "Tidied", "12 drafts, 1 deleted"),
  ],
};

const SEND: Script = {
  task: "Send issue 05",
  cues: [
    cue(0, "thinking", "Planning", "the send"),
    cue(900, "tool", "Resizing", "the cover"),
    cue(700, "tool", "Sending to", "2,140 readers"),
    cue(1100, "error", "Too many at once.", "Try again in a moment"),
  ],
  retry: [
    cue(0, "thinking", "Waiting out", "the limit"),
    cue(800, "tool", "Splitting", "readers into 3 batches"),
    cue(700, "tool", "Sending to", "2,140 readers"),
    cue(900, "done", "Sent", "to 2,140 readers"),
  ],
};

/**
 * Plays a script's cues one after another, pausing on a cue that waits for your OK. Tokens arrive in small chunks
 * while it thinks or writes. Nothing starts until a hand presses Run.
 */
function useScriptedRun(script: Script, start?: { at: number; tokens: number; elapsed: number }) {
  const first = start ? script.cues[start.at] : null;
  const [state, setState] = useState<AgentRunState>(first ? first.state : "ready");
  const [step, setStep] = useState<AgentStep | null>(first ? first.step : null);
  const [tokens, setTokens] = useState(start?.tokens ?? 0);
  const rest = useRef<Cue[]>(start ? script.cues.slice(start.at + 1) : []);
  const timer = useRef(0);
  const ticker = useRef(0);

  const halt = useCallback(() => {
    window.clearTimeout(timer.current);
    window.clearInterval(ticker.current);
  }, []);
  useEffect(() => halt, [halt]);

  const apply = useCallback((c: Cue) => {
    setState(c.state);
    setStep(c.step);
    window.clearInterval(ticker.current);
    if (c.state === "thinking" || c.state === "writing") {
      const most = c.state === "writing" ? 20 : 9;
      let n = 0;
      ticker.current = window.setInterval(() => setTokens((t) => t + 3 + (n++ % (most - 2))), 90);
    }
  }, []);

  const perform = useCallback(
    (cues: Cue[]) => {
      window.clearTimeout(timer.current);
      const [next, ...more] = cues;
      if (!next) return;
      const go = () => {
        apply(next);
        if (next.state === "waiting") rest.current = more;
        else perform(more);
      };
      if (next.wait) timer.current = window.setTimeout(go, next.wait);
      else go();
    },
    [apply],
  );

  const onRun = () => {
    halt();
    setTokens(0);
    perform(state === "error" && script.retry ? script.retry : script.cues);
  };
  const onStop = () => {
    halt();
    setState("stopped");
  };
  const onAllow = () => perform(rest.current);
  return { task: script.task, state, step, tokens, elapsed: start?.elapsed, onRun, onStop, onAllow };
}

function TidyDemo() {
  const run = useScriptedRun(TIDY);
  return <AgentStatus {...run} />;
}

function SendDemo() {
  const run = useScriptedRun(SEND);
  return <AgentStatus {...run} />;
}

/* The tile: a call waiting on your OK. On Flat's wall it answers itself and runs the tidy-up again, until a hand arrives. */
function WaitingTile() {
  const run = useScriptedRun(TIDY, { at: 5, tokens: 412, elapsed: 4.4 });
  const latest = { state: run.state, onAllow: run.onAllow, onRun: run.onRun };
  const self = useSelfRun(() => {
    if (latest.state === "waiting") latest.onAllow();
    else if (latest.state === "done" || latest.state === "ready" || latest.state === "stopped") latest.onRun();
  }, { every: 2600, first: 1400 });
  return (
    <div ref={self.ref} className="grid w-full justify-items-center">
      <AgentStatus {...run} />
    </div>
  );
}

export default function AgentStatusPage() {
  return (
    <Page meta={meta} docs={docs} tile={<WaitingTile />}>
      <Stage
        title="Tidy the drafts"
        tier="expressive"
        code="TidyDemo"
        caption="Press Run. The clock counts while it works and holds when it asks before deleting a draft: Allow grows in beside Stop. Escape stops it."
      >
        <TidyDemo />
      </Stage>

      <Stage
        title="A send that fails"
        tier="expressive"
        code="SendDemo"
        caption="Run it: the send stops in Use tools with Didn't finish in danger's words, and Try again takes a gentler path."
      >
        <SendDemo />
      </Stage>

      <TryIt
        of="AgentStatus"
        component={AgentStatus}
        props={{ task: "Summarise a post", state: "waiting", step: { verb: "Publish", target: "the summary" }, tokens: 318, elapsed: 6.2 }}
        controls={["task", { name: "state", options: ["ready", "thinking", "tool", "writing", "waiting", "done", "error", "stopped"] }, "tokens"]}
      />
    </Page>
  );
}
