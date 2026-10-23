import { useEffect, useState } from "react";
import type { StepStatus } from "@/components/icons";
import { Plan, type PlanStep } from "@/components/plan";
import { DeviceProvider } from "@/motion";
import { ToolCall } from "@/components/tool-call";
import { Page, Stage, useReplay, type PageDocs, type PageMeta } from "../kit";
import { useLoop, usePlaysOnItsOwn } from "../tile";

export const meta: PageMeta = {
  id: "plan",
  title: "Plan",
  lede: "An agent's steps, ticked off as it works.",
  order: 18.95,
  group: "Agents",
  verbs: ["watch"],
  summary:
    "An agent's steps for a task, ticked off as it works: the label and a count over a thin rail in the foreground, then each step with its status mark. The running step is a half-filled circle that stays still, and a done step steps its color back and is never struck through. A status swaps at once and only colors fade. A step added later fades in.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["plan"],
  exports: ["Plan"],
  usage: `import { useState } from "react";
import { Plan, type PlanStep } from "@/components/plan";

// Hold the steps in state and change a status in place as the agent works.
// Give every step an id: a step you add later gets a new one and fades in.
const [steps, setSteps] = useState<PlanStep[]>([
  { id: "read", label: "Read the layout of the Northwind site", status: "done" },
  { id: "build", label: "Run the build", status: "running" },
  { id: "preview", label: "Publish a preview", status: "pending" },
]);

<Plan label="Move the Northwind site to the new grid" steps={steps} />

// A failed step says why on a detail line. A step the agent will not run is skipped.
{ id: "build", label: "Run the build", status: "failed", detail: "Build failed: font file missing" }
{ id: "video", label: "Compress the case study videos", status: "skipped" }`,
  use: [
    "An agent has a list of steps for a task and the person wants to see where it is. It sits bare in the agent's turn, or in a raised panel you draw beside the chat.",
    "The plan changes while the agent works. Add a step with a new id and it fades in without moving the steps above it.",
    "A step can fail or be skipped. Each says so in words, and a detail line gives the reason in the label's column.",
    "The count is the steps that are done over all the steps, and the rail shows the same share. A failed or a skipped step does not count, so a plan with a skipped step ends one short, and the step says Skipped.",
    "A screen reader user should hear the plan move. A polite live region says which step started, which one failed and when the plan is done, and it stays quiet when the plan first appears.",
  ],
  skip: [
    "The steps are a checklist the person ticks off. Use a Checkbox group, because nothing here takes input.",
    "You need when each step started and how long it took, as in a deploy. Use Timeline, which has the columns for it.",
    "It is one number filling toward a limit, such as storage. Use Meter.",
    "You want the running step to spin, pulse or shimmer. Litt does not animate a status. The running step is a half-filled circle and the words say the rest.",
    "You want to show what a step did, with its input and output. Use Tool call, and let the plan stay a list of intentions.",
  ],
  a11y: [
    "The steps are an ordered list named by the label, so a screen reader says \"Move the Northwind site to the new grid, list, 7 items\". The list keeps role=\"list\", because Safari drops the semantics of a list without bullets.",
    "Each step reads its label, then its status from hidden text, then its detail: \"Run the build, failed. Build failed: font file missing\". The visible \"Failed\" and \"Skipped\" are hidden from assistive tech, so the status is said once.",
    "The running step has aria-current=\"step\", so it is the one a screen reader's \"current\" jump lands on.",
    "The count reads \"3 of 7 steps done\". The rail repeats it and is hidden from assistive tech.",
    "A polite status region says \"Step 4 of 7: Run the build\" when the running step changes, \"Step 4 of 7 failed: Run the build\" when a step fails, and \"Plan done\" when every step is done or skipped. It never speaks on the first render, so a plan loaded from history is silent, and it never reads a detail line.",
    "Status is never color alone. Each mark has its own shape (an empty circle, a half circle, a check, an x, a dashed circle), and failed and skipped are also words. Only the failed icon takes a status color.",
    "Text is the small size in fg, fg-muted or fg-subtle and the caption in fg-subtle, which pass 4.5:1 on the canvas and on a raised surface in both themes. A done step steps back to fg-muted and is never struck through, so it stays easy to read.",
    "The plan takes no focus, because it is not a control. Under reduced motion a step that is added appears at once, and the color fades are instant.",
  ],
};

/* ---------------------------------------------------------------- the demos' clock

   A demo is a list of frames, and a frame is what every step looks like at one moment. The clock moves to the next
   frame on a timer and stops on the last one. A Replay remounts the demo, so the clock starts again. */

function useFrame(count: number, ms: number) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (frame >= count - 1) return;
    const timer = setTimeout(() => setFrame((f) => f + 1), ms);
    return () => clearTimeout(timer);
  }, [frame, count, ms]);
  return frame;
}

