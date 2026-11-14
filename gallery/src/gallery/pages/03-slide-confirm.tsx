import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import { SlideConfirm } from "@/components/slide-confirm";
import { MaterialProvider, useMotionDial } from "@/motion";
import { useCustomize, useDark } from "../customize-state";
import { lookAttributes, BODY_WORLDS } from "../look";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "slide-confirm",
  title: "Slide to confirm",
  lede: "A deliberate yes to something that cannot be undone.",
  order: 3.95,
  group: "Controls",
  verbs: ["drag", "press"],
  summary:
    "A track and a thumb to slide to the end, for an action that cannot be undone, such as deleting a project on a phone. The thumb follows the finger one to one; let go early and it springs back on the responsive tier, reach the end and it confirms. The thumb is also a button, so Enter, Space or a screen reader confirms too, and with confirmText anyone who cannot drag can type the name instead.",
  fun: "Throw the thumb: with enough speed it coasts to the end, squashes against it and confirms.",
  tiers: ["responsive"],
  mechanism:
    "Press the cap and it follows the finger one to one, with no easing, while the words fade by its position and the part it has passed fills at fg 6%. Let go early and it springs home on the responsive tier, 200ms with no bounce. Reach the end and it confirms once: a check replaces the chevron and the words change. Enter and Space confirm too. Each world has its own body. Under Press a gripped cap rides in a slot cut into a plate, its words in the slot's floor, to a raised end stop. Under Flat the track is a grey pill and the thumb a plain ink circle, with the words in ink; once confirmed the whole pill turns ink. Under Device the thumb is a latch key pushed along a well to an end stop: the words sit on an LCD strip in the well, a lamp at the stop lights once it confirms, and a key let go short goes home in three steps on the instant tier, never a spring, though under your hand it still follows 1:1. Reduced motion snaps the thumb back in every body.",
};

export const docs: PageDocs = {
  components: ["slide-confirm"],
  exports: ["SlideConfirm"],
  usage: `import { SlideConfirm } from "@/components/slide-confirm";

<SlideConfirm
  label="Slide to delete Atelier Nord"
  confirmedLabel="Deleting Atelier Nord"
  onConfirm={() => deleteProject("atelier-nord")}
/>

// For a mouse or a pen that cannot drag: "Or type to confirm" under the track.
<SlideConfirm label="Slide to delete Atelier Nord" confirmText="Atelier Nord" onConfirm={…} />`,
  use: [
    "An action that cannot be undone, on a screen people use with a finger: deleting a project, cancelling a plan, publishing to a client's live domain.",
    "A confirmation inside a sheet or a card, where a second dialog would stack one surface on another.",
    "A place where a stray tap is likely, such as a phone in a pocket or a crowded toolbar.",
  ],
  skip: [
    "Anything that can be undone. Do it at once and offer Undo in a toast.",
    "A desktop form. A Dialog with the action named on its button is clearer for a mouse.",
    "The primary action of a view. It is a safeguard, not a call to action, so it never takes the accent.",
  ],
  keyboard: [
    [["Tab"], "Moves focus to the thumb."],
    [["Enter", "Space"], "Confirms. A key press is already deliberate."],
    [["Esc"], "While dragging, sends the thumb back to the start. In the typing field, closes it."],
    [["Enter"], "In the typing field, confirms once the words match."],
  ],
  a11y: [
    "The thumb is a real button named by the label, described by \"Drag the thumb to the end, or press Enter.\" A screen reader's activate confirms, because sliding is not a gesture it can make.",
    "A mouse click on the thumb does nothing on its own: only reaching the end, a key or assistive tech confirms, so the slide still guards against a stray press.",
    "With confirmText, \"Or type to confirm\" opens a labelled field and a danger button that waits for the exact words, so a mouse, a pen or a switch that cannot drag still has a way (WCAG 2.5.7). Pasting works.",
    "Once it confirms, the thumb is aria-disabled rather than disabled, so focus stays on it, and a polite status says the confirmed label.",
    "The words in the track are hidden from screen readers, because the thumb's name already says them.",
    "Under reduced motion the thumb snaps back instead of springing.",
  ],
};

function ReplayConfirm() {
  const { reduced } = useMotionDial();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const click = () => box.current?.querySelector("button")?.click();
    if (reduced) {
      click();
      return;
    }
    const t = setTimeout(click, 300);
    return () => clearTimeout(t);
  }, [reduced]);
  return (
    <div ref={box} className="w-full max-w-sm">
      <SlideConfirm label="Slide to delete Atelier Nord" confirmedLabel="Deleting Atelier Nord" />
    </div>
  );
}

export const study: PageStudy = {
  object: (
    <div className="w-full max-w-sm">
      <SlideConfirm label="Slide to delete Atelier Nord" confirmedLabel="Deleting Atelier Nord" />
    </div>
  ),
  parts: [
    { name: "The track", selector: "[data-no-drag]" },
    { name: "The slot", selector: "[data-no-drag] > span:first-child" },
    { name: "The words", selector: "[data-no-drag] > span:nth-child(2)" },
    { name: "The thumb", selector: "[data-no-drag] > button" },
    { name: "The grip", selector: "[data-no-drag] > button > span" },
  ],
  states: {
    default: (
      <div className="w-full max-w-sm">
        <SlideConfirm label="Slide to delete Atelier Nord" confirmedLabel="Deleting Atelier Nord" />
      </div>
    ),
    disabled: (
      <div className="w-full max-w-sm">
        <SlideConfirm label="Slide to delete Atelier Nord" confirmedLabel="Deleting Atelier Nord" disabled />
      </div>
    ),
  },
  replay: {
    label: "Replay the confirm",
    caption: "The track cannot be driven from outside, so it confirms by its keyboard path: the thumb jumps to the end with its check and the words change. Drag the thumb above to see the slide itself.",
    run: () => <ReplayConfirm />,
  },
};

