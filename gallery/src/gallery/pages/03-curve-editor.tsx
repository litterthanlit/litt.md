import { useState } from "react";
import { CurveEditor, toCubicBezier, type CubicBezier } from "@/components/curve-editor";
import { Segmented } from "@/components/segmented";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "curve-editor",
  title: "Curve editor",
  lede: "An easing shaped by hand, as a cubic Bézier.",
  order: 3.915,
  group: "Controls",
  verbs: ["drag"],
  summary:
    "An easing shaped by hand, as a cubic Bézier. Two round caps pull the curve from its start and its end, with an arm from each end to its handle, on a well that shows progress from -0.25 to 1.25 so a curve can pull back or pass its end. Under it the curve is written as CSS and said in words, and a dot crosses a rail on it when you let go. The handles follow the pointer and the keys at once, with no easing.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["curve-editor"],
  exports: ["CurveEditor"],
  usage: `import { useState } from "react";
import { CurveEditor, toCubicBezier, type CubicBezier } from "@/components/curve-editor";

const [ease, setEase] = useState<CubicBezier>([0.2, 0.7, 0.3, 1]);

<CurveEditor
  label="Hero exit"
  value={ease}
  onValueChange={setEase}
  onValueCommit={(c) => saveEase(toCubicBezier(c))}
  defaultMark={[0.2, 0.7, 0.3, 1]}
  duration={480}
/>`,
  use: [
    "Someone tunes an easing for their own work: a Framer site's scroll reveal, a CSS transition in a template, a slide in a deck. The value is the four numbers of cubic-bezier(), so it pastes into CSS, Motion and Framer.",
    "The person should see and feel the curve, not type four numbers. The words under the well say what it does, and the dot crosses on it when they let go.",
    "There is a sensible default. Pass defaultMark so its curve shows dashed under the one being edited; a double-click goes back to it.",
    "Save on release. Use onValueCommit, not onValueChange, which fires on every move.",
  ],
  skip: [
    "A spring. Springs are time and bounce; use Spring editor.",
    "Your own interface's motion. litt's easings are tokens, and its components read the tiers from the motion hooks, never from an editor.",
    "A few named easings. Use Segmented and keep the curves in code.",
    "Keyframes or steps(). A cubic Bézier is one curve from start to end.",
  ],
  keyboard: [
    [["Tab"], "Moves between the start handle and the end handle, one stop each."],
    [["←", "→"], "Moves the focused handle in time by 0.01."],
    [["↑", "↓"], "Moves the focused handle in progress by 0.01."],
    [["Shift + arrow"], "Moves ten steps."],
    [["Page Up", "Page Down"], "Moves the handle in progress by 0.1."],
    [["Home", "End"], "Takes the handle to the start or the end of time."],
  ],
  a11y: [
    "Each handle has two visually hidden range inputs, its time and its progress, named \"Start handle, time\" and so on, and described by the label, the CSS under the well and the help text. A screen reader gets four sliders and the arrow keys.",
    "Two tab stops, one per handle: the time input is in the tab order and the progress input is skipped by Tab, as on the Pad, but a screen reader can still reach it.",
    "Every input's value text says where its handle is and what the curve feels like: \"Start handle at time 0.2, progress 0.7. Starts quick and eases into place.\"",
    "The CSS and the words under the well change with the curve, so it never lives in the drawing alone (R5). The arms, the ends and the dot are for eyes and hidden from screen readers.",
    "A press on a handle takes it where it was taken; a press elsewhere sends the nearer handle there. The well captures the pointer and is marked data-no-drag, and touch-action none keeps the page still under the finger.",
    "The dot crosses on the curve being edited, because feeling it is the point; under reduced motion it lands at once. Nothing else moves.",
  ],
};

/* The person's own easings, shown as starting points. They are content being edited, never litt's motion. */
const PRESETS: { value: string; label: string; curve: CubicBezier }[] = [
  { value: "out", label: "Ease out", curve: [0.2, 0.7, 0.3, 1] },
  { value: "in-out", label: "In and out", curve: [0.65, 0, 0.35, 1] },
  { value: "back", label: "Overshoot", curve: [0.3, 1.4, 0.5, 1] },
];

function ExitDemo() {
  const [curve, setCurve] = useState<CubicBezier>([0.2, 0.7, 0.3, 1]);
  const preset = PRESETS.find((p) => p.curve.every((n, i) => n === curve[i]));
  return (
    <div className="grid w-full max-w-sm gap-4">
      <Segmented
        legend="Start from"
        size="sm"
        block
        options={PRESETS.map(({ value, label }) => ({ value, label }))}
        value={preset?.value ?? ""}
        onValueChange={(v) => setCurve(PRESETS.find((p) => p.value === v)!.curve)}
      />
      <CurveEditor
        label="Hero exit on the Atelier Nord site"
        help="Plays for 480ms when the visitor scrolls past the hero."
        value={curve}
        onValueChange={setCurve}
        defaultMark={PRESETS[0].curve}
        duration={480}
      />
    </div>
  );
}

function BackDemo() {
  const [curve, setCurve] = useState<CubicBezier>([0.4, -0.2, 0.5, 1.2]);
  return (
    <div className="grid w-full max-w-sm gap-3">
      <CurveEditor label="Logo bounce" value={curve} onValueChange={setCurve} height={240} preview />
      <p className="text-small text-fg-subtle">
        In a CSS transition: <code className="font-mono text-caption text-fg-muted">transition: transform 480ms {toCubicBezier(curve)}</code>
      </p>
    </div>
  );
}

function DisabledDemo() {
  return (
    <div className="w-full max-w-sm">
      <CurveEditor disabled label="Slide easing" help="Locked: the deck is being presented." defaultValue={[0.25, 0.1, 0.25, 1]} />
    </div>
  );
}

/* ---------- the overview's tile ---------- */

function CurveTile() {
  const [curve, setCurve] = useState<CubicBezier>([0.2, 0.7, 0.3, 1]);
  return (
    <div className="w-full max-w-sm">
      <CurveEditor label="Hero exit" value={curve} onValueChange={setCurve} height={144} preview={false} />
    </div>
  );
}

export default function CurveEditorPage() {
  return (
    <Page meta={meta} docs={docs} tile={<CurveTile />}>
      <Stage
        title="A hero's exit"
        tier="instant"
        code="ExitDemo"
        size="lg"
        caption="Take a handle and drag it, or press anywhere and the nearer handle comes to you. The curve, its arms and the CSS under it follow at once, with no easing. The words say what the curve does, and when you let go a dot crosses the rail on it, for 480ms. The dashed curve is the default, and a double-click goes back to it. The Segmented control above sets a starting point; once you move a handle, none of them is picked."
      >
        <ExitDemo />
      </Stage>

      <Stage
        title="Past the ends"
        tier="instant"
        code="BackDemo"
        caption="The floor shows progress from -0.25 to 1.25, so a handle can pull the curve back before it goes, or past the end before it settles: here it does both, and the words say so. Tab moves between the two handles; the arrows move the focused one, and Shift makes it ten steps."
      >
        <BackDemo />
      </Stage>

      <Stage
        title="Disabled"
        tier="instant"
        code="DisabledDemo"
        caption="The disabled editor lies flat: the well and both caps on the flat surface with hairline edges, the curve, the CSS and the words dimmed. Tab skips it and the pointer does nothing. The help text says why it is locked."
      >
        <DisabledDemo />
      </Stage>

      <TryIt of="CurveEditor" component={CurveEditor} props={{ label: "Card exit", defaultValue: [0.2, 0.7, 0.3, 1] }} />
    </Page>
  );
}
