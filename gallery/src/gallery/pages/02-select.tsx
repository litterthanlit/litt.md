import { useState, type FormEvent } from "react";
import { Button } from "@/components/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/dialog";
import { TextField } from "@/components/input";
import { Select, SelectField, type SelectOption } from "@/components/select";
import { DeviceProvider } from "@/motion";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "select",
  title: "Select",
  order: 2.5,
  group: "Controls",
  summary:
    "One value from a short list. The trigger is the Input's field, and the list is the Menu's glass panel: 44px rows, one gliding highlight and a check on the current option. The list grows from the trigger and leaves again, and on a phone it stays anchored beside it.",
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
    <p role="status" className="min-h-5 font-mono text-caption font-normal text-fg-subtle">
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
        <Button size="lg" variant="primary" type="submit">
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
      <div className="flex items-center gap-3">
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

export default function SelectPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="A role in an account form"
        tier="responsive"
        size="lg"
        align="start"
        code="AccountFormDemo"
        caption="The role field sits in the form like any other: label above, help below, and the same field as the inputs around it. Click it, or press Space, and the list grows out of the trigger and slides a quarter of the travel token from the side it opens on, on the responsive tier. The check marks Designer. Save sends the value through the field's name."
      >
        <AccountFormDemo />
      </Stage>

      <Stage
        title="Sizes"
        tier="responsive"
        caption="Small is 32, medium is 44 and large is 56, the same scale as Button, so a select and a button of one size sit flush. Small goes in a toolbar and large beside a large button. The trigger and the list are the same width at least, and the list is the Menu's panel with one gliding highlight."
        code="SizesDemo"
      >
        <SizesDemo />
      </Stage>

      <Stage
        title="Help, error, disabled and long values"
        tier="instant"
        caption="The edge turns to the focus color with a ring on focus, and to danger on an error, both on the instant tier, and the box never moves. The error replaces the help text and says how to fix it. Pick a region and it clears. The disabled field is muted and skipped by Tab, and a long value ends in an ellipsis. The chevron never turns."
        code="StatesDemo"
      >
        <StatesDemo />
      </Stage>

      <Stage
        title="Inside a dialog"
        tier="responsive"
        align="start"
        code="InviteDemo"
        caption="Glass never sits on glass. The dialog is glass, so the list opens solid: surface 2 with the float shadow. It finds that out from its trigger when it opens. Esc closes only the list, and a second Esc closes the dialog. The dialog's fields are medium."
      >
        <InviteDemo />
      </Stage>

      <Stage
        title="On a phone"
        tier="responsive"
        align="start"
        code="PhoneDemo"
        caption="On a phone the list stays anchored, as a dropdown menu does. The trigger is full width, so the list is too, and its rows are already 44px. It is not a sheet, so nothing else has to be learned. A tap opens it without picking the row under the finger, and a pressed row fills."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
