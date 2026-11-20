import { useState, type FormEvent } from "react";
import { Button } from "@/components/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/dialog";
import { TextField } from "@/components/input";
import { Select, SelectField, type SelectOption } from "@/components/select";
import { DeviceProvider,} from "@/motion";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "select",
  title: "Select",
  lede: "One value from a short list.",
  ledeByWorld: { heat: "One value from a striped slab, the row under the keys in brackets." },
  order: 2.06,
  group: "Inputs",
  verbs: ["select", "open"],
  summary:
    "One value from a short list. You press the trigger, so it is a raised block, the secondary Button's, and it stays pressed while its list is open. The list is a tray of slats in glass, 44px each, with one gliding highlight, and the current slat lifted with a check. The list grows from the trigger and leaves again, and on a phone it stays anchored beside it.",
  summaryByWorld: {
    heat: "One value from a short list. The trigger is a square cell in a 1px line, and corner brackets snap onto it while it is hovered, focused or open. The list is a square slab banded with stripes at its top and foot. The row under the keys or the pointer takes a darker cell, brackets and lit words, and the current value carries a check.",
  },
  fun: "Move through the options: the highlight reaches for the next row, then gathers itself there.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["select"],
  exports: ["SelectField", "Select"],
  usage: `import { Select, SelectField } from "@/components/select";

const ROLES = [
  { value: "designer", label: "Designer" },
  { value: "developer", label: "Developer" },
  { value: "producer", label: "Producer" },
  { value: "studio-lead", label: "Studio lead" },
];

// A form field: the label, the help and the error are wired up for you. Pass name and a form sends the value.
<SelectField label="Role" name="role" options={ROLES} defaultValue="designer" help="Sets what you see in the studio." />
<SelectField label="Hosting region" options={REGIONS} placeholder="Choose a region" error="Choose a region for the deploy." />

// The bare Select is for a toolbar. It has no label, so it needs an aria-label. Set the width on a wrapper.
<div className="w-44">
  <Select size="sm" aria-label="Sort by" options={SORTS} value={sort} onValueChange={setSort} />
</div>

// Control the list with open and onOpenChange. Inside a dialog, a sheet or the header, the list turns solid by itself.`,
  use: [
    "One value from a short list: a role, a region, a plan, a Framer site. Use SelectField, which carries the label, the help and the error.",
    "A sort or a filter in a toolbar. Use Select at size sm with an aria-label, beside an sm Button.",
    "A field beside an lg button. Use size lg, on the same 56px as the button, as Input does.",
    "Inside a dialog or on a phone, with no change from you. The list turns solid over glass, and on a phone it stays anchored beside the trigger.",
    "A form that submits natively. Pass name and the value travels in a hidden native field.",
  ],
  skip: [
    "A long list, or one a person needs to search. Use the Command menu.",
    "Two to four options that should stay visible. Use Segmented, or radios if each needs a sentence.",
    "A list of actions, such as rename and delete. Use Menu, which runs a command and keeps no current value.",
    "Several values at once. A select picks exactly one.",
    "A label that lives in the placeholder. The placeholder goes away once a value is picked, so every select needs a real label.",
  ],
  keyboard: [
    [["Enter", "Space", "ArrowDown", "ArrowUp"], "On the trigger: opens the list with focus on the current option, or on the first option when nothing is picked. The highlight shows a focus ring."],
    [["a-z"], "On the closed trigger: picks the next option that starts with the letters, without opening the list."],
    [["ArrowDown", "ArrowUp"], "In the list: moves the highlight to the next or previous option. Disabled options are skipped. It does not wrap."],
    [["Home", "End"], "In the list: moves to the first or last option."],
    [["a-z"], "In the list: jumps to the next option that starts with the letters you type."],
    [["Enter", "Space"], "In the list: picks the highlighted option, closes the list and returns focus to the trigger."],
    [["Esc"], "Closes the list, keeps the value and returns focus to the trigger."],
    [["Tab"], "Does nothing while the list is open. Pick an option or press Esc first."],
  ],
  a11y: [
    "Radix supplies the semantics. The trigger is role=\"combobox\" with aria-expanded and aria-controls, the list is role=\"listbox\" and each row is role=\"option\".",
    "SelectField gives the trigger its label and links the help or error with aria-describedby. An error also sets aria-invalid. Clicking the label moves focus to the trigger and does not open the list. The bare Select has no label, so give it an aria-label or aria-labelledby, which also names its list.",
    "While the list is open the rest of the page is hidden from screen readers, cannot be clicked and cannot scroll. A click outside or Esc closes it. Focus returns to the trigger as soon as it closes.",
    "A form reads the value from a hidden native select, which carries name and required. It sits out of sight, so do not rely on the browser's own message: validate on submit yourself and pass the message to error.",
    "The check marks the current option, and the word in the trigger says the same, so the check is never the only signal. The error edge is never alone either: the message under the field says how to fix it.",
    "Opened with the pointer, no row is lit until the pointer moves or a key is pressed. Opened with a key, the highlight carries a 1px focus ring, because a faint fill alone is not enough.",
    "On touch the trigger text is 16px so iOS does not zoom, the sm trigger grows from 32px to 44px, and rows are 44px. A pressed row fills, and a tap opens the list without picking the row under the finger.",
    "The list is glass, and solid when the trigger sits inside glass, such as a dialog, a sheet, the header or a popover, because glass never sits on glass.",
    "Under reduced motion the list appears and leaves at once, with no travel.",
  ],
};

