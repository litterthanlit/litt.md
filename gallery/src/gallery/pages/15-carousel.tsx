import { useRef, useState } from "react";
import { Card, CardBody, CardCover, CardDescription, CardLink, CardTitle } from "@/components/card";
import { Carousel, CarouselContent, CarouselControls, CarouselItem } from "@/components/carousel";
import { Lightbox } from "@/components/lightbox";
import { ProjectCover, type CoverName } from "@/components/list-cover";
import { Media } from "@/components/media";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";
import { SERIES } from "../plates";

export const meta: PageMeta = {
  id: "carousel",
  title: "Carousel",
  lede: "A row of slides that scrolls sideways.",
  order: 15.07,
  group: "Layout",
  verbs: ["drag", "press"],
  summary:
    "A row of slides that scrolls sideways with the browser's own scrolling and snaps each slide to the start edge. The next slide peeks at the end; the range is said in words and Previous and Next move a page. It never moves on its own: no autoplay, no loop. Buttons, keys and a mouse drag's release scroll smoothly, and under reduced motion they jump.",
  tiers: [],
};

export const docs: PageDocs = {
  components: ["carousel"],
  exports: ["Carousel", "CarouselContent", "CarouselItem", "CarouselControls", "useCarousel"],
  usage: `import { Carousel, CarouselContent, CarouselControls, CarouselItem } from "@/components/carousel";

// One slide at a time, the next one peeking. The controls say "3 of 12" and move a page.
<Carousel label="Atlas portfolio, screens">
  <CarouselContent>
    {screens.map((s) => (
      <CarouselItem key={s.id} label={s.name}>
        <Media src={s.src} alt={s.alt} ratio="16/9" caption={s.name} />
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselControls />
</Carousel>

// Three cards in a wide box, two in a middling one, one and a peek on a phone.
<Carousel label="Recent work" perView="three">…</Carousel>

// Slides of their own width.
<Carousel label="Filters" perView="auto">
  <CarouselContent>
    <CarouselItem className="w-64">…</CarouselItem>
  </CarouselContent>
</Carousel>

// Scroll it from outside, as a Lightbox does when it closes on another image.
const [slide, setSlide] = useState(0);
<Carousel label="Screens" index={slide} onIndexChange={setSlide}>…</Carousel>`,
  use: [
    "A set of images of one thing that people look through in order: the screens of a project, the views of a product.",
    "A strip of related cards under a section, such as recent work, when the page should not grow by a grid.",
    "Content that reads left to right and where it is fine that most of it starts out of view.",
  ],
  skip: [
    "Anything people must see. A slide out of view is a slide most people never reach: put key content in the page.",
    "Rotating banners or quotes. It never plays on its own, and a row of three statements is easier to read as a list.",
    "Cards people compare or scan. Use a grid that wraps, so every card is in view.",
    "A row of chips or tags that runs long. Use a Scroll area sideways, which keeps its scrollbar.",
  ],
  keyboard: [
    [["Tab"], "Moves to the track, then into what the slides hold, then to Previous and Next."],
    [["ArrowRight", "ArrowLeft"], "On the track: the next or previous slide. Right to left, the arrows swap."],
    [["Home", "End"], "On the track: the first or the last slide."],
    [["Enter", "Space"], "On Previous or Next: a page back or forward."],
  ],
  a11y: [
    "A region named by label, with aria-roledescription=\"carousel\". Each slide is a group with aria-roledescription=\"slide\" named \"3 of 12\", plus its label when you give one.",
    "Slides out of view are not hidden from screen readers or the keyboard: Tab into one and it scrolls into view.",
    "After a button or a key the new range is said once in a polite status, when the scroll has come to rest. A swipe says nothing.",
    "Previous and Next are named for what they do, control the track (aria-controls) and are disabled at the ends; a pressed button that becomes disabled hands its focus to the other one.",
    "It never moves on its own, so there is no pause button to add.",
    "Under reduced motion the buttons and keys jump to the slide instead of scrolling smoothly.",
  ],
};

