import { Funnel } from "@/components/funnel";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "funnel",
  title: "Funnel",
  order: 17.45,
  group: "Data",
  summary:
    "How many went on at each step, as rows rather than a trapezoid: a thin rail per step filled to its share of the first, in one data hue, with the step-to-step share in words between them. It is static, like the meter.",
  tiers: [],
};

export const docs: PageDocs = {
  components: ["funnel"],
  exports: ["Funnel"],
  usage: `import { Funnel } from "@/components/funnel";

// The steps in the order people go through them. Every rail is measured against the first,
// the header ends with the overall conversion, and a line between steps says how many went on.
<Funnel
  label="Template store, this month"
  steps={[
    { label: "Visited", value: 18240 },
    { label: "Signed up", value: 6930 },
    { label: "Activated", value: 2840 },
    { label: "Paid", value: 748 },
  ]}
/>

// One hue for the whole funnel. unit is said after each number to screen readers: "2,410 people".
<Funnel
  label="Signup form"
  hue="teal"
  unit={["person", "people"]}
  steps={[
    { label: "Opened the form", value: 3120 },
    { label: "Entered an email", value: 2410 },
  ]}
/>

// Your own words between steps and at the end of the header.
<Funnel
  label="Trial to paid"
  overallText="81 upgraded"
  formatStep={(value, previous) => \`\${previous - value} left here\`}
  steps={[
    { label: "Started a trial", value: 420 },
    { label: "Upgraded", value: 81 },
  ]}
/>`,
  use: [
    "People go through steps in a fixed order and fewer reach each one: visited, signed up, activated, paid. The question is where they stop.",
    "Both views matter. The rail shows each step against the first, and the line between steps says how many of the step before went on.",
    "It sits in a dashboard row or a narrow panel. Rows fit any width, because the label truncates and the reading never does.",
    "A handful of steps, three to six. More than that and the small end gets too thin to read.",
  ],
  skip: [
    "A ranking of items by size, where the order is by value and not by step. Use a Bar list.",
    "The parts add up to one whole, such as storage by file type. Use a Breakdown.",
    "The rate over time is the question, such as conversion week by week. Use a Chart.",
    "One value against a limit. Use a Meter.",
  ],
  a11y: [
    "The steps are an ordered list named by the label. Each step is a list item with a meter named by its label, from 0 to the first step's value, with the value and its share as its text: \"Signed up, 6,930 people, 38% of 18,240\".",
    "The line between steps is plain text at the start of the next item, so it is read in order: \"38% continued\", then the step.",
    "The visible header and readings are hidden from assistive tech, and a hidden line says the overall conversion instead: \"Template store, this month, 4.1% overall: 748 of 18,240\". Nothing is read twice.",
    "Color is never the only signal. Every step has its label and its number, and the whole funnel is one hue, so the hue means one thing. The rail reaches 3:1 against the card in light and dark.",
    "Pass a unit, or a formatValue that writes one, so a screen reader hears \"6,930 people\" and not a bare number. A long label truncates, so keep the full name in the label.",
    "It has no hover, no focus stop and no motion, so touch loses nothing and there is nothing to reduce under reduced motion.",
  ],
};

function StoreDemo() {
  return (
    <Funnel
      className="w-full max-w-md"
      label="Template store, this month"
      steps={[
        { label: "Visited", value: 18240 },
        { label: "Signed up", value: 6930 },
        { label: "Activated", value: 2840 },
        { label: "Paid", value: 748 },
      ]}
    />
  );
}

function SignupDemo() {
  return (
    <Funnel
      className="w-full max-w-md"
      label="Studio signup form, last 30 days"
      hue="teal"
      unit={["person", "people"]}
      steps={[
        { label: "Opened the form", value: 3120 },
        { label: "Entered an email", value: 2410 },
        { label: "Picked a plan", value: 1380 },
        { label: "Confirmed the email", value: 1190 },
        { label: "Published a first site", value: 412 },
      ]}
    />
  );
}

function TileDemo() {
  return (
    <div className="litt-raised w-64 min-w-0 max-w-full rounded-surface p-4">
      <Funnel
        label="Trial to paid"
        hue="violet"
        steps={[
          { label: "Started a trial", value: 420 },
          { label: "Published a site", value: 236 },
          { label: "Connected a domain", value: 131 },
          { label: "Upgraded", value: 81 },
        ]}
      />
    </div>
  );
}

function EdgeDemo() {
  return (
    <div className="grid w-full max-w-3xl gap-12 sm:grid-cols-2">
      <Funnel
        label="Pricing page, counted twice"
        steps={[
          { label: "Visited", value: 1200 },
          { label: "Opened pricing", value: 1450 },
          { label: "Paid", value: 40 },
        ]}
      />
      <Funnel
        label="New template, launched today"
        steps={[
          { label: "Visited", value: 0 },
          { label: "Signed up", value: 0 },
          { label: "Paid", value: 0 },
        ]}
      />
    </div>
  );
}

export default function FunnelPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="A product funnel"
        code="StoreDemo"
        caption="Each step is a row in the Meter's anatomy: the label, the count and its share of the first step, and a 4px rail filled to that share. Between two steps a quiet line says how many of the step before went on, in words. The header ends with the overall conversion. The whole funnel is one hue, because it is one quantity. Nothing animates."
      >
        <StoreDemo />
      </Stage>

      <Stage
        title="Another hue and a unit"
        code="SignupDemo"
        caption="Pick the hue with hue, so the funnel matches the rest of its page. The unit is said after every number to screen readers, so a step reads as 2,410 people and not a bare number. Under 10% the shares keep one decimal, so the small end of a funnel still reads."
      >
        <SignupDemo />
      </Stage>

      <Stage
        title="In a tile"
        code="TileDemo"
        caption="The same rows in a raised box 16rem wide, as in a dashboard row. A long label truncates and the reading never does, so the numbers always line up at the end."
      >
        <TileDemo />
      </Stage>

      <Stage
        title="When the data is off"
        code="EdgeDemo"
        caption="A step larger than the one before still draws, held at 100% of the first, and its line says it is more than the step before rather than calling it a conversion. A funnel with nothing in its first step draws empty rails and no shares, because there is nothing to measure against."
      >
        <EdgeDemo />
      </Stage>
    </Page>
  );
}
