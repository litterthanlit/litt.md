import {
  Timeline,
  TimelineBar,
  TimelinePhase,
  TimelineResult,
  TimelineStep,
  type TimelineHue,
  type TimelineStatus,
} from "@/components/timeline";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "timeline",
  title: "Timeline",
  lede: "The steps of a run, in order.",
  order: 17.8,
  group: "Data",
  summary:
    "The steps of a run in order: when each started, a status icon on a hairline rail, a label and how long it took, grouped into phases. In a proportional timeline a long step draws its time as a bar on the rail in its phase's color, with the last run beside it. A strip shows the whole run at a glance. Nothing moves.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["timeline"],
  exports: ["Timeline", "TimelinePhase", "TimelineStep", "TimelineResult", "TimelineBar"],
  usage: `import { Timeline, TimelinePhase, TimelineStep, TimelineResult, TimelineBar } from "@/components/timeline";

// The list: phases hold steps. "at" is the step's start on the run's clock.
// A phase's hue says which phase it is, here and in the strip.
<Timeline label="Update pricing page, deploy steps" proportional>
  <TimelinePhase label="Build" duration={24} hue="blue">
    <TimelineStep at="00:00" label="Clone repository" status="done" seconds={2} />
    <TimelineStep at="00:02" label="Restore build cache" status="skipped" />
    <TimelineStep at="00:02" label="Run build commands" status="done" seconds={19} previousSeconds={31} />
  </TimelinePhase>
  <TimelinePhase label="Deploy" duration={18} hue="teal">
    <TimelineStep at="00:24" label="Upload build output" status="done" seconds={12} previousSeconds={21} />
  </TimelinePhase>
  <TimelineResult tone="success" label="Live on atelier-nord.com" total={42} />
</Timeline>

// The strip takes data, not children. Feed it the same array as the list.
<TimelineBar
  label="Update pricing page"
  phases={[
    { label: "Build", hue: "blue", steps: [{ label: "Run build commands", seconds: 19, status: "done" }] },
    { label: "Deploy", hue: "teal", steps: [{ label: "Upload build output", seconds: 12, status: "done" }] },
  ]}
/>`,
  use: [
    "A run has steps in order and people want to know how long each took: a deploy, a build, an import, a publish. The list says what happened and when, and the result says how it ended.",
    "Where the time went matters. Turn on `proportional` and the long steps draw themselves as bars on the rail, so the eye lands on the slow one.",
    "You have last run's numbers. Give a step `previousSeconds` and a pale bar shows how it compared, with \"was 31s\" under it.",
    "The whole run should read in one glance, beside the list or on a card of its own. TimelineBar draws it as a strip, and a phase's hue says which part is which.",
    "The run is still going. A running step is a half-filled circle that stays still, and the steps after it are pending.",
  ],
  skip: [
    "The steps are a checklist the person ticks off. Use a Checkbox group, because nothing here takes input.",
    "The events happen over days or months and each has a long description. Use a List, which has room for a title and a line.",
    "You need to compare many runs, or see the trend of one number over time. Use a Chart, or a Table when the numbers matter more than the shape.",
    "You want a step to animate while it works: a spinner, a pulse, a bar that fills. Litt does not animate a status. A running step is a half-filled circle and the words say the rest.",
    "More than five phases. The hues are five and never repeat, so a longer run groups its phases or leaves some without a hue.",
  ],
  a11y: [
    "The timeline is an ordered list with its own name, and each phase has a nested list named by its heading. A step reads in order: \"00:02, Run build commands, done, 19 seconds\". The visual \"19s\" is hidden from screen readers and replaced by the spoken form.",
    "Status is never color alone. Each icon has its own shape (a check, a half circle, an empty circle, a dashed circle, an x), and a hidden word says the same: done, running, pending, skipped or failed. A skipped step also says \"skipped\" at the end of its row.",
    "A result is read with its tone, as \"Live on atelier-nord.com, success\" or \"Build failed, error\", so the green and the red are never the only news.",
    "The rail, the bars and the ghost bar are decoration and hidden from screen readers. The seconds are in the text, so the bars add nothing a person has to see.",
    "TimelineBar is a picture. It is role=\"img\" with a summary, such as \"Update pricing page: Build 24 seconds, Deploy 18 seconds, 42 seconds in all\", and a failed run adds where it failed. Its segments are not focusable, because it always sits beside a Timeline or a table that lists the same steps, and those are where a keyboard and a screen reader get each one. Do not use the strip on its own.",
    "Hovering a segment shows its label and time in the tooltip, Esc hides it, and a touch pins it until the next touch elsewhere. The tooltip repeats the list, so it is hidden from screen readers.",
    "A failed segment is danger and the other segments take their phase's hue. Neither is the only signal: the list beside the strip shows the failed icon and says \"failed\".",
    "Text is the small size or the mono caption in fg, fg-muted or fg-subtle, which pass 4.5:1 on a card in both themes. Nothing here moves, so there is nothing to reduce under reduced motion.",
    "The columns measure the list, not the window. On a narrow container the start column shrinks and the labels wrap, so nothing scrolls sideways.",
  ],
};

