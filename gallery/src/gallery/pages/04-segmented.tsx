import { useState } from "react";
import { Segmented } from "@/components/segmented";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "segmented",
  title: "Segmented control",
  lede: "A short choice in one track.",
  order: 3.05,
  group: "Selection",
  verbs: ["select"],
  summary:
    "A short choice in one track. The selected surface glides to your pick on the responsive tier, and color changes are instant, so the control answers without ever resizing.",
  fun: "Pick another option: the surface springs to it and settles a hair past its mark.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["segmented"],
  exports: ["Segmented"],
  usage: `import { Segmented } from "@/components/segmented";

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
    "The selected option is a raised surface and a stronger text color, not color alone.",
    "Keyboard focus draws a 2px outline inside the segment, so the track never clips it. Mouse and touch presses do not show it.",
    "The small track is 32px tall and the medium track is 44px. On touch screens the small one grows to 44px.",
    "Touch has no hover, so on a touch screen a segment held down fills and takes the stronger text color, on the instant tier. The OS tap flash is off, and the segment never moves.",
    "A disabled option is muted and skipped by the arrow keys. Say why in text nearby when it is not obvious.",
    "Under reduced motion the selected surface jumps to the new option without gliding.",
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

export default function SegmentedPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Theme switch"
        tier="responsive"
        caption="The small size, as in a header. The legend is hidden, because the options name the control. The selected surface glides to your pick through transform on the responsive tier, and the text color fades on the instant tier. On a touch screen the segment you hold fills."
        code="ThemeDemo"
        byWorld={{
          device: {
            demo: <InputTypeDemo />,
            title: "An input's type",
            code: "InputTypeDemo",
            caption:
              "The small size, as on a recorder's input strip. The legend is hidden from sight and read to a screen reader as Input 1, because the options name the control. The selected surface moves to your pick through transform on the responsive tier, and the line under it says what the input expects.",
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
        byWorld={{ device: { demo: <ShareTakeDemo />, code: "ShareTakeDemo" } }}
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
        }}
      >
        <SizesDemo />
      </Stage>

    </Page>
  );
}
