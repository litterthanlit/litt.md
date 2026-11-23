import { useEffect, useState } from "react";
import { Streak, type StreakSlot } from "@/components/streak";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "streak",
  title: "Streak",
  lede: "How long you have kept something going, such as a weekly letter sent or days read.",
  order: 9.05,
  group: "Data",
  verbs: ["watch"],
  worlds: ["flat"],
  summary:
    "How many weeks or days a run has lasted, on a white paper: the count as one large number with a status word beside it, and a pill for each week or day below. Each one done is the ink and a missed one stays grey. The current one is outlined until you log it, and logging it again takes it back. It belongs to Flat.",
  tiers: ["responsive", "expressive"],
  mechanism:
    "Done pills are the ink and missed ones the grey bubble. The current slot is a native button with aria-pressed, drawn as a 1.5px outline while open; logging it fills it with the ink and pops it back from the press on the expressive spring (350ms), and taking it back settles on the responsive spring with no bounce. The figure counts on without moving, and a polite status region announces the new streak. Reduced motion updates at once.",
};

export const docs: PageDocs = {
  components: ["streak"],
  exports: ["Streak"],
  usage: `import { Streak } from "@/components/streak";

<Streak
  label="Friday letter"
  unit={["week", "weeks"]}
  actionLabel="Send Issue 14"
  slots={[
    { label: "W9", done: true, detail: "Issue 9 sent" },
    { label: "W10", done: true, detail: "Issue 10 sent" },
    { label: "W11", done: true, detail: "Issue 11 sent" },
    { label: "W12", done: true, detail: "Issue 12 sent" },
    { label: "W13", done: true, detail: "Issue 13 sent" },
    { label: "W14", done: false, detail: "Issue 14 ready", current: true },
  ]}
/>`,
  use: [
    "A recurring site, newsletter or reading habit under Flat: consecutive issues published, days read, drafts finished.",
    "A quiet reward where the run reads at a glance: a row of ink with no gaps.",
  ],
  skip: [
    "Another world's page. Streak is drawn in Flat's paper, pills and standing figure; it needs data-material=\"flat\" on <html>.",
    "A dense calendar of months of history. Use Heatmap.",
    "A live job or upload with a known percentage. Use Progress.",
  ],
  keyboard: [
    [["Tab"], "Moves focus to the current slot button."],
    [["Enter", "Space"], "Logs the current slot, or removes it if already logged."],
  ],
  a11y: [
    "The standing count, unit and status are plain text; the capsules sit in a labelled list with full labels.",
    "The interactive current slot is a native button with aria-pressed, and toggling announces the updated count once in a polite status.",
    "Status never relies on a shade alone: the figure, the status word and the line under the pills state the run in words.",
    "Under reduced motion the figure and capsule update at once with no spring.",
  ],
};

const ISSUES: StreakSlot[] = [
  { label: "W8", done: true, detail: "Issue 8 · Winter light" },
  { label: "W9", done: true, detail: "Issue 9 · Harbour walk" },
  { label: "W10", done: true, detail: "Issue 10 · Wet film" },
  { label: "W11", done: true, detail: "Issue 11 · Low tide" },
  { label: "W12", done: true, detail: "Issue 12 · Open water" },
  { label: "W13", done: true, detail: "Issue 13 · Dusk tide" },
  { label: "W14", done: false, detail: "Issue 14 · Spring series", current: true },
];

const READING_WEEK: StreakSlot[] = [
  { label: "Mon", done: true, detail: "Read 2 posts" },
  { label: "Tue", done: true, detail: "Read 1 post" },
  { label: "Wed", done: false, detail: "Skipped" },
  { label: "Thu", done: true, detail: "Read 3 posts" },
  { label: "Fri", done: true, detail: "Read Issue 14" },
  { label: "Sat", done: true, detail: "Read 1 post" },
  { label: "Sun", done: true, detail: "Read today", current: true },
];

function LetterCadenceDemo() {
  return <Streak label="Friday letter" unit={["week", "weeks"]} actionLabel="Send Issue 14" slots={ISSUES} className="max-w-md" />;
}

function ReadingWeekDemo() {
  return <Streak label="Reading this week" unit={["day", "days"]} actionLabel="Log Sunday" slots={READING_WEEK} className="max-w-md" />;
}

function ReplayStreak() {
  const { reduced } = useMotionDial();
  const [done, setDone] = useState(reduced);
  useEffect(() => {
    if (reduced) return;
    const timer = window.setTimeout(() => setDone(true), 350);
    return () => window.clearTimeout(timer);
  }, [reduced]);
  return <Streak label="Friday letter" unit={["week", "weeks"]} actionLabel="Send Issue 14" slots={ISSUES} checked={done} onToggle={setDone} className="max-w-md" />;
}

export const study: PageStudy = {
  object: <Streak label="Friday letter" unit={["week", "weeks"]} actionLabel="Send Issue 14" slots={ISSUES} className="max-w-md" />,
  parts: [
    { name: "The figure", selector: "[data-part=figure]" },
    { name: "The status", selector: "header > [data-part=lettering]" },
    { name: "A week done", selector: "[role=listitem] [data-part=pill]" },
    { name: "The open slot", selector: "[role=listitem] button" },
  ],
  states: {
    default: <Streak label="Friday letter" unit={["week", "weeks"]} actionLabel="Send Issue 14" slots={ISSUES} defaultChecked={false} className="max-w-md" />,
    pressed: <Streak label="Friday letter" unit={["week", "weeks"]} actionLabel="Send Issue 14" slots={ISSUES} defaultChecked className="max-w-md" />,
  },
  replay: {
    label: "Replay logging a week",
    caption: "Watch this week's pill fill with the ink and pop as the count goes from 6 to 7.",
    run: () => <ReplayStreak />,
  },
};

export default function StreakPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      study={study}
      tile={<Streak label="Friday letter" unit={["week", "weeks"]} actionLabel="Send Issue 14" slots={ISSUES} className="max-w-sm" />}
    >
      <Stage
        title="Friday letter cadence"
        tier="expressive"
        code="LetterCadenceDemo"
        caption="Six weeks sent in a row, each in ink. W14 is outlined until Issue 14 goes out."
      >
        <LetterCadenceDemo />
      </Stage>
      <Stage
        title="With a missed day"
        tier="expressive"
        code="ReadingWeekDemo"
        caption="A missed day stays grey, so the run counts only the days since."
      >
        <ReadingWeekDemo />
      </Stage>
      <TryIt
        of="Streak"
        component={Streak}
        props={{ label: "Friday letter", unit: ["week", "weeks"], actionLabel: "Send Issue 14", slots: ISSUES, className: "max-w-md" }}
        controls={[{ name: "checked", type: "boolean" }, { name: "actionLabel", type: "text" }]}
      />
    </Page>
  );
}
