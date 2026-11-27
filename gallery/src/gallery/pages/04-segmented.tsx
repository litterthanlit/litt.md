import { useState } from "react";
import { Button } from "@/components/button";
import { Segmented } from "@/components/segmented";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";
import { useSelfRun } from "../self-run";

export const meta: PageMeta = {
  id: "segmented",
  title: "Segmented control",
  lede: "A short choice in one track.",
  ledeByWorld: {
    heat: "A short choice in a row of square cells, the chosen one in brackets.",
    flat: "A short choice, one pill gliding under your pick.",
  },
  order: 3.05,
  group: "Selection",
  verbs: ["select"],
  summary:
    "A short choice in one track. Your pick takes the selected face and the stronger ink, and color changes are instant, so the control answers without ever resizing.",
  summaryByWorld: {
    flat: "A short choice as words in a line, with one pill under the chosen word: white on the grey ground, the grey bubble inside paper. The pill glides to your pick on two springs, where it starts and how wide it is, so it stretches a little as it travels and never bounces, and the chosen word takes the ink at once. Nothing frames it.",
    heat: "A short choice in a row of square cells divided by 1px rules. The chosen cell takes a darker fill, corner brackets and ‹ › around its label at once, and colors change on the instant tier, so the control answers without ever resizing.",
  },
  fun: "Pick another option: the surface springs to it and settles a hair past its mark.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["segmented"],
  exports: ["Segmented"],
  usage: `import { Button } from "@/components/button";
import { Segmented } from "@/components/segmented";

const [theme, setTheme] = useState<"system" | "light" | "dark">("system");

<Segmented
  legend="Theme"
  size="sm"
  value={theme}
  onValueChange={setTheme}
  options={[
    { value: "system", label: "System" },
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ]}
/>

// In a form, show the legend and fill the width.
<Segmented legend="Visibility" showLegend block value={v} onValueChange={setV} options={options} />`,
  use: [
    "One choice from two to five short options, such as Viewer or Editor, or System, Light and Dark.",
    "A setting in a header or toolbar. Use size sm, where the legend stays hidden and the options name the control.",
    "A choice in a form. Use size md, showLegend and block, so it lines up with 44px fields.",
    "A choice that submits with a form. The options are native radios, so name and value work as usual.",
  ],
  skip: [
    "Switching between views that swap a panel of content. Use Tabs, which also moves focus to the panel.",
    "More than five options, or long labels. Use radios, or a select.",
    "Several choices at once. Use a CheckboxGroup.",
    "An on or off setting. Use a Checkbox.",
  ],
  keyboard: [
    [["Tab"], "Moves focus into the control, onto the selected option. Press it again to leave."],
    [["←", "→", "↑", "↓"], "Moves to the previous or next option and selects it. At either end it wraps around. Disabled options are skipped."],
  ],
  a11y: [
    "It is a fieldset with a legend and native radio inputs, so a screen reader says the group's name and reads each option as, for example, radio button 2 of 3, checked.",
    "The legend is visually hidden unless you pass showLegend, but it is always read. Give it a real name.",
    "The selected option has its own face and a stronger text color, not color alone.",
    "Keyboard focus draws a 2px outline inside the segment, so the track never clips it. Mouse and touch presses do not show it.",
    "The small track is 32px tall and the medium track is 44px. On touch screens the small one grows to 44px.",
    "Touch has no hover, so on a touch screen a segment held down fills and takes the stronger text color, on the instant tier. The OS tap flash is off, and the segment never moves.",
    "A disabled option is muted and skipped by the arrow keys. Say why in text nearby when it is not obvious.",
    "Under reduced motion the selected face appears on the new option at once.",
  ],
};

type Theme = "system" | "light" | "dark";

