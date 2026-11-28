import { useState } from "react";
import { HoldConfirm } from "@/components/hold-confirm";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";
import { useSelfRun } from "../self-run";

export const meta: PageMeta = {
  id: "hold-confirm",
  title: "Hold to confirm",
  lede: "Hold the button until it fills; let go early and nothing happens.",
  order: 1.06,
  group: "Actions",
  verbs: ["press", "watch"],
  worlds: ["flat"],
  summary:
    "A destructive action that asks for intent: a draft on a white paper, and a grey pill that fills with the ink from the left while you hold it. Let go early and the ink runs back; hold to the end and the pill turns into Undo. It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "Holding the pill (by pointer, touch, or Space and Enter) grows the ink across it from the left, its words turning to paper as the ink passes. Letting go early runs the ink back. Full, it stays lit a moment, then turns into the done line and an ink Undo pill, the draft's name struck through, and announces once. Undo brings the draft back, rising in on the expressive spring. Under reduced motion a single click or key press confirms.",
};

export const docs: PageDocs = {
  components: ["hold-confirm"],
  exports: ["HoldConfirm"],
  usage: `import { HoldConfirm } from "@/components/hold-confirm";

<HoldConfirm
  eyebrow="Draft"
  title="Spring issue"
  readyNote="412 words, edited Tuesday"
  doneNote="Draft deleted"
  actionLabel="Hold to delete"
/>`,
  use: [
    "Deleting a draft, unpublishing a post or clearing an archive, where a brief hold prevents an accidental tap.",
    "Actions that can be undone right after, so Undo can stand in for a confirmation dialog.",
  ],
  skip: [
    "Another world's page. HoldConfirm belongs to Flat's grey ground, white paper and ink pill, and needs data-material=\"flat\" on <html>.",
    "Everyday actions that can simply run on a click. Use Button.",
    "Irreversible account deletion where a typed confirmation is needed. Use Dialog.",
  ],
  keyboard: [
    [["Tab"], "Moves focus to the pill, or to Undo once confirmed."],
    [["Space", "Enter"], "Hold to fill the pill and confirm; release early to cancel. Under reduced motion, a single press confirms."],
  ],
  a11y: [
    "The pill is a native button named by its words and the item, and described by how long to hold it.",
    "Pointer capture and the keyboard share one hold, and reduced motion turns the hold into a single press.",
    "Focus moves to Undo once the pill turns, and back to the pill after Undo.",
    "Letting go early, confirming and undoing each announce once in a polite status region.",
  ],
};

function DeleteDraftDemo() {
  return <HoldConfirm />;
}

function UnpublishDemo() {
  return (
    <HoldConfirm
      eyebrow="Post"
      title="Notes on grey"
      readyNote="Published Monday, 318 readers"
      doneNote="Post unpublished"
      actionLabel="Hold to unpublish"
      doneLabel="Unpublished"
      duration={900}
    />
  );
}

/** On Flat's wall the pill is held to the end, then undone, again and again, until a hand arrives. */
function HoldTile() {
  const [rehearse, setRehearse] = useState(0);
  const run = useSelfRun((n) => setRehearse(n + 1), { every: 2800, first: 1000 });
  return (
    <div ref={run.ref} className="grid w-full justify-items-center">
      <HoldConfirm rehearse={rehearse} />
    </div>
  );
}

export default function HoldConfirmPage() {
  return (
    <Page meta={meta} docs={docs} tile={<HoldTile />}>
      <Stage
        title="Delete a draft"
        tier="expressive"
        caption="Hold the pill until the ink fills it; let go early and it runs back. Undo brings the draft back."
        code="DeleteDraftDemo"
      >
        <DeleteDraftDemo />
      </Stage>

      <Stage
        title="Short hold"
        tier="expressive"
        caption="A shorter hold for an action that is quick to take back, like unpublishing a post."
        code="UnpublishDemo"
      >
        <UnpublishDemo />
      </Stage>

      <TryIt
        of="HoldConfirm"
        component={HoldConfirm}
        props={{
          eyebrow: "Draft",
          title: "Spring issue",
          actionLabel: "Hold to delete",
          duration: 1200,
        }}
        controls={[
          "eyebrow",
          "title",
          "actionLabel",
          { name: "duration", type: "number", min: 400, max: 3000, step: 100 },
        ]}
      />
    </Page>
  );
}
