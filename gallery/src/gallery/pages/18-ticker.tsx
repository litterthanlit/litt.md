import { useEffect, useRef } from "react";
import { Ticker, useTicker, type TickerInput } from "@/components/ticker";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "ticker",
  title: "Ticker",
  lede: "One quiet line of site updates, with a colored dot for each severity and keyboard stepping.",
  order: 9.07,
  group: "Feedback",
  verbs: ["watch", "press"],
  worlds: ["flat"],
  summary:
    "A single pill strip on a white paper card holding one notice at a time: a colored status dot for info, warning or alert, the update text, and a quiet tabular position count. Pressing the strip or using the arrow keys steps through queued updates without timers or extra controls. It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "When the strip first enters view, the pill and status dot settle once on the expressive spring (350ms) and rest still. Stepping forward or back swaps the message line vertically on the same spring while the status dot shifts hue to match the notice's severity, and a polite status region announces each newly shown notice once. Hovering or focusing marks the strip paused for live queues. Under reduced motion the arrival and vertical slide are skipped and notices swap at once.",
};

export const docs: PageDocs = {
  components: ["ticker"],
  exports: ["Ticker", "useTicker"],
  usage: `import { Ticker, useTicker } from "@/components/ticker";

const ticker = useTicker({
  initial: [
    { text: "Issue 15 published to 1,420 readers", tone: "info" },
    { text: "Two images still uploading", tone: "warn" },
  ],
});

<Ticker controller={ticker} label="Site updates" />`,
  use: [
    "A compact single-line feed of recent site, newsletter or publishing updates under Flat.",
    "Status updates with distinct info, warning and alert severities that readers can step through at their own pace.",
  ],
  skip: [
    "Another world's page. Ticker is built from Flat's paper card, pill strip and data hues; it needs data-material=\"flat\" on <html>.",
    "Multiple notices that need body copy, timestamps and individual dismissal. Use ToastStack.",
    "A blocking problem that requires immediate action before continuing. Use Callout or Dialog.",
  ],
  keyboard: [
    [["Tab"], "Moves focus into and out of the ticker strip as one tab stop."],
    [["ArrowRight", "Enter", "Space"], "Steps forward to the next notice, wrapping to the first."],
    [["ArrowLeft"], "Steps back to the previous notice, wrapping to the last."],
    [["Home", "End"], "Jumps to the first or last notice in the queue."],
  ],
  a11y: [
    "The strip exposes role=\"group\" with aria-roledescription=\"ticker\", a clear label, and a single tab stop.",
    "Changing or pushing a notice announces the severity prefix, text and queue position once in a polite status region.",
    "Severity never relies on color alone: warnings and alerts announce their prefix and carry plain descriptive text, and forced colors outlines both the card and strip.",
    "Under reduced motion nothing springs or slides; notices replace each other at once.",
  ],
};

const SITE_UPDATES: TickerInput[] = [
  { text: "Issue 15 published to 1,420 readers", tone: "info" },
  { text: "Draft saved · Coast at dusk", tone: "info" },
  { text: "Two images still uploading", tone: "warn" },
  { text: "Custom domain check needs attention", tone: "alert" },
];

const EXTRA_INFO = [
  "Issue 16 outline synced",
  "18 new readers joined today",
  "Archive index refreshed",
];

const EXTRA_WARN = [
  "Two images still uploading",
  "Scheduled send is 10 minutes away",
  "Alt text missing on one photo",
];

const EXTRA_ALERT = [
  "Custom domain check needs attention",
  "Reply address failed verification",
  "Image upload timed out",
];

function SiteUpdatesDemo() {
  return <Ticker messages={SITE_UPDATES} label="Site updates" className="max-w-md" />;
}

const QUEUE_BUTTON =
  "litt-target relative inline-flex h-control-sm cursor-pointer items-center rounded-pill bg-surface-1 px-3 text-caption font-normal text-fg select-none " +
  "transition-colors duration-(--dur-instant) ease-litt hover:bg-(--block-hover) [-webkit-tap-highlight-color:transparent] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border";