function ThemeDemo() {
  const [theme, setTheme] = useState<Theme>("system");
  return (
    <div className="grid justify-items-center gap-4">
      <Segmented
        legend="Theme"
        size="sm"
        value={theme}
        onValueChange={setTheme}
        options={[
          { value: "system", label: "System" },
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ]}
      />
      <p role="status" className="text-small text-fg-subtle">
        {theme === "system" ? "Following your device." : `Always ${theme}.`}
      </p>
    </div>
  );
}

type Visibility = "private" | "public";
type Role = "viewer" | "commenter" | "editor";

const ROLE_NOTES: Record<Role, string> = {
  viewer: "Viewers can open the project.",
  commenter: "Commenters can also leave notes on pages.",
  editor: "Editors can change pages and publish.",
};

function FormDemo() {
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [role, setRole] = useState<Role>("commenter");
  return (
    <form className="grid w-full max-w-sm gap-6" onSubmit={(e) => e.preventDefault()}>
      <div className="grid gap-2">
        <Segmented
          legend="Visibility"
          showLegend
          block
          name="visibility"
          value={visibility}
          onValueChange={setVisibility}
          options={[
            { value: "private", label: "Private" },
            { value: "public", label: "Public" },
          ]}
        />
        <p className="text-small text-fg-subtle">
          {visibility === "private" ? "Only people you invite can open Halo site." : "Anyone with the link can open Halo site."}
        </p>
      </div>
      <div className="grid gap-2">
        <Segmented
          legend="Role for Nina"
          showLegend
          block
          name="role"
          value={role}
          onValueChange={setRole}
          options={[
            { value: "viewer", label: "Viewer" },
            { value: "commenter", label: "Commenter" },
            { value: "editor", label: "Editor" },
          ]}
        />
        <p className="text-small text-fg-subtle">{ROLE_NOTES[role]}</p>
      </div>
    </form>
  );
}

function SizesDemo() {
  const [range, setRange] = useState("30d");
  return (
    <div className="grid justify-items-start gap-6">
      <Segmented
        legend="Visits range, small"
        size="sm"
        value={range}
        onValueChange={setRange}
        options={[
          { value: "7d", label: "7 days" },
          { value: "30d", label: "30 days" },
          { value: "90d", label: "90 days" },
        ]}
      />
      <Segmented
        legend="Visits range, medium"
        size="md"
        value={range}
        onValueChange={setRange}
        options={[
          { value: "7d", label: "7 days" },
          { value: "30d", label: "30 days" },
          { value: "90d", label: "90 days" },
        ]}
      />
      <Segmented
        legend="Billing"
        size="md"
        defaultValue="monthly"
        options={[
          { value: "monthly", label: "Monthly" },
          { value: "yearly", label: "Yearly", disabled: true },
        ]}
      />
      <Segmented
        legend="Export format, unavailable"
        size="sm"
        disabled
        defaultValue="png"
        options={[
          { value: "png", label: "PNG" },
          { value: "svg", label: "SVG" },
        ]}
      />
    </div>
  );
}

/* ---------- Device's own (plans/024, phase 3): an input's type, sharing a take, the meter's hold ---------- */

type InputType = "mic" | "line" | "phantom";

const INPUT_NOTES: Record<InputType, string> = {
  mic: "Mic level, for a dynamic mic.",
  line: "Line level, from a mixer or a camera.",
  phantom: "Mic level with 48 V, for a condenser.",
};

function InputTypeDemo() {
  const [input, setInput] = useState<InputType>("mic");
  return (
    <div className="grid justify-items-center gap-4">
      <Segmented
        legend="Input 1"
        size="sm"
        value={input}
        onValueChange={setInput}
        options={[
          { value: "mic", label: "Mic" },
          { value: "line", label: "Line" },
          { value: "phantom", label: "Mic + 48 V" },
        ]}
      />
      <p role="status" className="text-small text-fg-subtle">
        {INPUT_NOTES[input]}
      </p>
    </div>
  );
}

type Listener = "listener" | "commenter" | "editor";

