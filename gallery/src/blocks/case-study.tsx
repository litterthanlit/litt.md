/**
 * Case study: one project told as a page, for a studio's or a photographer's site. A block: a whole page built from
 * the litt parts, to copy and make your own. Swap the project, the words and the images at the top for yours; the
 * layout stays.
 *
 * Where the page sits, then the title and its line as one sentence in two inks. A wide hero image, the facts in a row
 * of labels and values, and the story in sections with their label in a narrow left column and the text at a reading
 * measure beside it (R9, asymmetric and left-aligned). The series runs in a carousel, one image and the next peeking;
 * the details sit in a grid; the next project is one linked card at the end. Every image opens the lightbox on itself,
 * and the lightbox runs through them all in page order. The carousel follows it, so closing lands on the slide of the
 * image it closed on, with focus there. Nothing moves until someone moves it; opening the lightbox is the page's one
 * expressive moment.
 */
import { useId, useRef, useState, type ReactNode } from "react";
import { Breadcrumb } from "@/components/breadcrumb";
import { Card, CardBody, CardCover, CardDescription, CardLink, CardTitle } from "@/components/card";
import { Carousel, CarouselContent, CarouselControls, CarouselItem } from "@/components/carousel";
import { Lightbox, type LightboxItem } from "@/components/lightbox";
import { ProjectCover } from "@/components/list-cover";
import { Media } from "@/components/media";

/* ----------------------------------------------------------------- data */

/* Drawn stand-ins for photographs: a sky in two colors, light falling from the top, two ridges and a trace of grain.
   An SVG, so the page fetches nothing; named colors, because these are pictures, not the interface. The scene is
   cropped to the width and height asked for, as a photograph would be. Replace every src below with your images. */
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

/** The project, and where the page sits. Point the links at your routes. */
const PROJECT = {
  name: "Atlas portfolio",
  line: "A photographer's work, on a grid that stays out of the way.",
  trail: [
    { label: "Work", href: "/work" },
    { label: "Atlas portfolio", href: "/work/atlas" },
  ],
  facts: [
    { label: "Client", value: "Ines Ortega" },
    { label: "Year", value: "2025" },
    { label: "Role", value: "Design and build" },
    { label: "Built with", value: "Framer, a custom CMS" },
  ],
};

/** An image: what it shows (alt), the line under it, and its own size, so its frame has its shape before it loads. */
type Photo = LightboxItem & { id: string; caption: string; width: number; height: number };

const HERO: Photo = { id: "dusk", src: plate("darkslateblue", "lightsalmon", "dimgray", "darkslategray"), alt: "A violet dusk going salmon at the horizon, over grey hills", caption: "Dusk, the series' first frame", width: 1600, height: 1000 };

/** The series, in the carousel. */
const SERIES: Photo[] = [
  { id: "dawn", src: plate("lightsteelblue", "mistyrose", "slategray", "darkslategray"), alt: "Dawn over two ridges, the sky pale blue going pink", caption: "Dawn over the ridge", width: 1600, height: 1000 },
  { id: "dune", src: plate("peachpuff", "navajowhite", "peru", "sienna"), alt: "Dunes at noon, a ridge of shadow across the middle", caption: "Dunes at noon", width: 1600, height: 1000 },
  { id: "tide", src: plate("steelblue", "lightblue", "cadetblue", "darkslategray"), alt: "A blue evening over a dark shore", caption: "Tide line", width: 1600, height: 1000 },
  { id: "fog", src: plate("gainsboro", "whitesmoke", "darkgray", "dimgray"), alt: "Fog over two grey ridges, the light flat and white", caption: "Fog bank", width: 1600, height: 1000 },
  { id: "valley", src: plate("honeydew", "darkseagreen", "seagreen", "darkolivegreen"), alt: "A green valley under a pale sky", caption: "Valley", width: 1600, height: 1000 },
];

/** The details, in the grid: two upright, then one wide across both columns. */
const DETAILS: Photo[] = [
  { id: "valley-upright", src: plate("honeydew", "darkseagreen", "seagreen", "darkolivegreen", 1200, 1500), alt: "The valley, cropped upright for a phone", caption: "The same frame, cropped for a phone", width: 1200, height: 1500 },
  { id: "dune-upright", src: plate("peachpuff", "navajowhite", "peru", "sienna", 1200, 1500), alt: "The dunes, cropped upright for a phone", caption: "Crops are set by hand, per frame", width: 1200, height: 1500 },
  { id: "tide-wide", src: plate("steelblue", "lightblue", "cadetblue", "darkslategray", 2000, 900), alt: "The tide line at evening, as a panorama", caption: "Panoramas run the full width of the grid", width: 2000, height: 900 },
];

/** The next project, at the end. */
const NEXT = { name: "Halo site", note: "The studio site, on Framer with a custom CMS.", href: "/work/halo" };

