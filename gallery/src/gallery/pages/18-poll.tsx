import { useEffect, useState } from "react";
import { Poll, type PollOption } from "@/components/poll";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "poll",
  title: "Poll",
  lede: "A question for your readers, with everyone's share once they vote.",
  order: 9.04,
  group: "Data",
  verbs: ["select"],
  worlds: ["flat"],
  summary:
    "One question and its choices as pills. Once a reader picks one, every choice shows its share as a bar and the total votes stand above them as one large number. Choosing another moves the vote at once, and choosing the same one again takes it back. It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "Each option is a native button with aria-pressed. On a vote, a full-height quiet ink layer grows from zero to its share along X on the expressive spring (350ms). Percentage and vote count appear in ink words beside the label, and a polite live region announces the updated vote. Under reduced motion the bars land at their share at once.",
};

export const docs: PageDocs = {
  components: ["poll"],
  exports: ["Poll"],
  usage: `import { Poll } from "@/components/poll";

<Poll
  question="Which series for Issue 15?"
  options={[
    { id: "coast", label: "Coast at dusk", votes: 84 },
    { id: "greenhouse", label: "Greenhouse notes", votes: 52 },
    { id: "trains", label: "Morning trains", votes: 39 },
  ]}
/>`,
  use: [
    "A light reader question in a post, newsletter issue or portfolio site under Flat.",
    "Two to six clear options where seeing everyone else's share is part of the answer.",
  ],
  skip: [
    "Another world's page. Poll is drawn in Flat's pills and large figure; it needs data-material=\"flat\" on <html>.",
    "A form setting that submits with other fields. Use RadioGroup or CardPicker.",
    "A single binary choice. Use Switch or Button.",
  ],
  keyboard: [
    [["Tab"], "Moves between the choices."],
    [["Enter", "Space"], "Votes for the focused choice, or removes your vote if already picked."],
  ],
  a11y: [
    "Every choice is a native button with aria-pressed and a readable percentage and vote count once revealed.",
    "Voting announces the choice, percentage and vote count once in a polite status region.",
    "Color never carries selection alone: your pick shows a check mark and bold ink label, and forced colors outlines it in Highlight.",
    "Under reduced motion the share bars appear at their final width with no spring overshoot.",
  ],
};

const NEXT_ISSUE: PollOption[] = [
  { id: "coast", label: "Coast at dusk", votes: 84 },
  { id: "greenhouse", label: "Greenhouse notes", votes: 52 },
  { id: "trains", label: "Morning trains", votes: 39 },
  { id: "books", label: "Books on the desk", votes: 21 },
];

const READING_TIME: PollOption[] = [
  { id: "morning", label: "With morning coffee", votes: 112 },
  { id: "commute", label: "On the train", votes: 68 },
  { id: "evening", label: "Before bed", votes: 46 },
];

function ReaderPollDemo() {
  return (
    <Poll
      question="Which series for Issue 15?"
      options={NEXT_ISSUE}
      defaultValue="coast"
      note="Closes Thursday at 18:00. You can change your vote until then."
      className="max-w-md"
    />
  );
}

function UnvotedPollDemo() {
  return (
    <Poll
      question="When do you read the Friday letter?"
      options={READING_TIME}
      showFigure={false}
      note="Pick one to see when everyone else reads it."
      className="max-w-md"
    />
  );
}

function ReplayPoll() {
  const { reduced } = useMotionDial();
  const [picked, setPicked] = useState<string | null>(reduced ? "coast" : null);
  useEffect(() => {
    if (reduced) return;
    const timer = window.setTimeout(() => setPicked("coast"), 300);
    return () => window.clearTimeout(timer);
  }, [reduced]);
  return <Poll question="Which series for Issue 15?" options={NEXT_ISSUE} value={picked} onVote={setPicked} className="max-w-md" />;
}

export const study: PageStudy = {
  object: <Poll question="Which series for Issue 15?" options={NEXT_ISSUE.slice(0, 3)} defaultValue="coast" className="max-w-md" />,
  parts: [
    { name: "The question", selector: "header > p:first-child" },
    { name: "The figure", selector: "[data-part=figure]" },
    { name: "A choice pill", selector: "button[data-part=pill]" },
    { name: "The share bar", selector: "[data-part=bubble]" },
  ],
  states: {
    default: <Poll question="Which series for Issue 15?" options={NEXT_ISSUE.slice(0, 3)} defaultValue="coast" className="max-w-md" />,
    empty: <Poll question="When do you read the letter?" options={READING_TIME} showFigure={false} className="max-w-md" />,
  },
  replay: {
    label: "Replay the vote",
    caption: "Watch every share open the moment a choice is picked.",
    run: () => <ReplayPoll />,
  },
};

export default function PollPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      study={study}
      tile={<Poll question="Which series for Issue 15?" options={NEXT_ISSUE.slice(0, 3)} defaultValue="coast" className="max-w-sm" />}
    >
      <Stage
        title="Reader poll"
        tier="expressive"
        code="ReaderPollDemo"
        caption="Four choices. Choose another to move your vote, or choose yours again to clear it."
      >
        <ReaderPollDemo />
      </Stage>
      <Stage
        title="Before voting"
        tier="expressive"
        code="UnvotedPollDemo"
        caption="Before anyone has voted here, the choices wait as plain pills. Once a reader picks one, every share opens."
      >
        <UnvotedPollDemo />
      </Stage>
      <TryIt
        of="Poll"
        component={Poll}
        props={{ question: "Which series for Issue 15?", options: NEXT_ISSUE, showFigure: true, showResults: false, className: "max-w-md" }}
        controls={[
          { name: "showFigure", type: "boolean" },
          { name: "showResults", type: "boolean" },
        ]}
      />
    </Page>
  );
}
