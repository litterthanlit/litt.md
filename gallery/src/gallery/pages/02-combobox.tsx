import { useState, type FormEvent } from "react";
import { Button } from "@/components/button";
import { Combobox, type ComboboxGroup, type ComboboxOption } from "@/components/combobox";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/dialog";
import { TextField } from "@/components/input";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "combobox",
  title: "Combobox",
  lede: "Type to find one value, or several, in a long list.",
  order: 2.6,
  group: "Controls",
  summary:
    "Type to find one value, or several, in a long list. The Input's field with the Menu's glass list under it: the list grows from the field as you type, filters at once with the first match lit, and keeps one gliding highlight. Several picks sit in the field as tokens that fade in and out.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["combobox"],
  exports: ["Combobox"],
  usage: `import { Combobox } from "@/components/combobox";

const CLIENTS = [
  { value: "marlow-labs", label: "Marlow Labs", group: "Retainers" },
  { value: "grotta-type", label: "Grotta Type", group: "Retainers" },
  { value: "zurich-opera", label: "Zürich Opera House", group: "Past clients" },
  // …
];

// One value is a string, "" while nothing is picked. Pass name and a form sends it.
const [client, setClient] = useState("");
<Combobox label="Client" name="client" options={CLIENTS} value={client} onValueChange={setClient} placeholder="Search clients" />

// Several values are an array. The picks sit in the field as tokens, and the list stays open after each pick.
const [stack, setStack] = useState(["framer", "sanity"]);
<Combobox multiple label="Stack" options={FRAMEWORKS} value={stack} onValueChange={setStack} />

// Options can also come as groups. Inside a dialog or a sheet the list turns solid by itself.
<Combobox
  label="Reviewer"
  options={[{ label: "Design", options: DESIGNERS }, { label: "Engineering", options: ENGINEERS }]}
  error="Choose who reviews the preview."
/>`,
  use: [
    "One value from a list too long to scan: a client, a teammate, a Framer site. A person types a few letters instead of scrolling.",
    "Several values from a known list, such as the frameworks a site is built with. Pass multiple, and the picks become tokens.",
    "A form field. The label, the hint and the error are wired up, and with name every value posts through a hidden input.",
    "Inside a dialog, a sheet or on a phone, with no change from you. The list turns solid over glass, and on a phone it stays under the field and fits the screen above the keyboard.",
  ],
  skip: [
    "A short fixed list, up to about eight options. Use Select, which needs no typing.",
    "Actions, such as open, deploy or rename. Use Command menu, which runs a command and keeps no value.",
    "Free values that are not in a list, such as email addresses or new tags. Use Token input.",
    "Results a server finds as you type. The combobox filters the options it is given, so fetch them yourself and pass them in.",
  ],
  keyboard: [
    [["a-z"], "Opens the list and filters it, ignoring case and accents. The first match is lit."],
    [["ArrowDown"], "On a closed list: opens it with the pick lit, or the first option. In the list: lights the next option. It wraps and skips disabled options."],
    [["ArrowUp"], "In the list: lights the previous option, wrapping. On a closed list: opens it with the pick lit, or the last option."],
    [["Enter"], "Picks the lit option. One value closes the list. With multiple it adds the option, or removes it if it was picked, and the list stays open. On a closed list Enter submits the form."],
    [["Esc"], "Closes the list and keeps what you typed. A second Esc puts the picked label back in the field."],
    [["Backspace"], "With multiple, in an empty field: removes the last token."],
    [["ArrowLeft", "ArrowRight"], "With multiple, at the start of the text: ArrowLeft walks into the tokens' remove buttons, and ArrowRight past the last one returns to the field. Backspace or Delete removes the focused token."],
    [["Tab"], "Leaves the field. The list closes and the field shows the picked label again. A one-value field left empty clears its pick."],
  ],
  a11y: [
    "The field is role=\"combobox\" with aria-expanded, aria-controls and aria-autocomplete=\"list\". Focus stays in it, and aria-activedescendant names the lit option, so a screen reader reads each option as the arrows move.",
    "The list is role=\"listbox\", named by the label, with role=\"option\" rows and aria-selected on the picks. With multiple it is aria-multiselectable. Each group label names a role=\"group\".",
    "A polite live region says how many options match a moment after typing stops (\"4 options\", \"No matches\"), and with multiple what was added or removed.",
    "The label is a real label, so clicking it focuses the field. The hint or the error is linked with aria-describedby. An error also sets aria-invalid and draws the danger edge, and its message should say how to fix it.",
    "A pick carries a check, and the field's text or a token says the same, so the check is never the only signal. A keyboard-lit option carries a 1px focus ring, because a faint fill alone is not enough. A pointer-lit one does not.",
    "With multiple the tokens are a list named by the label, each with a remove button named after it (\"Remove Next.js\"). The remove buttons are not Tab stops, so the field stays one stop: reach them with ArrowLeft, or pick the option again.",
    "On touch the text is 16px so iOS does not zoom, the sm field grows to 44px, rows are 44px and the remove buttons have 44px targets. A tap on the chevron opens the list without opening the keyboard.",
    "A form reads the value from hidden inputs. They carry no validation of their own, so check the value on submit and pass the message to error.",
    "Under reduced motion the list and the tokens appear and leave at once, with no travel.",
  ],
};

