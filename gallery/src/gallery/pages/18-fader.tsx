import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import { FADER_UNITY, Fader } from "@/components/fader";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";
import { useSelfRun } from "../self-run";

export const meta: PageMeta = {
  id: "fader",
  title: "Fader",
  lede: "A mix that plays itself until you take a channel.",
  order: 1.0015,
  group: "Tools",
  verbs: ["drag", "press"],
  worlds: ["flat"],
  summary:
    "A mixer channel's level as a fat vertical pill on white paper: the ink fill is the level, the level stands above it in decibels, and its name sits under it. Values set from outside glide on a motor while the hand's land at once; 0 dB catches the hand, a double press sends it home, and Shift drags finely. It belongs to Flat.",
  tiers: ["instant", "responsive"],
  mechanism:
    "A value the hand sets lands at once; a value from outside (automation, a reset) is carried there on the responsive spring, a motor, and a held fader lets go of it. Dragging past 0 dB catches the hand within 1.2% of the travel and lets go 3.5% clear. The fill moves by a transform inside its pill. Under reduced motion every value lands at once.",
};

export const docs: PageDocs = {
  components: ["fader"],
  exports: ["Fader"],
  usage: `import { Fader } from "@/components/fader";

// 75 is 0 dB. onHoldChange says when a hand takes it, to hand a channel back to automation.
<Fader label="Voice" value={voice} onValueChange={setVoice} onHoldChange={setHeld} owner={held ? "yours" : "auto"} />`,
  use: [
    "A mixer or an audio tool: a channel's level, where the decibels matter and a hand can ride it.",
    "Automation a hand can take over: set the value from your playback, and let onHoldChange hand the channel back.",
  ],
  skip: [
    "Another world's page. Fader belongs to Flat's white paper and ink pill, and needs data-material=\"flat\" on <html>.",
    "A setting that is not a level in decibels. Use a slider.",
  ],
  keyboard: [
    [["↑", "→"], "Raises the level half a step of travel."],
    [["↓", "←"], "Lowers it."],
    [["Page Up", "Page Down"], "Moves a tenth of the travel."],
    [["Home", "End"], "Goes to −∞ or to +10 dB."],
  ],
  a11y: [
    "Each fader is a vertical slider named by its channel, its value said in decibels (\"−3.5 dB\").",
    "Who has the channel is said once in a polite status when it changes (\"Voice is yours\"), and Play says the automation is playing.",
    "The level is a figure in words above the pill, so it never rests on the fill alone.",
    "Under reduced motion every value lands at once.",
  ],
};

/* The recorded mix: the voice rides its phrases, the music ducks under it a beat later, the room breathes. */
const LOOP = 8;
const READ_EVERY = 80;
const STAGGER = 0.12;
const HAND_BACK = 650;
const smooth = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};
const swell = (t: number, a: number, b: number, r: number) => smooth((t - a) / r) * (1 - smooth((t - b) / r));
const speaking = (t: number) => {
  const u = ((t % LOOP) + LOOP) % LOOP;
  return swell(u, 0.35, 2.7, 0.45) + swell(u, 3.7, 6.5, 0.45);
};
const snap = (v: number) => Math.round(Math.min(100, Math.max(0, v)) * 2) / 2;
function mix(t: number) {
  const voice = speaking(t);
  const duck = speaking(t - 0.18);
  return {
    voice: snap(44 + 30 * voice + 2.2 * voice * Math.sin(t * Math.PI * 1.5)),
    music: snap(77 - 21 * duck + 1.6 * Math.sin((t * Math.PI) / 2)),
    room: snap(40 + 7 * Math.sin((t * Math.PI) / 4 + 0.6)),
  };
}
const CHANNELS = [
  { key: "voice", label: "Voice" },
  { key: "music", label: "Music" },
  { key: "room", label: "Room" },
] as const;
type Key = (typeof CHANNELS)[number]["key"];

