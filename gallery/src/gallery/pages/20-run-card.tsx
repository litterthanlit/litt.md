import { useState } from "react";
import { Button } from "@/components/button";
import { Composer } from "@/components/composer";
import type { StepStatus } from "@/components/icons";
import type { PlanStep } from "@/components/plan";
import { RunCard } from "@/components/run-card";
import { DeviceProvider } from "@/motion";
import { Page, Stage, TryIt, useReplay, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "run-card",
  title: "Run card",
  lede: "One agent run, folded to a ring and unfolded to its steps.",
  order: 18.955,
  group: "Agents",
  verbs: ["press", "watch"],
  summary:
    "An agent run as a flat card: its title, where it is in words (Step 1 of 3), a ring of ticks and a figure for how far it has got, and its steps beside a preview. Hide folds it into a raised block you press to open again. The ring travels between its two seats while the title, the words and the figure glide to theirs, the steps leave first and come back with a short drop, and the height snaps.",
  fun: "Press Hide: the ring glides across and settles a hair past its place, and its ticks sweep to the figure while the number counts.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["run-card"],
  exports: ["RunCard"],
  usage: `import { useState } from "react";
import { Button } from "@/components/button";
import type { PlanStep } from "@/components/plan";
import { RunCard } from "@/components/run-card";

// Hold the steps in state and change a status in place as the agent works.
const [steps, setSteps] = useState<PlanStep[]>([
  { id: "terrain", label: "Shaping the terrain", status: "running" },
  { id: "people", label: "Populating your world", status: "pending" },
  { id: "history", label: "Writing its history", status: "pending" },
]);

<RunCard
  title="Creating your world"
  steps={steps}
  progress={0.12}            // 0 to 1, when the agent knows more than the steps say
  preview={<WorldPreview />} // beside the steps while the card is open
  actions={<Button variant="ghost" size="sm" onClick={stop}>Stop</Button>}
/>

// Docked above the composer: fold it while the person writes, open it when they ask.
<RunCard title="Publishing the Halo site" steps={halo} open={open} onOpenChange={setOpen} />`,
  use: [
    "An agent is making something that takes a while, such as a world, a site or an import, and the person should see where it is without reading every tool call.",
    "The run should step aside while the person keeps working. Hide folds it into a block the width of its words, and the block opens it again.",
    "The agent knows how far it has got within a step. Pass progress from 0 to 1 and the figure and the ring say it; without it they count the steps done.",
    "There is something to show for it as it goes, such as a picture of what it has made so far. Pass it as preview, beside the steps.",
    "The run can be stopped or retried. Put a ghost sm button in actions, at the end of the header.",
  ],
  skip: [
    "The steps sit in the agent's turn with no card around them. Use Plan.",
    "You want to show what each step did, with its input and output. Use Tool call.",
    "It is one file or one job filling up, such as an upload. Use Progress.",
    "The run is a deploy with phases and timings to compare. Use Timeline.",
    "You want the ring to spin while the agent works. Litt does not animate a status: the ring moves only when the figure does, and the words say the rest.",
  ],
  keyboard: [
    [["Tab"], "Moves to the actions and Hide while the card is open, or to the block while it is folded."],
    [["Enter", "Space"], "Hide folds the card and the block opens it. Focus moves to the button that takes its place."],
  ],
  a11y: [
    "The open card is a group named by its title. Hide is a button with aria-expanded=\"true\", named \"Hide Creating your world\", and points to the steps with aria-controls.",
    "Folded, the run is one button with aria-expanded=\"false\", named by what it shows: \"Creating your world Step 1 of 3 12% Expand\". The ring is hidden from assistive tech, because the words and the figure say the same.",
    "When the button you pressed had focus, focus moves to the one that replaces it, so a keyboard never falls back to the top of the page.",
    "The steps are a list named \"Activity\", read as the Plan reads them: each label, its status in hidden text, and aria-current=\"step\" on the running one.",
    "One polite status says \"Step 2 of 3: Populating your world\", \"Step 2 failed: Populating your world\" or \"Done: Creating your world\" when the run moves on, whether the card is open or folded. It never speaks on the first render, so a run loaded from history is quiet. It does not announce each new percent.",
    "Every state is said in words, never by the ring's color alone. A failed run's lit ticks take the danger color, and the words say which step failed.",
    "Text is the body and small sizes in fg and fg-muted, which pass 4.5:1 on the card and on the block in both themes. The block is 44px tall, and Hide grows to 44px on a finger. Under reduced motion every glide and fade happens at once.",
  ],
};

/* ---------------------------------------------------------------- data */

const WORLD = [
  { id: "terrain", label: "Shaping the terrain" },
  { id: "people", label: "Populating your world" },
  { id: "history", label: "Writing its history" },
];

