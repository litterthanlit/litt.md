import { CaseStudy } from "@/blocks/case-study";
import { AppFrame, Page, Stage, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "case-study",
  title: "Case study",
  lede: "One project, told as a page.",
  order: 30.97,
  group: "Blocks",
  verbs: ["press", "drag", "open"],
  summary:
    "One project told as a page: where it sits, the title in two inks, a wide hero image, the facts in a row, the story with its labels in a narrow left column, the series in a carousel, the details in a grid and the next project as one linked card. Every image opens the lightbox on itself and the lightbox runs through them all in page order; the carousel follows it, so closing lands on the right slide. Opening the lightbox is the page's one expressive moment.",
  tiers: ["instant", "responsive", "expressive"],
  block: "case-study",
};

function DesktopDemo() {
  return (
    <AppFrame label="Case study, desktop">
      <CaseStudy />
    </AppFrame>
  );
}

function PhoneDemo() {
  return (
    <AppFrame label="Case study, phone" phone>
      <CaseStudy />
    </AppFrame>
  );
}

export default function CaseStudyPage() {
  return (
    <Page meta={meta}>
      <Stage
        title="Desktop"
        tier="expressive"
        size="lg"
        align="start"
        code="DesktopDemo"
        caption="Scroll the page. The hero loads at once and every other image waits until it is near; each frame keeps its shape, so nothing jumps. The story's labels sit in a narrow left column with the text at a reading measure beside them. Press any image: the lightbox opens on it and runs through every image on the page in order. Move through the series there and the carousel follows behind, so closing lands on that slide with focus on it."
      >
        <DesktopDemo />
      </Stage>

      <Stage
        title="On a phone"
        tier="expressive"
        size="lg"
        align="start"
        code="PhoneDemo"
        caption="One column. The facts go two by two, the labels sit above their text, the carousel shows one image and a peek, and the upright details stack. In the lightbox a finger swipes between images, and Previous and Next move under the caption."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
