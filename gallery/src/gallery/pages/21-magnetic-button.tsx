import { useState } from "react";
import { MagneticButton } from "@/components/magnetic-button";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "magnetic-button",
  title: "Magnetic button",
  lede: "A button with a little gravity.",
  order: 1.002,
  group: "Actions",
  verbs: ["press", "hover"],
  worlds: ["flat"],
  summary:
    "The view's one ink pill with a little gravity: as a pointer comes near, the pill leans toward it and its words ride half as far again, then it springs home when the pointer leaves. It belongs to Flat.",
  tiers: ["instant", "responsive", "expressive"],
  mechanism:
    "Bring the pointer within 150px of the pill and it leans toward the pointer by a third of the distance, following on the responsive spring with no bounce; the pull is measured from where the pill rests, so it never chases itself. Move away and it springs home on Flat's expressive spring, overshooting a little and settling. A press scales it to 97% on the instant tier. A touch has no hover, so the pill stays put, and under reduced motion it never moves.",
};

export const docs: PageDocs = {
  components: ["magnetic-button"],
  exports: ["MagneticButton"],
  usage: `import { MagneticButton } from "@/components/magnetic-button";

<MagneticButton pressed={subscribed} onClick={() => setSubscribed((s) => !s)}>
  {subscribed ? "Subscribed" : "Subscribe"}
</MagneticButton>`,
  use: [
    "The one action a page is for, on a page with room around it: Subscribe on a newsletter's page, Read the letter at the end of a post.",
    "A toggle that should feel inviting, with pressed for its on state.",
  ],
  skip: [
    "Another world's page. MagneticButton belongs to Flat's ink pill and bounce, and needs data-material=\"flat\" on <html>.",
    "A row of actions, a toolbar or a form's buttons. Use Button: a pull on every button is noise.",
    "Anywhere a button sits near other targets, where the lean could put it under the pointer meant for its neighbour.",
  ],
  keyboard: [
    [["Tab"], "Moves focus to the pill. Focus never moves it."],
    [["Enter", "Space"], "Presses it."],
  ],
  a11y: [
    "A native button; pressed sets aria-pressed, so a toggle says Subscribed or not.",
    "The lean follows a mouse or a pen only. A touch, a keyboard and reduced motion leave the pill where it is.",
    "The ink pill's words are the paper's color on the ink, well past 4.5:1 in light and dark.",
  ],
};

const ARROW = (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8h10m0 0L9 4m4 4-4 4" />
  </svg>
);
const CHECK = (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m3.5 8.5 3 3 6-7" />
  </svg>
);

/** A newsletter's sign-up: the reader count is the figure, and Subscribe is the one ink action. */
function SundayLetterDemo() {
  const [on, setOn] = useState(false);
  const readers = 1203 + (on ? 1 : 0);
  return (
    <div data-part="paper" className="litt-paper grid w-full max-w-sm min-w-0 justify-items-center rounded-surface bg-surface-1 px-6 pt-8 pb-7 text-center text-fg forced-colors:border">
      <span className="text-body font-label">The Sunday letter</span>
      <span className="mt-2.5 text-figure-lg tabular-nums">{readers.toLocaleString("en-US")}</span>
      <p className="m-0 mt-1 text-small text-fg-muted">readers get it every week</p>
      <div className="mt-5 px-7 py-1.5">
        <MagneticButton pressed={on} onClick={() => setOn((v) => !v)}>
          {on ? <>Subscribed {CHECK}</> : <>Subscribe {ARROW}</>}
        </MagneticButton>
      </div>
      <p className="sr-only" aria-live="polite">
        {on ? "Subscribed. You're reader 1,204." : ""}
      </p>
    </div>
  );
}

function ReadDemo() {
  return <MagneticButton strength={0.25}>Read the letter {ARROW}</MagneticButton>;
}

export default function MagneticButtonPage() {
  return (
    <Page meta={meta} docs={docs} tile={<SundayLetterDemo />}>
      <Stage
        title="The Sunday letter"
        tier="expressive"
        code="SundayLetterDemo"
        caption="Bring the pointer near Subscribe and it leans toward you; move away and it springs home with a little bounce. Subscribing counts you in."
      >
        <SundayLetterDemo />
      </Stage>

      <Stage
        title="A gentler pull"
        tier="responsive"
        code="ReadDemo"
        caption="strength sets how far it leans: a quarter of the distance here, at the end of a post."
      >
        <ReadDemo />
      </Stage>

      <TryIt
        of="MagneticButton"
        component={MagneticButton}
        props={{ children: "Subscribe", strength: 0.35, reach: 150 }}
        controls={["children", "pressed", { name: "strength", type: "number", min: 0, max: 0.6, step: 0.05 }, { name: "reach", type: "number", min: 40, max: 300, step: 10 }]}
      />
    </Page>
  );
}
