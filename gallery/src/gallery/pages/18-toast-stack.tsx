import { ToastStack, type StackNotice } from "@/components/toast-stack";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "toast-stack",
  title: "Toast stack",
  lede: "Stacked paper notices that fan out on hover, focus, or tap.",
  order: 1.08,
  group: "Feedback",
  verbs: ["press", "select"],
  worlds: ["flat"],
  summary:
    "Recent notices tucked behind the newest card with a gentle peek; hover, focus, or tap Fan out to spread every card apart with clear air, dismiss individual notices, or drop a new notice onto the top of the deck. It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "Collapsed, older paper cards scale slightly down and tuck 12px behind the front notice. Hovering the stack or tapping Fan out expands every notice to full height on Flat's expressive spring. Each notice pairs a frameless colored status dot with its title, detail line, timestamp and dismiss button, and every addition or dismissal announces once.",
};

export const docs: PageDocs = {
  components: ["toast-stack"],
  exports: ["ToastStack"],
  usage: `import { ToastStack } from "@/components/toast-stack";

<ToastStack />`,
  use: [
    "Collecting two or three recent save, publish, or reply confirmations without cluttering the corner of the screen.",
    "Letting a reader glance at the latest notice and fan out the stack only when they want older updates.",
  ],
  skip: [
    "Another world's page. ToastStack belongs to Flat's grey ground and floating paper notices, and needs data-material=\"flat\" on <html>.",
    "A single transient confirmation after one button press. Use Toast.",
    "An error that blocks work until resolved. Use Callout or Dialog.",
  ],
  keyboard: [
    [["Tab"], "Moves across the front notice's dismiss button (all notices when fanned out), Fan out / Stack, and Add notice."],
    [["Enter", "Space"], "Dismisses a notice, toggles the fanned-out stack, or adds a new notice to the top."],
  ],
  a11y: [
    "The notice list lives in a named region; Fan out exposes aria-expanded and aria-controls.",
    "Hidden back cards leave the tab order while collapsed and rejoin as soon as the stack fans out.",
    "Adding, dismissing and restoring notices announce once in a polite status region.",
  ],
};

function PublishingNoticesDemo() {
  return <ToastStack />;
}

const SINGLE_NOTICE: StackNotice[] = [
  {
    id: "only-1",
    title: "Draft saved",
    body: "Issue 15 synced cleanly to your workspace.",
    time: "Just now",
    hue: "teal",
  },
];

function QuietDeckDemo() {
  return <ToastStack defaultNotices={SINGLE_NOTICE} />;
}

export default function ToastStackPage() {
  return (
    <Page meta={meta} docs={docs} tile={<ToastStack />}>
      <Stage
        title="Stacked notices"
        tier="expressive"
        caption="Hover or tap Fan out to spread the paper cards apart, dismiss any notice, or add a fresh one on top."
        code="PublishingNoticesDemo"
      >
        <PublishingNoticesDemo />
      </Stage>

      <Stage
        title="Single notice"
        tier="expressive"
        caption="Starts as one quiet notice; add more to see them tuck neatly behind the newest card."
        code="QuietDeckDemo"
      >
        <QuietDeckDemo />
      </Stage>

      <TryIt
        of="ToastStack"
        component={ToastStack}
        props={{ visible: 3 }}
        controls={[{ name: "visible", type: "number", min: 1, max: 5, step: 1 }]}
      />
    </Page>
  );
}
