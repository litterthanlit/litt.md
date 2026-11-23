import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent } from "react";
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
  ledeByWorld: {
    flat: "What the agent is doing, in six small colored shapes.",
  },
  order: 11.04,
  group: "Agents",
  worlds: ["device", "flat"],
  verbs: ["watch"],
  summary:
    "What an agent is doing, said by a mechanism in a small LCD window: two seven-segment figures chasing for thinking, a tuner for searching, stereo meters for reading, a dot matrix for reasoning, step lights for running, tape reels for writing. It moves only while tokens arrive, and it needs data-material=\"device\".",
  summaryByWorld: {
    flat: "What an assistant is doing, shown in one compact 64px by 32px space with no frame: three violet circles for thinking, four sky bars for searching, three teal lines for reading, a blue dot grid for reasoning, four sunset step pills for running, and an expanding pink stroke with a dot caret for writing. It moves only while tokens arrive.",
  },
  tiers: ["instant"],
  mechanism:
    "No hand moves this; the stream does. Pass the phase and the window draws its mechanism, already rolled 1.2 seconds ahead so it is never seen at rest. It runs only while paused is false, which you tie to tokens arriving, and it stops off screen. All of them share one animation loop that stops when none is live. A new phase fades in over the old one in 150 milliseconds, in the same cell, and nothing else transitions. Every frame writes attributes, never React state. Press and Flat have no such hardware: it is a Device part and needs data-material=\"device\". Under reduced motion each mechanism rolls once and holds that frame.",
  movesByWorld: {
    flat: "Pass the phase and the indicator draws its shape already mid-motion, so it never reads as empty at rest. It moves only while paused is false and stops off screen or under reduced motion. All live indicators share one animation loop that stops when none is running. Switching phases crossfades smoothly on the expressive spring, and snaps directly under reduced motion.",
  },
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
  useByWorld: {
    flat: [
      "An assistant status line, draft card or header that shows what the agent is doing right now: thinking, searching, reading, reasoning, running or writing.",
      "When the phase changes mid-turn and you want a quiet crossfade in place with zero layout shift.",
      "Pairing a small live signal with plain words that name the same phase.",
    ],
  },
  skip: [
    "Press or Flat. There the clock is the only signal, and a mechanism with a lit lamp is wrong on paper or a flat page. Leave the indicator out.",
    "A wait with no stream behind it. It moves only while tokens arrive, so a spinner's job is not its job. Use Loading or Skeleton.",
    "Progress that has an end. Use Progress, or Tape progress under Device.",
    "What the agent did, such as a file it read. Use Tool call.",
  ],
  skipByWorld: {
    flat: [
      "A wait with no live stream behind it. Use Loading or Skeleton.",
      "Progress that has a known end. Use Progress.",
      "A record of what the assistant already checked or wrote. Use Agent run or Tool call.",
    ],
  },
  a11y: [
    "It is a status: role=\"status\" with the phase in words for a screen reader, such as \"Thinking\". The drawing is hidden from assistive tech, so the picture is never the only word. `label` replaces the words.",
    "A change of phase is read once, politely. The mechanisms are never read frame by frame.",
    "Nothing moves on its own. It runs only while a phase is set and `paused` is false, and it stops off screen and in a hidden tab.",
    "Under reduced motion each mechanism rolls 1.2 seconds ahead and holds that frame. The loop is never joined, and the crossfade is instant.",
    "Pair it with words that say the same thing, as a Thinking row does. The indicator adds to them and does not replace them.",
    "Inks are the LCD's: the field's ink on the field, at 7:1 or better under Device. The record lamp is red, Device's signal for REC, and it is never the only way to tell the phases apart.",
  ],
  a11yByWorld: {
    flat: [
      "Exposes role=\"status\" with the active phase in screen-reader words such as \"Thinking\"; the geometric shapes are hidden from assistive tech. Pass `label` to supply custom words.",
      "Phase changes announce politely once without narrating individual animation frames.",
      "Nothing moves on its own: the shared loop runs only while a phase is set and `paused` is false, and stops off screen.",
      "Under reduced motion every phase holds a static mid-motion frame with zero animation and instant phase switches.",
      "Pair the shapes with visible phase words so color and motion are never the only cue.",
    ],
  },
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

/* ---------------------------------------------------------------- flat demos */

/* Literal CSS variable strings so gen-registry renames every data token cleanly for host installs. */
const FLAT_PHASE_DOT: Record<AgentPhase, string> = {
  thinking: "var(--data-violet)",
  searching: "var(--data-sky)",
  reading: "var(--data-teal)",
  reasoning: "var(--data-blue)",
  running: "var(--data-seq-2)",
  writing: "var(--data-bubblegum)",
};