/* ------------------------------------------------------------ the data */

const CLIENTS: ComboboxOption[] = [
  { value: "marlow-labs", label: "Marlow Labs", group: "Retainers" },
  { value: "grotta-type", label: "Grotta Type", group: "Retainers" },
  { value: "sidebar-weekly", label: "Sidebar Weekly", group: "Retainers" },
  { value: "halden-studio", label: "Halden Studio", group: "Retainers" },
  { value: "atelier-nord", label: "Atelier Nord", group: "Retainers" },
  { value: "kiln", label: "Kiln", group: "Retainers" },
  { value: "cafe-lumiere", label: "Café Lumière", group: "Projects" },
  { value: "soren-co", label: "Søren & Co", group: "Projects" },
  { value: "angstrom-audio", label: "Ångström Audio", group: "Projects" },
  { value: "brightwater", label: "Brightwater Cycles", group: "Projects" },
  { value: "northfold", label: "Northfold", group: "Projects" },
  { value: "pellet-coffee", label: "Pellet Coffee", group: "Projects" },
  { value: "quarry-records", label: "Quarry Records", group: "Projects" },
  { value: "tidewell", label: "Tidewell", group: "Projects" },
  { value: "fable-fern", label: "Fable & Fern", group: "Projects" },
  { value: "mossgrove", label: "Mossgrove Hotel", group: "Projects" },
  { value: "lumen-optics", label: "Lumen Optics", group: "Projects" },
  { value: "ridgeline", label: "Ridgeline Outdoors", group: "Projects" },
  { value: "studio-ebene", label: "Studio Ébène", group: "Projects" },
  { value: "juniper-health", label: "Juniper Health", group: "Projects" },
  { value: "orbit-finance", label: "Orbit Finance", group: "Past clients" },
  { value: "velvet-hour", label: "Velvet Hour", group: "Past clients" },
  { value: "wren-wolf", label: "Wren & Wolf", group: "Past clients" },
  { value: "zurich-opera", label: "Zürich Opera House", group: "Past clients" },
  { value: "coastline", label: "Coastline Ferries", group: "Past clients" },
  { value: "hearth-bakery", label: "Hearth Bakery", group: "Past clients" },
  { value: "driftwood-surf", label: "Driftwood Surf", group: "Past clients" },
  { value: "parcel-post", label: "Parcel Post", group: "Past clients" },
  { value: "oaktree-dental", label: "Oaktree Dental", group: "Past clients" },
  { value: "oddway-press", label: "Oddway Press", group: "Past clients" },
];

