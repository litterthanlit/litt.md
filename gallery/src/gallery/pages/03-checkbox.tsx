import { useState } from "react";
import { Button } from "@/components/button";
import { Checkbox, CheckboxGroup, Radio, RadioGroup } from "@/components/checkbox";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "checkbox",
  title: "Checkbox and radio",
  lede: "Real checkboxes and radios, filled with ink when on.",
  order: 3.01,
  group: "Selection",
  verbs: ["press"],
  summary:
    "Real checkboxes and radios, drawn as a small cut, like a field: a 20px box at the control radius, or a circle for a radio. On, the ink fills the box around its tick, and a chosen radio takes a small raised bead. In Flat the same inputs are an outline that fills with ink. The accent stays for the one primary action. The label sits on the right and the whole row is clickable. Fill, edge and mark fade on the instant tier, and nothing moves.",
  fun: "Check a box: it pops and draws its tick.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["checkbox"],
  exports: ["Checkbox", "CheckboxGroup", "Radio", "RadioGroup"],
  usage: `import { Checkbox, CheckboxGroup, Radio, RadioGroup } from "@/components/checkbox";

<Checkbox label="Include motion study" defaultChecked />

<CheckboxGroup legend="Deliverables" help="Pick what the client gets.">
  <Checkbox name="deliverables" value="source" label="Source files" />
  <Checkbox name="deliverables" value="notes" label="Handoff notes" description="A PDF with the type and spacing." />
</CheckboxGroup>

<RadioGroup legend="Deploy to" value={target} onValueChange={setTarget}>
  <Radio value="production" label="Production" description="litt.design, visible to everyone." />
  <Radio value="preview" label="Preview" description="A private link for the client." />
</RadioGroup>

// Select all: set indeterminate when only some of the items are on.
<Checkbox label="All pages" checked={all} indeterminate={some} onChange={toggleAll} />`,
  use: [
    "Any number of independent yes or no choices: deliverables, notification settings, an agreement. Use Checkbox, alone or in a CheckboxGroup.",
    "Exactly one of three or more options, where each needs room for a description: a deploy target, a plan. Use RadioGroup.",
    "A select-all box above a list. Set indeterminate while only some items are on.",
    "Anything that submits with a form. These are real inputs, so name and value work as usual.",
  ],
  skip: [
    "One choice from two to five short options in a toolbar or a dialog. Use Segmented, which is built from radios too.",
    "A setting that takes effect the moment it changes. A checkbox suggests that a button saves it.",
    "More than a handful of options to pick from. Use a select or the Command menu.",
    "An action, such as Publish. Use Button.",
  ],
  keyboard: [
    [["Tab"], "Moves focus to the next checkbox. In a radio group it enters once, on the selected radio, or on the first if none is selected."],
    [["Space"], "Toggles the focused checkbox, or selects the focused radio."],
    [["↑", "↓", "←", "→"], "In a radio group, moves to the previous or next radio and selects it. At either end it wraps around."],
  ],
  a11y: [
    "Both are native inputs. The role, the checked state and the mixed state, which a browser reads out as mixed, come from the element, not from ARIA.",
    "The label is a real <label for> stretched over the whole row, so a click or tap anywhere in it toggles the input. The accessible name is only the label text, and the description is linked with aria-describedby.",
    "A group is a fieldset with a legend, so a screen reader says the group's name when focus enters it. A group error is linked to the fieldset with aria-describedby and marks every input invalid. It is not announced by itself, so after a failed submit move focus to the first input.",
    "The chip is 20px, but the whole row is the target: 36px tall, and 44px on touch screens.",
    "On is shown by a mark inside the chip (a check, a dash or a bead), not by color alone. In forced colors the box keeps a real border and the mark takes the system text color.",
    "Keyboard focus draws a 2px outline at a 2px offset around the chip. Mouse and touch presses do not show it.",
    "A disabled input is muted, skipped by Tab and exempt from contrast rules. In a group, disable the fieldset and every input follows.",
  ],
};

function StatesDemo() {
  return (
    <div className="grid w-full max-w-xl gap-x-12 gap-y-6 sm:grid-cols-2">
      <CheckboxGroup legend="Deliverables">
        <Checkbox name="deliverables" value="motion" label="Include motion study" defaultChecked />
        <Checkbox name="deliverables" value="template" label="Send me the template" />
        <Checkbox
          name="deliverables"
          value="deploy-email"
          label="Email me when it deploys"
          description="A note when a build finishes or fails."
          defaultChecked
        />
      </CheckboxGroup>
      <CheckboxGroup legend="On the Studio plan" disabled>
        <Checkbox label="Custom domain" defaultChecked />
        <Checkbox label="Password protection" />
        <Checkbox label="Remove the Framer badge" description="Part of the Studio plan." />
      </CheckboxGroup>
    </div>
  );
}

const PAGES = ["Home", "Work", "Journal", "About"];

