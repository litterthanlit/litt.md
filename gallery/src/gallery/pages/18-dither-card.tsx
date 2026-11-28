import { useState } from "react";
import { DitherCards, type DitherProject } from "@/components/dither-card";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";
import { useSelfRun } from "../self-run";

export const meta: PageMeta = {
  id: "dither-card",
  title: "Dither card",
  lede: "Project cards with a dithered creature on every one.",
  order: 1.0025,
  group: "Layout",
  verbs: ["press"],
  worlds: ["flat"],
  summary:
    "A row of project cards on the grey ground, each a white paper with its picture, a butterfly, a jellyfish or a bloom in three-tone ordered dither drawn in the ink, and its name. The card under your hand lifts and its picture quickens; under the row its name, year and line are said in words. It belongs to Flat.",
  tiers: ["instant", "responsive", "expressive"],
  mechanism:
    "Nothing moves on its own: each picture holds one frame. The card under the hand or with focus lifts on Flat's expressive spring and its picture quickens and brightens toward the pointer; a press rings out from where you pressed and shrinks the card a little. The line under the row rises into place. Under reduced motion each picture is drawn once, a card lifts at once, and nothing rings.",
};

export const docs: PageDocs = {
  components: ["dither-card"],
  exports: ["DitherCards"],
  usage: `import { DitherCards } from "@/components/dither-card";

<DitherCards
  projects={[
    { id: "wavr", title: "Wavr", line: "Shader code in, motion graphics out.", year: "2026", href: "/work/wavr", creature: "butterfly" },
    { id: "carson", title: "Carson", line: "Learn a layout by wrecking one.", year: "2026", href: "/work/carson", creature: "jellyfish" },
  ]}
/>`,
  use: [
    "A portfolio's or a studio's few projects, side by side, where each deserves a picture of its own.",
    "Three to four cards in a row: the creature is the card's art, and the line under the row says what each one is.",
  ],
  skip: [
    "Another world's page. DitherCards belongs to Flat's grey ground and white paper, and needs data-material=\"flat\" on <html>.",
    "Many projects. Use a grid of cards; three or four pictures that move are the most a row should hold.",
    "Real photographs or screenshots. Use a card with its image.",
  ],
  keyboard: [
    [["Tab"], "Moves from card to card; the card with focus lifts and rings."],
    [["Enter"], "Opens the project."],
  ],
  a11y: [
    "The cards are a list named Projects; each is a link named by its project and described by its line and year.",
    "The pictures are hidden from a screen reader; the line under the row repeats the link's description for the eye.",
    "Nothing moves until a hand or focus does, and under reduced motion each picture is drawn once.",
  ],
};

const PROJECTS: DitherProject[] = [
  { id: "wavr", title: "Wavr", line: "Shader code in, motion graphics out.", year: "2026", href: "https://www.litt.design", creature: "butterfly" },
  { id: "carson", title: "Carson", line: "Learn a layout by wrecking one.", year: "2026", href: "https://www.litt.design", creature: "jellyfish" },
  { id: "litt-works", title: "litt.works", line: "Prints and long-form pieces.", year: "2024–26", href: "https://www.litt.design", creature: "bloom" },
];

function ProjectsDemo() {
  return <DitherCards projects={PROJECTS} active="wavr" newTab />;
}

/** On Flat's wall each card comes up in turn, ringing as it lands, until a hand arrives. */
function DitherTile() {
  const [active, setActive] = useState<string | undefined>(undefined);
  const run = useSelfRun((n) => setActive(PROJECTS[n % PROJECTS.length]!.id), { every: 1400, first: 350 });
  return (
    <div ref={run.ref} className="grid w-full justify-items-center">
      <DitherCards projects={PROJECTS} active={active} newTab />
    </div>
  );
}

export default function DitherCardPage() {
  return (
    <Page meta={meta} docs={docs} tile={<DitherTile />}>
      <Stage
        title="A studio's projects"
        tier="expressive"
        code="ProjectsDemo"
        caption="Move over a card and it lifts while its creature quickens under your pointer; press it and a ring runs through the picture. Tab across the cards and each one comes up as it takes focus. The line under the row says what the card is."
      >
        <ProjectsDemo />
      </Stage>

      <TryIt of="DitherCards" component={DitherCards} props={{ projects: PROJECTS, newTab: true }} controls={["label"]} />
    </Page>
  );
}
