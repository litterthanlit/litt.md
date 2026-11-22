import { useEffect, useState } from "react";
import { ReactionBar } from "@/components/reaction-bar";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "reaction-bar",
  title: "Reaction bar",
  lede: "Quick reactions to a post, each with how many readers chose it.",
  order: 1.04,
  group: "Actions",
  verbs: ["press"],
  worlds: ["flat"],
  summary:
    "Reactions at the foot of a post, a letter or a portfolio note. Each pill holds a symbol and its count, and the reaction's name is read out and shown on hover. A reaction nobody here has chosen yet is outlined; choosing one tints the pill, colors its symbol and sends a small +1 up, and choosing it again takes it back. It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "Each reaction is a native button with aria-pressed. Choosing one moves it from the outline (off) to its tint (on) without taking an accent fill, colors the symbol in its data hue, pops on the expressive spring (350ms), and announces the updated count in a polite status region.",
};

export const docs: PageDocs = {
  components: ["reaction-bar"],
  exports: ["ReactionBar"],
  usage: `import { ReactionBar } from "@/components/reaction-bar";

<ReactionBar subject="Issue 18" />

// With Flat's standing 40px combined reaction total.
<ReactionBar subject="Issue 18" prominent />`,
  use: [
    "At the foot of an essay, portfolio case study or newsletter issue under Flat, where readers want minimal multi-choice reactions.",
    "Lightweight editorial feedback that stays playful, uncluttered and free of accent fills.",
  ],
  skip: [
    "Another world's page. ReactionBar uses Flat's outline-means-off pills and data hues; it needs data-material=\"flat\" on <html>.",
    "A single cheer a reader can give up to five times. Use Kudos.",
    "A formal mutually exclusive vote with share bars. Use Poll.",
  ],
  keyboard: [
    [["Tab"], "Moves focus between reaction pills."],
    [["Enter", "Space"], "Toggles the focused reaction on or off."],
  ],
  a11y: [
    "Grouped in role=\"group\" with an accessible name carrying the subject.",
    "Each pill is a native button with aria-pressed, title and an accessible label carrying the full reaction name and count.",
    "Every toggle announces once in a polite live status region; decorative floating +1 badges are hidden from assistive tech.",
    "Under reduced motion nothing springs or floats; pill state and count update immediately.",
  ],
};

function EssayReactionsDemo() {
  return <ReactionBar subject="Issue 18" defaultValue={["love", "spark"]} prominent />;
}

function CompactReactionsDemo() {
  return <ReactionBar subject="Dusk tide" defaultValue={[]} />;
}

function ReplayReactions() {
  const { reduced } = useMotionDial();
  const [active, setActive] = useState<string[]>(reduced ? ["love", "spark"] : []);
  useEffect(() => {
    if (reduced) return;
    const t1 = window.setTimeout(() => setActive(["love"]), 260);
    const t2 = window.setTimeout(() => setActive(["love", "spark"]), 640);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [reduced]);
  return <ReactionBar subject="Issue 18" value={active} onChange={setActive} prominent />;
}

export const study: PageStudy = {
  object: <ReactionBar subject="Issue 18" defaultValue={["love"]} prominent />,
  parts: [
    { name: "The figure", selector: "[data-part=figure]" },
    { name: "The active pill", selector: "[data-part=pill]" },
    { name: "The outline pill", selector: "[data-part=outline]" },
  ],
  states: {
    empty: <ReactionBar subject="Issue 18" defaultValue={[]} prominent />,
    default: <ReactionBar subject="Issue 18" defaultValue={["love"]} prominent />,
    pressed: <ReactionBar subject="Issue 18" defaultValue={["love", "spark", "fire"]} prominent />,
  },
  replay: {
    label: "Replay two reactions",
    caption: "Watch each pill pop and take its color as a reader reacts.",
    run: () => <ReplayReactions />,
  },
};

export default function ReactionBarPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      study={study}
      tile={<ReactionBar subject="Issue 18" defaultValue={["love", "spark"]} prominent />}
    >
      <Stage
        title="Essay reactions"
        tier="expressive"
        code="EssayReactionsDemo"
        caption="The total stands above the pills. A reaction you chose is tinted, with its symbol in color."
      >
        <EssayReactionsDemo />
      </Stage>
      <Stage
        title="Inline footer bar"
        tier="expressive"
        code="CompactReactionsDemo"
        caption="Without the total: every reaction is outlined until you choose it."
      >
        <CompactReactionsDemo />
      </Stage>
      <TryIt
        of="ReactionBar"
        component={ReactionBar}
        props={{ subject: "Dusk tide", defaultValue: ["love"], prominent: true }}
        controls={[{ name: "prominent", type: "boolean" }]}
      />
    </Page>
  );
}
