import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { Lightbox } from "@/components/lightbox";
import { Media, type MediaProps } from "@/components/media";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

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

const DAWN = plate("lightsteelblue", "mistyrose", "slategray", "darkslategray");
const DUNE = plate("peachpuff", "navajowhite", "peru", "sienna");
const FOG = plate("gainsboro", "whitesmoke", "darkgray", "dimgray");
const MOSS = plate("honeydew", "darkseagreen", "seagreen", "darkolivegreen");
/* An image that cannot be decoded, so the failed state shows without a request. */
const BROKEN = "data:image/png;base64,AAAA";

function FramesDemo() {
  return (
    <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-[2fr_1fr]">
      <Media src={DAWN} alt="Dawn over two ridges, the sky pale blue going pink" ratio="16/9" caption="Dawn over the ridge, 2025" />
      <Media src={MOSS} alt="A green valley under a pale sky" ratio="4/5" caption="Valley, 2024" />
    </div>
  );
}

/* The same image, held back for a moment as a slow network would, and one that fails. */
function StatesDemo() {
  const [run, setRun] = useState(0);
  const [src, setSrc] = useState<string | undefined>(undefined);
  useEffect(() => {
    setSrc(undefined);
    const timer = window.setTimeout(() => setSrc(DUNE), 1200);
    return () => window.clearTimeout(timer);
  }, [run]);
  return (
    <div className="grid w-full max-w-3xl gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        {/* No src yet is how a slow image looks: the still frame, until it arrives and fades in. */}
        <Media key={run} src={src} alt="Dunes at noon, a ridge of shadow across the middle" ratio="4/3" caption={src ? "Loaded" : "Loading"} />
        <Media src={BROKEN} alt="The tide line at dusk" ratio="4/3" caption="Failed" />
      </div>
      <Button size="sm" className="justify-self-start" onClick={() => setRun((r) => r + 1)}>
        Load again
      </Button>
    </div>
  );
}

const SET = [
  { src: FOG, alt: "Fog over two grey ridges", caption: "Fog bank, 2025" },
  { src: DAWN, alt: "Dawn over two ridges, the sky pale blue going pink", caption: "Dawn over the ridge, 2025" },
  { src: DUNE, alt: "Dunes at noon, a ridge of shadow across the middle", caption: "Dunes at noon, 2024" },
];

function OpenDemo() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <ul aria-label="Photographs" className="grid w-full max-w-3xl grid-cols-3 gap-4">
        {SET.map((image, i) => (
          <li key={image.alt}>
            <Media src={image.src} alt={image.alt} ratio="1/1" onOpen={() => setOpen(i)} />
          </li>
        ))}
      </ul>
      <Lightbox label="Atlas, landscapes" items={SET.map((image) => ({ ...image, width: 1600, height: 1000 }))} index={open} onIndexChange={setOpen} />
    </>
  );
}

/* Try it shows a real address in its code; the stage draws the stand-in. */
function TryMedia(props: MediaProps) {
  return <Media {...props} src={FOG} />;
}

export default function MediaPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Pictures in frames"
        align="start"
        code="FramesDemo"
        caption="Each frame has its shape before the image arrives, so nothing below it moves. The radius is the surface's, and a hairline lies over the image so a pale sky keeps its edge on a pale page. The caption sits 8px under the frame, in the grey. These pictures are drawn inline, so the page fetches nothing."
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
        props={{ src: "/work/atlas/fog.jpg", alt: "Fog over two grey ridges", caption: "Fog bank, 2025", className: "w-full max-w-md" }}
        controls={[{ name: "ratio", options: ["16/9", "8/5", "4/3", "1/1", "4/5", "auto"] }, "fit", "radius", "caption", "priority"]}
      />
    </Page>
  );
}