const LISTENER_NOTES: Record<Listener, string> = {
  listener: "Listeners can play the take.",
  commenter: "Commenters can also leave a note at a time in it.",
  editor: "Editors can trim the take and export it.",
};

function ShareTakeDemo() {
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [role, setRole] = useState<Listener>("commenter");
  return (
    <form className="grid w-full max-w-sm gap-6" onSubmit={(e) => e.preventDefault()}>
      <div className="grid gap-2">
        <Segmented
          legend="Visibility"
          showLegend
          block
          name="visibility"
          value={visibility}
          onValueChange={setVisibility}
          options={[
            { value: "private", label: "Private" },
            { value: "public", label: "Public" },
          ]}
        />
        <p className="text-small text-fg-subtle">
          {visibility === "private" ? "Only people you invite can play take_04.wav." : "Anyone with the link can play take_04.wav."}
        </p>
      </div>
      <div className="grid gap-2">
        <Segmented
          legend="Role for Nina"
          showLegend
          block
          name="role"
          value={role}
          onValueChange={setRole}
          options={[
            { value: "listener", label: "Listener" },
            { value: "commenter", label: "Commenter" },
            { value: "editor", label: "Editor" },
          ]}
        />
        <p className="text-small text-fg-subtle">{LISTENER_NOTES[role]}</p>
      </div>
    </form>
  );
}

function MeterHoldDemo() {
  const [hold, setHold] = useState("1s");
  return (
    <div className="grid justify-items-start gap-6">
      <Segmented
        legend="Peak hold, small"
        size="sm"
        value={hold}
        onValueChange={setHold}
        options={[
          { value: "off", label: "Off" },
          { value: "1s", label: "1 s" },
          { value: "3s", label: "3 s" },
        ]}
      />
      <Segmented
        legend="Peak hold, medium"
        size="md"
        value={hold}
        onValueChange={setHold}
        options={[
          { value: "off", label: "Off" },
          { value: "1s", label: "1 s" },
          { value: "3s", label: "3 s" },
        ]}
      />
      <Segmented
        legend="Sample rate"
        size="md"
        defaultValue="48"
        options={[
          { value: "48", label: "48 kHz" },
          { value: "96", label: "96 kHz", disabled: true },
        ]}
      />
      <Segmented
        legend="Export format, unavailable"
        size="sm"
        disabled
        defaultValue="wav"
        options={[
          { value: "wav", label: "WAV" },
          { value: "flac", label: "FLAC" },
        ]}
      />
    </div>
  );
}

/* ---------- Heat's own (proposals/heat.md): transmission, race rules, and tire compounds ---------- */

type Transmission = "auto" | "manual" | "clutch";

const TRANSMISSION_NOTES: Record<Transmission, string> = {
  auto: "Automatic shifts at redline.",
  manual: "Shift gears with paddles or keys.",
  clutch: "Full manual clutch for faster launches.",
};

function TransmissionDemo() {
  const [gear, setGear] = useState<Transmission>("manual");
  return (
    <div className="grid justify-items-center gap-4">
      <Segmented
        legend="Transmission"
        size="sm"
        value={gear}
        onValueChange={setGear}
        options={[
          { value: "auto", label: "Auto" },
          { value: "manual", label: "Manual" },
          { value: "clutch", label: "Clutch" },
        ]}
      />
      <p role="status" className="text-small text-fg-subtle">
        {TRANSMISSION_NOTES[gear]}
      </p>
    </div>
  );
}

type SessionMode = "free" | "ranked";
type CameraView = "bumper" | "hood" | "chase";

const CAMERA_NOTES: Record<CameraView, string> = {
  bumper: "Lowest to the asphalt for apex sightlines.",
  hood: "Shows the front fenders through tight chicanes.",
  chase: "Wide rear view for traffic and pursuits.",
};