const FRAMEWORKS: ComboboxGroup[] = [
  {
    label: "Site builders",
    options: [
      { value: "framer", label: "Framer" },
      { value: "webflow", label: "Webflow" },
      { value: "squarespace", label: "Squarespace" },
    ],
  },
  {
    label: "Frameworks",
    options: [
      { value: "nextjs", label: "Next.js" },
      { value: "astro", label: "Astro" },
      { value: "sveltekit", label: "SvelteKit" },
      { value: "remix", label: "Remix" },
      { value: "nuxt", label: "Nuxt" },
      { value: "eleventy", label: "Eleventy" },
      { value: "hugo", label: "Hugo" },
    ],
  },
  {
    label: "Styling",
    options: [
      { value: "tailwind", label: "Tailwind CSS" },
      { value: "vanilla-extract", label: "Vanilla Extract" },
      { value: "css-modules", label: "CSS Modules" },
    ],
  },
  {
    label: "Content",
    options: [
      { value: "sanity", label: "Sanity" },
      { value: "contentful", label: "Contentful" },
      { value: "storyblok", label: "Storyblok" },
      { value: "notion", label: "Notion" },
    ],
  },
];

const TEAM: ComboboxGroup[] = [
  {
    label: "Design",
    options: [
      { value: "mara", label: "Mara Lindqvist" },
      { value: "nina", label: "Nina Hart" },
      { value: "ilse", label: "Ilse Varga, on leave", disabled: true },
      { value: "sofia", label: "Sofia Russo" },
    ],
  },
  {
    label: "Engineering",
    options: [
      { value: "theo", label: "Theo Brandt" },
      { value: "priya", label: "Priya Raman" },
      { value: "kenji", label: "Kenji Mori" },
      { value: "elif", label: "Elif Demir" },
    ],
  },
  {
    label: "Production",
    options: [
      { value: "jonas", label: "Jonas Weber" },
      { value: "ana", label: "Ana Sousa" },
    ],
  },
];

const labelIn = (groups: ComboboxGroup[], value: string) =>
  groups.flatMap((g) => g.options).find((o) => o.value === value)?.label ?? value;

/** A quiet status line under a demo, so each stage shows what the combobox did. */
function Status({ children }: { children: string }) {
  return (
    <p role="status" className="min-h-5 font-mono text-caption font-normal text-fg-subtle">
      {children}
    </p>
  );
}

/* ------------------------------------------------------- one value, in a form */

function NewProjectDemo() {
  const [client, setClient] = useState("");
  const [sent, setSent] = useState("");
  const send = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSent(`Sent client=${data.get("client") || "(none)"} name=${data.get("project")}`);
  };
  return (
    <form onSubmit={send} className="grid w-full max-w-sm gap-6">
      <Combobox
        label="Client"
        name="client"
        options={CLIENTS}
        value={client}
        onValueChange={setClient}
        placeholder="Search 30 clients"
        hint="Accents are optional: zurich finds Zürich."
      />
      <TextField label="Project name" name="project" defaultValue="Spring launch site" />
      <div className="grid gap-3">
        <Button variant="primary" type="submit">
          Create project
        </Button>
        <Status>{sent}</Status>
      </div>
    </form>
  );
}

/* --------------------------------------------------------- several values */

function SiteStackDemo() {
  const [stack, setStack] = useState(["framer", "sanity"]);
  return (
    <div className="grid w-full max-w-md gap-3">
      <Combobox
        multiple
        label="Stack for atelier-nord.com"
        name="stack"
        options={FRAMEWORKS}
        value={stack}
        onValueChange={setStack}
        placeholder="Add a framework"
        hint="Pick all the site uses. Backspace removes the last one."
      />
      <Status>{stack.length ? `Tagged ${stack.map((v) => labelIn(FRAMEWORKS, v)).join(", ")}` : "No frameworks yet"}</Status>
    </div>
  );
}

