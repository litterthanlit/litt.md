import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AGENT_SHAPE_PHASES, AgentShapes, SHAPE_WORDS, type AgentShapePhase } from "@/components/agent-shapes";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, useReplay, type PageDocs, type PageMeta } from "../kit";
import { useSelfRun } from "../self-run";

export const meta: PageMeta = {
  id: "agent-shapes",
  title: "Agent shapes",
  lede: "Abstract shapes for how an agent works.",
  order: 1.001,
  group: "Agents",
  verbs: ["select", "watch"],
  worlds: ["flat"],
  summary:
    "One abstract shape that follows an agent's run, on white paper on the grey ground: a spark for thinking, a graph for searching, a cube for organizing, an orbit for reasoning, a morph for planning, a stack for building, a fold for running and a thread for writing, each soft grey with one part in the ink. Under it the step in one sentence, and how far along as short ink pills. It belongs to Flat.",
  tiers: ["responsive", "expressive"],
  mechanism:
    "Nothing moves until you say the work does: the shape runs only while paused is false, which an app ties to its run, and here only after Play or a pick. Every shape starts mid-work, so paused it holds a frame that looks busy. A new phase grows in from 82% on Flat's expressive spring, the sentence rises 4px into place, and a band of ink sweeps across it while the work runs. Under reduced motion nothing moves and the sentence stands in the ink.",
};

export const docs: PageDocs = {
  components: ["agent-shapes"],
  exports: ["AgentShapes"],
  usage: `import { AgentShapes } from "@/components/agent-shapes";

// Tie paused to your run, so the shape moves only while the work does.
<AgentShapes phase="searching" label="Searching 12 sources" step={2} steps={8} paused={!working} />`,
  use: [
    "Showing an agent's run step by step, where each step is a different kind of work and a reader should see which.",
    "A long run with a known number of steps: pass step and steps, and the pills say how far along it is.",
  ],
  skip: [
    "Another world's page. AgentShapes belongs to Flat's grey ground and white paper, and needs data-material=\"flat\" on <html>.",
    "A writing assistant's phase in a line of text. Use AssistantStatus, a pill that fits a composer.",
    "A whole run with its time, actions and tools. Use AgentStatus.",
  ],
  keyboard: [[["Tab"], "The paper is a status and takes no focus; the demo's phase picks are a radio group."]],
  a11y: [
    "The paper is role=\"status\" named by the sentence and, with steps, \"step 3 of 8\", so the shape is never the only word.",
    "The shape, the sentence and the pills are hidden from a screen reader, so the status is read once, by its name, when it changes.",
    "Under reduced motion every shape holds its frame and the sentence stands in the ink.",
  ],
};

const LINES: Record<AgentShapePhase, string> = {
  thinking: "Thinking it through",
  searching: "Searching 12 sources",
  organizing: "Organizing the results",
  reasoning: "Weighing 3 approaches",
  planning: "Planning the changes",
  building: "Building the project",
  running: "Running the tests",
  writing: "Drafting the answer",
};

/* How long each phase runs when a hand picks it, or Play steps through them, in ms. */
const TURN = 2400;
const N = AGENT_SHAPE_PHASES.length;

/** The phases as pills on the ground, a radio group: the chosen one is white. */
function PhasePicks({ value, onPick }: { value: AgentShapePhase; onPick: (p: AgentShapePhase) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: N - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const k = (to + N) % N;
    onPick(AGENT_SHAPE_PHASES[k]);
    refs.current[k]?.focus();
  };
  return (
    <div role="radiogroup" aria-label="Phase" className="flex max-w-xl flex-wrap justify-center gap-1.5">
      {AGENT_SHAPE_PHASES.map((p, i) => (
        <button
          key={p}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={p === value}
          tabIndex={p === value ? 0 : -1}
          onClick={() => onPick(p)}
          onKeyDown={(e) => onKey(e, i)}
          className={
            "litt-target relative h-10 cursor-pointer rounded-pill px-4 text-small transition-colors duration-(--dur-instant) ease-litt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
            (p === value ? "bg-surface-1 font-label text-fg forced-colors:border" : "bg-transparent text-fg-muted hover:text-fg")
          }
        >
          {SHAPE_WORDS[p]}
        </button>
      ))}
    </div>
  );
}

/**
 * A pick runs that phase for one turn; Play (the stage's) runs every phase in order. Then the shape holds. Nothing runs
 * before a hand.
 */
function RunDemo({ play = 0 }: { play?: number }) {
  const { reduced } = useMotionDial();
  const [phase, setPhase] = useState<AgentShapePhase>("searching");
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);
  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clear, []);

  const pick = (p: AgentShapePhase) => {
    clear();
    setPhase(p);
    setRunning(true);
    timers.current.push(window.setTimeout(() => setRunning(false), TURN));
  };

  useEffect(() => {
    if (!play) return;
    clear();
    setRunning(true);
    AGENT_SHAPE_PHASES.forEach((p, i) => timers.current.push(window.setTimeout(() => setPhase(p), i * TURN)));
    timers.current.push(window.setTimeout(() => setRunning(false), N * TURN));
  }, [play]);

  const at = AGENT_SHAPE_PHASES.indexOf(phase);
  return (
    <div className="grid w-full justify-items-center gap-6">
      <AgentShapes size="lg" phase={phase} label={LINES[phase]} step={at + 1} steps={N} paused={!running || reduced} />
      <PhasePicks value={phase} onPick={pick} />
    </div>
  );
}

/** On Flat's wall the agent works through its phases by itself, until a hand arrives; anywhere else it holds. */
function ShapesTile() {
  const [at, setAt] = useState(1);
  const run = useSelfRun((n) => setAt((n + 2) % N), { every: TURN });
  const phase = AGENT_SHAPE_PHASES[at];
  return (
    <div ref={run.ref} className="grid w-full justify-items-center">
      <AgentShapes phase={phase} label={LINES[phase]} step={at + 1} steps={N} paused={!run.running} />
    </div>
  );
}

function SidebarDemo() {
  return (
    <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-3">
      <AgentShapes phase="thinking" paused />
      <AgentShapes phase="building" label="Building the site" step={5} steps={7} paused />
      <AgentShapes phase="writing" label="Writing issue 15" paused />
    </div>
  );
}

export default function AgentShapesPage() {
  const [play, replay] = useReplay();
  return (
    <Page meta={meta} docs={docs} tile={<ShapesTile />}>
      <Stage
        title="Eight phases"
        tier="expressive"
        code="RunDemo"
        onReplay={replay}
        replayLabel="Play"
        caption="Press Play and the agent works through every phase, each shape moving its own way while the pills fill. Pick a phase and it runs for a moment, then holds."
      >
        <RunDemo play={play} />
      </Stage>

      <Stage
        title="In a card"
        tier="instant"
        code="SidebarDemo"
        caption="The md size fits a card or a sidebar. label replaces the phase's sentence; step and steps add the pills, and without them the paper holds the shape and the sentence alone. Paused, each shape holds a frame that looks mid-work."
      >
        <SidebarDemo />
      </Stage>

      <TryIt
        of="AgentShapes"
        component={AgentShapes}
        props={{ phase: "reasoning", label: "Weighing 3 approaches", step: 4, steps: 8, paused: true }}
        controls={[{ name: "phase", options: AGENT_SHAPE_PHASES }, "label", "step", "steps", { name: "size", options: ["md", "lg"] }, "paused"]}
      />
    </Page>
  );
}
