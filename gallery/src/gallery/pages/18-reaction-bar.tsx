import { useEffect, useState } from "react";
import { ReactionBar } from "@/components/reaction-bar";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "reaction-bar",
  title: "Reaction bar",
  lede: "Minimal cotton-candy reaction pills that pop on Flat's bounce.",
  order: 1.04,
  group: "Actions",
  verbs: ["press"],
  worlds: ["flat"],
  summary:
    "Minimal reader reaction pills for essays, newsletters and portfolio notes. Each pill carries only its glyph and count — zero redundant dots or word clutter. Untouched pills rest in Flat's 1.5px outline; toggling any pill washes it in its soft Candy tint (bubblegum, sky, violet, teal), pops on Flat's 0.28 bounce, and floats a tiny +1 badge upward. It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "Each reaction is a native button with aria-pressed. Toggling switches between Flat's outline-off and soft Candy tint-on without taking an accent fill, lights the glyph in its vivid Candy hue, pops on the expressive spring (350ms, bounce 0.28), and announces the updated count in a polite status region.",
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
    "Another world's page. ReactionBar uses Flat's 0.28 bounce, outline-means-off pills and Candy hues; it needs data-material=\"flat\" on <html>.",
    "A single multi-tap cheer counter. Use Kudos.",
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
    "Under reduced motion nothing bounces or floats; pill state and count update immediately.",
  ],
};

function EssayReactionsDemo() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <p className="text-body font-title text-fg">Issue 18 · Motion that stays out of the way</p>
        <p className="text-small text-fg-subtle">Glyph and count only — toggle any pill for a soft cotton-candy wash.</p>
      </div>
      <ReactionBar subject="Issue 18" defaultValue={["love", "spark"]} prominent />
    </div>
  );
}

function CompactReactionsDemo() {
  return <ReactionBar subject="Field notes" defaultValue={[]} />;
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
    caption: "Watch each pill pop on Flat's 0.28 bounce and light its Candy hue dot.",
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
        caption="Standing 40px combined total above the pills. Selected reactions lift onto crisp white paper with their Candy data dot."
      >
        <EssayReactionsDemo />
      </Stage>
      <Stage
        title="Inline footer bar"
        tier="expressive"
        code="CompactReactionsDemo"
        caption="Without the standing figure: untouched pills rest in Flat's 1.5px outline until tapped."
      >
        <CompactReactionsDemo />
      </Stage>
      <TryIt
        of="ReactionBar"
        component={ReactionBar}
        props={{ subject: "Field notes", defaultValue: ["love"], prominent: true }}
        controls={[{ name: "prominent", type: "boolean" }]}
      />
    </Page>
  );
}