/** How far the world has got at each step: 12% into the first, then on through the others, then done. */
const WORLD_PROGRESS = [0.12, 0.45, 0.78, 1];

/** Step `at` runs, the ones before it are done and the rest wait. At 3 every step is done. */
function worldSteps(at: number): PlanStep[] {
  return WORLD.map((step, i) => ({ ...step, status: i < at ? "done" : i === at ? "running" : "pending" }));
}

const HALO: PlanStep[] = [
  { id: "build", label: "Run the build", status: "done" },
  { id: "images", label: "Upload 48 case study images", status: "running", detail: "25 of 48" },
  { id: "domain", label: "Point halo.studio at the new build", status: "pending" },
];

const NORTHWIND = [
  { id: "read", label: "Read the layout of the Northwind site" },
  { id: "build", label: "Run the build" },
  { id: "preview", label: "Publish a preview" },
];

function northwindSteps(retried: boolean): PlanStep[] {
  const status: StepStatus[] = retried ? ["done", "running", "pending"] : ["done", "failed", "pending"];
  return NORTHWIND.map((step, i) => ({
    ...step,
    status: status[i],
    detail: !retried && step.id === "build" ? "Build failed: font file missing" : undefined,
  }));
}

/* ---------------------------------------------------------------- the preview

   What the run has made so far, drawn from the steps: the terrain as contour lines, then the towns, then the roads
   between them. It changes at once when a step finishes. */

type Hill = { x: number; y: number; r: number; levels: number; seed: number };
const HILLS: Hill[] = [
  { x: 84, y: 72, r: 56, levels: 6, seed: 0.4 },
  { x: 172, y: 96, r: 38, levels: 4, seed: 2.1 },
];
const TOWNS = [
  [58, 104],
  [120, 40],
  [150, 122],
  [200, 70],
  [96, 58],
];
const ROADS = [
  [0, 4, 1],
  [4, 2],
  [2, 3],
];

/** One contour: a closed line round a hill, wobbled so it reads as ground and not as an ellipse. */
function contour(h: Hill, level: number) {
  const r = (h.r * level) / h.levels;
  let d = "";
  for (let j = 0; j < 48; j++) {
    const a = (2 * Math.PI * j) / 48;
    const w = 1 + 0.13 * Math.sin(3 * a + h.seed) + 0.07 * Math.sin(5 * a + 2 * h.seed + level * 0.3);
    d += `${j ? "L" : "M"}${(h.x + r * 1.3 * Math.cos(a) * w).toFixed(1)} ${(h.y + r * 0.78 * Math.sin(a) * w).toFixed(1)}`;
  }
  return d + "Z";
}

const SAID_AT = ["the terrain, half shaped", "the terrain and the first towns", "the towns and the first road", "the finished world: terrain, five towns and three roads"];

/** A picture of the world at step `at`: half the contours while the terrain is shaped, then towns, then roads. */
function WorldPreview({ at }: { at: number }) {
  const towns = at === 0 ? 0 : at === 1 ? 2 : 5;
  const roads = at < 2 ? 0 : at === 2 ? 1 : ROADS.length;
  return (
    <svg
      viewBox="0 0 240 150"
      role="img"
      aria-label={`Preview of the world: ${SAID_AT[at]}`}
      className="block h-auto w-full rounded-control bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]"
    >
      <g fill="none" strokeWidth={1}>
        {HILLS.map((h) =>
          Array.from({ length: h.levels }, (_, i) => h.levels - i)
            .filter((level) => at > 0 || level > h.levels / 2)
            .map((level) => (
              <path
                key={`${h.seed}-${level}`}
                d={contour(h, level)}
                className={level === 1 ? "stroke-fg-muted" : "stroke-[color-mix(in_oklab,var(--fg)_24%,transparent)]"}
              />
            )),
        )}
        {ROADS.slice(0, roads).map((road) => (
          <path key={road.join("-")} d={road.map((t, i) => `${i ? "L" : "M"}${TOWNS[t][0]} ${TOWNS[t][1]}`).join("")} strokeDasharray="3 3" className="stroke-fg-muted" />
        ))}
      </g>
      {TOWNS.slice(0, towns).map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x - 2} y={y - 2} width={4} height={4} className="fill-fg" />
      ))}
    </svg>
  );
}

/* ---------------------------------------------------------------- demos */

function WorldDemo() {
  const [at, setAt] = useState(0);
  const finished = at === WORLD.length;
  return (
    <div className="grid w-full max-w-2xl gap-4">
      <RunCard
        title="Creating your world"
        steps={worldSteps(at)}
        progress={WORLD_PROGRESS[at]}
        preview={<WorldPreview at={at} />}
      />
      <div>
        <Button size="sm" onClick={() => setAt(finished ? 0 : at + 1)}>
          {finished ? "Start again" : "Next step"}
        </Button>
      </div>
    </div>
  );
}

function DockedDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="grid w-full max-w-xl gap-6">
      <p className="litt-raised ml-auto max-w-[80%] px-4 py-3 text-body text-fg">Publish the Halo site once the new case study images are in.</p>
      <p className="text-body text-fg-muted">On it. The run sits on the box, so you can keep writing.</p>
      {/* Writing folds the run away; the block opens it again. */}
      <div className="grid gap-2" onFocusCapture={(e) => e.target instanceof HTMLTextAreaElement && setOpen(false)}>
        <RunCard title="Publishing the Halo site" steps={HALO} progress={0.52} open={open} onOpenChange={setOpen} />
        <Composer placeholder="Message Litt" label="Message Litt" className="w-full" />
      </div>
    </div>
  );
}

function EndingsDemo() {
  const [retried, setRetried] = useState(false);
  return (
    <div className="@container w-full">
      <div className="grid items-start gap-4 @4xl:grid-cols-2">
        <RunCard title="Creating your world" steps={worldSteps(3)} preview={<WorldPreview at={3} />} />
        <RunCard
          title="Moving the Northwind site"
          steps={northwindSteps(retried)}
          progress={retried ? 0.5 : 0.4}
          actions={
            !retried && (
              <Button variant="ghost" size="sm" onClick={() => setRetried(true)}>
                Retry
              </Button>
            )
          }
        />
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
            <p className="litt-raised ml-auto max-w-[85%] px-4 py-3 text-body text-fg">Make me a world with two islands and a few towns.</p>
            <div className="grid gap-3">
              <p className="text-body text-fg-muted">Here it comes. I am placing the towns.</p>
              <RunCard title="Creating your world" steps={worldSteps(1)} progress={WORLD_PROGRESS[1]} preview={<WorldPreview at={1} />} />
            </div>
          </div>
        </DeviceProvider>
      </div>
    </div>
  );
}

/* ---------- the overview's tile ---------- */

function RunTile() {
  return (
    <div className="w-full max-w-md">
      <RunCard title="Creating your world" steps={worldSteps(0)} progress={WORLD_PROGRESS[0]} />
    </div>
  );
}

export default function RunCardPage() {
  const [endingsKey, resetEndings] = useReplay();
  return (
    <Page meta={meta} docs={docs} tile={<RunTile />}>
      <Stage
        title="A run in progress"
        tier="responsive"
        size="lg"
        align="start"
        code="WorldDemo"
        caption="Litt is creating a world in three steps. Press Next step and the run moves on: the step's mark swaps at once, the figure rolls on the responsive tier, and the ring lights its next ticks at once. Press Hide and the steps leave on the exit token, then the card becomes a raised block: the ring travels from the end of the header to the start of the block, and the title, the words and the figure glide to their seats, on the responsive tier. The height snaps. Press the block and it all goes back, the steps dropping in a quarter of the travel token."
      >
        <WorldDemo />
      </Stage>

      <Stage
        title="Folded on the composer"
        tier="responsive"
        size="lg"
        align="start"
        code="DockedDemo"
        caption="The chat holds the card's open state, so it can fold the run away when the person goes to write, and the block opens it again. Folded, the run is one raised block the width of its words, at the control radius, and it sinks half a pixel when pressed, on the instant tier. Open, it is the flat card. The material swaps at once, because a press does, and only the parts glide."
      >
        <DockedDemo />
      </Stage>

      <Stage
        title="Done, and a step that failed"
        tier="instant"
        size="lg"
        code="EndingsDemo"
        onReplay={resetEndings}
        replayLabel="Reset"
        caption="A finished run says Done and its ring is full. A failed run says which step failed, its lit ticks take the danger color as the Plan's x does, and the step gives the reason in its detail line. Retry is the caller's, in the actions slot. When the build runs again, the words go back to Step 2 of 3 at once and the live region says so."
      >
        <div key={endingsKey} className="w-full">
          <EndingsDemo />
        </div>
      </Stage>

      <Stage
        title="On a phone"
        tier="responsive"
        align="start"
        code="PhoneDemo"
        caption="On a narrow card the header takes two rows, the title beside Hide and then the ring, the words and the figure, and the preview moves under the steps. Hide grows to 44px for a finger. Folded, the whole block is the target, 44px tall, and on a phone the word Expand gives its room to the title while the chevron stays. A screen reader still hears Expand."
      >
        <PhoneDemo />
      </Stage>

      <TryIt
        of="RunCard"
        component={RunCard}
        props={{ title: "Creating your world", steps: worldSteps(1), progress: 0.45, className: "w-full max-w-xl" }}
        controls={["title", { name: "progress", type: "number", min: 0, max: 1, step: 0.01 }]}
      />
    </Page>
  );
}