/* Every image, in page order: the hero, the series, then the details. The lightbox runs through them all. */
const ALL: Photo[] = [HERO, ...SERIES, ...DETAILS];
const FIRST_IN_SERIES = 1;

/* ----------------------------------------------------------------- the page */

/** One section of the story: its label in a narrow left column and the text at a reading measure beside it. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="grid gap-1 @min-[48rem]:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] @min-[48rem]:gap-12">
      <h2 id={id} className="text-h4 text-fg">
        {title}
      </h2>
      <div className="grid max-w-[65ch] gap-4 text-reading text-fg-muted">{children}</div>
    </section>
  );
}

export function CaseStudy() {
  const page = useRef<HTMLElement>(null);
  const seriesId = useId();
  const detailsId = useId();
  const [open, setOpen] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);

  /* The buttons that open the lightbox are in page order, the same order as ALL. */
  const opener = (i: number) => page.current?.querySelectorAll<HTMLElement>("[aria-haspopup=dialog]")[i];

  return (
    <article ref={page} className="@container mx-auto grid w-full max-w-5xl gap-12">
      <header className="grid gap-6">
        <Breadcrumb label="Where this page is" items={PROJECT.trail} />
        {/* The title and its line as one sentence in two inks; the h1 stays the name alone. */}
        <div className="flex flex-wrap items-baseline gap-x-2 text-h1 text-balance">
          <h1 className="text-fg">{PROJECT.name}</h1>
          <p className="font-normal text-fg-muted">{PROJECT.line}</p>
        </div>
      </header>

      {/* The image the page opens on loads at once; every other one waits until it is near the screen. */}
      <Media src={HERO.src} alt={HERO.alt} ratio="16/9" priority onOpen={() => setOpen(0)} />

      <dl className="grid grid-cols-2 gap-x-8 gap-y-6 border-y border-line py-6 @min-[48rem]:grid-cols-4">
        {PROJECT.facts.map((fact) => (
          <div key={fact.label} className="grid content-start gap-1">
            <dt className="text-caption text-fg-subtle">{fact.label}</dt>
            <dd className="text-small text-fg">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <Section title="The brief">
        <p>
          Ines shoots long series of one place, often over a year. Her old site showed them as a wall of thumbnails, so
          nobody saw a series in order and nobody saw a frame at size.
        </p>
        <p>She wanted the work first, in the order she made it, and a site she could update herself between shoots.</p>
      </Section>

      <section aria-labelledby={seriesId} className="grid gap-6">
        <div className="grid gap-1">
          <h2 id={seriesId} className="text-h4 text-fg">
            The series
          </h2>
          <p className="max-w-[65ch] text-small text-fg-subtle">Each series opens on its first frame at full width, and the next one is always in view.</p>
        </div>
        <Carousel label="The series" index={slide} onIndexChange={setSlide}>
          <CarouselContent>
            {SERIES.map((image, i) => (
              <CarouselItem key={image.id} label={image.caption}>
                <Media src={image.src} alt={image.alt} ratio="16/9" caption={image.caption} onOpen={() => setOpen(FIRST_IN_SERIES + i)} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselControls />
        </Carousel>
      </section>

      <Section title="The grid">
        <p>
          One column on a phone and two from a tablet up, with every crop set by hand, so a horizon never lands under a
          caption. The frames keep their shape while they load, so the page never jumps as you read.
        </p>
      </Section>

      <section aria-labelledby={detailsId} className="grid gap-6">
        <h2 id={detailsId} className="sr-only">
          Details
        </h2>
        <ul className="grid gap-6 @min-[36rem]:grid-cols-2">
          {DETAILS.map((image, i) => (
            <li key={image.id} className={image.width > image.height ? "@min-[36rem]:col-span-2" : ""}>
              <Media
                src={image.src}
                alt={image.alt}
                ratio={image.width / image.height}
                caption={image.caption}
                onOpen={() => setOpen(FIRST_IN_SERIES + SERIES.length + i)}
              />
            </li>
          ))}
        </ul>
      </section>

      <Section title="Next">
        <Card cover="inset" className="max-w-sm">
          <CardCover>
            <ProjectCover name="landing" />
          </CardCover>
          <CardBody>
            <CardTitle>
              <CardLink href={NEXT.href}>{NEXT.name}</CardLink>
            </CardTitle>
            <CardDescription>{NEXT.note}</CardDescription>
          </CardBody>
        </Card>
      </Section>

      <Lightbox
        label={PROJECT.name}
        items={ALL}
        index={open}
        onIndexChange={(i) => {
          setOpen(i);
          /* The carousel follows the lightbox through the series, so it is on the right slide when it closes. */
          if (i !== null && i >= FIRST_IN_SERIES && i < FIRST_IN_SERIES + SERIES.length) setSlide(i - FIRST_IN_SERIES);
        }}
        returnFocus={opener}
      />
    </article>
  );
}
