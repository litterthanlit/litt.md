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
    "A cheer for a post, a picture series or an issue, on a white paper. The pill is the ink until a reader gives kudos, then the grey bubble with the heart filled and how many of five they gave beside it; the total rolls up with each one. One more at the most clears the reader's kudos, so it can always be undone. It belongs to Flat.",
  tiers: ["instant", "responsive"],
  mechanism:
    "A native button counts the reader's kudos from zero up to max (five by default). The first turns the pill from the ink to the grey bubble and fills the heart; each one rolls the changed digits of the total (Rolling number, on the responsive spring, never a bounce) and writes how many of max the reader has given beside the pill. The pill gives a little under the finger. Nothing floats. Reduced motion updates the count at once.",
};

export const docs: PageDocs = {
  components: ["kudos"],
  exports: ["Kudos"],
  usage: `import { Kudos } from "@/components/kudos";

<Kudos count={142} subject="Dusk tide" />

// With the total as the large figure above the pill.
<Kudos count={142} subject="Dusk tide" prominent />`,
  use: [
    "At the foot of a post, photo series or newsletter issue under Flat, where a reader wants to cheer without writing a comment.",
    "A light signal, given up to five times, where the count going up is the reward.",
  ],
  skip: [
    "Another world's page. Kudos is drawn in Flat's paper, pills and large figure; it needs data-material=\"flat\" on <html>.",
    "A single on/off bookmark or save action. Use Button with aria-pressed or Switch.",
    "A numeric quantity in a form. Use NumberField.",
  ],
  keyboard: [
    [["Tab"], "Moves focus to the kudos pill."],
    [["Enter", "Space"], "Adds one kudo, or clears your kudos once you reach the cap."],
  ],
  a11y: [
    "A single native button with aria-pressed, whose accessible name starts with its visible words and carries the subject, the total and how many you gave.",
    "Each kudos announces the updated count and progress (or clear) once in a polite status region.",
    "The rolling digits are hidden from assistive tech, which reads the whole figure; the live region and label say everything in words.",
    "Under reduced motion nothing rolls; the count updates at once.",
  ],
};

function PostKudosDemo() {
  return <Kudos count={142} subject="Dusk tide" defaultValue={2} prominent />;
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
    { name: "How many you gave", selector: "[data-part=lettering][aria-hidden]" },
  ],
  states: {
    empty: <Kudos count={142} subject="Dusk tide" defaultValue={0} prominent />,
    default: <Kudos count={142} subject="Dusk tide" defaultValue={3} prominent />,
    pressed: <Kudos count={142} subject="Dusk tide" defaultValue={5} prominent />,
  },
  replay: {
    label: "Replay three taps",
    caption: "Watch the pill turn grey and the total roll up with each kudos given.",
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
        caption="The total stands above the pill. Each kudos rolls it up, and one past five clears yours."
      >
        <PostKudosDemo />
      </Stage>
      <Stage
        title="Compact inline pills"
        tier="expressive"
        code="InlineKudosDemo"
        caption="At the foot of a post or issue, the total sits in the pill: the ink until you give kudos, the grey bubble once you have."
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
