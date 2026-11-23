import { useEffect, useRef, useState } from "react";
import { Segmented } from "@/components/segmented";
import { WorkingLoader, type LoaderStyle } from "@/components/working-loader";
import { Page, Stage, TryIt, useReplay, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "working-loader",
  title: "Working loader",
  lede: "Four ways to say your assistant is working, with what it is doing and for how long.",
  order: 1.003,
  group: "Agents",
  verbs: ["select", "watch"],
  worlds: ["flat"],
  summary:
    "How a writing assistant says it is working, large on a white paper: the words shimmering, a wave of nine small squares, an arc stepping round its ring or three pills typing in a bubble, with what it is doing in words and how long it has been at it. It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "Nothing moves until you say the work does: the loader runs only while paused is false, which an app ties to its stream, and here only after Play or a pick. Each style is one motion: a band of ink crosses the words, the squares swell along the diagonal, the arc steps a tenth of a turn, the pills hop in turn. A new style arrives on Flat's expressive spring, rising in from 8px below. Paused, it holds the frame it is on, and the time stops with it. Under reduced motion nothing moves: the words stand in the muted ink and the squares, arc and pills stand still.",
};

export const docs: PageDocs = {
  components: ["working-loader"],
  exports: ["WorkingLoader"],
  usage: `import { WorkingLoader } from "@/components/working-loader";

// Tie paused to your stream, so it moves only while the work does.
<WorkingLoader variant="wave" label="Searching your posts" paused={!streaming} />`,
  use: [
    "The space where a reply will be, while a writing assistant works on it and you know what it is doing.",
    "A wait of a few seconds or more, where how long it has been at it reassures.",
  ],
  skip: [
    "Another world's page. WorkingLoader belongs to Flat's paper, ink and grey bubble, and needs data-material=\"flat\" on <html>.",
    "Which phase of several it is in. Use AssistantStatus.",
    "A button that is busy. Use Button's loading.",
    "Progress you can measure. Use Progress.",
  ],
  keyboard: [[["Tab"], "The loader is a status and takes no focus; the demo's style picker is a segmented control."]],
  a11y: [
    "The loader is role=\"status\" named by what it is doing (\"Searching your posts\").",
    "The drawing and the ticking time are hidden from a screen reader, so nothing is read every second.",
    "Under reduced motion nothing moves; the words, squares, arc and pills stand still.",
  ],
};

const STYLES: { value: LoaderStyle; label: string; doing: string }[] = [
  { value: "shimmer", label: "Shimmer", doing: "Thinking" },
  { value: "wave", label: "Wave", doing: "Searching your posts" },
  { value: "spinner", label: "Spinner", doing: "Checking 24 links" },
  { value: "typing", label: "Typing", doing: "Writing a reply" },
];

/* How long a pick, or each style under Play, runs before it holds, in ms. */
const TURN = 2400;

/**
 * The question the study asks: how should your assistant say it is working? One paper shows one style at a time;
 * the segmented control picks it. A pick runs that style for one turn; Play runs each in turn. Then it holds.
 */
function StylesDemo({ play = 0 }: { play?: number }) {
  const [style, setStyle] = useState<LoaderStyle>("wave");
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);
  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clear, []);

  const pick = (v: LoaderStyle) => {
    clear();
    setStyle(v);
    setRunning(true);
    timers.current.push(window.setTimeout(() => setRunning(false), TURN));
  };

  useEffect(() => {
    if (!play) return;
    clear();
    setRunning(true);
    STYLES.forEach((s, i) => timers.current.push(window.setTimeout(() => setStyle(s.value), i * TURN)));
    timers.current.push(window.setTimeout(() => setRunning(false), STYLES.length * TURN));
  }, [play]);

  const doing = STYLES.find((s) => s.value === style)!.doing;
  return (
    <div data-part="paper" className="litt-paper grid w-full max-w-md min-w-0 gap-2 rounded-surface bg-surface-1 p-3 forced-colors:border">
      <div className="grid h-40 place-items-center sm:h-50">
        <WorkingLoader variant={style} label={doing} paused={!running} />
      </div>
      {/* Its own sideways scroller, so the four pills never push a phone's page sideways. */}
      <div className="min-w-0 overflow-x-auto">
        <Segmented legend="Loader style" size="sm" block value={style} onValueChange={pick} options={STYLES.map(({ value, label }) => ({ value, label }))} />
      </div>
    </div>
  );
}

function InlineDemo() {
  return (
    <div data-part="paper" className="litt-paper grid w-full max-w-md min-w-0 gap-4 rounded-surface bg-surface-1 p-6 text-fg forced-colors:border">
      <p className="m-0 text-small text-fg-muted">You asked for a summary of “Spring notes”.</p>
      <div className="justify-self-start">
        <WorkingLoader variant="typing" label="Writing a reply" seconds={3} paused />
      </div>
    </div>
  );
}

export default function WorkingLoaderPage() {
  const [play, replay] = useReplay();
  return (
    <Page meta={meta} docs={docs} tile={<StylesDemo />}>
      <Stage
        title="Four styles"
        tier="expressive"
        code="StylesDemo"
        onReplay={replay}
        replayLabel="Play"
        caption="Press Play and each style takes a turn; pick one and it runs for a moment, then holds where it is."
      >
        <StylesDemo play={play} />
      </Stage>

      <Stage
        title="Where the reply will be"
        tier="instant"
        code="InlineDemo"
        caption="Paused with a time you keep: the typing pills hold a frame that looks mid-word, under the request."
      >
        <InlineDemo />
      </Stage>

      <TryIt
        of="WorkingLoader"
        component={WorkingLoader}
        props={{ variant: "spinner", label: "Checking 24 links", seconds: 4, paused: true }}
        controls={[{ name: "variant", options: ["shimmer", "wave", "spinner", "typing"] }, "label", "paused"]}
      />
    </Page>
  );
}
