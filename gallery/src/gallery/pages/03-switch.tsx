import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { Switch } from "@/components/switch";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "switch",
  title: "Switch",
  lede: "A setting that is on or off, with the word to say which.",
  ledeByWorld: {
    press: "A block thrown along a tray, uncovering On or Off.",
  },
  order: 3.02,
  group: "Selection",
  verbs: ["press"],
  summary:
    "An on or off setting you can feel. Click, tap or drag it, and it says On or Off in a word as well as by where it stands. Neutral keeps it quiet; accent marks it when on, for the one switch that is a view's main choice. The label sits beside it, or the switch sits at the end of a settings row.",
  summaryByWorld: {
    press: "An on or off setting you can feel. A raised block rides a sunken tray with On and Off set in its floor, and the block's travel uncovers the one that is true. Press it and it presses down; click, tap or drag it across. Neutral keeps the block white; accent fills it when on, for the one switch that is a view's main choice. The block crosses on the responsive tier, and the tray never moves. The label sits beside it, or the switch sits at the end of a settings row.",
  },
  fun: "Flip a switch: the block springs across and meets the far wall with a little life.",
  tiers: ["responsive", "instant"],
  mechanism:
    "Press the row and the block presses down, its cast tightening at once. A click, a tap or Space sends it across the tray on the responsive tier, 200ms with no bounce. Or take the block and drag it: it follows the finger one to one and lands on the nearer side. Its fill and cast change on the instant tier, 100ms, and the tray never moves. Under Press the block is weight: it presses down and is thrown along the tray, uncovering the word set in the floor. Under Flat it is a small ink pill with a canvas knob when on and an outline when off, the word in type beside it. Under Device it is a toggle key: it sinks its 2px under the finger and flips across its well in three steps with a detent, and its word lights on an LCD beside it with a lamp. Reduced motion drops the crossing.",
};

