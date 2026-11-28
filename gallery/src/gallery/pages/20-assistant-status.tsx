import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ASSISTANT_PHASES, AssistantStatus, PHASE_WORDS, type AssistantPhase } from "@/components/assistant-status";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, useReplay, type PageDocs, type PageMeta } from "../kit";
import { useSelfRun } from "../self-run";

export const meta: PageMeta = {
  id: "assistant-status",
  title: "Assistant status",
  lede: "What a writing assistant is doing, in one white pill.",
  order: 1.004,
  group: "Agents",
  verbs: ["select", "watch"],
  worlds: ["flat"],
  summary:
    "One white pill on the grey ground saying what a writing assistant is doing while it drafts: an ink circle with a small glyph that moves its own way for each phase (thinking, searching, reading, weighing, checking, writing), and the phase in words. It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "Nothing moves until you say the work does: the glyph runs only while paused is false, which an app ties to its stream, and here only after Play or a pick. Each glyph is stepped ahead before it paints, so it is never seen at rest, and paused it holds the frame it is on. A new phase arrives on Flat's expressive spring: the glyph grows in from 86%, and the new words rise in while the old ones leave up with no bounce. Under reduced motion nothing moves and the words change in place.",
};

export const docs: PageDocs = {
  components: ["assistant-status"],
  exports: ["AssistantStatus"],
  usage: `import { AssistantStatus } from "@/components/assistant-status";

// Tie paused to your stream, so the glyph moves only while tokens arrive.
<AssistantStatus phase="searching" detail="12 sources" paused={!streaming} />`,
  use: [
    "Saying what a writing or research assistant is doing while a reply is on its way, above the reply or in a composer.",
    "When the phase changes often and a reader should see which, not only that something is happening.",
  ],
  skip: [
    "Another world's page. AssistantStatus belongs to Flat's grey ground, white pill and ink circle, and needs data-material=\"flat\" on <html>.",
    "A whole run with its time and actions. Use AgentStatus.",
    "Only that it is working, with no phase. Use WorkingLoader.",
  ],
  keyboard: [[["Tab"], "The pill is a status and takes no focus; the demo's phase picks are a radio group."]],
  a11y: [
    "The pill is role=\"status\" named by the phase and detail in words (\"Searching 12 sources\"), so the glyph is never the only word.",
    "The glyph and the visible words are hidden from a screen reader, so the status is read once, by its name, when it changes.",
    "Under reduced motion every glyph holds the frame it rolled to.",
  ],
};

const DETAILS: Record<AssistantPhase, string> = {
  thinking: "about your post",
  searching: "12 sources",
  reading: "your last three issues",
  weighing: "two openings",
  checking: "8 links",
  writing: "the draft",
};

/* How long each phase runs when a hand picks it, or Play steps through them, in ms. */
const TURN = 2400;

/** The phases as pills on the ground, a radio group: the chosen one is white. */
function PhasePicks({ value, onPick }: { value: AssistantPhase; onPick: (p: AssistantPhase) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const n = ASSISTANT_PHASES.length;
    const to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: n - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const k = (to + n) % n;
    onPick(ASSISTANT_PHASES[k]);
    refs.current[k]?.focus();
  };
  return (
    <div role="radiogroup" aria-label="Phase" className="flex max-w-full flex-wrap justify-center gap-1.5">
      {ASSISTANT_PHASES.map((p, i) => (
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
          {PHASE_WORDS[p]}
        </button>
      ))}
    </div>
  );
}

/**
 * A pick runs that phase for one turn; Play (the stage's) runs every phase in order. Then the glyph holds. Nothing
 * runs before a hand.
 */
function PhasesDemo({ play = 0 }: { play?: number }) {
  const { reduced } = useMotionDial();
  const [phase, setPhase] = useState<AssistantPhase>("searching");
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);
  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clear, []);

  const pick = (p: AssistantPhase) => {
    clear();
    setPhase(p);
    setRunning(true);
    timers.current.push(window.setTimeout(() => setRunning(false), TURN));
  };

  useEffect(() => {
    if (!play) return;
    clear();
    setRunning(true);
    ASSISTANT_PHASES.forEach((p, i) => timers.current.push(window.setTimeout(() => setPhase(p), i * TURN)));
    timers.current.push(window.setTimeout(() => setRunning(false), ASSISTANT_PHASES.length * TURN));
  }, [play]);

  return (
    <div className="grid w-full justify-items-center gap-7">
      <AssistantStatus phase={phase} detail={DETAILS[phase]} paused={!running || reduced} />
      <PhasePicks value={phase} onPick={pick} />
    </div>
  );
}

/** On Flat's wall the phases follow one another by themselves, each glyph moving, until a hand arrives. */
function PhasesTile() {
  const [at, setAt] = useState(1);
  const run = useSelfRun((n) => setAt((n + 2) % ASSISTANT_PHASES.length), { every: TURN, first: TURN });
  const phase = ASSISTANT_PHASES[at];
  return (
    <div ref={run.ref} className="grid w-full justify-items-center">
      <AssistantStatus phase={phase} detail={DETAILS[phase]} paused={!run.running} />
    </div>
  );
}

function WordsDemo() {
  return (
    <div className="grid justify-items-center gap-3">
      <AssistantStatus phase="thinking" paused />
      <AssistantStatus phase="reading" label="Reading" detail="Sunday's letter" paused />
      <AssistantStatus phase="writing" label="Drafting" detail="issue 15" paused />
    </div>
  );
}

export default function AssistantStatusPage() {
  const [play, replay] = useReplay();
  return (
    <Page meta={meta} docs={docs} tile={<PhasesTile />}>
      <Stage
        title="Six phases"
        tier="expressive"
        code="PhasesDemo"
        onReplay={replay}
        replayLabel="Play"
        caption="Press Play and the assistant passes through every phase, each glyph moving its own way while the words rise in. Pick a phase and it runs for a moment, then holds."
      >
        <PhasesDemo play={play} />
      </Stage>

      <Stage
        title="Your own words"
        tier="instant"
        code="WordsDemo"
        caption="label replaces the phase's word and detail follows it in the muted ink. Paused, each glyph holds a frame that looks mid-work."
      >
        <WordsDemo />
      </Stage>

      <TryIt
        of="AssistantStatus"
        component={AssistantStatus}
        props={{ phase: "reading", detail: "your last three issues", paused: true }}
        controls={[{ name: "phase", options: ASSISTANT_PHASES }, "label", "detail", "paused"]}
      />
    </Page>
  );
}