/* ------------------------------------------------------- error and disabled */

function StatesDemo() {
  const [billing, setBilling] = useState("");
  const [error, setError] = useState<string | null>("Choose who gets the invoices for Marlow Labs.");
  return (
    <div className="grid w-full max-w-2xl gap-x-6 gap-y-8 sm:grid-cols-2">
      <Combobox
        label="Billing contact"
        options={TEAM}
        value={billing}
        error={error}
        placeholder="Search the team"
        onValueChange={(next) => {
          setBilling(next);
          setError(next ? null : "Choose who gets the invoices for Marlow Labs.");
        }}
      />
      <Combobox
        multiple
        disabled
        label="Locked stack"
        options={FRAMEWORKS}
        defaultValue={["framer", "tailwind"]}
        hint="Set at kickoff, so it cannot change."
      />
    </div>
  );
}

/* ------------------------------------------------------------ in a dialog */

function ReviewDemo() {
  const [open, setOpen] = useState(false);
  const [reviewer, setReviewer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reviewer) {
      setError("Choose who reviews the preview.");
      e.currentTarget.querySelector("input")?.focus();
      return;
    }
    setOpen(false);
    setStatus(`Review requested from ${labelIn(TEAM, reviewer)}.`);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) {
            setReviewer("");
            setError(null);
          }
          setOpen(next);
        }}
      >
        <DialogTrigger asChild>
          <Button>Request a review</Button>
        </DialogTrigger>
        <DialogContent
          title="Request a review"
          description="They get a link to the preview of marlow-labs.framer.website."
          footer={
            <>
              <DialogClose asChild>
                <Button>Cancel</Button>
              </DialogClose>
              <Button variant="primary" type="submit" form="review-form">
                Send request
              </Button>
            </>
          }
        >
          <form id="review-form" onSubmit={submit} noValidate className="grid gap-6">
            <Combobox
              label="Reviewer"
              options={TEAM}
              value={reviewer}
              error={error}
              placeholder="Search the team"
              onValueChange={(next) => {
                setReviewer(next);
                if (next) setError(null);
              }}
            />
            <TextField label="Note" placeholder="The new pricing page is ready." />
          </form>
        </DialogContent>
      </Dialog>
      <Status>{status}</Status>
    </div>
  );
}

export default function ComboboxPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="A client for a new project"
        tier="responsive"
        size="lg"
        align="start"
        code="NewProjectDemo"
        caption="Thirty clients in three groups. Type and the list grows out of the field and slides a quarter of the travel token on the responsive tier, then filters at once, with the first match lit and no change of height animated. Accents are optional, so zurich finds Zürich. Enter picks, the field shows the client, and Create project sends it through the field's name."
      >
        <NewProjectDemo />
      </Stage>

      <Stage
        title="Frameworks on a site"
        tier="responsive"
        size="lg"
        align="start"
        code="SiteStackDemo"
        caption="With multiple, each pick becomes a token before the text and the list stays open for the next one. A new token fades in while its neighbors slide, and a removed one fades out, on the responsive tier. Pick a checked framework again, press its x, or press Backspace in an empty field to remove one."
      >
        <SiteStackDemo />
      </Stage>

      <Stage
        title="Error and disabled"
        tier="instant"
        code="StatesDemo"
        caption="The edge turns to danger on an error, and to the focus color with a ring on focus, both on the instant tier, and the box never moves. The message says how to fix it and clears on a pick. The disabled field is muted and skipped by Tab, and its tokens stay readable."
      >
        <StatesDemo />
      </Stage>

      <Stage
        title="Inside a dialog"
        tier="responsive"
        align="start"
        code="ReviewDemo"
        caption="Glass never sits on glass. The dialog is glass, so the list opens solid: surface 2 with the float shadow. Esc closes only the list, and a second Esc closes the dialog. Ilse is on leave, so the arrows skip her."
      >
        <ReviewDemo />
      </Stage>
    </Page>
  );
}
