import { useEffect, useState } from "react";
import { Kudos } from "@/components/kudos";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "kudos",
  title: "Kudos",
  lede: "A way for readers to cheer a post, up to five times each.",
  order: 1.03,
  group: "Actions",
  verbs: ["press"],
  worlds: ["flat"],
  summary:
    "A cheer for a post, a picture series or an issue. Until a reader gives kudos the pill is outlined; each one fills it, lights the next dot a step warmer, warms the heart and sends a small +1 up. One more at the cap clears the reader's kudos, so it can always be undone. It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "A native button counts the reader's kudos from zero up to max (five by default). Each one steps the heart glyph and the row of progress dots along the sequential ramp (--data-seq-1 to --data-seq-4), pops the pill on the expressive spring (350ms), and releases a floating +1 badge that rises on the expressive spring and fades on the exit tween. Reduced motion updates the count and dots at once.",
};

export const docs: PageDocs = {
  components: ["kudos"],
  exports: ["Kudos"],
  usage: `import { Kudos } from "@/components/kudos";

<Kudos count={142} subject="Dusk tide" />

// With Flat's standing 40px figure above the pill.
<Kudos count={142} subject="Dusk tide" prominent />`,
  use: [
    "At the foot of a post, photo series or newsletter issue under Flat, where a reader wants to cheer without writing a comment.",
    "A light signal, given up to five times, that feels warm and playful without taking an accent fill.",
  ],
  skip: [
    "Another world's page. Kudos uses Flat's outline-means-off pill and warm dots; it needs data-material=\"flat\" on <html>.",
    "A single on/off bookmark or save action. Use Button with aria-pressed or Switch.",
    "A numeric quantity in a form. Use NumberField.",
  ],
  keyboard: [
    [["Tab"], "Moves focus to the kudos pill."],
    [["Enter", "Space"], "Adds one kudo, or clears your kudos once you reach the cap."],
  ],
  a11y: [
    "A single native button with aria-pressed and an accessible name carrying the subject, total count and how many taps you gave.",
    "Each kudos announces the updated count and progress (or clear) once in a polite status region.",
    "The floating +1 badge and the decorative dots are hidden from assistive tech; the live region and label say everything in words.",
    "Under reduced motion nothing springs or floats; the count and dots update at once.",
  ],
};

function PostKudosDemo() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <p className="text-body font-title text-fg">Dusk tide · Spring series</p>
        <p className="text-small text-fg-subtle">Give up to five kudos. One more clears yours.</p>
      </div>
      <Kudos count={142} subject="Dusk tide" defaultValue={2} prominent />
    </div>
  );
}

function InlineKudosDemo() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <Kudos count={48} subject="Issue 14" />
      <Kudos count={19} subject="Open water" defaultValue={5} max={5} />
    </div>
  );
}

function ReplayKudos() {
  const { reduced } = useMotionDial();
  const [mine, setMine] = useState(reduced ? 3 : 0);
  useEffect(() => {
    if (reduced) return;
    const t1 = window.setTimeout(() => setMine(1), 280);
    const t2 = window.setTimeout(() => setMine(2), 620);
    const t3 = window.setTimeout(() => setMine(3), 960);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [reduced]);
  return <Kudos count={142} subject="Dusk tide" value={mine} onChange={setMine} prominent />;
}

export const study: PageStudy = {
  object: <Kudos count={142} subject="Dusk tide" defaultValue={3} prominent />,
  parts: [
    { name: "The figure", selector: "[data-part=figure]" },
    { name: "The pill", selector: "button" },
    { name: "The dots", selector: "[data-part=circle]" },
  ],
  states: {
    empty: <Kudos count={142} subject="Dusk tide" defaultValue={0} prominent />,
    default: <Kudos count={142} subject="Dusk tide" defaultValue={3} prominent />,
    pressed: <Kudos count={142} subject="Dusk tide" defaultValue={5} prominent />,
  },
  replay: {
    label: "Replay three taps",
    caption: "Watch the pill pop and the next dot warm with each kudos given.",
    run: () => <ReplayKudos />,
  },
};

export default function KudosPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      study={study}
      tile={<Kudos count={142} subject="Dusk tide" defaultValue={3} prominent />}
    >
      <Stage
        title="Reader kudos"
        tier="expressive"
        code="PostKudosDemo"
        caption="The total stands above the pill. Each kudos warms the next dot, and one past five clears yours."
      >
        <PostKudosDemo />
      </Stage>
      <Stage
        title="Compact inline pills"
        tier="expressive"
        code="InlineKudosDemo"
        caption="At the foot of a post or issue: outlined until you give kudos, white once you have."
      >
        <InlineKudosDemo />
      </Stage>
      <TryIt
        of="Kudos"
        component={Kudos}
        props={{ count: 142, subject: "Dusk tide", defaultValue: 2, prominent: true, max: 5 }}
        controls={[
          { name: "prominent", type: "boolean" },
          { name: "max", type: "number", min: 3, max: 8, step: 1 },
        ]}
      />
    </Page>
  );
}
