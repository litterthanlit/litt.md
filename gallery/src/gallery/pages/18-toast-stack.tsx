import { ToastStack, type StackNotice } from "@/components/toast-stack";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "toast-stack",
  title: "Toast stack",
  lede: "Notifications that tuck away and fan out when you look.",
  order: 1.08,
  group: "Feedback",
  verbs: ["press", "select"],
  worlds: ["flat"],
  summary:
    "A site's notifications under the ink pill that sends them: white paper notices, the newest in front and older ones tucked behind it. Hover, focus or a tap fans them out at their real heights; each one is dismissed with a grey circle. It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "Tucked, each older notice sits 12px behind the one in front and a step smaller. Hovering, focusing or tapping the stack fans every notice out at its real height on Flat's expressive spring. A new notice grows out of the Send pill on the same spring; a dismissed one leaves upward on a short ease-out with no bounce. Nothing arrives, leaves or times out on its own, and every arrival and dismissal announces once.",
};

export const docs: PageDocs = {
  components: ["toast-stack"],
  exports: ["ToastStack"],
  usage: `import { ToastStack } from "@/components/toast-stack";

<ToastStack />`,
  use: [
    "Collecting two or three recent save, publish or reader notices without cluttering the corner of the screen.",
    "Letting a reader glance at the latest notice and fan out the stack only when they want older ones.",
  ],
  skip: [
    "Another world's page. ToastStack belongs to Flat's grey ground and white paper notices, and needs data-material=\"flat\" on <html>.",
    "A single transient confirmation after one button press. Use Toast.",
    "An error that blocks work until resolved. Use Callout or Dialog.",
  ],
  keyboard: [
    [["Tab"], "Moves to Send notification, then to the front notice's dismiss button; focus in the stack fans it out, so Tab goes on across every notice's dismiss."],
    [["Enter", "Space"], "Sends a new notice, or dismisses the focused one."],
  ],
  a11y: [
    "The notices live in a region named Notifications; each dismiss button names the notice it dismisses.",
    "Notices past the visible count are inert until one in front is dismissed; while the stack is tucked only the front notice's dismiss is in reach, and focus on it fans the stack out.",
    "Dismissing the focused notice moves focus to the one now in front, or back to Send when none is left.",
    "Sending and dismissing announce once in a polite status region.",
  ],
};

function SiteNoticesDemo() {
  return <ToastStack />;
}

const ONE_NOTICE: StackNotice[] = [{ id: "only-1", title: "Draft saved", body: "Spring issue, 412 words.", time: "Just now" }];

function OneNoticeDemo() {
  return <ToastStack defaultNotices={ONE_NOTICE} />;
}

export default function ToastStackPage() {
  return (
    <Page meta={meta} docs={docs} tile={<ToastStack />}>
      <Stage
        title="Site notices"
        tier="expressive"
        caption="Send a notification to watch it grow out of the pill; hover or tap the stack to fan it out."
        code="SiteNoticesDemo"
      >
        <SiteNoticesDemo />
      </Stage>

      <Stage
        title="One notice, with its time"
        tier="expressive"
        caption="Starts with one notice; each one you send tucks the older ones behind it."
        code="OneNoticeDemo"
      >
        <OneNoticeDemo />
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
