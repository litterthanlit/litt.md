import { useEffect, useState } from "react";
import { Poll, type PollOption } from "@/components/poll";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "poll",
  title: "Poll",
  lede: "A reader poll whose Candy share bars spring open on Flat's bounce.",
  order: 9.04,
  group: "Data",
  verbs: ["select"],
  worlds: ["flat"],
  summary:
    "One question and a stack of paper pills on grey. Each choice carries its own Candy data dot in R7's order; picking a choice springs every share bar open from the left on Flat's 0.28 expressive bounce and shows the total votes as one standing 40px figure. Pressing another choice moves your vote at once, and pressing your pick takes it back. It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "Each option is a native button with aria-pressed. On vote, a full-height tinted layer in the choice's Candy data hue scales from zero to its share along X on Flat's expressive spring (350ms, bounce 0.28). Percentage and vote count appear in ink words beside the label, and a polite live region announces the updated vote. Under reduced motion the bars land at their share at once.",
};

export const docs: PageDocs = {
  components: ["poll"],
  exports: ["Poll"],
  usage: `import { Poll } from "@/components/poll";

<Poll
  question="Which series for Issue 15?"
  options={[
    { id: "coast", label: "Coast at dusk", votes: 84, hue: "blue" },
    { id: "greenhouse", label: "Greenhouse notes", votes: 52, hue: "teal" },
    { id: "trains", label: "Morning trains", votes: 39, hue: "bubblegum" },
  ]}
/>`,
  use: [
    "A light reader question in a post, newsletter issue or portfolio site under Flat.",
    "Two to six clear options where seeing everyone else's share is part of the answer.",
  ],
  skip: [
    "Another world's page. Poll uses Flat's pills, standing figure and Candy hues; it needs data-material=\"flat\" on <html>.",
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
  { id: "coast", label: "Coast at dusk", votes: 84, hue: "blue" },
  { id: "greenhouse", label: "Greenhouse notes", votes: 52, hue: "teal" },
  { id: "trains", label: "Morning trains", votes: 39, hue: "bubblegum" },
  { id: "books", label: "Books on the desk", votes: 21, hue: "amber" },
];

const READING_TIME: PollOption[] = [
  { id: "morning", label: "With morning coffee", votes: 112, hue: "amber" },
  { id: "commute", label: "On the train", votes: 68, hue: "sky" },
  { id: "evening", label: "Before bed", votes: 46, hue: "violet" },
];

function ReaderPollDemo() {
  return (
    <Poll
      question="Which series for Issue 15?"
      options={NEXT_ISSUE}
      defaultValue="coast"
      note="Closes Thursday at 18:00 · click any pill to change your vote."
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
      note="Pick a choice to reveal how everyone else reads."
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
    { name: "The Candy dot", selector: "[data-part=circle]" },
    { name: "The share bar", selector: "[data-part=bubble]" },
  ],
  states: {
    default: <Poll question="Which series for Issue 15?" options={NEXT_ISSUE.slice(0, 3)} defaultValue="coast" className="max-w-md" />,
    empty: <Poll question="When do you read the letter?" options={READING_TIME} showFigure={false} className="max-w-md" />,
  },
  replay: {
    label: "Replay the vote",
    caption: "Watch the Candy share bars spring open on Flat's 0.28 bounce the moment a choice is picked.",
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
        caption="Four choices on grey, each in its own Candy data hue. Pick any pill to move your vote, or press your choice again to clear it."
      >
        <ReaderPollDemo />
      </Stage>
      <Stage
        title="Before voting"
        tier="expressive"
        code="UnvotedPollDemo"
        caption="With no default value, the choices wait as plain paper pills until a hand picks one, then the shares bounce open."
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