const ROLES: SelectOption[] = [
  { value: "designer", label: "Designer" },
  { value: "developer", label: "Developer" },
  { value: "producer", label: "Producer" },
  { value: "studio-lead", label: "Studio lead" },
];

const SITES: SelectOption[] = [
  { value: "atelier-nord", label: "atelier-nord.com" },
  { value: "kiln", label: "Kiln" },
  { value: "halden-studio", label: "Halden Studio" },
];

const SORTS: SelectOption[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name A to Z" },
  { value: "slowest", label: "Slowest build" },
];

const TARGETS: SelectOption[] = [
  { value: "preview", label: "Preview" },
  { value: "staging", label: "Staging" },
  { value: "production", label: "Production" },
];

const REGIONS: SelectOption[] = [
  { value: "fra", label: "Frankfurt" },
  { value: "arn", label: "Stockholm" },
  { value: "lhr", label: "London" },
  { value: "iad", label: "Washington, D.C." },
  { value: "sfo", label: "San Francisco" },
  { value: "syd", label: "Sydney", disabled: true },
];

const PAGES: SelectOption[] = [
  { value: "home", label: "Home" },
  { value: "press", label: "Halden Studio, press kit and annual report 2026 (draft for review)" },
  { value: "work", label: "Work" },
];

/** A quiet status line beside a trigger, so each stage shows what the select did. */
function Status({ children }: { children: string }) {
  return (
    <p role="status" className="min-h-5 text-caption font-normal text-fg-subtle">
      {children}
    </p>
  );
}

/* ------------------------------------------------------------ a form field */