/* ---------------------------------------------------------------- data */

const MOVE = [
  { id: "read", label: "Read the layout of the Northwind site" },
  { id: "map", label: "Map its sections to the 12-column grid" },
  { id: "rebuild", label: "Rebuild the hero and the project pages" },
  { id: "build", label: "Run the build" },
  { id: "check", label: "Check the pages at 390 and 1440 wide" },
  { id: "preview", label: "Publish a preview" },
  { id: "send", label: "Send the link to Priya" },
];

/** Frame 0 has the first step running, and each frame after finishes one more. The last frame has every step done. */
function moveSteps(frame: number): PlanStep[] {
  return MOVE.map((step, i) => ({ ...step, status: i < frame ? "done" : i === frame ? "running" : "pending" }));
}

const ATLAS = [
  { id: "read", label: "Read the layout of the Atlas portfolio" },
  { id: "map", label: "Map its sections to the 12-column grid" },
  { id: "video", label: "Compress the case study videos" },
  { id: "build", label: "Run the build" },
  { id: "preview", label: "Publish a preview" },
  { id: "send", label: "Send the link to Maya" },
];

/** What every Atlas step looks like at each moment: the videos are skipped, then the build fails. */
const ATLAS_FRAMES: StepStatus[][] = [
  ["running", "pending", "pending", "pending", "pending", "pending"],
  ["done", "running", "pending", "pending", "pending", "pending"],
  ["done", "done", "running", "pending", "pending", "pending"],
  ["done", "done", "skipped", "running", "pending", "pending"],
  ["done", "done", "skipped", "failed", "pending", "pending"],
];

function atlasSteps(frame: number): PlanStep[] {
  return ATLAS.map((step, i) => ({
    ...step,
    status: ATLAS_FRAMES[frame][i],
    detail: step.id === "build" && ATLAS_FRAMES[frame][i] === "failed" ? "Build failed: font file missing" : undefined,
  }));
}

/** The Halo plan, with the step Litt adds last. */
const HALO = [
  { id: "read", label: "Read the Halo case study" },
  { id: "images", label: "Swap in the new hero images" },
  { id: "build", label: "Run the build" },
  { id: "preview", label: "Publish a preview" },
  { id: "send", label: "Send the preview to Ines" },
];

/** Four steps at first. In the fifth moment Litt adds a last one while the preview publishes. */
const HALO_FRAMES: StepStatus[][] = [
  ["running", "pending", "pending", "pending"],
  ["done", "running", "pending", "pending"],
  ["done", "done", "running", "pending"],
  ["done", "done", "done", "running"],
  ["done", "done", "done", "running", "pending"],
  ["done", "done", "done", "done", "running"],
  ["done", "done", "done", "done", "done"],
];

function haloSteps(frame: number): PlanStep[] {
  return HALO_FRAMES[frame].map((status, i) => ({ ...HALO[i], status }));
}

/* ---------------------------------------------------------------- demos */

function MoveDemo() {
  const frame = useFrame(MOVE.length + 1, 1400);
  return (
    <div className="w-full max-w-md">
      <Plan label="Move the Northwind site to the new grid" steps={moveSteps(frame)} />
    </div>
  );
}

function FailedDemo() {
  const frame = useFrame(ATLAS_FRAMES.length, 1400);
  return (
    <div className="w-full max-w-md">
      <Plan label="Move the Atlas portfolio to the new grid" steps={atlasSteps(frame)} />
    </div>
  );
}

function PanelDemo() {
  const frame = useFrame(HALO_FRAMES.length, 1600);
  return (
    <div className="@container w-full">
      <div className="grid items-start gap-8 @2xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid content-start gap-6">
          <p className="litt-raised ml-auto max-w-[80%] rounded-surface px-4 py-3 text-body text-fg">
            Halo wants the case study live today. Swap in the new hero images and publish a preview.
          </p>
          <p className="max-w-[68ch] text-body text-fg-muted">
            On it. The steps are in the panel. If the build needs another one, I will add it there.
          </p>
        </div>
        <div className="litt-raised rounded-surface p-4">
          <Plan label="Update the Halo case study" steps={haloSteps(frame)} />
        </div>
      </div>
    </div>
  );
}

