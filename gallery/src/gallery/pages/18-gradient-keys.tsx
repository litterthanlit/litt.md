import { useState } from "react";
import { GradientKeys, type GradientCover } from "@/components/gradient-keys";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";
import { useSelfRun } from "../self-run";

export const meta: PageMeta = {
  id: "gradient-keys",
  title: "Gradient keys",
  lede: "Pick a cover: long exposures in Japanese palettes.",
  order: 1.003,
  group: "Selection",
  verbs: ["select"],
  worlds: ["flat"],
  summary:
    "A cover picker for a site or a letter: one cover on white paper, a long exposure of streaks drawn live, its name under it as the one large figure, and a swatch circle per cover, the chosen one standing larger with a tick. The covers are content you pass in, five colour stops each. It belongs to Flat.",
  tiers: ["responsive", "expressive"],
  mechanism:
    "Nothing moves on its own: at rest the field holds one frame. Under a hand it streams, quickening where the pointer is, and a press rings out from the press. A new cover runs out along the streaks over 600ms from the edge nearest the swatch that chose it, the name rises 6px into place on the responsive tier, and the chosen swatch grows on Flat's expressive spring. Under reduced motion the field is drawn once per cover and nothing rings.",
};

export const docs: PageDocs = {
  components: ["gradient-keys"],
  exports: ["GradientKeys"],
  usage: `import { GradientKeys } from "@/components/gradient-keys";

// The covers are your artwork: { id, name, line?, stops: five colours, dark to light }.
<GradientKeys covers={covers} value={cover} onValueChange={setCover} />`,
  use: [
    "Choosing the header art for a site, a letter or a profile from a few covers you made.",
    "When the picture is the choice: a live cover says more than a list of names.",
  ],
  skip: [
    "Another world's page. GradientKeys belongs to Flat's white paper on the grey ground, and needs data-material=\"flat\" on <html>.",
    "Picking a colour for the interface. Use a colour picker; a cover is artwork, not a theme.",
    "More than five or six covers. Use a grid of cards.",
  ],
  keyboard: [
    [["Tab"], "Moves into the swatches, on the chosen one."],
    [["←", "→", "↑", "↓"], "Moves to the previous or next cover and picks it."],
    [["Home", "End"], "Picks the first or last cover."],
  ],
  a11y: [
    "The picture is an image named by the cover (\"Cover: Ai, indigo, fading to asagi blue\").",
    "The swatches are a radio group named Cover, each named by its cover in words, so the choice never rests on a colour.",
    "A pick is said once in a polite status.",
    "Nothing moves until a hand does; under reduced motion the field is drawn once per cover and nothing rings.",
  ],
};

/* The Flat studies' three covers. Artwork, not tokens: content a host passes in, as it would images. */
const COVERS: GradientCover[] = [
  { id: "wakatake", name: "Wakatake", line: "Young bamboo, through the leaves", seed: 2, stops: ["#264d35", "#3b6e4e", "#6da47a", "#a9cba3", "#e1ecdc"] }, // litt-allow: artwork, a cover's stops (the Flat studies, Gradient keys)
  { id: "ai", name: "Ai", line: "Indigo, fading to asagi blue", seed: 2, stops: ["#16213d", "#1f2f54", "#3f5f8f", "#7fa6c2", "#c9dde6"] }, // litt-allow: artwork, a cover's stops (the Flat studies, Gradient keys)
  { id: "sakura", name: "Sakura", line: "Cherry blossom, fading to shell white", seed: 2, stops: ["#b06e7c", "#d796a6", "#e9b5c1", "#f5d8de", "#fbf2ee"] }, // litt-allow: artwork, a cover's stops (the Flat studies, Gradient keys)
];

function CoverDemo() {
  const [cover, setCover] = useState("wakatake");
  return <GradientKeys covers={COVERS} value={cover} onValueChange={setCover} />;
}

/** On Flat's wall the choice steps on every two seconds until a hand arrives. */
function CoverTile() {
  const [cover, setCover] = useState("wakatake");
  const run = useSelfRun((n) => setCover(COVERS[(n + 1) % COVERS.length]!.id), { every: 2000, first: 1200 });
  return (
    <div ref={run.ref} className="grid w-full justify-items-center">
      <GradientKeys covers={COVERS} value={cover} onValueChange={setCover} />
    </div>
  );
}

export default function GradientKeysPage() {
  return (
    <Page meta={meta} docs={docs} tile={<CoverTile />}>
      <Stage
        title="Pick a cover"
        tier="expressive"
        code="CoverDemo"
        caption="Pick a swatch and the new cover runs out along the streaks from that side, while its name rises into place. Move over the picture and it streams under your hand; press it and it rings out from where you pressed."
      >
        <CoverDemo />
      </Stage>

      <TryIt of="GradientKeys" component={GradientKeys} props={{ covers: COVERS }} controls={["label"]} />
    </Page>
  );
}