function AccountFormDemo() {
  const [sent, setSent] = useState("");
  const send = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSent(`Sent role=${data.get("role")}`);
  };
  return (
    <form onSubmit={send} className="grid w-full max-w-sm gap-6">
      <SelectField label="Role" name="role" options={ROLES} defaultValue="designer" help="Sets what you see in the studio." />
      <TextField label="Full name" name="name" autoComplete="name" defaultValue="Mara Lindqvist" />
      <TextField label="Work email" name="email" type="email" autoComplete="email" defaultValue="mara@litt.design" />
      <div className="grid gap-3">
        <Button variant="primary" type="submit">
          Save account
        </Button>
        <Status>{sent}</Status>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ sizes */

function SizesDemo() {
  const [sort, setSort] = useState("newest");
  const [site, setSite] = useState("atelier-nord");
  return (
    <div className="grid w-full max-w-xl gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-44">
          <Select size="sm" aria-label="Sort by" options={SORTS} value={sort} onValueChange={setSort} />
        </div>
        <Button size="sm">Export CSV</Button>
      </div>
      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
        <Select size="md" aria-label="Framer site" options={SITES} value={site} onValueChange={setSite} />
        <Button size="md">Open site</Button>
      </div>
      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
        <Select size="lg" aria-label="Deploy to" options={TARGETS} defaultValue="preview" />
        <Button size="lg" variant="primary">
          Deploy
        </Button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- states */

function StatesDemo() {
  const [region, setRegion] = useState("");
  const [error, setError] = useState<string | null>("Choose a region for the deploy.");
  return (
    <div className="grid w-full max-w-2xl gap-x-6 gap-y-8 sm:grid-cols-2">
      <SelectField
        label="Framer site"
        options={SITES}
        defaultValue="atelier-nord"
        help="Builds and deploys run for this site."
      />
      <SelectField
        label="Hosting region"
        options={REGIONS}
        placeholder="Choose a region"
        value={region}
        error={error}
        help="Closest to the client's visitors."
        onValueChange={(next) => {
          setRegion(next);
          setError(null);
        }}
      />
      <SelectField
        label="Framer project"
        options={SITES}
        defaultValue="kiln"
        disabled
        help="Linked at kickoff, so it cannot change."
      />
      <SelectField label="Page to redirect to" options={PAGES} defaultValue="press" help="A long value ends in an ellipsis." />
    </div>
  );
}

/* --------------------------------------------------------------- in a dialog */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function InviteDemo() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("designer");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setError("Enter a full address, like nina@halden.studio.");
      e.currentTarget.querySelector("input")?.focus();
      return;
    }
    setOpen(false);
    setStatus(`Invite sent to ${email.trim()} as ${ROLES.find((r) => r.value === role)?.label}.`);
  };

  return (
    <div className="flex items-center gap-4">
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) {
            setEmail("");
            setRole("designer");
            setError(null);
          }
          setOpen(next);
        }}
      >
        <DialogTrigger asChild>
          <Button>Invite a teammate</Button>
        </DialogTrigger>
        <DialogContent
          title="Invite a teammate"
          description="They get an email with a link to the litt.design workspace."
          footer={
            <>
              <DialogClose asChild>
                <Button>Cancel</Button>
              </DialogClose>
              <Button variant="primary" type="submit" form="invite-form">
                Send invite
              </Button>
            </>
          }
        >
          <form id="invite-form" onSubmit={submit} noValidate className="grid gap-6">
            <TextField
              label="Work email"
              type="email"
              autoComplete="off"
              placeholder="nina@halden.studio"
              value={email}
              error={error}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
            />
            <SelectField label="Role" options={ROLES} value={role} onValueChange={setRole} />
          </form>
        </DialogContent>
      </Dialog>
      <Status>{status}</Status>
    </div>
  );
}

/* ----------------------------------------------------------------- on a phone */

/** The same select forced to the phone path, so a desktop can preview it. A real phone needs no wrapper. */
function PhoneDemo() {
  const [site, setSite] = useState("kiln");
  return (
    <DeviceProvider mode="phone">
      <div className="w-full max-w-sm">
        <SelectField
          label="Framer site"
          name="site"
          options={SITES}
          value={site}
          onValueChange={setSite}
          help="The list stays beside the field. It is not a sheet."
        />
      </div>
    </DeviceProvider>
  );
}

/* ---------- the overview's tile ---------- */

function RoleTile() {
  return (
    <div className="w-full max-w-xs">
      <SelectField label="Role" name="role" options={ROLES} defaultValue="designer" help="Sets what you see in the studio." />
    </div>
  );
}

/* ---------- Device's own (plans/024, phase 3): a field recorder's settings, inputs and shared card ---------- */

const RATES: SelectOption[] = [
  { value: "44.1", label: "44.1 kHz" },
  { value: "48", label: "48 kHz" },
  { value: "96", label: "96 kHz" },
  { value: "192", label: "192 kHz" },
];

const INPUTS: SelectOption[] = [
  { value: "in-1", label: "Input 1" },
  { value: "in-2", label: "Input 2" },
  { value: "pair-1-2", label: "Inputs 1 and 2, stereo" },
];

const TAKE_SORTS: SelectOption[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name A to Z" },
  { value: "longest", label: "Longest take" },
];

const EXPORT_TO: SelectOption[] = [
  { value: "card", label: "Card A" },
  { value: "phone", label: "Phone" },
  { value: "drive", label: "Studio drive" },
];