function QueueNoticesDemo() {
  const ticker = useTicker({ initial: [SITE_UPDATES[0]!] });
  const counts = useRef({ info: 0, warn: 0, alert: 0 });

  const pushInfo = () => {
    const text = EXTRA_INFO[counts.current.info % EXTRA_INFO.length]!;
    counts.current.info += 1;
    ticker.push(text, { tone: "info" });
  };

  const pushWarn = () => {
    const text = EXTRA_WARN[counts.current.warn % EXTRA_WARN.length]!;
    counts.current.warn += 1;
    ticker.push(text, { tone: "warn" });
  };

  const pushAlert = () => {
    const text = EXTRA_ALERT[counts.current.alert % EXTRA_ALERT.length]!;
    counts.current.alert += 1;
    ticker.push(text, { tone: "alert" });
  };

  return (
    <div className="grid w-full max-w-md min-w-0 gap-3">
      <Ticker controller={ticker} label="Queued site updates" />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" data-part="pill" onClick={pushInfo} className={QUEUE_BUTTON}>
          Add update
        </button>
        <button type="button" data-part="pill" onClick={pushWarn} className={QUEUE_BUTTON}>
          Add warning
        </button>
        <button type="button" data-part="pill" onClick={pushAlert} className={QUEUE_BUTTON}>
          Add alert
        </button>
      </div>
    </div>
  );
}

function ReplayTicker() {
  const { reduced } = useMotionDial();
  const ticker = useTicker({
    initial: reduced ? [SITE_UPDATES[0]!, SITE_UPDATES[2]!, SITE_UPDATES[3]!] : [SITE_UPDATES[0]!],
    initialIndex: reduced ? 2 : 0,
  });
  const pushRef = useRef(ticker.push);
  pushRef.current = ticker.push;

  useEffect(() => {
    if (reduced) return;
    const t1 = window.setTimeout(() => pushRef.current(SITE_UPDATES[2]!.text, { tone: "warn" }), 320);
    const t2 = window.setTimeout(() => pushRef.current(SITE_UPDATES[3]!.text, { tone: "alert" }), 980);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [reduced]);

  return <Ticker controller={ticker} label="Replayed updates" className="max-w-md" />;
}

export const study: PageStudy = {
  object: <Ticker messages={SITE_UPDATES} label="Site updates" className="max-w-md" />,
  parts: [
    { name: "The strip", selector: "[data-part=pill]" },
    { name: "The status dot", selector: "[data-part=circle]" },
    { name: "The message", selector: "[data-part=pill] > div [data-part=lettering]" },
    { name: "The position", selector: "[data-part=pill] > [data-part=lettering]" },
  ],
  states: {
    default: <Ticker messages={SITE_UPDATES} label="Default updates" className="max-w-md" />,
    error: <Ticker messages={[SITE_UPDATES[3]!, SITE_UPDATES[2]!]} label="Alert updates" className="max-w-md" />,
    empty: <Ticker messages={[]} label="Empty updates" emptyLabel="All caught up" className="max-w-md" />,
  },
  replay: {
    label: "Replay new notices",
    caption: "Watch a warning and then an alert arrive in turn as the status dot shifts hue.",
    run: () => <ReplayTicker />,
  },
};

export default function TickerPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      study={study}
      tile={<Ticker messages={SITE_UPDATES} label="Site updates" className="max-w-sm" />}
    >
      <Stage
        title="Site updates"
        tier="expressive"
        code="SiteUpdatesDemo"
        caption="Four site and newsletter notices on one strip. Press the strip or use the arrow keys to step through them."
      >
        <SiteUpdatesDemo />
      </Stage>

      <Stage
        title="Queue notices"
        tier="expressive"
        code="QueueNoticesDemo"
        caption="Push live updates, warnings or alerts through useTicker and step back through the queue."
      >
        <QueueNoticesDemo />
      </Stage>

      <TryIt
        of="Ticker"
        component={Ticker}
        props={{ messages: SITE_UPDATES, label: "Site updates", emptyLabel: "All caught up", className: "max-w-md" }}
        controls={["label", "emptyLabel"]}
      />
    </Page>
  );
}
