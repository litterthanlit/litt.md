import { useState } from "react";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { Switch } from "@/components/switch";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "switch",
  title: "Switch",
  lede: "On or off, in a pill that slides.",
  order: 3.3,
  group: "Controls",
  summary:
    "An on or off setting. A pill track with a round thumb, filled with the foreground color when on and never the accent. The thumb slides and the fills fade on the instant tier, and the box never moves. The label sits beside it, or the switch sits at the end of a settings row.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["switch"],
  exports: ["Switch"],
  usage: `import { Switch } from "@/components/switch";

<Switch label="Email me when a build finishes" defaultChecked />

// A settings list: align="end" puts the switch at the row's end, so they line up.
<Switch
  align="end"
  label="Preview deploys for every branch"
  description="Each pushed branch gets its own link."
  checked={previews}
  onCheckedChange={setPreviews}
/>

// In a form, name sends "on" while the switch is on and nothing while it is off.
<form onSubmit={save}>
  <Switch name="digest" label="Weekly digest" />
</form>`,
  use: [
    "A setting that is on or off and takes effect as a setting: an email when a build finishes, preview deploys, a weekly digest.",
    "A settings list. Set align=\"end\" so the label and description come first and the switches line up in one column.",
    "A short form, beside checkboxes. The default alignment puts the switch first, like a checkbox.",
    "A form field that is either sent or not. A form gets the value (\"on\" unless you set value) while the switch is on, and nothing while it is off.",
  ],
  skip: [
    "A choice that can be wrong, such as accepting terms or confirming a launch. Use Checkbox. A switch has no error state.",
    "Picking one of several options. Use Segmented for two to five short options, or a RadioGroup when each needs a description.",
    "An action, such as Publish. Use Button.",
    "A choice that waits for a Save button. A switch looks like it applies at once, so use Checkbox there.",
  ],
  keyboard: [
    [["Tab"], "Moves focus to the switch. A disabled switch is skipped."],
    [["Space"], "Toggles the focused switch."],
    [["Enter"], "Also toggles it, because the switch is a button. In a form it does not submit."],
  ],
  a11y: [
    "The switch is a <button> with role=\"switch\" and aria-checked, from Radix. A screen reader says the label, then switch, then on or off.",
    "The label is a real <label for> stretched over the whole row, so a click or tap anywhere in it toggles the switch. The accessible name is only the label text, and the description is linked with aria-describedby.",
    "On and off differ in the thumb's position, the track's fill and the thumb's color, so color is never the only signal.",
    "In a form, Radix adds a hidden checkbox that carries the name and value. It is hidden from screen readers, so the setting is not read twice.",
    "A switch changes at once, and nothing tells a screen reader that it saved. If the change is saved, confirm it somewhere, such as a status line or a toast.",
    "The row is 36px tall and 44px on touch screens. A settings row (align=\"end\") is 44px tall at least.",
    "Keyboard focus draws a 2px outline at a 2px offset around the track. Mouse and touch presses do not show it.",
    "In forced colors mode the track gets a real border and the on state uses the system highlight.",
    "A disabled switch is muted, skipped by Tab, left out of a form, and exempt from contrast rules. If the reason is not obvious, say it in the description.",
  ],
};

function SettingsListDemo() {
  const [saved, setSaved] = useState("");
  const note = (setting: string) => (on: boolean) => setSaved(`Saved. ${setting} is ${on ? "on" : "off"}.`);

  return (
    <div className="grid w-full max-w-lg gap-3">
      <p className="text-small font-title text-fg">Notifications for litt.design</p>
      <ul className="divide-y divide-line border-y border-line">
        <li>
          <Switch align="end" label="Email me when a build finishes" defaultChecked onCheckedChange={note("Build email")} />
        </li>
        <li>
          <Switch align="end" label="Weekly digest" onCheckedChange={note("The weekly digest")} />
        </li>
        <li>
          <Switch
            align="end"
            label="Preview deploys for every branch"
            description="Each pushed branch gets its own link, so a client can review it before it merges."
            defaultChecked
            onCheckedChange={note("Preview deploys")}
          />
        </li>
      </ul>
      <p role="status" className="min-h-5 text-small text-fg-subtle">
        {saved}
      </p>
    </div>
  );
}

function DigestFormDemo() {
  const [result, setResult] = useState("");

  return (
    <form
      className="grid w-full max-w-sm gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        const sent = [...new FormData(e.currentTarget).entries()].map(([key, value]) => `${key}=${value}`);
        setResult(sent.length ? `Sent: ${sent.join(", ")}` : "Sent: nothing, both are off.");
      }}
    >
      <div className="grid justify-items-start">
        <Switch name="digest" label="Weekly digest" description="A Monday email with visits and deploys for Kiln." />
        <Checkbox name="approved" label="Halden Studio approved the launch" />
      </div>
      <div className="grid gap-3">
        <Button type="submit" variant="primary">
          Save
        </Button>
        <p role="status" className="min-h-5 text-small text-fg-subtle">
          {result}
        </p>
      </div>
    </form>
  );
}

function DisabledDemo() {
  return (
    <div className="grid w-full max-w-xl gap-x-12 gap-y-6 sm:grid-cols-2">
      <div className="grid content-start gap-2">
        <p className="text-small text-fg-subtle">Off and disabled</p>
        <Switch disabled label="Password protection" description="Part of the Studio plan." />
      </div>
      <div className="grid content-start gap-2">
        <p className="text-small text-fg-subtle">On and disabled</p>
        <Switch disabled defaultChecked label="Remove the Framer badge" description="Set by the Studio plan." />
      </div>
    </div>
  );
}

export default function SwitchPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Settings list"
        tier="instant"
        caption="Click anywhere on a row, or press Space on the switch. The thumb slides and the fills fade together on the instant tier. Hover and press wash the track. The switches sit at the row's end, so they line up in one column."
        code="SettingsListDemo"
      >
        <SettingsListDemo />
      </Stage>

      <Stage
        title="In a short form"
        tier="instant"
        caption="The default alignment puts the switch first, like the checkbox, so the two stack in one column. Press Save: a form sends the switch as digest=on while it is on and sends nothing while it is off. The checkbox is for the consent, because that choice can be wrong."
        code="DigestFormDemo"
      >
        <DigestFormDemo />
      </Stage>

      <Stage
        title="Disabled"
        tier="instant"
        caption="A disabled switch is muted, skipped by Tab and left out of a form. Off keeps a surface-2 track with a hairline. On steps to surface-3, and the thumb stays at the end, so the state still reads."
        code="DisabledDemo"
      >
        <DisabledDemo />
      </Stage>
    </Page>
  );
}
