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
    "Reactions at the foot of a post, a letter or a portfolio note, on a white paper. Each pill holds a symbol and its count, and the reaction's name is read out and shown on hover. A reaction you have not chosen is outlined; choosing one makes it the grey bubble with its symbol filled and its count rolled up by one, and choosing it again takes it back. It belongs to Flat.",
  tiers: ["instant", "responsive"],
  mechanism:
    "Each reaction is a native button with aria-pressed. Choosing one moves it from the outline (off) to the grey bubble (chosen inside paper), fills its symbol, rolls the changed digits of its count and of the total (Rolling number, on the responsive spring, never a bounce) and announces the new count in a polite status region. The pill gives a little under the finger; nothing floats.",
};

export const docs: PageDocs = {
  components: ["reaction-bar"],
  exports: ["ReactionBar"],
  usage: `import { ReactionBar } from "@/components/reaction-bar";

<ReactionBar subject="Issue 18" />

// With the combined total as the standing figure.
<ReactionBar subject="Issue 18" prominent />`,
  use: [
    "At the foot of an essay, portfolio case study or newsletter issue under Flat, where readers want minimal multi-choice reactions.",
    "Light feedback from readers that stays quiet: grey and ink, nothing else.",
  ],
  skip: [
    "Another world's page. ReactionBar is drawn in Flat's paper, outlines and grey bubble; it needs data-material=\"flat\" on <html>.",
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
    "Every toggle announces once in a polite live status region; the rolling digits are hidden from assistive tech, which reads the whole figure.",
    "Under reduced motion nothing rolls; the pill and its count change at once.",
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
    { name: "A chosen reaction", selector: "button[aria-pressed=true]" },
    { name: "A reaction not chosen", selector: "button[aria-pressed=false]" },
  ],
  states: {
    empty: <ReactionBar subject="Issue 18" defaultValue={[]} prominent />,
    default: <ReactionBar subject="Issue 18" defaultValue={["love"]} prominent />,
    pressed: <ReactionBar subject="Issue 18" defaultValue={["love", "spark", "fire"]} prominent />,
  },
  replay: {
    label: "Replay two reactions",
    caption: "Watch each pill turn to the grey bubble and its count roll up as a reader reacts.",
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
        caption="The total stands above the pills. A reaction you chose is the grey bubble, with its symbol filled."
      >
        <EssayReactionsDemo />
      </Stage>
      <Stage
        title="Inline footer bar"
        tier="expressive"
        code="CompactReactionsDemo"
        caption="Without the total, every reaction is outlined until you choose it."
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
