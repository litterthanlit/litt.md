import { Insights } from "@/blocks/insights";
import { DeviceProvider } from "@/motion";
import { Page, Stage, useReplay, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "insights",
  title: "Insights",
  lede: "Inbox and build insights, in the data colors.",
  order: 18.7, group: "Data",
  verbs: ["hover"],
  summary:
    "The studio's inbox and build insights, built from the data-color parts: a dot plot of reply times, a bar list of shortcuts, a mail rule, a voice pad, a deploy timeline, a credits gauge and a heatmap of the credits by day. Each hue means one thing in its panel, the deploy stays in the quiet foreground, and Create rule is the one accent fill in the view.",
  tiers: ["instant", "responsive"],
  block: "insights",
};

function InsightsDemo() {
  return <Insights />;
}

function PhoneDemo() {
  return (
    <div className="mx-auto w-full max-w-sm">
      <div
        role="region"
        aria-label="Insights, phone"
        tabIndex={0}
        className={
          "h-176 overflow-y-auto overscroll-contain rounded-surface bg-canvas p-4 outline-1 -outline-offset-1 outline-line " +
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
        }
      >
        <DeviceProvider mode="phone">
          <Insights />
        </DeviceProvider>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const [key, replay] = useReplay();
  return (
    <Page meta={meta}>
      <Stage
        title="The studio this fortnight"
        tier="responsive"
        size="lg"
        align="start"
        code="InsightsDemo"
        onReplay={replay}
        caption="Seven panels, one idea each. Color carries data and nothing else: blue is a reply within the goal, violet a press of a shortcut, amber the Finance label and teal the credits, in the gauge and in the heatmap alike. The deploy and the credit meters need no hue, so they stay in the quiet foreground. The panels are raised and flat, with no glass and no shadow, and Create rule is the one accent fill. The dot plot fades in once on the responsive tier; nothing else moves on its own."
      >
        <InsightsDemo key={key} />
      </Stage>

      <Stage
        title="On a phone"
        tier="instant"
        align="start"
        code="PhoneDemo"
        caption="The same panels in one column. The grid measures itself, so the frame is enough to stack it. The bar list keeps its rails aligned, the months of credits scroll sideways inside their own box and start at today, and the token field folds its senders until you tap it."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