function PhoneDemo() {
  return (
    <div className="mx-auto w-full max-w-[22.375rem]">
      <div className="rounded-surface bg-canvas p-4 outline-1 -outline-offset-1 outline-line">
        <DeviceProvider mode="phone">
          <div className="grid gap-6">
            <p className="litt-raised ml-auto max-w-[85%] rounded-surface px-4 py-3 text-body text-fg">Move the Northwind site to the new grid.</p>
            <div className="grid gap-3">
              <p className="text-body text-fg-muted">Here is the plan. I am on the build.</p>
              <Plan
                label="Move the Northwind site to the new grid"
                steps={[
                  { id: "read", label: "Read the layout of the Northwind site", status: "done" },
                  { id: "map", label: "Map its sections to the 12-column grid", status: "done" },
                  { id: "rebuild", label: "Rebuild the hero and the project pages for the new grid", status: "done", detail: "Hero and 6 project pages" },
                  { id: "build", label: "Run the build", status: "running", detail: "Building 12 pages" },
                  { id: "check", label: "Check the pages at 390 and 1440 wide", status: "pending" },
                  { id: "preview", label: "Publish a preview", status: "pending" },
                  { id: "send", label: "Send the link to Priya", status: "pending" },
                ]}
              />
            </div>
          </div>
        </DeviceProvider>
      </div>
    </div>
  );
}

/* ---------- the overview's tile ---------- */

const RUN: (Omit<PlanStep, "status"> & { doing: string; did: string; target: string; seconds: number })[] = [
  { id: "read", label: "Read the layout of the Northwind site", doing: "Reading", did: "Read", target: "src/app/layout.tsx", seconds: 0.2 },
  { id: "grid", label: "Move the case studies to the new grid", doing: "Editing", did: "Edited", target: "src/pages/work.tsx", seconds: 1.4 },
  { id: "build", label: "Run the build", doing: "Running", did: "Ran", target: "npm run build", seconds: 31 },
  { id: "preview", label: "Publish a preview", doing: "Publishing", did: "Published", target: "northwind-git-grid.vercel.app", seconds: 4 },
];

/** The plan works through its steps with a tool call for each, holds the finished turn, then starts again. */
function PlanTile() {
  usePlaysOnItsOwn();
  const total = RUN.length + 2; // each step, then two beats on the finished plan
  const [ref, step] = useLoop<HTMLDivElement>(total, 1400, RUN.length);
  const steps: PlanStep[] = RUN.map(({ id, label }, i) => ({ id, label, status: i < step ? "done" : i === step ? "running" : "pending" }));
  return (
    <div ref={ref} className="grid w-full max-w-md gap-6">
      <Plan label="Move the Northwind site to the new grid" steps={steps} />
      <div className="grid min-h-44 content-start gap-1 border-t border-line pt-4">
        {RUN.slice(0, step + 1).map((s, i) =>
          i < step ? (
            <ToolCall key={s.id} status="done" action={s.did} target={s.target} duration={s.seconds} />
          ) : (
            <ToolCall key={s.id} status="running" action={s.doing} target={s.target} />
          ),
        )}
      </div>
    </div>
  );
}

export default function PlanPage() {
  const [moveKey, replayMove] = useReplay();
  const [failedKey, replayFailed] = useReplay();
  const [panelKey, replayPanel] = useReplay();
  return (
    <Page meta={meta} docs={docs} tile={<PlanTile />}>
      <Stage
        title="Moving a site, step by step"
        tier="instant"
        size="lg"
        code="MoveDemo"
        onReplay={replayMove}
        caption="Litt works through the Northwind move one step at a time. When a status changes, the mark swaps at once and only its colors fade, on the instant tier. The running step is full strength with a half-filled circle that never spins. A done step steps back to the muted color with a check, and is never struck through. The count and the rail move together, and the rail jumps with no tween. A screen reader hears the step as it starts."
      >
        <div key={moveKey} className="w-full">
          <MoveDemo />
        </div>
      </Stage>

      <Stage
        title="A skipped step and a failed one"
        tier="instant"
        size="lg"
        code="FailedDemo"
        onReplay={replayFailed}
        caption="Litt skips the video step because the site has none, then the build fails. A skipped step is a dashed circle with Skipped in words. A failed step has the x in danger, keeps its label in the foreground and says Failed, with the reason on a detail line in the label's column. Neither counts as done, so the count stops at 2 of 6. A screen reader hears the failure when it happens. Status color stays on the icon."
      >
        <div key={failedKey} className="w-full">
          <FailedDemo />
        </div>
      </Stage>

      <Stage
        title="A plan that grows, beside the chat"
        tier="responsive"
        size="lg"
        align="start"
        code="PanelDemo"
        onReplay={replayPanel}
        caption="The plan sits in a raised panel next to the chat. The panel is the caller's, and the plan inside it is the same bare list. While the preview publishes, Litt adds a last step, so the total goes from 4 to 5. The new step fades in on the responsive tier with a quarter of the travel token, and the steps above it do not move. Steps that were there from the start never animate."
      >
        <div key={panelKey} className="w-full">
          <PanelDemo />
        </div>
      </Stage>

      <Stage
        title="On a phone"
        tier="instant"
        align="start"
        code="PhoneDemo"
        caption="On a phone the plan sits bare in the agent's turn, with no card of its own. A long label wraps under its first line, and a detail line stays in the label's column. Nothing here takes a tap, so nothing grows on touch."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
