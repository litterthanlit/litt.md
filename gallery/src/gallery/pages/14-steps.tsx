import { useState } from "react";
import { Button } from "@/components/button";
import { Steps, type Step } from "@/components/steps";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "steps",
  title: "Steps",
  lede: "Where someone is in a flow of a few steps.",
  order: 14.6,
  group: "Layout",
  verbs: ["press"],
  summary:
    "Where someone is in a flow of a few steps, in the step marks Plan uses: a check for done, a half-filled circle for now, an empty circle for what is left. A row above a form, a column beside one, and in a narrow box \"Step 2 of 4\" with a rail per step. Done steps can be gone back to; nothing animates.",
  tiers: [],
};

export const docs: PageDocs = {
  components: ["steps"],
  exports: ["Steps"],
  usage: `import { Steps } from "@/components/steps";

<Steps
  label="Set up your studio"
  steps={[
    { id: "details", label: "Details" },
    { id: "team", label: "Team" },
    { id: "domain", label: "Domain" },
    { id: "billing", label: "Billing" },
  ]}
  current={step}
  onStepSelect={setStep}
/>`,
  use: [
    "A flow of three to six steps someone goes through once: setting up a studio, importing a site, checking out.",
    "A checklist of first things to do, in the vertical form, with a line under each step.",
  ],
  skip: [
    "Views someone moves between freely and in any order. Those are Tabs.",
    "Where a page sits in a hierarchy. That is a Breadcrumb.",
    "An agent working through a task. That is a Plan.",
  ],
  keyboard: [[["Tab"], "Moves to the done steps when they can be gone back to. The current step and what is left are not buttons."]],
  a11y: [
    "An ordered list named by the label. The current step has aria-current=\"step\".",
    "Each step's state is said in hidden text (done, current, not started), so the marks never carry it alone.",
    "The narrow form keeps the same list, so a screen reader hears every step there too.",
    "Going back is a real button named by the step, and only done steps get one.",
  ],
};

const SETUP: Step[] = [
  { id: "details", label: "Details" },
  { id: "team", label: "Team" },
  { id: "domain", label: "Domain" },
  { id: "billing", label: "Billing" },
];

const SAYS = [
  "Name the studio and pick its time zone.",
  "Invite the people you work with.",
  "Point halo.studio at the studio's site.",
  "Choose a plan and add a card.",
];

function SetupDemo() {
  const [step, setStep] = useState(1);
  const finished = step >= SETUP.length;
  return (
    <div className="grid w-full max-w-2xl gap-8">
      <Steps label="Set up your studio" steps={SETUP} current={step} onStepSelect={setStep} />
      <div className="grid gap-1">
        <p className="text-body font-title text-fg">{finished ? "The studio is ready" : SETUP[step]!.label}</p>
        <p className="text-small text-fg-muted">{finished ? "Everything is set. You can change any of it in Settings." : SAYS[step]}</p>
      </div>
      <div className="flex gap-3">
        <Button disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          Back
        </Button>
        {finished ? (
          <Button variant="primary" onClick={() => setStep(0)}>
            Start again
          </Button>
        ) : (
          <Button variant="primary" onClick={() => setStep((s) => s + 1)}>
            {step === SETUP.length - 1 ? "Finish" : "Continue"}
          </Button>
        )}
      </div>
    </div>
  );
}

function ChecklistDemo() {
  return (
    <div className="grid w-full gap-12 sm:grid-cols-2">
      <Steps
        orientation="vertical"
        label="Get the studio going"
        current={2}
        steps={[
          { id: "site", label: "Connect a site", description: "Halo site, from GitHub." },
          { id: "invite", label: "Invite the team", description: "Rui and Maya joined." },
          { id: "domain", label: "Add a domain", description: "Point halo.studio here, then wait for the check." },
          { id: "deploy", label: "Deploy from main", description: "Every push to main goes live." },
        ]}
      />
      <div className="w-full max-w-xs">
        <Steps label="Set up your studio, narrow" steps={SETUP} current={2} />
      </div>
    </div>
  );
}

export default function StepsPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Set up a studio"
        align="start"
        code="SetupDemo"
        caption="Continue moves on and Back moves back; a done step is also a button that goes back to it. The current step is the half-filled mark at the title weight, done ones are checked in the muted ink, and the hairline after a done step turns to the foreground. Nothing animates. Finish marks every step done."
      >
        <SetupDemo />
      </Stage>

      <Stage
        title="A checklist, and narrow"
        align="start"
        code="ChecklistDemo"
        caption="Vertical, the hairline runs down between the marks and each step takes a line under it, for a checklist or a side panel. In a box narrower than about 640px the row becomes Step 3 of 4 with the current label and a rail per step. The box decides, not the screen."
      >
        <ChecklistDemo />
      </Stage>

      <TryIt of="Steps" component={Steps} props={{ label: "Set up your studio", steps: SETUP, current: 1, className: "w-full max-w-2xl" }} controls={["current", "orientation"]} />
    </Page>
  );
}
