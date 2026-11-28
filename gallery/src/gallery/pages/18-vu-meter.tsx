import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import { VuMeter } from "@/components/vu-meter";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";
import { useSelfRun } from "../self-run";

export const meta: PageMeta = {
  id: "vu-meter",
  title: "VU meter",
  lede: "Levels with real VU ballistics.",
  order: 1.001,
  group: "Feedback",
  verbs: ["watch", "press"],
  worlds: ["flat"],
  summary:
    "A level meter for a mic check, on one white paper: the level as the large figure, its meaning in words (Good level, A little quiet, Too loud), and a pill bar per channel that fills with the ink, with a peak mark that holds and falls. The bars keep the VU standard's ballistics, so speech reads steadily and a click never pins them. It belongs to Flat.",
  tiers: ["instant"],
  mechanism:
    "A 60ms detector follows the signal and each bar is a spring on it, the VU standard's (99% of a steady tone in about 300ms, about 1.5% overshoot). The peak mark holds 900ms, then falls 12 dB a second. The figure and the word change ten times a second, and the loop runs only while there is a level to show. Under reduced motion the bars show each level at once.",
};

export const docs: PageDocs = {
  components: ["vu-meter"],
  exports: ["VuMeter"],
  usage: `import { VuMeter } from "@/components/vu-meter";

// Feed it the input's level per channel, where 1 reads 0 dB, as often as you measure it.
<VuMeter label="Mic check" levels={[left, right]} />`,
  use: [
    "A mic check before recording or a call: the person sees their level and reads in words whether it is right.",
    "An audio tool's input or output level, where a steady, honest reading matters more than every peak.",
  ],
  skip: [
    "Another world's page. VuMeter belongs to Flat's white paper and ink pills, and needs data-material=\"flat\" on <html>.",
    "Progress or a quantity that stands still. Use a progress bar or a meter.",
  ],
  keyboard: [[["Tab"], "The meter is a reading and takes no focus; the demo's buttons start the sample voice and the test tone."]],
  a11y: [
    "The meter is a group named by its label, described by the figure and the word (\"−12 dB. Good level.\").",
    "Each new word is said once in a polite status, so the level can be followed without watching the bars.",
    "Too loud is said in words as well as in the danger colour.",
    "Under reduced motion the bars show each level at once, with no ballistics.",
  ],
};

/* A synthetic voice, in levels where 1 reads 0 dB: phrases of syllables with pauses between, now and then a loud one. */
function makeVoice() {
  let t = 0;
  let sylEnd = 0;
  let sylLen = 0;
  let sylAmp = 0;
  let inPhrase = 0;
  let pauseUntil = 0;
  return (dt: number) => {
    t += dt;
    if (t >= sylEnd) {
      if (inPhrase <= 0) {
        pauseUntil = t + 0.3 + Math.random() * 0.6;
        inPhrase = 5 + Math.floor(Math.random() * 9);
      }
      const start = Math.max(t, pauseUntil);
      sylLen = 0.12 + Math.random() * 0.14;
      sylEnd = start + sylLen;
      inPhrase--;
      sylAmp = Math.random() < 0.05 ? 1.55 : 0.45 + Math.random() * 0.7;
    }
    const into = t - (sylEnd - sylLen);
    const env = into < 0 ? 0 : Math.sin(Math.PI * Math.min(1, into / sylLen)) ** 0.7;
    return 0.02 + sylAmp * env;
  };
}
/** A line-up tone: up in 12ms, a steady 0 dB for 900ms, then off. */
const tone = (s: number) => (s < 0 ? 0 : s < 0.012 ? s / 0.012 : s < 0.912 ? 1 : s < 0.982 ? Math.exp(-(s - 0.912) / 0.02) : 0);

/** The mic check: Sample voice and Test tone, and every press is picked up a little. */
function MicCheck({ autostart = 0 }: { autostart?: number }) {
  const { reduced } = useMotionDial();
  const [speaking, setSpeaking] = useState(false);
  const [toneAt, setToneAt] = useState(-1);
  const [levels, setLevels] = useState([0, 0]);
  const kick = useRef(0);

  useEffect(() => {
    if (autostart && !reduced) setSpeaking(true);
  }, [autostart, reduced]);

  useEffect(() => {
    const live = speaking || toneAt >= 0;
    if (!live && kick.current < 0.001) {
      setLevels([0, 0]);
      return;
    }
    /* Under reduced motion a voice is a steady level and the tone a steady 0 dB: nothing changes over time. */
    if (reduced) {
      setLevels(toneAt >= 0 ? [1, 1] : speaking ? [0.5, 0.46] : [0, 0]);
      return;
    }
    const voice = makeVoice();
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      kick.current *= Math.exp(-dt / 0.025);
      const v = speaking ? voice(dt) : 0;
      const t = toneAt >= 0 ? tone((now - toneAt) / 1000) : 0;
      if (toneAt >= 0 && now - toneAt > 1000) setToneAt(-1);
      setLevels([0, 1].map((c) => Math.max(v * (c ? 0.92 : 1) * (0.96 + Math.random() * 0.08), t, kick.current)));
    }, 33);
    return () => window.clearInterval(timer);
  }, [speaking, toneAt, reduced]);

  return (
    <div
      className="grid w-full max-w-sm gap-3"
      onPointerDownCapture={() => {
        kick.current = Math.max(kick.current, 0.9);
      }}
    >
      <VuMeter levels={levels} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" aria-pressed={speaking} onClick={() => setSpeaking((s) => !s)}>
          {speaking ? "Stop voice" : "Sample voice"}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setToneAt(performance.now())}>
          Test tone
        </Button>
      </div>
    </div>
  );
}

function MicDemo() {
  return <MicCheck />;
}

/** On Flat's wall the sample voice speaks by itself until a hand arrives. */
function MicTile() {
  const [go, setGo] = useState(0);
  const run = useSelfRun((n) => n === 0 && setGo(1), { every: 4000, first: 400 });
  return (
    <div ref={run.ref} className="grid w-full justify-items-center">
      <MicCheck autostart={go} />
    </div>
  );
}

export default function VuMeterPage() {
  return (
    <Page meta={meta} docs={docs} tile={<MicTile />}>
      <Stage
        title="A mic check"
        tier="instant"
        code="MicDemo"
        caption="Press Sample voice and a speaking voice drives the bars: they follow it steadily, the peak mark holds and falls, and the words say whether the level is right. Test tone sends a line-up tone that settles on 0 dB, and every press is picked up a little, as a mic would."
      >
        <MicDemo />
      </Stage>

      <TryIt of="VuMeter" component={VuMeter} props={{ levels: [0.5, 0.42], label: "Mic check" }} controls={["label"]} />
    </Page>
  );
}