/* ---------------------------------------------------------------- data

   One array per demo feeds the strip and the list, so they cannot disagree. A skipped step has no seconds and
   a step that has not run has none either. "was" is the last run's time. */

type DemoStep = { label: string; seconds: number; status: TimelineStatus; was?: number };
type DemoPhase = { label: string; hue: TimelineHue; steps: DemoStep[] };

const DEPLOY: DemoPhase[] = [
  {
    label: "Build",
    hue: "blue",
    steps: [
      { label: "Clone repository", seconds: 2, status: "done" },
      { label: "Restore build cache", seconds: 0, status: "skipped" },
      { label: "Run build commands", seconds: 19, status: "done", was: 31 },
      { label: "Collect build output", seconds: 3, status: "done" },
    ],
  },
  {
    label: "Deploy",
    hue: "teal",
    steps: [
      { label: "Upload build output", seconds: 12, status: "done", was: 21 },
      { label: "Assign atelier-nord.com", seconds: 3, status: "done" },
      { label: "Warm the cache", seconds: 3, status: "done" },
    ],
  },
];

const HALO: DemoPhase[] = [
  {
    label: "Build",
    hue: "blue",
    steps: [
      { label: "Clone repository", seconds: 2, status: "done" },
      { label: "Restore build cache", seconds: 4, status: "done" },
      { label: "Run build commands", seconds: 27, status: "done" },
    ],
  },
  {
    label: "Deploy",
    hue: "teal",
    steps: [
      { label: "Upload build output", seconds: 11, status: "done" },
      { label: "Assign halo.studio", seconds: 2, status: "done" },
      { label: "Warm the cache", seconds: 4, status: "done" },
    ],
  },
];

const FAILED: DemoPhase[] = [
  {
    label: "Build",
    hue: "blue",
    steps: [
      { label: "Clone repository", seconds: 2, status: "done" },
      { label: "Restore build cache", seconds: 0, status: "skipped" },
      { label: "Install dependencies", seconds: 9, status: "done" },
      { label: "Run build commands", seconds: 14, status: "failed" },
      { label: "Collect build output", seconds: 0, status: "pending" },
    ],
  },
  {
    label: "Deploy",
    hue: "teal",
    steps: [
      { label: "Upload build output", seconds: 0, status: "pending" },
      { label: "Assign northwind.co", seconds: 0, status: "pending" },
    ],
  },
];

const PUBLISH: DemoPhase[] = [
  {
    label: "Build",
    hue: "blue",
    steps: [
      { label: "Clone repository", seconds: 2, status: "done" },
      { label: "Restore build cache", seconds: 0, status: "skipped" },
      { label: "Install dependencies", seconds: 9, status: "done" },
      { label: "Run build commands", seconds: 7, status: "running" },
      { label: "Collect build output", seconds: 0, status: "pending" },
    ],
  },
  {
    label: "Deploy",
    hue: "teal",
    steps: [
      { label: "Upload build output", seconds: 0, status: "pending" },
      { label: "Assign atlas.studio", seconds: 0, status: "pending" },
    ],
  },
];

/** Seconds a skipped step or one that has not run adds: none. */
const spent = (step: DemoStep) => (step.status === "skipped" || step.status === "pending" ? 0 : step.seconds);
const total = (steps: DemoStep[]) => steps.reduce((t, s) => t + spent(s), 0);
const runTotal = (phases: DemoPhase[]) => phases.reduce((t, p) => t + total(p.steps), 0);