function EventRulesDemo() {
  const [session, setSession] = useState<SessionMode>("ranked");
  const [camera, setCamera] = useState<CameraView>("chase");
  return (
    <form className="grid w-full max-w-sm gap-6" onSubmit={(e) => e.preventDefault()}>
      <div className="grid gap-2">
        <Segmented
          legend="Session"
          showLegend
          block
          name="session"
          value={session}
          onValueChange={setSession}
          options={[
            { value: "free", label: "Free roam" },
            { value: "ranked", label: "Ranked" },
          ]}
        />
        <p className="text-small text-fg-subtle">
          {session === "free" ? "Practice lines with pursuit heat off." : "Lap times count toward the Blacklist standings."}
        </p>
      </div>
      <div className="grid gap-2">
        <Segmented
          legend="Camera"
          showLegend
          block
          name="camera"
          value={camera}
          onValueChange={setCamera}
          options={[
            { value: "bumper", label: "Bumper" },
            { value: "hood", label: "Hood" },
            { value: "chase", label: "Chase" },
          ]}
        />
        <p className="text-small text-fg-subtle">{CAMERA_NOTES[camera]}</p>
      </div>
    </form>
  );
}

function TireCompoundDemo() {
  const [compound, setCompound] = useState("soft");
  return (
    <div className="grid justify-items-start gap-6">
      <Segmented
        legend="Tire compound, small"
        size="sm"
        value={compound}
        onValueChange={setCompound}
        options={[
          { value: "soft", label: "Soft" },
          { value: "medium", label: "Medium" },
          { value: "hard", label: "Hard" },
        ]}
      />
      <Segmented
        legend="Tire compound, medium"
        size="md"
        value={compound}
        onValueChange={setCompound}
        options={[
          { value: "soft", label: "Soft" },
          { value: "medium", label: "Medium" },
          { value: "hard", label: "Hard" },
        ]}
      />
      <Segmented
        legend="Nitrous mix"
        size="md"
        defaultValue="balanced"
        options={[
          { value: "balanced", label: "Balanced" },
          { value: "overboost", label: "Overboost", disabled: true },
        ]}
      />
      <Segmented
        legend="Ghost replay, unavailable"
        size="sm"
        disabled
        defaultValue="off"
        options={[
          { value: "off", label: "Off" },
          { value: "best", label: "Best lap" },
        ]}
      />
    </div>
  );
}

/* ---------- Rack's own (proposals/rack.md): quantization grid and track monitor/warp modes ---------- */

type Quantize = "bar" | "eighth" | "sixteenth";

const QUANTIZE_NOTES: Record<Quantize, string> = {
  bar: "Launches clips on the next bar downbeat.",
  eighth: "Snaps clip launches to 1/8 note divisions.",
  sixteenth: "Tight 1/16 grid for drum and synth triggers.",
};

function QuantizeGridDemo() {
  const [grid, setGrid] = useState<Quantize>("bar");
  return (
    <div className="grid justify-items-center gap-4">
      <Segmented
        legend="Global quantization"
        size="sm"
        value={grid}
        onValueChange={setGrid}
        options={[
          { value: "bar", label: "1 Bar" },
          { value: "eighth", label: "1/8" },
          { value: "sixteenth", label: "1/16" },
        ]}
      />
      <p role="status" className="text-small text-fg-subtle">
        {QUANTIZE_NOTES[grid]}
      </p>
    </div>
  );
}

type MonitorMode = "in" | "auto" | "off";
type WarpMode = "beats" | "tones" | "complex";

const WARP_NOTES: Record<WarpMode, string> = {
  beats: "Preserves drum transients across tempo changes.",
  tones: "Best for vocals, bass, and monophonic leads.",
  complex: "Full-mix warping for stems and chord chops.",
};

