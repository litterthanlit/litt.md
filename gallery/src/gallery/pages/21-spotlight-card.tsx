import { SpotlightCard, SpotlightGroup } from "@/components/spotlight-card";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "spotlight-card",
  title: "Spotlight card",
  lede: "A soft shape that follows your cursor.",
  order: 1.001,
  group: "Layout",
  verbs: ["hover"],
  worlds: ["flat"],
  summary:
    "A white paper with one large figure, and a big grey bubble that rides under the pointer inside it, held 4px in so the paper keeps its white rim. Cards in a group read the one pointer, so the bubble crosses the gap between them. It belongs to Flat.",
  tiers: ["instant"],
  mechanism:
    "Move a mouse over the paper and a grey circle appears under the words and follows it: the pointer's place goes straight to CSS variables, so nothing renders as it moves. The circle fades and grows in on the instant tier, and swells a little while you press. In a group every card reads the same pointer, so one circle crosses from paper to paper. A touch shows nothing, and under reduced motion the circle appears and leaves at once.",
};

export const docs: PageDocs = {
  components: ["spotlight-card"],
  exports: ["SpotlightCard", "SpotlightGroup"],
  usage: `import { SpotlightCard, SpotlightGroup } from "@/components/spotlight-card";

<SpotlightGroup>
  <SpotlightCard title="Readers" figure="12,480" label="62 joined this week" />
  <SpotlightCard title="Opened" figure="61%" label="of Sunday's letter" />
</SpotlightGroup>`,
  use: [
    "A site's few headline numbers this week, each the whole of its card: readers, opens, posts.",
    "A portfolio or newsletter page with room to play, where a hand on the cards should feel answered.",
  ],
  skip: [
    "Another world's page. SpotlightCard belongs to Flat's paper and grey bubble, and needs data-material=\"flat\" on <html>.",
    "A dense dashboard of many figures. Use Stat: a bubble on every card is noise.",
    "A card a reader presses to open. The bubble follows the pointer, not a press; use Card.",
  ],
  a11y: [
    "Each card is an article named by its title; the figure and its line are text, read in order.",
    "The bubble is decoration, hidden from a screen reader and from forced colors.",
    "A touch, a keyboard and reduced motion change nothing a reader needs: the figure is the same with or without the bubble.",
  ],
};

function WeekDemo() {
  return (
    <SpotlightGroup>
      <SpotlightCard title="Readers" figure="12,480" label="62 joined this week" />
      <SpotlightCard title="Opened" figure="61%" label="of Sunday's letter" />
    </SpotlightGroup>
  );
}

function OneCardDemo() {
  return (
    <div className="w-full max-w-xs">
      <SpotlightCard title="Posts" figure="48" label="4 this month" />
    </div>
  );
}

export default function SpotlightCardPage() {
  return (
    <Page meta={meta} docs={docs} tile={<WeekDemo />}>
      <Stage
        title="This week"
        tier="instant"
        code="WeekDemo"
        caption="Move the pointer across both papers: one grey circle follows it under the words and crosses the gap between them. Press to swell it."
      >
        <WeekDemo />
      </Stage>

      <Stage
        title="On its own"
        tier="instant"
        code="OneCardDemo"
        caption="A card outside a group reads its own pointer."
      >
        <OneCardDemo />
      </Stage>

      <TryIt
        of="SpotlightCard"
        component={SpotlightCard}
        props={{ title: "Readers", figure: "12,480", label: "62 joined this week" }}
        controls={["title", "figure", "label"]}
      />
    </Page>
  );
}
