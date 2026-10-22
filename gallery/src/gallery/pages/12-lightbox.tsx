import { useState } from "react";
import { Lightbox, type LightboxItem } from "@/components/lightbox";
import { Media } from "@/components/media";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "lightbox",
  title: "Lightbox",
  lede: "One image of a set, at the size of the screen.",
  order: 12.5,
  group: "Overlays",
  verbs: ["open", "drag", "press"],
  summary:
    "One image of a set at the size of the screen, on the canvas, with the rest a key or a swipe away. Opening is the view's expressive moment, as a dialog's: the image rises by the travel token and settles from 0.98. Moving to the next image is a short fade on the responsive tier, and on a touch screen a finger swipes it away one to one.",
  tiers: ["instant", "responsive", "expressive"],
};

export const docs: PageDocs = {
  components: ["lightbox", "media"],
  exports: ["Lightbox", "Media"],
  usage: `import { useState } from "react";
import { Lightbox } from "@/components/lightbox";
import { Media } from "@/components/media";

const [open, setOpen] = useState<number | null>(null);

// Each image opens the lightbox on itself.
{photos.map((p, i) => (
  <Media key={p.src} src={p.thumb} alt={p.alt} ratio="1/1" onOpen={() => setOpen(i)} />
))}

// width and height give each frame its shape before the image loads.
<Lightbox
  label="Atlas, landscapes"
  items={photos.map((p) => ({ src: p.src, alt: p.alt, caption: p.caption, width: p.width, height: p.height }))}
  index={open}
  onIndexChange={setOpen}
/>`,
  use: [
    "Images people want to see larger than the page shows them: photographs in a portfolio, screenshots in a case study.",
    "A set to look through one by one, opened from a grid of thumbnails or a carousel.",
  ],
  skip: [
    "A form or a decision. That is a Dialog.",
    "One image that is already shown large. Opening it again adds a step and nothing to see.",
    "Images that must be read side by side, such as a before and after. Lay them out in the page.",
  ],
  keyboard: [
    [["ArrowRight", "ArrowLeft"], "The next or the previous image."],
    [["Home", "End"], "The first or the last image."],
    [["Escape"], "Closes it, and focus goes back to the image that opened it, or to returnFocus."],
    [["Tab"], "Moves between Close, Previous and Next. Focus stays inside until it closes."],
  ],
  a11y: [
    "A modal dialog named by the label, with focus held inside and the page behind it held still.",
    "Focus lands on the panel when it opens, so the arrow keys work at once, and goes back to what opened it when it closes.",
    "Each image is named by its alt text, and its caption is shown under it.",
    "Moving says \"Image 4 of 12\" once in a polite status.",
    "A swipe is never the only way: Previous, Next and Close are always there, 44px on a touch screen.",
    "Under reduced motion it opens, moves and closes without movement, and a swipe still follows the finger.",
  ],
};

/* Drawn stand-ins for photographs: a sky in two colors, light falling from the top, two ridges and a trace of grain.
   An SVG, so the page fetches nothing; named colors, because these are pictures, not the interface. The scene is
   cropped to the width and height asked for, as a photograph would be. */
