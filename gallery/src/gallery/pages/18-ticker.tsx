import { useRef, useState } from "react";
import { Button } from "@/components/button";
import { Ticker, type TickerMessage } from "@/components/ticker";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";
import { useSelfRun } from "../self-run";

export const meta: PageMeta = {
  id: "ticker",
  title: "Ticker",
  lede: "Notifications on one line that types itself.",
  order: 1.002,
  group: "Feedback",
  verbs: ["watch", "press"],
  worlds: ["flat"],
  summary:
    "Notifications as one line: a white pill on the grey ground that types each message as it arrives, with how many there are and two grey circles to step through them. A message that fits stays a moment; a long one slides with its caret, holds at its end and glides back. A warning leads with Heads up and an alert with Alert, in words. A hand pauses it. It belongs to Flat.",
  tiers: ["instant", "responsive", "expressive"],
  mechanism:
    "Nothing moves on load: messages already there show whole. A new one gives the pill a little pop on Flat's expressive spring and types on at 42 characters a second behind a caret. A message that fits stays two seconds and a little per character, then the next takes its place; a long one keeps the caret in view as it types, holds a second at its end, and glides back to its start on the responsive spring when nothing comes after it. Hover, focus or a press holds everything where it is. Under reduced motion each message shows whole and nothing slides.",
};

export const docs: PageDocs = {
  components: ["ticker"],
  exports: ["Ticker"],
  usage: `import { Ticker } from "@/components/ticker";

// Append to messages as notifications arrive; the line types each new one.
<Ticker messages={[{ id: 1, text: "Draft saved" }, { id: 2, text: "Storage is 88% full", tone: "warn" }]} />`,
  use: [
    "A site's or an app's small notifications in one place that never covers the page: saves, comments, a quota running low.",
    "Where the newest thing matters most and older ones can wait behind the arrows.",
  ],
  skip: [
    "Another world's page. Ticker belongs to Flat's grey ground and white pill, and needs data-material=\"flat\" on <html>.",
    "Something that needs an action or a decision. Use a toast with an action, or a dialog.",
    "One confirmation after a press. Use Toast.",
  ],
  keyboard: [
    [["Tab"], "Moves focus to the line, which holds it still."],
    [["←", "→"], "Steps to the previous or next notification."],
    [["Home", "End"], "Goes to the first or last notification."],
  ],
  a11y: [
    "The line is a group named Notifications and described by the current message in full, with its place in the queue (\"Notification 2 of 4: Heads up: Storage is 88% full\").",
    "Each new message is said once in a polite status; the typing is hidden from a screen reader.",
    "A warning or an alert says so in words before the message, so the tone never rests on a colour.",
    "Hover, focus or a press holds it still (WCAG 2.2.2), and leaving goes on from where it was.",
    "Under reduced motion each message shows whole and nothing types or slides.",
  ],
};

const ARRIVALS: Omit<TickerMessage, "id">[] = [
  { text: "Draft saved" },
  { text: "Zoë left 2 comments" },
  { text: "Storage is 88% full", tone: "warn" },
  { text: "Your site is over its plan. Upgrade to keep publishing new posts", tone: "alert" },
];
const SAMPLES: Omit<TickerMessage, "id">[] = [
  { text: "Issue 05 is scheduled" },
  { text: "12 new readers this week" },
  { text: "Your domain renews in 3 days", tone: "warn" },
  { text: "Backup done" },
  { text: "A post failed to publish", tone: "alert" },
  ...ARRIVALS,
];
/** The most messages a demo keeps, oldest dropped first. */
const LIMIT = 9;

function useQueue(start: Omit<TickerMessage, "id">[] = []) {
  const next = useRef(start.length);
  const [messages, setMessages] = useState<TickerMessage[]>(() => start.map((m, i) => ({ ...m, id: i })));
  const push = (m: Omit<TickerMessage, "id">) => setMessages((all) => [...all, { ...m, id: next.current++ }].slice(-LIMIT));
  return { messages, push, clear: () => setMessages([]) };
}

/** Notify me sends the next sample; Clear all empties the line. */
function NotifyDemo() {
  const q = useQueue(ARRIVALS.slice(0, 2));
  const sample = useRef(0);
  return (
    <div className="grid w-full max-w-lg justify-items-center gap-4">
      <Ticker messages={q.messages} />
      <div className="flex gap-2">
        <Button onClick={() => q.push(SAMPLES[sample.current++ % SAMPLES.length]!)}>Notify me</Button>
        <Button variant="secondary" onClick={q.clear} disabled={!q.messages.length}>
          Clear all
        </Button>
      </div>
    </div>
  );
}

/** On Flat's wall the site reports in by itself, four notifications a moment apart, then starts over, until a hand arrives. */
function TickerTile() {
  const q = useQueue();
  const run = useSelfRun(
    (n) => {
      const beat = n % (ARRIVALS.length + 3);
      if (beat < ARRIVALS.length) q.push(ARRIVALS[beat]!);
      else if (beat === ARRIVALS.length + 2) q.clear();
    },
    { every: 2600, first: 400 },
  );
  return (
    <div ref={run.ref} className="grid w-full justify-items-center">
      <Ticker messages={q.messages} />
    </div>
  );
}

function TonesDemo() {
  return (
    <div className="grid w-full max-w-lg gap-3">
      <Ticker messages={[{ id: "a", text: "Backup done" }]} />
      <Ticker messages={[{ id: "b", text: "Your domain renews in 3 days", tone: "warn" }]} />
      <Ticker messages={[{ id: "c", text: "A post failed to publish", tone: "alert" }]} />
      <Ticker messages={[]} />
    </div>
  );
}

export default function TickerPage() {
  return (
    <Page meta={meta} docs={docs} tile={<TickerTile />}>
      <Stage
        title="Site notifications"
        tier="expressive"
        code="NotifyDemo"
        caption="Press Notify me and the pill gives a little as a new message types itself on; a long one slides with its caret, holds at its end and glides back. Hover or focus the line to hold it, and use the circles or the arrow keys to step through the queue."
      >
        <NotifyDemo />
      </Stage>

      <Stage title="Tones, and nothing to say" tier="instant" code="TonesDemo" caption="A warning leads with Heads up and an alert with Alert, in words. With no messages the line says you're all caught up.">
        <TonesDemo />
      </Stage>

      <TryIt of="Ticker" component={Ticker} props={{ messages: ARRIVALS.map((m, i) => ({ ...m, id: i })) }} controls={["label", "emptyLabel"]} />
    </Page>
  );
}