function TrackMonitorDemo() {
  const [monitor, setMonitor] = useState<MonitorMode>("auto");
  const [warp, setWarp] = useState<WarpMode>("beats");
  return (
    <form className="grid w-full max-w-sm gap-6" onSubmit={(e) => e.preventDefault()}>
      <div className="grid gap-2">
        <Segmented
          legend="Monitor"
          showLegend
          block
          name="monitor"
          value={monitor}
          onValueChange={setMonitor}
          options={[
            { value: "in", label: "In" },
            { value: "auto", label: "Auto" },
            { value: "off", label: "Off" },
          ]}
        />
        <p className="text-small text-fg-subtle">
          {monitor === "in" ? "Always monitors live input." : monitor === "auto" ? "Monitors input when track is armed." : "Plays clips only."}
        </p>
      </div>
      <div className="grid gap-2">
        <Segmented
          legend="Warp mode"
          showLegend
          block
          name="warp"
          value={warp}
          onValueChange={setWarp}
          options={[
            { value: "beats", label: "Beats" },
            { value: "tones", label: "Tones" },
            { value: "complex", label: "Complex" },
          ]}
        />
        <p className="text-small text-fg-subtle">{WARP_NOTES[warp]}</p>
      </div>
    </form>
  );
}

/* ---------- Press's own (plans/024, Press): deploy telemetry window ---------- */

type DeployWindow = "24h" | "7d" | "30d";

const DEPLOY_WINDOW_NOTES: Record<DeployWindow, string> = {
  "24h": "6 deploys · 1m 21s median build · 0 rollbacks",
  "7d": "38 deploys · 1m 25s median build · fra1",
  "30d": "142 deploys · 1m 29s median build · 99.98% up",
};

function DeployWindowDemo() {
  const [windowVal, setWindowVal] = useState<DeployWindow>("7d");
  return (
    <div className="grid justify-items-center gap-4">
      <Segmented
        legend="Deploy window"
        size="sm"
        value={windowVal}
        onValueChange={setWindowVal}
        options={[
          { value: "24h", label: "24h" },
          { value: "7d", label: "7 days" },
          { value: "30d", label: "30 days" },
        ]}
      />
      <p role="status" className="font-mono text-caption tabular-nums text-fg-subtle">
        {DEPLOY_WINDOW_NOTES[windowVal]}
      </p>
    </div>
  );
}

/* ---------- Flat's own: a newsletter's plan picker ---------- */

type Billing = "monthly" | "yearly" | "lifetime";

const PLANS: Record<Billing, { label: string; amount: string; per: string; note: string }> = {
  monthly: { label: "Monthly", amount: "$9", per: "a month", note: "Billed every month. Stop any time." },
  yearly: { label: "Yearly", amount: "$84", per: "a year", note: "Two months free, billed once a year." },
  lifetime: { label: "Lifetime", amount: "$249", per: "once", note: "Yours for good, every future issue." },
};

const PLAN_RUN: Billing[] = ["monthly", "lifetime", "yearly"];

/** The choice on the grey ground, where chosen is white, and under it one paper with the price and the one action. */
function SupporterPlanDemo() {
  const [billing, setBilling] = useState<Billing>("yearly");
  const plan = PLANS[billing];
  // On Flat's wall the plans change by themselves, a beat apart, until a hand arrives.
  const run = useSelfRun((n) => setBilling(PLAN_RUN[n % PLAN_RUN.length]));
  return (
    <div ref={run.ref} className="grid w-full max-w-sm justify-items-center gap-4">
      <Segmented
        legend="Billing period"
        value={billing}
        onValueChange={setBilling}
        options={(Object.keys(PLANS) as Billing[]).map((value) => ({ value, label: PLANS[value].label }))}
      />
      <div className="litt-paper grid w-full gap-1 rounded-surface bg-surface-1 p-6">
        <p className="text-body font-title text-fg">Supporter</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-figure-lg tabular-nums text-fg">{plan.amount}</span>
          <span className="text-body text-fg-subtle">{plan.per}</span>
        </p>
        <p role={run.running ? undefined : "status"} className="min-h-5 text-small text-fg-subtle">
          {plan.note}
        </p>
        <Button variant="secondary" className="mt-3 w-full">
          Become a supporter
        </Button>
      </div>
    </div>
  );
}

