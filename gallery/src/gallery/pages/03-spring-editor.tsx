import { useState } from "react";
import { motion, type Transition } from "motion/react";
import { useMotionDial, useTransition, useTravel } from "@/motion";
import { Button } from "@/components/button";
import { CheckCircleIcon } from "@/components/icons";
import { SpringEditor, type Spring } from "@/components/spring-editor";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "spring-editor",
  title: "Spring editor",
  lede: "A spring shaped by hand, as time and bounce.",
  order: 3.91,
  group: "Controls",
  verbs: ["drag"],
  summary:
    "A spring shaped by hand, as time and bounce: Motion's visualDuration and bounce, Framer's Time and Bounce. It is the Pad with the spring's curve drawn on its floor: drag the cap right for a slower spring and up for more bounce, and the curve follows at once. Under it the spring is said in words, and a dot crosses a rail on the spring you drew when you let go. Pass a tier and litt's limits for it wash the floor beyond them, with a Fits or Change row per rule.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["spring-editor"],
  exports: ["SpringEditor"],
  usage: `import { useState } from "react";
import { useMotionDial } from "@/motion";
import { SpringEditor, type Spring } from "@/components/spring-editor";

const { dial } = useMotionDial();
const [enter, setEnter] = useState<Spring>(dial.expressive);

<SpringEditor
  label="Toast entrance"
  value={enter}
  onValueChange={setEnter}
  onValueCommit={(s) => saveSpring(s)}
  tier="expressive"
  defaultMark={dial.expressive}
/>

// In Motion: { type: "spring", visualDuration: enter.time, bounce: enter.bounce }`,
  use: [
    "Someone tunes a spring for their own work: a Framer site's entrance, a component's open, a prototype. Time and bounce are what Motion and Framer take, so what they draw pastes straight in.",
    "You want the person to feel the spring before they keep it. The dot under the well crosses on it each time they let go; pair it with the real thing moving beside it when you can.",
    "The spring must stay inside litt's motion rules. Pass tier=\"expressive\" or tier=\"responsive\" and the floor shows where it fits, with a row per rule.",
    "Save on release. Use onValueCommit, not onValueChange, which fires on every move.",
  ],
  skip: [
    "Picking one of a few named feels, such as Calm or Lively. Use Segmented and keep the springs in code.",
    "Your own interface's motion. litt's springs are tokens (the responsive and expressive tiers), and components read them from the motion hooks, never from an editor.",
    "A tween with a duration and an easing curve. Use Curve editor.",
    "Stiffness, damping and mass. Time and bounce say the same spring in the words people tune by.",
  ],
  keyboard: [
    [["Tab"], "Moves focus to the editor as one stop. A disabled editor is skipped."],
    [["←", "→"], "Shortens or lengthens the time by 10ms."],
    [["↑", "↓"], "Adds or takes away 0.01 of bounce."],
    [["Shift + arrow"], "Moves ten steps."],
    [["Page Up", "Page Down"], "Changes the bounce by 0.1."],
    [["Home", "End"], "Takes the time to its shortest or its longest."],
  ],
  a11y: [
    "The well holds two visually hidden range inputs, Time and Bounce, both described by the label, the words under the well and the help text. A screen reader gets two sliders and the arrow keys, not a curve to guess at.",
    "One tab stop: Time is in the tab order and Bounce is skipped by Tab, as on the Pad. A screen reader can still reach Bounce.",
    "Both inputs say the spring as their value text: \"300ms, bounce 0.1. Settles in 540ms and overshoots 1%.\" The curve, the corner words and the dot are for eyes and are hidden from screen readers.",
    "The words under the well say what the spring does as it changes, so the effect never lives in the curve alone (R5).",
    "With a tier, each rule is a row with Fits or Change in words, not a color alone.",
    "A press anywhere moves the cap there, so the whole well is the target. It captures the pointer and is marked data-no-drag, so a sheet never moves under it, and touch-action none keeps the page from scrolling under the finger.",
    "The dot crosses on the spring being edited, because feeling it is the point; under reduced motion it lands at once. Nothing else moves.",
  ],
};

/* Springs people are tuning in these demos. They are the content being edited, not litt's motion. */
const BOUNCY: Spring = { time: 0.42, bounce: 0.2 }; // litt-allow: a spring being edited is content
const MENU: Spring = { time: 0.24, bounce: 0.15 }; // litt-allow: a spring being edited is content
const DIALOG: Spring = { time: 0.32, bounce: 0.08 }; // litt-allow: a spring being edited is content
const CARD: Spring = { time: 0.36, bounce: 0.18 }; // litt-allow: a spring being edited is content

