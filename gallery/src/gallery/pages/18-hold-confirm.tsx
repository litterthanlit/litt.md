import { HoldConfirm } from "@/components/hold-confirm";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "hold-confirm",
  title: "Hold to confirm",
  lede: "A press-and-hold publishing card that warms as you hold and offers one-tap undo.",
  order: 1.06,
  group: "Actions",
  verbs: ["press", "watch"],
  worlds: ["flat"],
  summary:
    "An intentional action framed on a white paper card: press and hold the pill for a moment and one ink bar fills alongside a live percentage readout. Letting go early rewinds smoothly; holding to the end confirms and offers Undo. It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "Holding the primary ink pill (by pointer, touch, or Space and Enter) fills one ink bar and a live 28px percentage readout. Releasing early rewinds smoothly to zero; completing 100% swaps in a settled confirmation with a one-tap Undo pill and announces the outcome once. Under reduced motion, a single click or key press confirms directly.",
};

export const docs: PageDocs = {
  components: ["hold-confirm"],
  exports: ["HoldConfirm"],
  usage: `import { HoldConfirm } from "@/components/hold-confirm";

<HoldConfirm
  eyebrow="Newsletter"
  title="Publish Issue 15"
  readyNote="Ready · 1,204 subscribers"
  doneNote="Sent to 1,204 subscribers"
/>`,
  use: [
    "Sending a newsletter issue, publishing a post, or clearing a draft where a brief hold prevents an accidental tap.",
    "Actions that benefit from live progress feedback and an immediate Undo without opening a modal dialog.",
  ],
  skip: [
    "Another world's page. HoldConfirm belongs to Flat's grey ground, paper card and ink bar, and needs data-material=\"flat\" on <html>.",
    "Everyday actions that can simply run on a click. Use Button.",
    "Irreversible account deletion where a typed confirmation is needed. Use Dialog.",
  ],
  keyboard: [
    [["Tab"], "Moves focus to the primary hold pill, or to Undo once confirmed."],
    [["Space", "Enter"], "Hold to fill the bar and confirm; release early to cancel. Under reduced motion, a single press confirms."],
  ],
  a11y: [
    "The bar exposes role=\"progressbar\" with live aria-valuenow and aria-valuetext.",
    "Pointer capture and keyboard hold handlers share the same state machine, and reduced motion collapses the hold to a single press.",
    "Cancelling, confirming and undoing each announce once in a polite status region.",
  ],
};

function PublishIssueDemo() {
  return <HoldConfirm />;
}

function ClearArchiveDemo() {
  return (
    <HoldConfirm
      eyebrow="Drafts"
      title="Clear 14 old notes"
      readyNote="Ready · 14 archived drafts"
      doneNote="Cleared 14 archived drafts"
      actionLabel="Hold to clear"
      holdingLabel="Clearing…"
      doneLabel="Cleared"
      duration={900}
    />
  );
}

export default function HoldConfirmPage() {
  return (
    <Page meta={meta} docs={docs} tile={<HoldConfirm />}>
      <Stage
        title="Publish an issue"
        tier="expressive"
        caption="Hold the button to fill the bar and send; let go early to rewind, or tap Undo once sent."
        code="PublishIssueDemo"
      >
        <PublishIssueDemo />
      </Stage>

      <Stage
        title="Short hold"
        tier="expressive"
        caption="Shorter duration for routine housekeeping like clearing archived notes."
        code="ClearArchiveDemo"
      >
        <ClearArchiveDemo />
      </Stage>

      <TryIt
        of="HoldConfirm"
        component={HoldConfirm}
        props={{
          eyebrow: "Newsletter",
          title: "Publish Issue 15",
          actionLabel: "Hold to publish",
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
