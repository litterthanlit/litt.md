import { useEffect, useState, type ComponentProps, type PointerEvent } from "react";
import { AGENT_PHASES, AgentIndicator, type AgentPhase } from "@/components/agent-indicator";
import { Button } from "@/components/button";
import { Segmented } from "@/components/segmented";
import { Thinking } from "@/components/thinking";
import { useMotionDial } from "@/motion";
import { Page, Stage, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "agent-indicator",
  title: "Agent indicator",
  lede: "What the agent is doing, in hardware.",
  order: 18.935,
  group: "Agents",
  worlds: ["device"],
  verbs: ["watch"],
  summary:
    "What an agent is doing, said by a mechanism in a small LCD window: two seven-segment figures chasing for thinking, a tuner for searching, stereo meters for reading, a dot matrix for reasoning, step lights for running, tape reels for writing. It moves only while tokens arrive, and it needs data-material=\"device\".",
  tiers: ["instant"],
  mechanism:
    "No hand moves this; the stream does. Pass the phase and the window draws its mechanism, already rolled 1.2 seconds ahead so it is never seen at rest. It runs only while paused is false, which you tie to tokens arriving, and it stops off screen. All of them share one animation loop that stops when none is live. A new phase fades in over the old one in 150 milliseconds, in the same cell, and nothing else transitions. Every frame writes attributes, never React state. Press and Flat have no such hardware: it is a Device part and needs data-material=\"device\". Under reduced motion each mechanism rolls once and holds that frame.",
};

export const docs: PageDocs = {
  components: ["agent-indicator"],
  exports: ["AgentIndicator"],
  usage: `import { AgentIndicator } from "@/components/agent-indicator";

// Tie paused to your stream, so it moves only while tokens arrive. Needs data-material="device" on <html>.
<AgentIndicator phase={phase} paused={!streaming} />

// Beside the clock in a Thinking row.
<Thinking active={thinking} indicator={<AgentIndicator phase="thinking" paused={!thinking} />}>
  <p>{reasoning}</p>
</Thinking>

// Your own words for a screen reader, and a size from the font size: the box is 5.6em by 2.6em.
<AgentIndicator phase="searching" label="Searching the docs" className="text-body" />`,
  use: [
    "An app on Device (data-material=\"device\") shows what its agent is doing and wants the answer to live in hardware: a window that thinks, searches, reads, reasons, runs or writes.",
    "Beside a Thinking row. The row says how long, and the indicator says what. Pass it as the row's indicator.",
    "The agent changes what it is doing and you want the change seen. A new phase crossfades in the same cell, so nothing shifts.",
    "A status line, a run card or a header that needs one small live signal at the font size around it.",
  ],
  skip: [
    "Press or Flat. There the clock is the only signal, and a mechanism with a lit lamp is wrong on paper or a flat page. Leave the indicator out.",
    "A wait with no stream behind it. It moves only while tokens arrive, so a spinner's job is not its job. Use Loading or Skeleton.",
    "Progress that has an end. Use Progress, or Tape progress under Device.",
    "What the agent did, such as a file it read. Use Tool call.",
  ],
  a11y: [
    "It is a status: role=\"status\" with the phase in words for a screen reader, such as \"Thinking\". The drawing is hidden from assistive tech, so the picture is never the only word. `label` replaces the words.",
    "A change of phase is read once, politely. The mechanisms are never read frame by frame.",
    "Nothing moves on its own. It runs only while a phase is set and `paused` is false, and it stops off screen and in a hidden tab.",
    "Under reduced motion each mechanism rolls 1.2 seconds ahead and holds that frame. The loop is never joined, and the crossfade is instant.",
    "Pair it with words that say the same thing, as a Thinking row does. The indicator adds to them and does not replace them.",
    "Inks are the LCD's: the field's ink on the field, at 7:1 or better under Device. The record lamp is the accent, and it is never the only way to tell the phases apart.",
  ],
};

/* ---------------------------------------------------------------- a hand, not the page, starts it */

/**
 * Plays while the pointer rests on the thing, or after a press (a press again lets go). A touch never rests, so a
 * tap is what plays it. Without a hand it holds its frame.
 */
function useHand() {
  const [hovered, setHovered] = useState(false);
  const [held, setHeld] = useState(false);
  return {
    playing: hovered || held,
    held,
    props: {
      onPointerEnter: (e: PointerEvent) => e.pointerType !== "touch" && setHovered(true),
      onPointerLeave: () => setHovered(false),
      onClick: () => setHeld((h) => !h),
    },
  };
}