function plate(sky: string, glow: string, far: string, near: string, width = 1600, height = 1000) {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 1600 1000' preserveAspectRatio='xMidYMid slice'>` +
    `<defs><linearGradient id='s' x2='0' y2='1'><stop offset='0' stop-color='${sky}'/><stop offset='1' stop-color='${glow}'/></linearGradient>` +
    `<radialGradient id='l' cx='.5' cy='0' r='.9'><stop offset='0' stop-color='${glow}' stop-opacity='.7'/><stop offset='1' stop-color='${glow}' stop-opacity='0'/></radialGradient>` +
    `<filter id='g'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .12 0'/></filter></defs>` +
    `<rect width='1600' height='1000' fill='url(#s)'/><rect width='1600' height='1000' fill='url(#l)'/>` +
    `<path d='M0 620C260 540 430 590 650 530S1110 450 1600 545V1000H0Z' fill='${far}'/>` +
    `<path d='M0 780C310 700 560 765 830 720S1310 655 1600 735V1000H0Z' fill='${near}'/>` +
    `<rect width='1600' height='1000' filter='url(#g)'/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const PHOTOS: LightboxItem[] = [
  { src: plate("lightsteelblue", "mistyrose", "slategray", "darkslategray"), alt: "Dawn over two ridges, the sky pale blue going pink", caption: "Dawn over the ridge, 2025", width: 1600, height: 1000 },
  { src: plate("peachpuff", "navajowhite", "peru", "sienna"), alt: "Dunes at noon, a ridge of shadow across the middle", caption: "Dunes at noon, 2024", width: 1600, height: 1000 },
  { src: plate("gainsboro", "whitesmoke", "darkgray", "dimgray"), alt: "Fog over two grey ridges", caption: "Fog bank, 2025", width: 1600, height: 1000 },
  { src: plate("steelblue", "lightblue", "cadetblue", "darkslategray"), alt: "A blue evening over a dark shore", caption: "Tide line, 2023", width: 1600, height: 1000 },
  { src: plate("darkslateblue", "lightsalmon", "dimgray", "darkslategray"), alt: "A violet dusk going salmon at the horizon, over grey hills", caption: "Dusk, 2024", width: 1600, height: 1000 },
  { src: plate("honeydew", "darkseagreen", "seagreen", "darkolivegreen"), alt: "A green valley under a pale sky", caption: "Valley, 2025", width: 1600, height: 1000 },
];

function GridDemo() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <ul aria-label="Atlas, landscapes" className="grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
        {PHOTOS.map((photo, i) => (
          <li key={photo.alt}>
            <Media src={photo.src} alt={photo.alt} ratio="1/1" onOpen={() => setOpen(i)} />
          </li>
        ))}
      </ul>
      <Lightbox label="Atlas, landscapes" items={PHOTOS} index={open} onIndexChange={setOpen} />
    </>
  );
}

/* Tall and wide in one set, with no width and height given: each frame takes its image's own shape once it loads. */
const MIXED: LightboxItem[] = [
  { src: plate("honeydew", "darkseagreen", "seagreen", "darkolivegreen", 1200, 1500), alt: "A green valley under a pale sky, upright", caption: "Valley, upright, 2025" },
  { src: plate("darkslateblue", "lightsalmon", "dimgray", "darkslategray", 2000, 900), alt: "A violet dusk over grey hills, very wide", caption: "Dusk, panorama, 2024" },
  { src: plate("peachpuff", "navajowhite", "peru", "sienna", 1400, 1400), alt: "Dunes at noon, square", caption: "Dunes, square, 2024" },
];

function ShapesDemo() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <ul aria-label="Atlas, mixed shapes" className="flex w-full max-w-3xl flex-wrap items-end gap-4">
        {MIXED.map((photo, i) => (
          <li key={photo.alt} className={i === 1 ? "w-full sm:w-72" : "w-32 sm:w-40"}>
            <Media src={photo.src} alt={photo.alt} ratio="auto" onOpen={() => setOpen(i)} />
          </li>
        ))}
      </ul>
      <Lightbox label="Atlas, mixed shapes" items={MIXED} index={open} onIndexChange={setOpen} tier="responsive" />
    </>
  );
}

export default function LightboxPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="A set of photographs"
        tier="expressive"
        align="start"
        code="GridDemo"
        caption="Press a photograph. It rises by the travel token and settles from 0.98 on the expressive tier, on the canvas at 97%, so the page behind is a trace and the image is the only surface. Use the arrow keys, Previous and Next, or on a phone swipe it; the next one fades in from the side it comes from on the responsive tier. Esc, Close or a click around the image closes it, and focus goes back to the one you pressed."
      >
        <GridDemo />
      </Stage>

      <Stage
        title="Images of their own shape"
        tier="responsive"
        align="start"
        code="ShapesDemo"
        caption="Upright, wide and square in one set. Each is as large as the screen allows at its own shape, and the frame keeps the hairline and the surface radius. These pass no width and height, so each frame takes its shape when the image loads; pass them when you know them and the frame has it from the start. This set opens on the responsive tier, as it would where the view has already had its moment."
      >
        <ShapesDemo />
      </Stage>
    </Page>
  );
}