/** A quiet status line beside a control, so each stage shows what it did. */
function Status({ children }: { children: string }) {
  return (
    <p role="status" className="min-h-5 text-caption font-normal text-fg-subtle">
      {children}
    </p>
  );
}

function DeleteProjectDemo() {
  const [round, setRound] = useState(0);
  const [said, setSaid] = useState("");
  return (
    <div className="grid w-full max-w-sm gap-4">
      <div className="grid gap-1">
        <p className="text-body font-title text-fg">Delete Atelier Nord</p>
        <p className="text-small text-fg-muted">The site, its 41 deploys and the atelier-nord.com domain go for good.</p>
      </div>
      <SlideConfirm
        key={round}
        label="Slide to delete Atelier Nord"
        confirmedLabel="Deleting Atelier Nord"
        onConfirm={() => setSaid("onConfirm ran: deleting atelier-nord")}
      />
      <div className="flex items-center justify-between gap-4">
        <Status>{said}</Status>
        <Button
          size="sm"
          variant="ghost"
          disabled={!said}
          onClick={() => {
            setRound((r) => r + 1);
            setSaid("");
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}

function TypeDemo() {
  const [round, setRound] = useState(0);
  const [said, setSaid] = useState("");
  return (
    <div className="grid w-full max-w-sm gap-4">
      <SlideConfirm
        key={round}
        label="Slide to delete Atelier Nord"
        confirmedLabel="Deleting Atelier Nord"
        confirmText="Atelier Nord"
        onConfirm={() => setSaid("onConfirm ran: deleting atelier-nord")}
      />
      <div className="flex items-center justify-between gap-4">
        <Status>{said}</Status>
        <Button
          size="sm"
          variant="ghost"
          disabled={!said}
          onClick={() => {
            setRound((r) => r + 1);
            setSaid("");
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}

function PublishDemo() {
  return (
    <div className="grid w-full max-w-sm gap-6">
      <SlideConfirm size="lg" label="Slide to publish to marlowlabs.com" confirmedLabel="Publishing to marlowlabs.com" />
      <SlideConfirm label="Slide to cancel the Studio plan" disabled />
    </div>
  );
}

function ThreeBodiesDemo() {
  const { look } = useCustomize();
  const dark = useDark();
  return (
    <div className="grid w-full gap-6 md:grid-cols-3">
      {BODY_WORLDS.map((m) => (
        <figure key={m.id} className="m-0 grid min-w-0 content-start gap-3">
          <div
            {...lookAttributes({ accent: look.accent, material: m.id }, dark)}
            className="grid min-h-56 min-w-0 content-center gap-6 rounded-surface bg-canvas p-8 text-fg outline-1 -outline-offset-1 outline-line"
          >
            <MaterialProvider material={m.id}>
              <SlideConfirm label="Slide to delete Atelier Nord" confirmedLabel="Deleting Atelier Nord" />
              <SlideConfirm label="Slide to cancel the Studio plan" disabled />
            </MaterialProvider>
          </div>
          <figcaption className="text-caption text-fg-muted">{m.name}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export default function SlideConfirmPage() {
  return (
    <Page meta={meta} docs={docs} study={study}>
      <Stage
        title="Delete a project"
        tier="responsive"
        align="start"
        code="DeleteProjectDemo"
        caption="Drag the thumb. It follows the pointer one to one and the words fade as it goes; the part it has passed fills at fg 6%. Let go before the end and it springs back on the responsive tier, with no bounce. Reach the end and it stays there with a check, and onConfirm runs once. Tab to the thumb and press Enter to confirm by key; a mouse click alone does nothing."
      >
        <DeleteProjectDemo />
      </Stage>

      <Stage
        title="Or type to confirm"
        tier="responsive"
        align="start"
        code="TypeDemo"
        caption="confirmText adds a quiet link under the track for anyone who cannot drag. It opens a field labelled with the words to type and a danger button that waits until they match exactly. The button or Enter confirms the same way the slide does: the thumb moves to the end with its check and onConfirm runs once. Esc closes the field."
      >
        <TypeDemo />
      </Stage>

      <Stage
        title="Sizes and disabled"
        tier="responsive"
        align="start"
        code="PublishDemo"
        caption="lg is 56 tall; md is 44, and grows to 56 on a coarse pointer, because a finger does the sliding. Disabled is flat, skipped by Tab and ignores the pointer; its words stay readable, because they still say what it would do."
      >
        <PublishDemo />
      </Stage>

      <Stage
        title="Three bodies"
        tier="instant"
        caption="One track, one contract, three bodies. Press is a plate with a slot cut into it: a gripped cap rides in the slot to a raised end stop, its words in the slot's floor. Flat is a plain ink circle in a grey pill with its words in ink, and the whole pill turns ink once it confirms. Device is a latch key pushed along a well to an end stop, its words on an LCD strip and a lamp at the stop that lights once it confirms; let go short and the key goes home in three steps, not on a spring. Each is drawn here whatever look the page is in; the props, the keyboard and what a screen reader hears are the same in all three."
        code="ThreeBodiesDemo"
      >
        <ThreeBodiesDemo />
      </Stage>

      <TryIt of="SlideConfirm" component={SlideConfirm} props={{ label: "Slide to delete Atelier Nord", confirmedLabel: "Deleting Atelier Nord", className: "max-w-sm" }} controls={["label", "confirmedLabel", "confirmText", "size", "disabled"]} />
    </Page>
  );
}