function SeriesDemo() {
  return (
    <Carousel label="Thermal, film, fluid" className="w-full max-w-3xl">
      <CarouselContent>
        {SERIES.map((image) => (
          <CarouselItem key={image.id} label={image.name}>
            <Media src={image.src} srcSet={image.srcSet} sizes="(min-width: 48rem) 40rem, 90vw" alt={image.alt} ratio="16/9" caption={image.name} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselControls />
    </Carousel>
  );
}

const WORK: { id: string; name: string; note: string; cover: CoverName }[] = [
  { id: "halo", name: "Halo site", note: "The studio site, on Framer with a custom CMS.", cover: "landing" },
  { id: "northwind", name: "Northwind rebrand", note: "A new identity and the site that carries it.", cover: "identity" },
  { id: "atlas", name: "Atlas portfolio", note: "A photographer's portfolio on a tight grid.", cover: "type" },
  { id: "lumen", name: "Lumen docs", note: "Docs with search and versioned pages.", cover: "system" },
  { id: "kassa", name: "Kassa", note: "Cash, invoices and runway on one screen.", cover: "dashboard" },
  { id: "template", name: "Case study template", note: "A template for long case studies.", cover: "template" },
];

function CardsDemo() {
  return (
    <Carousel label="Recent work" perView="three" className="w-full">
      <CarouselContent>
        {WORK.map((work) => (
          <CarouselItem key={work.id} label={work.name}>
            <Card cover="inset" className="h-full">
              <CardCover>
                <ProjectCover name={work.cover} />
              </CardCover>
              <CardBody>
                <CardTitle>
                  <CardLink href="#carousel">{work.name}</CardLink>
                </CardTitle>
                <CardDescription>{work.note}</CardDescription>
              </CardBody>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselControls />
    </Carousel>
  );
}

function LightboxDemo() {
  const [slide, setSlide] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const slides = useRef<HTMLDivElement>(null);
  return (
    <div ref={slides} className="w-full max-w-3xl">
      <Carousel label="Thermal, film, fluid" perView="two" index={slide} onIndexChange={setSlide}>
        <CarouselContent>
          {SERIES.map((image, i) => (
            <CarouselItem key={image.id} label={image.name}>
              <Media src={image.src} srcSet={image.srcSet} sizes="(min-width: 48rem) 24rem, 90vw" alt={image.alt} ratio="4/3" onOpen={() => setOpen(i)} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselControls />
      </Carousel>
      <Lightbox
        label="Thermal, film, fluid"
        items={SERIES.map((image) => ({ src: image.src, srcSet: image.srcSet, alt: image.alt, caption: image.name, width: image.width, height: image.height }))}
        index={open}
        onIndexChange={(i) => {
          setOpen(i);
          /* The carousel follows behind, so closing lands on the slide of the image it closed on. */
          if (i !== null) setSlide(i);
        }}
        returnFocus={(i) => slides.current?.querySelectorAll<HTMLElement>("[aria-haspopup=dialog]")[i]}
      />
    </div>
  );
}

export default function CarouselPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="One at a time"
        size="lg"
        align="start"
        code="SeriesDemo"
        caption="One slide fills the box and the next peeks at the end, which is how it says there is more. Swipe, scroll sideways with a trackpad, drag with a mouse, or press Next: each slide comes to rest at the start edge. The range under it is in words, and nothing moves until you move it."
      >
        <SeriesDemo />
      </Stage>

      <Stage
        title="A strip of cards"
        size="lg"
        align="start"
        code="CardsDemo"
        caption="Three cards in a wide box, two in a middling one, one and a peek on a phone; the box decides, not the screen. Next moves a whole page, so the first card not wholly in view comes to the start, and the range reads 4 to 6 of 6. At the end Next is disabled and hands its focus to Previous."
      >
        <CardsDemo />
      </Stage>

      <Stage
        title="Opens a lightbox"
        size="lg"
        align="start"
        code="LightboxDemo"
        caption="Each slide is a Media that opens the Lightbox on its image. Move through the images there and the carousel follows behind, so closing lands on the slide you finished on, with focus on it."
      >
        <LightboxDemo />
      </Stage>
    </Page>
  );
}
