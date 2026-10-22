import { useState } from "react";
import { Lightbox, type LightboxItem } from "@/components/lightbox";
import { Media } from "@/components/media";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";
import { FILM_UPRIGHT, FLUID_WIDE, SERIES, THERMAL_SQUARE } from "../plates";

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

const PHOTOS: LightboxItem[] = SERIES.map(({ src, srcSet, alt, name, width, height }) => ({ src, srcSet, alt, caption: `${name}, 2026`, width, height }));

function GridDemo() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <ul aria-label="Thermal, film, fluid" className="grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
        {PHOTOS.map((photo, i) => (
          <li key={photo.alt}>
            <Media src={photo.src} srcSet={photo.srcSet} sizes="(min-width: 40rem) 16rem, 50vw" alt={photo.alt} ratio="1/1" onOpen={() => setOpen(i)} />
          </li>
        ))}
      </ul>
      <Lightbox label="Thermal, film, fluid" items={PHOTOS} index={open} onIndexChange={setOpen} />
    </>
  );
}

/* Tall and wide in one set, with no width and height given: each frame takes its image's own shape once it loads. */
const MIXED: LightboxItem[] = [FILM_UPRIGHT, FLUID_WIDE, THERMAL_SQUARE].map(({ src, srcSet, alt, name }) => ({ src, srcSet, alt, caption: `${name}, 2026` }));

function ShapesDemo() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <ul aria-label="Thermal, film, fluid, mixed shapes" className="flex w-full max-w-3xl flex-wrap items-end gap-4">
        {MIXED.map((photo, i) => (
          <li key={photo.alt} className={i === 1 ? "w-full sm:w-72" : "w-32 sm:w-40"}>
            <Media src={photo.src} srcSet={photo.srcSet} sizes={i === 1 ? "(min-width: 40rem) 18rem, 100vw" : "10rem"} alt={photo.alt} ratio="auto" onOpen={() => setOpen(i)} />
          </li>
        ))}
      </ul>
      <Lightbox label="Thermal, film, fluid, mixed shapes" items={MIXED} index={open} onIndexChange={setOpen} tier="responsive" />
    </>
  );
}

export default function LightboxPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="A set of images"
        tier="expressive"
        align="start"
        code="GridDemo"
        caption="Press an image. It rises by the travel token and settles from 0.98 on the expressive tier, on the canvas at 97%, so the page behind is a trace and the image is the only surface. Use the arrow keys, Previous and Next, or on a phone swipe it; the next one fades in from the side it comes from on the responsive tier. Esc, Close or a click around the image closes it, and focus goes back to the one you pressed."
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