const FORMATS: SelectOption[] = [
  { value: "wav", label: "WAV, 24 bit" },
  { value: "bwf", label: "Broadcast WAV, with timecode" },
  { value: "flac", label: "FLAC" },
  { value: "mp3", label: "MP3, 320 kbps", disabled: true },
];

const CLOCKS: SelectOption[] = [
  { value: "internal", label: "Internal" },
  { value: "timecode", label: "Timecode in" },
];

const FOLDERS: SelectOption[] = [
  { value: "today", label: "Today" },
  { value: "scene-12", label: "Mossgrove Hotel, lobby, night ambience and room tone for scene 12 (second pass)" },
  { value: "archive", label: "Archive" },
];

const ACCESS: SelectOption[] = [
  { value: "listen", label: "Listen only" },
  { value: "tag", label: "Listen and tag" },
  { value: "export", label: "Edit and export" },
];

function RecorderSettingsDemo() {
  const [sent, setSent] = useState("");
  const send = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSent(`Sent rate=${data.get("rate")}`);
  };
  return (
    <form onSubmit={send} className="grid w-full max-w-sm gap-6">
      <SelectField label="Sample rate" name="rate" options={RATES} defaultValue="48" help="Every new take records at this rate." />
      <TextField label="Recorder name" name="name" defaultValue="Mara’s FR-2" />
      <TextField label="File prefix" name="prefix" mono spellCheck={false} defaultValue="take_" />
      <div className="grid gap-3">
        <Button variant="primary" type="submit">
          Save settings
        </Button>
        <Status>{sent}</Status>
      </div>
    </form>
  );
}

function TakeListSizesDemo() {
  const [sort, setSort] = useState("newest");
  const [input, setInput] = useState("pair-1-2");
  return (
    <div className="grid w-full max-w-xl gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-44">
          <Select size="sm" aria-label="Sort takes by" options={TAKE_SORTS} value={sort} onValueChange={setSort} />
        </div>
        <Button size="sm">Export list</Button>
      </div>
      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
        <Select size="md" aria-label="Input" options={INPUTS} value={input} onValueChange={setInput} />
        <Button size="md">Arm track</Button>
      </div>
      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
        <Select size="lg" aria-label="Export to" options={EXPORT_TO} defaultValue="card" />
        <Button size="lg" variant="primary">
          Export
        </Button>
      </div>
    </div>
  );
}

function RecorderStatesDemo() {
  const [format, setFormat] = useState("");
  const [error, setError] = useState<string | null>("Choose a format for the export.");
  return (
    <div className="grid w-full max-w-2xl gap-x-6 gap-y-8 sm:grid-cols-2">
      <SelectField label="Input" options={INPUTS} defaultValue="pair-1-2" help="New takes record from this input." />
      <SelectField
        label="File format"
        options={FORMATS}
        placeholder="Choose a format"
        value={format}
        error={error}
        help="WAV keeps every bit of the take."
        onValueChange={(next) => {
          setFormat(next);
          setError(null);
        }}
      />
      <SelectField label="Clock" options={CLOCKS} defaultValue="timecode" disabled help="Set by the timecode box, so it cannot change." />
      <SelectField label="Folder" options={FOLDERS} defaultValue="scene-12" help="A long value ends in an ellipsis." />
    </div>
  );
}

function ShareCardDemo() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [access, setAccess] = useState("listen");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setError("Enter a full address, like nina@studio.com.");
      e.currentTarget.querySelector("input")?.focus();
      return;
    }
    setOpen(false);
    setStatus(`Card A shared with ${email.trim()} (${ACCESS.find((a) => a.value === access)?.label}).`);
  };

  return (
    <div className="flex items-center gap-4">
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) {
            setEmail("");
            setAccess("listen");
            setError(null);
          }
          setOpen(next);
        }}
      >
        <DialogTrigger asChild>
          <Button>Share the card</Button>
        </DialogTrigger>
        <DialogContent
          title="Share the card"
          description="They get an email with a link to every take on card A."
          footer={
            <>
              <DialogClose asChild>
                <Button>Cancel</Button>
              </DialogClose>
              <Button variant="primary" type="submit" form="share-card-form">
                Send invite
              </Button>
            </>
          }
        >
          <form id="share-card-form" onSubmit={submit} noValidate className="grid gap-6">
            <TextField
              label="Email"
              type="email"
              autoComplete="off"
              placeholder="nina@studio.com"
              value={email}
              error={error}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
            />
            <SelectField label="Access" options={ACCESS} value={access} onValueChange={setAccess} />
          </form>
        </DialogContent>
      </Dialog>
      <Status>{status}</Status>
    </div>
  );
}