export const docs: PageDocs = {
  components: ["switch"],
  exports: ["Switch"],
  usage: `import { Switch } from "@/components/switch";

<Switch label="Email me when a build finishes" defaultChecked />

// The accent fills the block when on. One per view (R6): the switch that is the view's main choice.
<Switch tone="accent" label="Site is live" checked={live} onCheckedChange={setLive} />

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
    "tone=\"accent\" for the one switch that is the view's main choice, such as whether a site is live. It is an accent fill, so keep it to one per view (R6), and leave every switch in a list neutral.",
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
    [["Drag"], "Takes the block across. It follows the finger, says the side it is over, and lands on the nearer side when let go."],
  ],
  a11y: [
    "The switch is a <button> with role=\"switch\" and aria-checked, from Radix. A screen reader says the label, then switch, then on or off.",
    "The label is a real <label for> stretched over the whole row, so a click or tap anywhere in it toggles the switch. The accessible name is only the label text, and the description is linked with aria-describedby.",
    "On and off differ in the block's position and the word it uncovers, so color is never the only signal. The word is hidden from screen readers, which hear on or off from aria-checked instead, and it reaches 4.5:1 in both themes and both tones.",
    "In a form, Radix adds a hidden checkbox that carries the name and value. It is hidden from screen readers, so the setting is not read twice.",
    "A switch changes at once, and nothing tells a screen reader that it saved. If the change is saved, confirm it somewhere, such as a status line or a toast.",
    "Every row is 44px tall at least. A sideways drag that starts on the switch flips it; a vertical one still scrolls the page.",
    "Dragging is never the only way: a click, a tap, Space or Enter does the same, and a screen reader's activate flips it.",
    "Keyboard focus draws a 2px outline at a 2px offset around the switch. Mouse and touch presses do not show it.",
    "In forced colors mode the switch keeps real borders and the on state uses the system highlight.",
    "A disabled switch is muted, skipped by Tab, left out of a form, and exempt from contrast rules. If the reason is not obvious, say it in the description.",
  ],
};

function ReplayFlip() {
  const { reduced } = useMotionDial();
  const [on, setOn] = useState(reduced);
  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => setOn(true), 300);
    return () => clearTimeout(t);
  }, [reduced]);
  return <Switch label="Email me about new deploys" checked={on} onCheckedChange={setOn} />;
}

export const study: PageStudy = {
  object: <Switch label="Email me about new deploys" defaultChecked />,
  parts: [
    { name: "The tray", selector: "[role=switch]" },
    { name: "The block", selector: "[role=switch] [data-state]" },
    { name: "The word", selector: "[role=switch] span[aria-hidden]:not(:empty)" },
    { name: "The label", selector: "label" },
  ],
  states: {
    default: <Switch label="Email me about new deploys" defaultChecked />,
    disabled: <Switch label="Email me about new deploys" defaultChecked disabled />,
  },
  replay: {
    label: "Replay the flip",
    caption: "Watch it go from Off to On, and the word change with it.",
    run: () => <ReplayFlip />,
  },
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

function LiveDemo() {
  const [live, setLive] = useState(true);

  return (
    <div className="grid w-full max-w-sm gap-3">
      <Switch
        tone="accent"
        align="end"
        label="Kiln is live"
        description={live ? "Anyone with the link can see kiln.studio." : "Only the team can see kiln.studio."}
        checked={live}
        onCheckedChange={setLive}
      />
    </div>
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

/* ---------- Device's own (plans/024, phase 3): a field recorder's settings ---------- */

function RecordingSettingsDemo() {
  const [saved, setSaved] = useState("");
  const note = (setting: string) => (on: boolean) => setSaved(`Saved. ${setting} is ${on ? "on" : "off"}.`);

  return (
    <div className="grid w-full max-w-lg gap-3">
      <p className="text-small font-title text-fg">Recording</p>
      <ul className="divide-y divide-line border-y border-line">
        <li>
          <Switch align="end" label="Record a safety track at −12 dB" defaultChecked onCheckedChange={note("The safety track")} />
        </li>
        <li>
          <Switch align="end" label="Split takes at 4 GB" onCheckedChange={note("Splitting")} />
        </li>
        <li>
          <Switch
            align="end"
            label="Pre-roll"
            description="Keeps the 2 s before you press REC, so a first word is never lost."
            defaultChecked
            onCheckedChange={note("Pre-roll")}
          />
        </li>
      </ul>
      <p role="status" className="min-h-5 text-small text-fg-subtle">
        {saved}
      </p>
    </div>
  );
}

function PhantomFormDemo() {
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
        <Switch name="phantom" label="Phantom power" description="48 V on inputs 1 and 2, for condenser mics." />
        <Checkbox name="checked" label="The mics on inputs 1 and 2 take 48 V" />
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

function ArmDemo() {
  const [armed, setArmed] = useState(true);

  return (
    <div className="grid w-full max-w-sm gap-3">
      <Switch
        tone="accent"
        align="end"
        label="Input 1 armed"
        description={armed ? "The next take records input 1." : "Input 1 is monitored, not recorded."}
        checked={armed}
        onCheckedChange={setArmed}
      />
    </div>
  );
}

function RecorderLockedDemo() {
  return (
    <div className="grid w-full max-w-xl gap-x-12 gap-y-6 sm:grid-cols-2">
      <div className="grid content-start gap-2">
        <p className="text-small text-fg-subtle">Off and disabled</p>
        <Switch disabled label="Wi-Fi transfer" description="Needs firmware 2.1." />
      </div>
      <div className="grid content-start gap-2">
        <p className="text-small text-fg-subtle">On and disabled</p>
        <Switch disabled defaultChecked label="Limiter on input 1" description="Set by the scene." />
      </div>
    </div>
  );
}

/* ---------- Flat's own (plans/024, phase 3): a small site and its letter ---------- */

function LetterSettingsDemo() {
  const [saved, setSaved] = useState("");
  const note = (setting: string) => (on: boolean) => setSaved(`Saved. ${setting} is ${on ? "on" : "off"}.`);

  return (
    <div className="grid w-full max-w-lg gap-3">
      <p className="text-small font-title text-fg">Your letter</p>
      <ul className="divide-y divide-line border-y border-line">
        <li>
          <Switch align="end" label="Send the letter every Friday at 9:00" defaultChecked onCheckedChange={note("The Friday letter")} />
        </li>
        <li>
          <Switch align="end" label="Email me when someone subscribes" onCheckedChange={note("The new reader email")} />
        </li>
        <li>
          <Switch
            align="end"
            label="Let readers reply"
            description="A reply comes to your inbox, never to the site, so only you see it."
            defaultChecked
            onCheckedChange={note("Replies")}
          />
        </li>
      </ul>
      <p role="status" className="min-h-5 text-small text-fg-subtle">
        {saved}
      </p>
    </div>
  );
}

function SubscribeFormDemo() {
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
        <Switch name="letter" label="The weekly letter" description="One email on Friday morning with the week's posts." />
        <Checkbox name="agreed" label="I agree to get the letter by email" />
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

function SiteLiveDemo() {
  const [live, setLive] = useState(true);

  return (
    <div className="grid w-full max-w-sm gap-3">
      <Switch
        tone="accent"
        align="end"
        label="Your site is public"
        description={live ? "Anyone can read it." : "Only you can see it."}
        checked={live}
        onCheckedChange={setLive}
      />
    </div>
  );
}

function SiteLockedDemo() {
  return (
    <div className="grid w-full max-w-xl gap-x-12 gap-y-6 sm:grid-cols-2">
      <div className="grid content-start gap-2">
        <p className="text-small text-fg-subtle">Off and disabled</p>
        <Switch disabled label="Paid posts" description="Comes with a paid plan." />
      </div>
      <div className="grid content-start gap-2">
        <p className="text-small text-fg-subtle">On and disabled</p>
        <Switch disabled defaultChecked label="Unsubscribe link" description="Every letter carries one." />
      </div>
    </div>
  );
}

/* ---------- Rack's own (proposals/rack.md): transport & track routing switches ---------- */

function SessionSwitchesDemo() {
  const [saved, setSaved] = useState("");
  const note = (setting: string) => (on: boolean) => setSaved(`${setting} ${on ? "on" : "off"}.`);

  return (
    <div className="grid w-full max-w-lg gap-3">
      <p className="text-small font-title text-fg">Session transport</p>
      <ul className="divide-y divide-line border-y border-line">
        <li>
          <Switch align="end" label="Metronome click" defaultChecked onCheckedChange={note("Metronome")} />
        </li>
        <li>
          <Switch align="end" label="Loop brace (Bars 25–33)" defaultChecked onCheckedChange={note("Loop brace")} />
        </li>
        <li>
          <Switch
            align="end"
            label="Overdub MIDI"
            description="Layers new notes onto the active clip without erasing previous takes."
            onCheckedChange={note("MIDI overdub")}
          />
        </li>
      </ul>
      <p role="status" className="min-h-5 text-small text-fg-subtle">
        {saved}
      </p>
    </div>
  );
}

function TrackArmDemo() {
  const [armed, setArmed] = useState(true);

  return (
    <div className="grid w-full max-w-sm gap-3">
      <Switch
        tone="accent"
        align="end"
        label="Device active · Dub Echo"
        description={armed ? "Processing Return A in real time." : "Bypassed; signal passes dry."}
        checked={armed}
        onCheckedChange={setArmed}
      />
    </div>
  );
}

/* ---------- Press's own (plans/024, Press): deploy settings ---------- */

function DeploySettingsDemo() {
  const [autoDeploy, setAutoDeploy] = useState(true);
  const [previews, setPreviews] = useState(true);
  const [purge, setPurge] = useState(false);

  return (
    <div className="grid w-full max-w-md gap-4">
      <Switch
        align="end"
        label="Auto-deploy main"
        description="Build and promote every commit pushed to harbor-web main."
        checked={autoDeploy}
        onCheckedChange={setAutoDeploy}
      />
      <Switch
        align="end"
        label="Preview URLs"
        description="Spin up an isolated fra1 preview for each open pull request."
        checked={previews}
        onCheckedChange={setPreviews}
      />
      <Switch
        align="end"
        label="Purge edge cache on release"
        description="Invalidate static assets across every edge region after promote."
        checked={purge}
        onCheckedChange={setPurge}
      />
    </div>
  );
}

export default function SwitchPage() {
  return (
    <Page meta={meta} docs={docs} study={study}>
      <Stage
        title="Settings list"
        tier="responsive"
        caption="Click anywhere on a row, press Space on the switch, or take a block and drag it across. Pressing presses the block down, and it crosses on the responsive tier. The switches sit at the row's end, so they line up in one column, and every one is neutral: a list never takes the accent."
        code="SettingsListDemo"
        byWorld={{
          press: {
            demo: <DeploySettingsDemo />,
            title: "Deploy settings",
            code: "DeploySettingsDemo",
            caption:
              "Project settings for harbor-web. Each switch is a raised stone block crossing a recessed tray — neutral in a list, never taking the accent.",
          },
          flat: {
            demo: <LetterSettingsDemo />,
            title: "Letter settings",
            code: "LetterSettingsDemo",
            caption:
              "Press anywhere on a row, press Space on the switch, or take the knob and drag it across: it crosses on the responsive tier. Off is an outline, on is the ink. The switches sit at the row's end, so they line up in one column, and every one is neutral: a list never takes the accent.",
          },
          device: {
            demo: <RecordingSettingsDemo />,
            title: "Recording settings",
            code: "RecordingSettingsDemo",
            caption:
              "Press anywhere on a row, press Space on the switch, or take the cap and drag it across. It snaps through where it stands, and a switch that is on lights its lamp. The switches sit at the row's end, so they line up in one column.",
          },
          rack: {
            demo: <SessionSwitchesDemo />,
            title: "Session transport",
            code: "SessionSwitchesDemo",
            caption:
              "Under Rack, Switch is a compact flat toggle key that cuts on and off in place on the frame — Metronome, Loop brace, and MIDI overdub.",
          },
        }}
      >
        <SettingsListDemo />
      </Stage>

      <Stage
        title="In a short form"
        tier="responsive"
        caption="The default alignment puts the switch first, like the checkbox, so the two stack in one column. Press Save: a form sends the switch as digest=on while it is on and sends nothing while it is off. The checkbox is for the consent, because that choice can be wrong."
        code="DigestFormDemo"
        byWorld={{
          flat: {
            demo: <SubscribeFormDemo />,
            code: "SubscribeFormDemo",
            caption:
              "The default alignment puts the switch first, like the checkbox, so the two stack in one column. Press Save: a form sends the switch as letter=on while it is on and sends nothing while it is off. The checkbox is for the consent, because that choice can be wrong.",
          },
          device: {
            demo: <PhantomFormDemo />,
            code: "PhantomFormDemo",
            caption:
              "The default alignment puts the switch first, like the checkbox, so the two stack in one column. Press Save: a form sends the switch as phantom=on while it is on and sends nothing while it is off. The checkbox is for the check, because that choice can be wrong: 48 V can harm a mic that does not take it.",
          },
        }}
      >
        <DigestFormDemo />
      </Stage>

      <Stage
        title="Accent when on"
        tier="responsive"
        caption="The accent tone fills the block with the accent when it is on. It is the view's one accent fill, so it belongs to the one switch that is the view's main choice, such as whether a site is live."
        code="LiveDemo"
        byWorld={{
          flat: { demo: <SiteLiveDemo />, code: "SiteLiveDemo" },
          device: {
            demo: <ArmDemo />,
            title: "Armed",
            code: "ArmDemo",
            caption: "The one switch that is the view's main choice, whether an input is armed. On Device its lamp lights orange when it is on: a hand set it.",
          },
          rack: {
            demo: <TrackArmDemo />,
            title: "Device active",
            code: "TrackArmDemo",
            caption: "Under Rack, the one main toggle lights in Live's warm yellow (--accent) inside its crisp 1px key outline.",
          },
        }}
      >
        <LiveDemo />
      </Stage>

      <Stage
        title="Disabled"
        tier="instant"
        caption="A disabled switch is muted, skipped by Tab and left out of a form. The tray goes flat to surface-2 with a hairline, and the block lies flat in it with no cast. The block stays on its side and uncovers its word, so the state still reads."
        code="DisabledDemo"
        byWorld={{ flat: { demo: <SiteLockedDemo />, code: "SiteLockedDemo" }, device: { demo: <RecorderLockedDemo />, code: "RecorderLockedDemo" } }}
      >
        <DisabledDemo />
      </Stage>

      <TryIt of="Switch" component={Switch} props={{ label: "Email me when a build finishes", description: "One email per build, never a digest." }} />
    </Page>
  );
}
