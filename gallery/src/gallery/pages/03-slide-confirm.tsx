import { useState } from "react";
import { Button } from "@/components/button";
import { SlideConfirm } from "@/components/slide-confirm";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "slide-confirm",
  title: "Slide to confirm",
  lede: "A deliberate yes to something that cannot be undone.",
  order: 3.95,
  group: "Controls",
  verbs: ["drag", "press"],
  summary:
    "A track and a thumb to slide to the end, for an action that cannot be undone, such as deleting a project on a phone. The thumb follows the finger one to one; let go early and it springs back on the responsive tier, reach the end and it confirms. The thumb is also a button, so Enter, Space or a screen reader confirms too.",
  fun: "Throw the thumb: with enough speed it coasts to the end, squashes against it and confirms.",
  tiers: ["responsive"],
};

export const docs: PageDocs = {
  components: ["slide-confirm"],
  exports: ["SlideConfirm"],
  usage: `import { SlideConfirm } from "@/components/slide-confirm";

<SlideConfirm
  label="Slide to delete Atelier Nord"
  confirmedLabel="Deleting Atelier Nord"
  onConfirm={() => deleteProject("atelier-nord")}
/>`,
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
    [["Esc"], "While dragging, sends the thumb back to the start."],
  ],
  a11y: [
    "The thumb is a real button named by the label, described by \"Drag the thumb to the end, or press Enter.\" A screen reader's activate confirms, because sliding is not a gesture it can make.",
    "A mouse click on the thumb does nothing on its own: only reaching the end, a key or assistive tech confirms, so the slide still guards against a stray press.",
    "Once it confirms, the thumb is disabled and a polite status says the confirmed label.",
    "The words in the track are hidden from screen readers, because the thumb's name already says them.",
    "Under reduced motion the thumb snaps back instead of springing.",
  ],
};

/** A quiet status line beside a control, so each stage shows what it did. */
function Status({ children }: { children: string }) {
  return (
    <p role="status" className="min-h-5 font-mono text-caption font-normal text-fg-subtle">
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

function PublishDemo() {
  return (
    <div className="grid w-full max-w-sm gap-6">
      <SlideConfirm size="lg" label="Slide to publish to marlowlabs.com" confirmedLabel="Publishing to marlowlabs.com" />
      <SlideConfirm label="Slide to cancel the Studio plan" disabled />
    </div>
  );
}

export default function SlideConfirmPage() {
  return (
    <Page meta={meta} docs={docs}>
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
        title="Sizes and disabled"
        tier="responsive"
        align="start"
        code="PublishDemo"
        caption="lg is 56 tall; md is 44, and grows to 56 on a coarse pointer, because a finger does the sliding. Disabled is flat, skipped by Tab and ignores the pointer; its words stay readable, because they still say what it would do."
      >
        <PublishDemo />
      </Stage>

      <TryIt of="SlideConfirm" component={SlideConfirm} props={{ label: "Slide to delete Atelier Nord", confirmedLabel: "Deleting Atelier Nord", className: "max-w-sm" }} controls={["label", "confirmedLabel", "size", "disabled"]} />
    </Page>
  );
}