/** A toast that enters on the spring each time `run` changes. */
function ToastPreview({ spring, run }: { spring: Spring; run: number }) {
  const travel = useTravel();
  const { reduced } = useMotionDial();
  const still = useTransition("instant");
  const own: Transition = { type: "spring", visualDuration: spring.time, bounce: spring.bounce }; // litt-allow: the toast enters on the spring being edited
  return (
    <motion.div
      key={run}
      initial={{ opacity: 0, y: travel }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? still : own}
      className="flex items-center gap-3 rounded-surface bg-surface-1 p-4 shadow-float"
    >
      <CheckCircleIcon className="shrink-0 text-success" />
      <p className="text-small text-fg">Invoice sent to Atelier Nord.</p>
    </motion.div>
  );
}

function ToastSpringDemo() {
  const { locked } = useMotionDial();
  const home = locked.dial.expressive;
  const [spring, setSpring] = useState<Spring>(BOUNCY);
  const [run, setRun] = useState(0);
  return (
    <div className="grid w-full max-w-sm gap-6">
      <ToastPreview spring={spring} run={run} />
      <SpringEditor
        label="Toast entrance"
        help="The toast replays on the spring each time you let go."
        value={spring}
        onValueChange={setSpring}
        onValueCommit={() => setRun((r) => r + 1)}
        tier="expressive"
        defaultMark={home}
        preview={false}
      />
      <div className="flex justify-start">
        <Button size="sm" variant="secondary" disabled={spring.time === home.time && spring.bounce === home.bounce} onClick={() => { setSpring(home); setRun((r) => r + 1); }}>
          Back to litt's expressive spring
        </Button>
      </div>
    </div>
  );
}

function ResponsiveDemo() {
  const [spring, setSpring] = useState<Spring>(MENU);
  return (
    <div className="w-full max-w-sm">
      <SpringEditor label="Menu open" value={spring} onValueChange={setSpring} tier="responsive" help="A menu answers a press, so the responsive tier never bounces." />
    </div>
  );
}

function DisabledDemo() {
  return (
    <div className="w-full max-w-sm">
      <SpringEditor disabled label="Dialog entrance" help="Locked while the design review is open." defaultValue={DIALOG} />
    </div>
  );
}

/* ---------- the overview's tile ---------- */

function SpringTile() {
  const [spring, setSpring] = useState<Spring>(CARD);
  return (
    <div className="w-full max-w-sm">
      <SpringEditor label="Card entrance" value={spring} onValueChange={setSpring} height={128} />
    </div>
  );
}

export default function SpringEditorPage() {
  return (
    <Page meta={meta} docs={docs} tile={<SpringTile />}>
      <Stage
        title="A toast's entrance"
        tier="instant"
        code="ToastSpringDemo"
        size="lg"
        caption="Press anywhere in the well, drag, or use the arrow keys. The cap is the Pad's: right is a longer visual time, up is more bounce, and the curve on the floor redraws under your hand at once, with no easing. The dashed line down through the cap is where the curve should look arrived. Let go and the toast above enters on the spring you drew. The floor beyond 350ms and above 0.12 bounce is washed: that is outside litt's expressive tier, and the rows under the words say which rule to change. The dashed circle is litt's own expressive spring, and a double-click goes back to it."
      >
        <ToastSpringDemo />
      </Stage>

      <Stage
        title="The responsive tier"
        tier="instant"
        code="ResponsiveDemo"
        caption="A menu, a tab or a tooltip answers a press, so on the responsive tier a spring never bounces: the whole floor above the baseline is washed, and the bounce row says Change until the cap sits on the line. The dot under the well crosses on the spring when you let go, and crosses back the next time, so it never jumps to a start. Tab once to reach the editor; the arrows change time and bounce, and Shift makes it ten steps."
      >
        <ResponsiveDemo />
      </Stage>

      <Stage
        title="Disabled"
        tier="instant"
        code="DisabledDemo"
        caption="The disabled editor lies flat, as the Pad does: the well and the cap on the flat surface with hairline edges, the curve and every word dimmed. Tab skips it and the pointer does nothing. The help text says why it is locked."
      >
        <DisabledDemo />
      </Stage>

      <TryIt of="SpringEditor" component={SpringEditor} props={{ label: "Card entrance", defaultValue: CARD }} />
    </Page>
  );
}