/** One mechanism with its name under it. The window is a button: hover plays it, a press holds it playing. */
function Mechanism({ phase, words }: { phase: AgentPhase; words: string }) {
  const { playing, held, props } = useHand();
  return (
    <div className="grid justify-items-center gap-2">
      <button
        type="button"
        aria-pressed={held}
        aria-label={`Play ${words.toLowerCase()}`}
        {...props}
        className="cursor-pointer rounded-control text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <AgentIndicator phase={phase} paused={!playing} />
      </button>
      <span className="text-caption text-fg-subtle">{words}</span>
    </div>
  );
}

function SixDemo() {
  return (
    <div className="flex flex-wrap justify-center gap-x-8 gap-y-6">
      {AGENT_PHASES.map(({ phase, words }) => (
        <Mechanism key={phase} phase={phase} words={words} />
      ))}
    </div>
  );
}

function PickerDemo() {
  const [phase, setPhase] = useState<AgentPhase>("searching");
  const { playing, props } = useHand();
  return (
    <div {...props} className="grid justify-items-center gap-4">
      <div className="max-w-full overflow-x-auto">
        <Segmented
          legend="Phase"
          size="sm"
          value={phase}
          onValueChange={setPhase}
          options={AGENT_PHASES.map(({ phase: value, words }) => ({ value, label: words }))}
        />
      </div>
      <AgentIndicator phase={phase} paused={!playing} className="text-body" />
    </div>
  );
}

const REASONING = [
  "The deploy log stops at the image step, so it ran out of memory and the code is fine.",
  "Eleven of the case study images are over 6 MB, and the resize step opens them all at once.",
];

function ThinkingDemo() {
  const [active, setActive] = useState(false);
  return (
    <div className="grid w-full max-w-xl gap-3">
      <Thinking active={active} duration={12} indicator={<AgentIndicator phase="thinking" paused={!active} />}>
        {REASONING.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </Thinking>
      <div>
        <Button size="sm" variant="secondary" onClick={() => setActive((a) => !a)}>
          {active ? "Stop" : "Let it think"}
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- the study */

type Still = ComponentProps<typeof AgentIndicator>;

/* The object is the thinking window, paused: it holds the frame it rolled to, the same each time. */
const stillThinking = (props: Still = {}) => (
  <div className="text-body">
    <AgentIndicator phase="thinking" paused {...props} />
  </div>
);

/* Replay: thinks for 3 seconds with its chase running, then pauses on the frame it reached. Under reduced motion it never runs. */
function ReplayThinking() {
  const { reduced } = useMotionDial();
  const [paused, setPaused] = useState(false);
  useDelay(() => setPaused(true), reduced ? 0 : 3000);
  return (
    <div className="text-body">
      <AgentIndicator phase="thinking" paused={reduced || paused} />
    </div>
  );
}

function useDelay(fn: () => void, ms: number) {
  useEffect(() => {
    const id = setTimeout(fn, ms);
    return () => clearTimeout(id);
    // Once, when it mounts.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

export const study: PageStudy = {
  object: stillThinking(),
  parts: [
    { name: "The window", selector: "[data-layer] > div" },
    { name: "The figures", selector: "svg" },
    { name: "A segment", selector: "polygon" },
  ],
  states: {
    default: stillThinking(),
  },
  replay: {
    label: "Replay",
    caption: "Watch the lit segment chase round both figures for 3 seconds, leaving a fading trail, then hold the frame it reached.",
    run: () => <ReplayThinking />,
  },
};

export default function AgentIndicatorPage() {
  return (
    <Page meta={meta} docs={docs} study={study}>
      <Stage
        title="Six mechanisms"
        tier="instant"
        size="lg"
        code="SixDemo"
        caption="One for each phase, at the same size so any can stand in for any other. Hover a window, or press it, and it plays: segments chase round two figures, a needle seeks a station and lights its lamp, meters rise with each burst, a dot matrix drifts, step lights take turns and two reels turn at the speed their packs give them. Let go and it holds the frame it is on. It needs data-material=&quot;device&quot;."
      >
        <SixDemo />
      </Stage>

      <Stage
        title="A phase picker"
        tier="instant"
        size="lg"
        code="PickerDemo"
        caption="Pick a phase and the new mechanism fades in over the old one in 150 milliseconds, in the same cell, already rolled ahead. It plays while the pointer rests here or after a press, the way an app's stream would hold it."
      >
        <PickerDemo />
      </Stage>

      <Stage
        title="In a Thinking row"
        tier="instant"
        align="start"
        size="lg"
        code="ThinkingDemo"
        caption="Under Device the row carries the indicator beside the clock while the agent thinks. Press Let it think: the clock counts and the segments chase. Stop, and both are gone, the row reading Thought for 12s. The indicator is 31px tall, so the row never changes height."
      >
        <ThinkingDemo />
      </Stage>
    </Page>
  );
}