const FLAT_NOTES = [
  "The draft mentions three coastal towns, so the opening links match each stop.",
  "Two captions still point to last month's issue and can be updated together.",
];

function FlatPhaseDemo() {
  const [phase, setPhase] = useState<AgentPhase>("thinking");
  const [hovered, setHovered] = useState(false);
  const [held, setHeld] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const playing = hovered || held;
  const current = AGENT_PHASES.find((p) => p.phase === phase) ?? AGENT_PHASES[0]!;

  function moveTo(index: number) {
    const wrapped = (index + AGENT_PHASES.length) % AGENT_PHASES.length;
    setPhase(AGENT_PHASES[wrapped]!.phase);
    tabRefs.current[wrapped]?.focus();
  }

  function onRadioKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      moveTo(index + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      moveTo(index - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      moveTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      moveTo(AGENT_PHASES.length - 1);
    }
  }

  return (
    <div
      data-part="paper"
      onPointerEnter={(e: PointerEvent) => e.pointerType !== "touch" && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className="litt-paper grid w-full max-w-sm min-w-0 gap-5 rounded-surface bg-surface-1 p-6 text-fg forced-colors:border"
    >
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AgentIndicator phase={phase} paused={!playing} />
          <span data-part="lettering" data-phase-label="" className="truncate text-h3 text-fg">
            {current.words}
          </span>
        </div>
        <button
          type="button"
          aria-pressed={held}
          data-part="lettering"
          onClick={() => setHeld((h) => !h)}
          className={
            "litt-target relative inline-flex h-control-sm shrink-0 cursor-pointer items-center rounded-pill bg-transparent px-2.5 text-caption font-normal text-fg-subtle select-none " +
            "[-webkit-tap-highlight-color:transparent] transition-colors duration-(--dur-instant) ease-litt " +
            "hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          }
        >
          {held ? "Pause" : "Play"}
        </button>
      </div>

      <div role="radiogroup" aria-label="Agent phase" className="-mx-2 flex flex-wrap gap-1">
        {AGENT_PHASES.map((item, index) => {
          const active = item.phase === phase;
          return (
            <button
              key={item.phase}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              data-part="lettering"
              onClick={() => setPhase(item.phase)}
              onKeyDown={(e) => onRadioKeyDown(e, index)}
              className={
                "litt-target relative inline-flex h-control-sm cursor-pointer items-center gap-2 rounded-pill px-2.5 text-caption font-normal select-none " +
                "[-webkit-tap-highlight-color:transparent] transition-colors duration-(--dur-instant) ease-litt " +
                "hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
                (active
                  ? "bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] text-fg"
                  : "bg-transparent text-fg-subtle hover:text-fg")
              }
            >
              <span
                aria-hidden="true"
                data-part={active ? "circle" : "outline"}
                className={
                  "size-2.5 shrink-0 rounded-pill border-2 forced-colors:border-[CanvasText] " +
                  (active
                    ? "border-transparent forced-colors:bg-[CanvasText] forced-colors:[forced-color-adjust:none]"
                    : "border-fg-subtle bg-transparent")
                }
                style={active ? { backgroundColor: FLAT_PHASE_DOT[item.phase] } : { borderColor: FLAT_PHASE_DOT[item.phase] }}
              />
              <span>{item.words}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FlatPhaseCell({ phase, words }: { phase: AgentPhase; words: string }) {
  const { playing, held, props } = useHand();
  return (
    <button
      type="button"
      aria-pressed={held}
      aria-label={`Play ${words.toLowerCase()}`}
      data-part="lettering"
      {...props}
      className={
        "litt-target relative grid cursor-pointer justify-items-center gap-2 rounded-control bg-transparent px-2 py-3 text-fg-subtle select-none " +
        "[-webkit-tap-highlight-color:transparent] transition-colors duration-(--dur-instant) ease-litt " +
        "hover:bg-[color-mix(in_oklab,var(--fg)_5%,transparent)] hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      }
    >
      <AgentIndicator phase={phase} paused={!playing} />
      <span className="text-caption font-normal">{words}</span>
    </button>
  );
}

function FlatAllPhasesDemo() {
  return (
    <div
      data-part="paper"
      className="litt-paper grid w-full max-w-md min-w-0 grid-cols-2 gap-2 rounded-surface bg-surface-1 p-6 text-fg sm:grid-cols-3 forced-colors:border"
    >
      {AGENT_PHASES.map(({ phase, words }) => (
        <FlatPhaseCell key={phase} phase={phase} words={words} />
      ))}
    </div>
  );
}

function FlatStatusRowDemo() {
  const [active, setActive] = useState(false);
  return (
    <div
      data-part="paper"
      className="litt-paper grid w-full max-w-md min-w-0 gap-4 rounded-surface bg-surface-1 p-6 text-fg forced-colors:border"
    >
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AgentIndicator phase="thinking" paused={!active} />
          <span data-part="lettering" className="truncate text-small font-normal text-fg">
            {active ? "Thinking" : "Thought for 12s"}
          </span>
        </div>
        <button
          type="button"
          aria-pressed={active}
          data-part="lettering"
          onClick={() => setActive((a) => !a)}
          className={
            "litt-target relative inline-flex h-control-sm shrink-0 cursor-pointer items-center rounded-pill bg-transparent px-2.5 text-caption font-normal text-fg select-none " +
            "[-webkit-tap-highlight-color:transparent] transition-colors duration-(--dur-instant) ease-litt " +
            "hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          }
        >
          {active ? "Stop" : "Let it think"}
        </button>
      </div>
      <div className="grid gap-1.5">
        {FLAT_NOTES.map((line) => (
          <p key={line} data-part="lettering" className="text-small text-fg-subtle">
            {line}
          </p>
        ))}
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

const stillFlatThinking = (props: Still = {}) => (
  <div
    data-part="paper"
    className="litt-paper flex w-full max-w-xs min-w-0 items-center justify-center gap-3 rounded-surface bg-surface-1 p-6 text-fg forced-colors:border"
  >
    <AgentIndicator phase="thinking" paused {...props} />
    <span data-part="lettering" data-phase-label="" className="text-h3 text-fg">
      Thinking
    </span>
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

function ReplayFlatThinking() {
  const { reduced } = useMotionDial();
  const [paused, setPaused] = useState(false);
  useDelay(() => setPaused(true), reduced ? 0 : 3000);
  return (
    <div
      data-part="paper"
      className="litt-paper flex w-full max-w-xs min-w-0 items-center justify-center gap-3 rounded-surface bg-surface-1 p-6 text-fg forced-colors:border"
    >
      <AgentIndicator phase="thinking" paused={reduced || paused} />
      <span data-part="lettering" data-phase-label="" className="text-h3 text-fg">
        Thinking
      </span>
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
  partsByWorld: {
    flat: [
      { name: "The paper", selector: "[data-part=paper]" },
      { name: "The indicator", selector: "[data-agent-indicator]" },
      { name: "The phase label", selector: "[data-phase-label]" },
    ],
  },
  states: {
    default: stillThinking(),
  },
  replay: {
    label: "Replay",
    caption: "Watch the lit segment chase round both figures for 3 seconds, leaving a fading trail, then hold the frame it reached.",
    run: () => <ReplayThinking />,
  },
  byWorld: {
    flat: {
      object: stillFlatThinking(),
      states: {
        default: stillFlatThinking(),
      },
      replay: {
        label: "Replay",
        caption: "Watch the three violet circles rise and fall in sequence for 3 seconds, then hold the frame they reached.",
        run: () => <ReplayFlatThinking />,
      },
    },
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
        byWorld={{
          flat: {
            demo: <FlatPhaseDemo />,
            title: "Active phase",
            code: "FlatPhaseDemo",
            caption:
              "One white paper card with the active phase beside its name and six frameless colored dot tabs to switch between them. Use the arrow keys, Home or End across the tabs; hover the card or toggle Play to watch it move, and let go to hold its frame.",
          },
        }}
        caption="One for each phase, at the same size so any can stand in for any other. Hover a window, or press it, and it plays: segments chase round two figures, a needle seeks a station and lights its lamp, meters rise with each burst, a dot matrix drifts, step lights take turns and two reels turn at the speed their packs give them. Let go and it holds the frame it is on. It needs data-material=&quot;device&quot;."
      >
        <SixDemo />
      </Stage>

      <Stage
        title="A phase picker"
        tier="instant"
        size="lg"
        code="PickerDemo"
        byWorld={{
          flat: {
            demo: <FlatAllPhasesDemo />,
            title: "All six phases",
            code: "FlatAllPhasesDemo",
            caption:
              "All six phases side by side on one paper card, each in its own color and geometry at the same compact size. Hover or press any phase to run its loop; let go and it holds its mid-motion frame.",
          },
        }}
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
        byWorld={{
          flat: {
            demo: <FlatStatusRowDemo />,
            title: "In a status row",
            code: "FlatStatusRowDemo",
            caption:
              "Paired with a quiet status line on a paper card: press Let it think to run the three violet circles beside the label, and Stop to hold the frame.",
          },
        }}
        caption="Under Device the row carries the indicator beside the clock while the agent thinks. Press Let it think: the clock counts and the segments chase. Stop, and both are gone, the row reading Thought for 12s. The indicator is 31px tall, so the row never changes height."
      >
        <ThinkingDemo />
      </Stage>
    </Page>
  );
}