function SelectAllDemo() {
  const [picked, setPicked] = useState<string[]>(["Home", "Work"]);
  const all = picked.length === PAGES.length;
  const some = picked.length > 0 && !all;

  return (
    <CheckboxGroup legend="Publish litt.design v3" help={`${picked.length} of ${PAGES.length} pages will go live.`} className="w-full max-w-xs">
      <Checkbox label="All pages" checked={all} indeterminate={some} onChange={(e) => setPicked(e.target.checked ? PAGES : [])} />
      {/* The indent is the chip's width plus its gap, so the pages line up under the parent's label. */}
      <div className="grid justify-items-start pl-[calc(1.25rem+var(--control-gap))]">
        {PAGES.map((page) => (
          <Checkbox
            key={page}
            label={page}
            checked={picked.includes(page)}
            onChange={(e) => setPicked((p) => (e.target.checked ? [...p, page] : p.filter((x) => x !== page)))}
          />
        ))}
      </div>
    </CheckboxGroup>
  );
}

const TARGETS = [
  { value: "production", label: "Production", description: "litt.design, visible to everyone." },
  { value: "preview", label: "Preview", description: "A private link for the client to review." },
  { value: "staging", label: "Staging", description: "staging.litt.design, behind a password." },
];

function DeployTargetDemo() {
  const [target, setTarget] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [status, setStatus] = useState("");

  return (
    <form
      noValidate
      className="grid w-full max-w-sm gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!target) {
          setStatus("");
          setError("Pick where to deploy.");
          e.currentTarget.querySelector("input")?.focus(); // the group reads its legend and its error
          return;
        }
        setError(undefined);
        setStatus(`Deploying v3 to ${target}.`);
      }}
    >
      <RadioGroup
        legend="Deploy to"
        value={target}
        onValueChange={(v) => {
          setTarget(v);
          setError(undefined);
        }}
        error={error}
      >
        {TARGETS.map((t) => (
          <Radio key={t.value} value={t.value} label={t.label} description={t.description} />
        ))}
      </RadioGroup>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit">Deploy v3</Button>
        <p role="status" className="text-small text-fg-subtle">
          {status}
        </p>
      </div>
    </form>
  );
}

function AppearanceDemo() {
  return (
    <div className="grid w-full max-w-xl gap-x-12 gap-y-6 sm:grid-cols-2">
      <div className="grid content-start gap-2">
        <p className="text-small text-fg-subtle">Drawn, the default</p>
        <div className="grid justify-items-start">
          <Checkbox label="Checked" defaultChecked />
          <Checkbox label="Unchecked" />
          <Checkbox label="Mixed" indeterminate />
          <Radio name="drawn" value="on" label="Selected" defaultChecked />
          <Radio name="drawn" value="off" label="Not selected" />
        </div>
      </div>
      <div className="grid content-start gap-2">
        <p className="text-small text-fg-subtle">Native, the browser's own</p>
        <div className="grid justify-items-start">
          <Checkbox appearance="native" label="Checked" defaultChecked />
          <Checkbox appearance="native" label="Unchecked" />
          <Checkbox appearance="native" label="Mixed" indeterminate />
          <Radio appearance="native" name="native" value="on" label="Selected" defaultChecked />
          <Radio appearance="native" name="native" value="off" label="Not selected" />
        </div>
      </div>
    </div>
  );
}

/* ---------- the overview's tile ---------- */

function DeliverablesTile() {
  return (
    <CheckboxGroup legend="Deliverables">
      <Checkbox name="deliverables" value="motion" label="Include motion study" defaultChecked />
      <Checkbox name="deliverables" value="template" label="Send me the template" />
      <Checkbox name="deliverables" value="deploy-email" label="Email me when it deploys" description="A note when a build finishes or fails." defaultChecked />
    </CheckboxGroup>
  );
}

/* ---------- Device's own (plans/024, phase 3): a recorder's recording settings and its export sheet ---------- */

function RecordingOptionsDemo() {
  return (
    <div className="grid w-full max-w-xl gap-x-12 gap-y-6 sm:grid-cols-2">
      <CheckboxGroup legend="Recording">
        <Checkbox name="recording" value="safety" label="Record a safety track" description="A second file 12 dB lower, for a take that clips." defaultChecked />
        <Checkbox name="recording" value="pre-roll" label="Pre-roll 2 s" />
        <Checkbox name="recording" value="clip-marker" label="Mark the take where it clips" defaultChecked />
      </CheckboxGroup>
      <CheckboxGroup legend="With a second card" disabled>
        <Checkbox label="Mirror to card B" defaultChecked />
        <Checkbox label="Split files at 4 GB" />
        <Checkbox label="Back up each take to card B" description="Needs a card in slot B." />
      </CheckboxGroup>
    </div>
  );
}

const TAKES = ["take_01.wav", "take_02.wav", "take_03.wav", "take_04.wav"];

