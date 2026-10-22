import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { Lightbox } from "@/components/lightbox";
import { Media, type MediaProps } from "@/components/media";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";
import { BUDS, GRAPHITE, OPEN_WATER, RED_SUN, SILK, SPRIG } from "../plates";

export const meta: PageMeta = {
  id: "media",
  title: "Media",
  lede: "One picture in a frame that keeps its shape.",
  order: 15.05,
  group: "Layout",
  verbs: ["press"],
  summary:
    "One picture in a frame with a fixed shape, so the page never jumps when it arrives. While it loads the frame is still surface-2, then the image fades in on the instant tier; if it fails, the frame keeps its size and says so. A hairline lies over every image, and with onOpen the frame becomes a button that opens a Lightbox.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["media"],
  exports: ["Media"],
  usage: `import { Media } from "@/components/media";

// A shape, a sentence of alt text, and a caption under it.
<Media src="/work/atlas/dune.jpg" alt="Dunes at noon, a ridge of shadow across the middle" ratio="16/9" caption="Dunes at noon, 2025" />

// The image the page opens on loads at once; every other one waits until it is near the screen.
<Media src="/work/atlas/hero.jpg" alt="Fog over a valley at dawn" ratio="16/9" priority />

// Its own shape: pass the width and height so the space is kept before it loads.
<Media src="/work/atlas/tide.jpg" alt="The tide line at dusk" ratio="auto" width={1600} height={2000} />

// A button that opens a larger view.
<Media src="/work/atlas/moss.jpg" alt="Moss on a wall, close up" ratio="4/5" onOpen={() => setOpen(0)} />`,
  use: [
    "Any image in the page flow: a screenshot in a case study, a photograph in a portfolio, a poster in an article.",
    "A card's cover or a carousel's slide, where every frame should keep one shape however the images were cropped.",
    "An image someone should be able to see larger. Give it onOpen and a Lightbox.",
    "A video with its own controls, or drawn art, as children: the frame, the radius and the hairline stay.",
  ],
  skip: [
    "A person or a company's mark. That is an Avatar, which falls back to initials.",
    "An icon. Icons are 16px strokes in the text color, not pictures.",
    "A background behind text. Text over a photograph fails contrast somewhere in it; put the text beside or under the image.",
    "A video that plays on its own. Nothing loops or plays without being asked: give the video controls.",
  ],
  keyboard: [
    [["Tab"], "Moves to the image when it opens a larger view. A plain image is not a stop."],
    [["Enter", "Space"], "Opens the larger view."],
  ],
  a11y: [
    "alt is required. Say what the image shows in a sentence. Pass \"\" only for an image that decorates, and it is hidden from screen readers.",
    "With onOpen the frame is a real button named by the alt text, with aria-haspopup=\"dialog\", so the alt must not be empty.",
    "A failed image keeps its alt text as its name; the words \"Image didn't load\" are for sighted people and are not read twice.",
    "The caption is a figcaption, read with the image.",
    "Keyboard focus draws the 2px focus ring at a 2px offset around the frame. Hover only strengthens the hairline, so touch loses nothing.",
    "Under reduced motion the image appears without its fade.",
  ],
};

/* An image that cannot be decoded, so the failed state shows without a request. */
const BROKEN = "data:image/png;base64,AAAA";

function FramesDemo() {
  return (
    <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-[2fr_1fr]">
      <Media src={OPEN_WATER.src} srcSet={OPEN_WATER.srcSet} sizes="(min-width: 48rem) 32rem, 100vw" alt={OPEN_WATER.alt} ratio="16/9" caption="Open water, 2026" />
      <Media src={BUDS.src} srcSet={BUDS.srcSet} sizes="(min-width: 48rem) 16rem, 100vw" alt={BUDS.alt} ratio="4/5" caption="Two buds, 2026" />
    </div>
  );
}

/* The same image, held back for a moment as a slow network would, and one that fails. */
function StatesDemo() {
  const [run, setRun] = useState(0);
  const [src, setSrc] = useState<string | undefined>(undefined);
  useEffect(() => {
    setSrc(undefined);
    const timer = window.setTimeout(() => setSrc(SILK.src), 1200);
    return () => window.clearTimeout(timer);
  }, [run]);
  return (
    <div className="grid w-full max-w-3xl gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        {/* No src yet is how a slow image looks: the still frame, until it arrives and fades in. */}
        <Media key={run} src={src} srcSet={src && SILK.srcSet} sizes="(min-width: 40rem) 24rem, 100vw" alt={SILK.alt} ratio="4/3" caption={src ? "Loaded" : "Loading"} />
        <Media src={BROKEN} alt="The tide line at dusk" ratio="4/3" caption="Failed" />
      </div>
      <Button size="sm" className="justify-self-start" onClick={() => setRun((r) => r + 1)}>
        Load again
      </Button>
    </div>
  );
}

const SET = [RED_SUN, SPRIG, GRAPHITE].map(({ src, srcSet, alt, name, width, height }) => ({ src, srcSet, alt, caption: `${name}, 2026`, width, height }));

function OpenDemo() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <ul aria-label="Photographs" className="grid w-full max-w-3xl grid-cols-3 gap-4">
        {SET.map((image, i) => (
          <li key={image.alt}>
            <Media src={image.src} srcSet={image.srcSet} sizes="(min-width: 48rem) 16rem, 33vw" alt={image.alt} ratio="1/1" onOpen={() => setOpen(i)} />
          </li>
        ))}
      </ul>
      <Lightbox label="Field studies" items={SET} index={open} onIndexChange={setOpen} />
    </>
  );
}

/* Try it shows an address of your own in its code; the stage shows a study from the gallery's set. */
function TryMedia(props: MediaProps) {
  return <Media {...props} src={GRAPHITE.src} srcSet={GRAPHITE.srcSet} sizes="28rem" />;
}

export default function MediaPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Pictures in frames"
        align="start"
        code="FramesDemo"
        caption="Each frame has its shape before the image arrives, so nothing below it moves. The radius is the surface's, and a hairline lies over the image so a pale sky keeps its edge on a pale page. The caption sits 8px under the frame, in the grey. These are renders from the Brand Playground, loaded as a site would load photographs: lazily, at the size the frame needs."
      >
        <FramesDemo />
      </Stage>

      <Stage
        title="Loading and failing"
        tier="instant"
        align="start"
        code="StatesDemo"
        caption="Press Load again. Until the image arrives the frame is a still surface-2, the skeleton's look, with no pulse and no shimmer; then it fades in on the instant tier. The second image is broken, so its frame keeps its size and says so beside an image mark. Its alt text still names it for a screen reader."
      >
        <StatesDemo />
      </Stage>

      <Stage
        title="Opens a larger view"
        tier="instant"
        align="start"
        code="OpenDemo"
        caption="With onOpen each frame is a button. Hover strengthens the hairline and the pointer becomes a zoom; nothing lifts. Tab to one and the focus ring wraps the frame. Press it and the Lightbox opens on that image."
      >
        <OpenDemo />
      </Stage>

      <TryIt
        of="Media"
        component={TryMedia}
        props={{ src: "/work/studies/graphite.webp", alt: GRAPHITE.alt, caption: "Graphite, 2026", className: "w-full max-w-md" }}
        controls={[{ name: "ratio", options: ["16/9", "8/5", "4/3", "1/1", "4/5", "auto"] }, "fit", "radius", "caption", "priority"]}
      />
    </Page>
  );
}