/** Three channels of an episode's mix, with Play for the automation; a hand takes a channel, and lets it go back. */
function EpisodeMix({ size = "md", autoplay = 0 }: { size?: "md" | "sm"; autoplay?: number }) {
  const { reduced } = useMotionDial();
  const [levels, setLevels] = useState<Record<Key, number>>(() => mix(1.6));
  const [playing, setPlaying] = useState(false);
  const [yours, setYours] = useState<Record<Key, boolean>>({ voice: false, music: false, room: false });
  const [said, setSaid] = useState("");
  const held = useRef(new Set<Key>());
  const back = useRef<Partial<Record<Key, number>>>({});
  const time = useRef(1.6);

  useEffect(() => {
    if (!playing) return;
    const started = performance.now() - time.current * 1000;
    const timer = window.setInterval(() => {
      const t = (performance.now() - started) / 1000;
      time.current = t;
      const m = mix(t);
      setLevels((was) => {
        const next = { ...was };
        CHANNELS.forEach(({ key }, i) => {
          if (!held.current.has(key) && !yoursRef.current[key] && t >= i * STAGGER) next[key] = m[key];
        });
        return next;
      });
    }, READ_EVERY);
    return () => window.clearInterval(timer);
  }, [playing]);
  const yoursRef = useRef(yours);
  yoursRef.current = yours;

  /* The wall's self-run starts the automation; a hand's own Play is its choice. */
  useEffect(() => {
    if (autoplay && !reduced) setPlaying(true);
  }, [autoplay, reduced]);

  const take = (key: Key, label: string, on: boolean) => {
    window.clearTimeout(back.current[key]);
    if (on) {
      held.current.add(key);
      if (!yoursRef.current[key]) setSaid(`${label} is yours`);
      setYours((y) => ({ ...y, [key]: true }));
    } else {
      held.current.delete(key);
      back.current[key] = window.setTimeout(() => {
        setYours((y) => ({ ...y, [key]: false }));
        if (playing) setSaid(`${label} is back on the automation`);
      }, HAND_BACK);
    }
  };

  return (
    <div className="litt-paper grid w-full max-w-md gap-4 rounded-surface bg-surface-1 p-4 pb-4.5 text-fg">
      <div className="flex items-center justify-between gap-3 ps-1">
        <p className="truncate text-body font-label">
          Episode 12 <span className="font-normal text-fg-muted">mix</span>
        </p>
        <Button
          size="sm"
          variant="secondary"
          aria-pressed={playing}
          aria-label={playing ? "Pause the automation" : "Play the automation"}
          onClick={() => {
            setPlaying((p) => !p);
            setSaid(playing ? "Automation paused" : "Playing the automation");
          }}
        >
          {playing ? "Pause" : "Play"}
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {CHANNELS.map(({ key, label }) => (
          <Fader
            key={key}
            label={label}
            size={size}
            value={levels[key]}
            onValueChange={(v) => setLevels((l) => ({ ...l, [key]: v }))}
            onHoldChange={(on) => take(key, label, on)}
            owner={yours[key] ? "yours" : playing ? "auto" : undefined}
          />
        ))}
      </div>
      <p role="status" className="sr-only">
        {said}
      </p>
    </div>
  );
}

function MixDemo() {
  return <EpisodeMix />;
}

/** On Flat's wall the mix plays itself until a hand arrives. */
function MixTile() {
  const [go, setGo] = useState(0);
  const run = useSelfRun((n) => n === 0 && setGo(1), { every: 4000, first: 250 });
  return (
    <div ref={run.ref} className="grid w-full justify-items-center">
      <EpisodeMix size="sm" autoplay={go} />
    </div>
  );
}

function AloneDemo() {
  const [v, setV] = useState(FADER_UNITY);
  return (
    <div className="litt-paper grid justify-items-center rounded-surface bg-surface-1 px-10 py-6">
      <Fader label="Master" value={v} onValueChange={setV} />
    </div>
  );
}

export default function FaderPage() {
  return (
    <Page meta={meta} docs={docs} tile={<MixTile />}>
      <Stage
        title="An episode's mix"
        tier="responsive"
        code="MixDemo"
        caption="Press Play and the recorded mix plays back: the voice rides its phrases and the music ducks under it a beat later, each fader carried on its motor. Take a channel and it is yours; let go, and a beat later it goes back on the automation. Drag past 0 dB and it catches; press twice to send a fader home."
      >
        <MixDemo />
      </Stage>

      <Stage title="One channel" tier="instant" code="AloneDemo" caption="A fader alone at 0 dB. Shift drags at a quarter speed, and the arrow keys move it half a step.">
        <AloneDemo />
      </Stage>

      <TryIt of="Fader" component={Fader} props={{ label: "Voice", defaultValue: 75 }} controls={["label", { name: "size", options: ["md", "sm"] }, { name: "owner", options: ["auto", "yours"] }]} />
    </Page>
  );
}