function InputPhoneDemo() {
  const [input, setInput] = useState("pair-1-2");
  return (
    <DeviceProvider mode="phone">
      <div className="w-full max-w-sm">
        <SelectField
          label="Input"
          name="input"
          options={INPUTS}
          value={input}
          onValueChange={setInput}
          help="The list stays beside the field. It is not a sheet."
        />
      </div>
    </DeviceProvider>
  );
}

function SampleRateTile() {
  return (
    <div className="w-full max-w-xs">
      <SelectField label="Sample rate" name="rate" options={RATES} defaultValue="48" help="Every new take records at this rate." />
    </div>
  );
}

/* ---------- Flat's own (plans/024, phase 3): how often the letter goes out ---------- */

const EVERY: SelectOption[] = [
  { value: "week", label: "Every week" },
  { value: "two-weeks", label: "Every two weeks" },
  { value: "month", label: "Every month" },
  { value: "post", label: "When I post" },
];

function LetterFormDemo() {
  const [sent, setSent] = useState("");
  const send = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSent(`Sent every=${data.get("every")}`);
  };
  return (
    <form onSubmit={send} className="grid w-full max-w-sm gap-6">
      <SelectField label="Send the letter" name="every" options={EVERY} defaultValue="week" help="Readers see this on the sign-up page." />
      <TextField label="From" name="from" defaultValue="Your name" />
      <TextField label="Replies go to" name="reply" type="email" autoComplete="email" defaultValue="hello@example.com" />
      <div className="grid gap-3">
        <Button variant="primary" type="submit">
          Save letter
        </Button>
        <Status>{sent}</Status>
      </div>
    </form>
  );
}

function EveryTile() {
  return (
    <div className="w-full max-w-xs">
      <SelectField label="Send the letter" name="every" options={EVERY} defaultValue="week" help="Readers see this on the sign-up page." />
    </div>
  );
}

/* ---------- Heat's own (proposals/heat.md): event circuit and tune preset picker ---------- */

const HEAT_TRACKS: SelectOption[] = [
  { value: "camden", label: "Camden Beach sprint" },
  { value: "rosewood", label: "Rosewood circuit" },
  { value: "rockport", label: "Rockport tollbooth" },
  { value: "downtown", label: "Downtown loop" },
];

function RaceEventFormDemo() {
  const [sent, setSent] = useState("");
  const send = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSent(`Locked grid: track=${data.get("track")}`);
  };
  return (
    <form onSubmit={send} className="grid w-full max-w-sm gap-6">
      <SelectField label="Event track" name="track" options={HEAT_TRACKS} defaultValue="camden" help="Sets weather, lap count and pursuit sector." />
      <TextField label="Driver handle" name="driver" defaultValue="Rin Vale" />
      <TextField label="Vehicle" name="vehicle" defaultValue="Skyline GT-R · Blacklist #4" />
      <div className="grid gap-3">
        <Button variant="primary" type="submit">
          Enter event
        </Button>
        <Status>{sent}</Status>
      </div>
    </form>
  );
}

function TrackSelectTile() {
  return (
    <div className="w-full max-w-xs">
      <SelectField label="Event track" options={HEAT_TRACKS} defaultValue="camden" help="Camden Beach · 5 laps" />
    </div>
  );
}