export default function SegmentedPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Theme switch"
        tier="responsive"
        caption="The small size, as in a header. The legend is hidden, because the options name the control. The selected surface glides to your pick through transform on the responsive tier, and the text color fades on the instant tier. On a touch screen the segment you hold fills."
        code="ThemeDemo"
        byWorld={{
          flat: {
            demo: <SupporterPlanDemo />,
            title: "Plan picker",
            code: "SupporterPlanDemo",
            caption:
              "A newsletter's plan picker. On the grey ground the chosen word sits in a white pill, which glides to your pick on two springs, where it starts and how wide it is, so it stretches a little between words of different widths and keeps its speed if you change your mind. It never bounces, and the word takes the ink at once. The arrow keys move and pick, and the price on the paper below follows.",
          },
          press: {
            demo: <DeployWindowDemo />,
            title: "Deploy window",
            code: "DeployWindowDemo",
            caption:
              "A compact range switcher in a deploy header: the selected range stands up as a raised stone block inside the recessed tray and glides cleanly to your pick.",
          },
          device: {
            demo: <InputTypeDemo />,
            title: "An input's type",
            code: "InputTypeDemo",
            caption:
              "The small size, as on a recorder's input strip. The legend is hidden from sight and read to a screen reader as Input 1, because the options name the control. The selected surface moves to your pick through transform on the responsive tier, and the line under it says what the input expects.",
          },
          rack: {
            demo: <QuantizeGridDemo />,
            title: "Global quantization",
            code: "QuantizeGridDemo",
            caption:
              "Under Rack, Segmented cuts cleanly in place like Live's chooser — 1 Bar, 1/8, or 1/16 launch quantization.",
          },
          heat: {
            demo: <TransmissionDemo />,
            title: "Transmission",
            code: "TransmissionDemo",
            caption:
              "Under Heat, the chosen option snaps into four 6px amber corner brackets with ‹ › chevrons on a flat square track — Auto, Manual, or Clutch.",
          },
        }}
      >
        <ThemeDemo />
      </Stage>

      <Stage
        title="In a form"
        tier="responsive"
        caption="The medium size with the legend shown and the track full width, so it lines up with 44px fields. Segments share one width, so the surface keeps its shape as it moves. Arrow keys move and select, because the options share one name."
        code="FormDemo"
        byWorld={{
          device: { demo: <ShareTakeDemo />, code: "ShareTakeDemo" },
          rack: { demo: <TrackMonitorDemo />, code: "TrackMonitorDemo" },
          heat: { demo: <EventRulesDemo />, code: "EventRulesDemo" },
        }}
      >
        <FormDemo />
      </Stage>

      <Stage
        title="Sizes and states"
        tier="responsive"
        caption="Small is 32 and medium is 44, on the same scale as Button. Both controls share one value, so picking in one moves the other. A disabled option is muted and skipped by the arrow keys, and a disabled control stays readable."
        code="SizesDemo"
        byWorld={{
          device: {
            demo: <MeterHoldDemo />,
            code: "MeterHoldDemo",
            caption:
              "Small is 32 and medium is 44, on the same scale as Button. Both peak holds share one value, so picking in one moves the other. 96 kHz is disabled, muted and skipped by the arrow keys, and a disabled control stays readable.",
          },
          heat: {
            demo: <TireCompoundDemo />,
            code: "TireCompoundDemo",
            caption:
              "Small is 32 and medium is 44. Both tire compound selectors stay in sync; Overboost is locked until stage 3 tuning, and Ghost replay lies flat while disabled.",
          },
        }}
      >
        <SizesDemo />
      </Stage>

    </Page>
  );
}