/** 24 becomes "00:24". */
function clock(seconds: number) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(seconds / 60))}:${p(seconds % 60)}`;
}

/** Each step starts when the steps before it have finished. A step that has not started has no time yet. */
function withStarts(phases: DemoPhase[]) {
  let t = 0;
  return phases.map((phase) => ({
    ...phase,
    steps: phase.steps.map((step) => {
      const at = step.status === "pending" ? undefined : clock(t);
      t += spent(step);
      return { ...step, at };
    }),
  }));
}

/* ---------------------------------------------------------------- demos */

function DeployDemo() {
  return (
    <div className="grid w-full max-w-xl gap-6">
      <div className="grid gap-1">
        <p className="text-body font-title text-fg">Update pricing page</p>
        <p className="font-mono text-caption font-normal text-fg-subtle">Ines · main / a3f91c2</p>
      </div>
      <Timeline label="Update pricing page, deploy steps" proportional>
        {withStarts(DEPLOY).map((phase) => (
          <TimelinePhase key={phase.label} label={phase.label} duration={total(phase.steps)} hue={phase.hue}>
            {phase.steps.map((step) => (
              <TimelineStep
                key={step.label}
                at={step.at}
                label={step.label}
                status={step.status}
                seconds={step.seconds}
                previousSeconds={step.was}
              />
            ))}
          </TimelinePhase>
        ))}
        <TimelineResult tone="success" label="Live on atelier-nord.com" total={runTotal(DEPLOY)} />
      </Timeline>
    </div>
  );
}

function GlanceDemo() {
  return (
    <div className="grid w-full max-w-xl gap-8">
      <div className="flex items-end justify-between gap-6">
        <div className="grid gap-1">
          <p className="text-body font-title text-fg">Publish Halo case study</p>
          <p className="font-mono text-caption font-normal text-fg-subtle">Maya · main / 7be04d1</p>
        </div>
        <p className="text-h1 tabular-nums text-fg">
          <span aria-hidden="true">{runTotal(HALO)}s</span>
          <span className="sr-only">{runTotal(HALO)} seconds in all</span>
        </p>
      </div>
      <TimelineBar label="Publish Halo case study" phases={HALO} />
      <Timeline label="Publish Halo case study, steps">
        {withStarts(HALO).map((phase) => (
          <TimelinePhase key={phase.label} label={phase.label} duration={total(phase.steps)} hue={phase.hue}>
            {phase.steps.map((step) => (
              <TimelineStep key={step.label} at={step.at} label={step.label} status={step.status} seconds={step.seconds} />
            ))}
          </TimelinePhase>
        ))}
      </Timeline>
    </div>
  );
}

function FailedDemo() {
  return (
    <div className="grid w-full max-w-xl gap-8">
      <div className="grid gap-1">
        <p className="text-body font-title text-fg">Update hero copy</p>
        <p className="font-mono text-caption font-normal text-fg-subtle">Priya · main / e41c7d0</p>
      </div>
      <TimelineBar label="Update hero copy" phases={FAILED} />
      <Timeline label="Update hero copy, steps">
        {withStarts(FAILED).map((phase) => (
          <TimelinePhase
            key={phase.label}
            label={phase.label}
            duration={total(phase.steps) || undefined}
            hue={phase.hue}
          >
            {phase.steps.map((step) => (
              <TimelineStep key={step.label} at={step.at} label={step.label} status={step.status} seconds={step.seconds} />
            ))}
          </TimelinePhase>
        ))}
        <TimelineResult tone="danger" label="Build failed" total={runTotal(FAILED)} />
      </Timeline>
    </div>
  );
}

function RunningDemo() {
  return (
    <div className="w-full max-w-[22.375rem]">
      <Timeline label="Publish Atlas portfolio, steps">
        {withStarts(PUBLISH).map((phase) => (
          <TimelinePhase
            key={phase.label}
            label={phase.label}
            duration={total(phase.steps) ? `${total(phase.steps)}s so far` : undefined}
            hue={phase.hue}
          >
            {phase.steps.map((step) => (
              <TimelineStep key={step.label} at={step.at} label={step.label} status={step.status} seconds={step.seconds} />
            ))}
          </TimelinePhase>
        ))}
      </Timeline>
    </div>
  );
}

export default function TimelinePage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="A deploy"
        size="lg"
        code="DeployDemo"
        caption="A run drawn to scale. Each step's row is as tall as its time, and a long step draws that time as a bar on the rail, in the color of its phase: blue for the build, teal for the deploy. The pale bar beside it is the last run, with its length at its foot, so a faster step reads as shorter at a glance. Short steps keep the thin line, a skipped step says so in words, and the result closes the run. Nothing on the page moves."
      >
        <DeployDemo />
      </Stage>

      <Stage
        title="At a glance"
        tier="responsive"
        size="lg"
        code="GlanceDemo"
        caption="The whole run as one strip, over the same steps as a plain list. A segment is as wide as its step, the phases are labeled above their spans, and the times at the phase boundaries sit below. The big total is composed here on the page, at the largest heading size. Hover or touch a segment and the tooltip names the step and its time. The strip is a picture, so the list beside it is where the keyboard and a screen reader go."
      >
        <GlanceDemo />
      </Stage>

      <Stage
        title="A failed run"
        tier="instant"
        size="lg"
        code="FailedDemo"
        caption="The build stopped at a step, so that step has an x in danger and the steps after it are pending: an empty circle, no time and no start. The deploy never began, so its phase has no total and takes no room in the strip. The failed segment is the one place a mark takes danger. The result says it in words, in danger, with the time it took to fail."
      >
        <FailedDemo />
      </Stage>

      <Stage
        title="A run in progress, on a phone"
        tier="instant"
        align="start"
        code="RunningDemo"
        caption="The list measures its own width, so in a phone-wide column the start column shrinks and the labels wrap. The step that is running is a half-filled circle in the foreground. It does not spin or pulse, and the steps after it wait as empty circles. The phase total says it is so far."
      >
        <RunningDemo />
      </Stage>
    </Page>
  );
}