export default function SelectPage() {
  return (
    <Page meta={meta} docs={docs} tile={<RoleTile />} tileByWorld={{ device: <SampleRateTile />, flat: <EveryTile />, heat: <TrackSelectTile /> }}>
      <Stage
        title="A role in an account form"
        tier="responsive"
        size="lg"
        align="start"
        code="AccountFormDemo"
        byWorld={{
          flat: {
            demo: <LetterFormDemo />,
            title: "How often the letter goes out",
            code: "LetterFormDemo",
            caption:
              "The select sits in the form like any other field: label above, help below, at the inputs' height. It is a white pill on the grey ground, like the fields beside it. Click it, or press Space, and the list grows out of the trigger and slides a quarter of the travel token from the side it opens on, on the responsive tier. The check marks Every week. Save letter sends the value through the field's name.",
          },
          device: {
            demo: <RecorderSettingsDemo />,
            title: "A sample rate in the recorder's settings",
            code: "RecorderSettingsDemo",
            caption:
              "The sample rate sits in the settings like any other field: its label engraved above, the help below, at the inputs' height. The select is a readout in a well, the value on LCD glass, with two small keys at its end that step the rate without opening the list. Press the readout, or press Space, and the list switches on where it stands, a screen of rows in the mono. The chosen row has a lamp lit at its start, and the row under the keyboard sits on the one blue. Save sends the value through the field's name.",
          },
          heat: {
            demo: <RaceEventFormDemo />,
            title: "Event track in a race entry",
            code: "RaceEventFormDemo",
            caption:
              "Under Heat, the trigger is a flat square key that opens a hazard-striped black dropdown slab where the highlighted circuit snaps into four 8px amber corner brackets.",
          },
        }}
        caption="The role field sits in the form like any other: label above, help below, at the inputs' height. You type into an input, so it is cut into the page; you press the select, so it is raised, like a button. Click it, or press Space, and the list grows out of the trigger and slides a quarter of the travel token from the side it opens on, on the responsive tier. The check marks Designer. Save sends the value through the field's name."
      >
        <AccountFormDemo />
      </Stage>

      <Stage
        title="Sizes"
        tier="responsive"
        caption="Small is 32, medium is 44 and large is 56, the same scale as Button, so a select and a button of one size sit flush. Small goes in a toolbar and large beside a large button. The trigger and the list are the same width at least, and the list is a tray of slats with one gliding highlight."
        code="SizesDemo"
        byWorld={{
          device: {
            demo: <TakeListSizesDemo />,
            code: "TakeListSizesDemo",
            caption:
              "Small is 32, medium is 44 and large is 56, the same scale as Button, so a select and a key of one size sit flush. Small goes in a toolbar, over the list of takes, and large beside a large key. The list is at least as wide as the readout.",
          },
        }}
      >
        <SizesDemo />
      </Stage>

      <Stage
        title="Help, error, disabled and long values"
        tier="instant"
        caption="Focus draws the 2px focus ring around the block, as on a button. An error draws a danger edge inside it and the block keeps its cast. The error replaces the help text and says how to fix it. Pick a region and it clears. The disabled select lies flat, muted and skipped by Tab, and a long value ends in an ellipsis. The up and down mark never turns."
        code="StatesDemo"
        byWorld={{
          device: {
            demo: <RecorderStatesDemo />,
            code: "RecorderStatesDemo",
            caption:
              "Focus draws the 2px focus ring around the well. An error rings it in red, and the words under it replace the help and say how to fix it; pick a format and it clears. MP3 needs a firmware update, so its row is disabled and the arrows skip it. The clock is set by the timecode box, so its select lies flat, muted and skipped by Tab, and a long folder name ends in an ellipsis.",
          },
        }}
      >
        <StatesDemo />
      </Stage>

      <Stage
        title="Inside a dialog"
        tier="responsive"
        align="start"
        code="InviteDemo"
        byWorld={{ device: { demo: <ShareCardDemo />, code: "ShareCardDemo" } }}
        caption="Glass never sits on glass. The dialog is glass, so the list opens solid: surface 2 with the float shadow. It finds that out from its trigger when it opens. Esc closes only the list, and a second Esc closes the dialog. The dialog's fields are medium."
      >
        <InviteDemo />
      </Stage>

      <Stage
        title="On a phone"
        tier="responsive"
        align="start"
        code="PhoneDemo"
        byWorld={{ device: { demo: <InputPhoneDemo />, code: "InputPhoneDemo" } }}
        caption="On a phone the list stays anchored, as a dropdown menu does. The trigger is full width, so the list is too, and its rows are already 44px. It is not a sheet, so nothing else has to be learned. A tap opens it without picking the row under the finger, and a pressed row fills."
      >
        <PhoneDemo />
      </Stage>

    </Page>
  );
}