function ExportTakesDemo() {
  const [picked, setPicked] = useState<string[]>(["take_01.wav", "take_02.wav"]);
  const all = picked.length === TAKES.length;
  const some = picked.length > 0 && !all;

  return (
    <CheckboxGroup legend="Export scene A" help={`${picked.length} of ${TAKES.length} takes will export.`} className="w-full max-w-xs">
      <Checkbox label="All takes" checked={all} indeterminate={some} onChange={(e) => setPicked(e.target.checked ? TAKES : [])} />
      <div className="grid justify-items-start pl-[calc(1.25rem+var(--control-gap))]">
        {TAKES.map((take) => (
          <Checkbox
            key={take}
            label={take}
            checked={picked.includes(take)}
            onChange={(e) => setPicked((p) => (e.target.checked ? [...p, take] : p.filter((x) => x !== take)))}
          />
        ))}
      </div>
    </CheckboxGroup>
  );
}

const DESTINATIONS = [
  { value: "card A", label: "Card A", description: "The card in the recorder, 3H 12M left." },
  { value: "the computer", label: "Computer", description: "Over USB-C, as a mounted drive." },
  { value: "the phone", label: "Phone", description: "The paired app, over Wi-Fi." },
];

function ExportToDemo() {
  const [target, setTarget] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [status, setStatus] = useState("");

  return (
    <form
      noValidate
      className="grid w-full max-w-sm gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!target) {
          setStatus("");
          setError("Pick where to export.");
          e.currentTarget.querySelector("input")?.focus();
          return;
        }
        setError(undefined);
        setStatus(`Exporting take_04 to ${target}.`);
      }}
    >
      <RadioGroup
        legend="Export to"
        value={target}
        onValueChange={(v) => {
          setTarget(v);
          setError(undefined);
        }}
        error={error}
      >
        {DESTINATIONS.map((d) => (
          <Radio key={d.value} value={d.value} label={d.label} description={d.description} />
        ))}
      </RadioGroup>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit">Export take_04</Button>
        <p role="status" className="text-small text-fg-subtle">
          {status}
        </p>
      </div>
    </form>
  );
}

function RecordingTile() {
  return (
    <CheckboxGroup legend="Recording">
      <Checkbox name="recording" value="safety" label="Record a safety track" description="A second file 12 dB lower, for a take that clips." defaultChecked />
      <Checkbox name="recording" value="pre-roll" label="Pre-roll 2 s" />
      <Checkbox name="recording" value="clip-marker" label="Mark the take where it clips" defaultChecked />
    </CheckboxGroup>
  );
}

export default function CheckboxPage() {
  return (
    <Page meta={meta} docs={docs} tile={<DeliverablesTile />} tileByWorld={{ device: <RecordingTile /> }}>
      <Stage
        title="Checkbox"
        tier="instant"
        caption="Click anywhere on a row, not only the chip. Hover and press wash the chip, and the fill, the edge and the check fade together on the instant tier. A description sits under the label, and the disabled group is muted and skipped by Tab."
        code="StatesDemo"
        byWorld={{
          device: {
            demo: <RecordingOptionsDemo />,
            code: "RecordingOptionsDemo",
            caption:
              "A recorder's recording settings. Click anywhere on a row, not only the chip. A description sits under the label. The second card's settings wait for a card in slot B, so the group is muted and skipped by Tab.",
          },
        }}
      >
        <StatesDemo />
      </Stage>

      <Stage
        title="Select all"
        tier="instant"
        caption="The parent shows a dash while only some pages are on, and a check when all are. Clicking it sets every page. The state lives in the DOM, so a screen reader hears it as mixed."
        code="SelectAllDemo"
        byWorld={{
          device: {
            demo: <ExportTakesDemo />,
            code: "ExportTakesDemo",
            caption: "The parent shows a dash while only some takes are on, and a check when all are. Clicking it sets every take. The state lives in the DOM, so a screen reader hears it as mixed.",
          },
        }}
      >
        <SelectAllDemo />
      </Stage>

      <Stage
        title="Radio group"
        tier="instant"
        caption="Arrow keys move between the radios and select, because they share one name. Press Deploy with nothing picked: the group gets a danger message, linked to the fieldset, and focus moves in."
        code="DeployTargetDemo"
        byWorld={{
          device: {
            demo: <ExportToDemo />,
            code: "ExportToDemo",
            caption: "Arrow keys move between the radios and select, because they share one name. Press Export with nothing picked: the group gets a fault in words, linked to the fieldset, and focus moves in.",
          },
        }}
      >
        <DeployTargetDemo />
      </Stage>

      <Stage
        title="Drawn and native"
        tier="instant"
        caption="Drawn is the default: the 20px chip is the material's own box (a cut in Press, an outline in Flat), with the control line and the control radius, the same in every browser. Native is the spec's other option, the browser's own 16px box in the foreground color. Both are real inputs with the same label."
        code="AppearanceDemo"
      >
        <AppearanceDemo />
      </Stage>

      <TryIt of="Checkbox" component={Checkbox} props={{ label: "Send the invoice to Marlow Labs", description: "A PDF goes to billing@marlowlabs.com." }} controls={["label", "description", "appearance", "indeterminate", "invalid", { name: "disabled", type: "boolean" }]} />
    </Page>
  );
}
