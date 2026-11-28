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
  order: 2.07,
  group: "Inputs",
  worlds: ["press", "device", "plain", "rack", "heat"],
  verbs: ["type", "select"],
  summary:
    "Type to find one value, or several, in a long list. The Input's field with the Menu's list under it: the list opens from the field as you type, filters at once with the first match lit, and keeps one highlight that follows the keys. Several picks stand in the field as tokens you can take out again.",
  fun: "Move through the list: the highlight reaches for the next row, then gathers itself there.",
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
    "Inside a dialog, a sheet or on a phone, with no change from you. The list stays solid over another overlay, and on a phone it stays under the field and fits the screen above the keyboard.",
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
    <p role="status" className="min-h-5 text-caption font-normal text-fg-subtle">
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

/* ---------- the overview's tile ---------- */

function ClientTile() {
  const [client, setClient] = useState("");
  return (
    <div className="w-full max-w-xs">
      <Combobox
        label="Client"
        name="client"
        options={CLIENTS}
        value={client}
        onValueChange={setClient}
        placeholder="Search 30 clients"
        hint="Accents are optional: zurich finds Zürich."
      />
    </div>
  );
}

/* ---------- Device's own (plans/024, phase 3): a field recorder's slate, its tags and its crew ---------- */

const LOCATIONS: ComboboxOption[] = [
  { value: "studio-b", label: "Studio B, live room", group: "Today" },
  { value: "kitchen", label: "Kitchen, room tone", group: "Today" },
  { value: "rooftop", label: "Rooftop, east side", group: "Today" },
  { value: "stairwell", label: "Stairwell, floor 3", group: "Today" },
  { value: "car-park", label: "Car park, level 2", group: "Today" },
  { value: "garden", label: "Garden, by the pond", group: "Today" },
  { value: "cafe-lumiere", label: "Café Lumière, back room", group: "This week" },
  { value: "soren-flat", label: "Søren’s flat, hallway", group: "This week" },
  { value: "angstrom-hall", label: "Ångström Hall, stage left", group: "This week" },
  { value: "brightwater-pier", label: "Brightwater pier", group: "This week" },
  { value: "northfold-track", label: "Northfold forest track", group: "This week" },
  { value: "quarry", label: "Quarry, upper ledge", group: "This week" },
  { value: "tidewell-beach", label: "Tidewell beach", group: "This week" },
  { value: "mossgrove-lobby", label: "Mossgrove Hotel, lobby", group: "This week" },
  { value: "market", label: "Riverside market", group: "This week" },
  { value: "library", label: "Old library, reading room", group: "This week" },
  { value: "platform-4", label: "Station, platform 4", group: "This week" },
  { value: "chapel", label: "Chapel, nave", group: "This week" },
  { value: "studio-ebene", label: "Studio Ébène, booth 2", group: "This week" },
  { value: "harbour", label: "Harbour, fish market", group: "This week" },
  { value: "zurich-opera", label: "Zürich Opera House, rehearsal room", group: "Archive" },
  { value: "ferry", label: "Ferry deck, crossing", group: "Archive" },
  { value: "bakery", label: "Bakery at 05:00", group: "Archive" },
  { value: "underpass", label: "Underpass, ring road", group: "Archive" },
  { value: "wind-farm", label: "Wind farm, turbine 7", group: "Archive" },
  { value: "tunnel", label: "Tunnel, north end", group: "Archive" },
  { value: "valley", label: "Valley, dawn chorus", group: "Archive" },
  { value: "ice-rink", label: "Ice rink, empty", group: "Archive" },
  { value: "football", label: "Football ground, half time", group: "Archive" },
  { value: "bells", label: "Church bells, noon", group: "Archive" },
];

const TAGS: ComboboxGroup[] = [
  {
    label: "Sound",
    options: [
      { value: "room-tone", label: "Room tone" },
      { value: "dialogue", label: "Dialogue" },
      { value: "ambience", label: "Ambience" },
      { value: "foley", label: "Foley" },
      { value: "wildtrack", label: "Wildtrack" },
    ],
  },
  {
    label: "Place",
    options: [
      { value: "interior", label: "Interior" },
      { value: "exterior", label: "Exterior" },
      { value: "vehicle", label: "Vehicle" },
    ],
  },
  {
    label: "To fix",
    options: [
      { value: "wind", label: "Wind" },
      { value: "hum", label: "Hum" },
      { value: "clipping", label: "Clipping" },
      { value: "traffic", label: "Traffic" },
      { value: "handling", label: "Handling noise" },
    ],
  },
];

const CREW: ComboboxGroup[] = [
  {
    label: "Sound",
    options: [
      { value: "mara", label: "Mara Lindqvist" },
      { value: "nina", label: "Nina Hart" },
      { value: "ilse", label: "Ilse Varga, on leave", disabled: true },
      { value: "sofia", label: "Sofia Russo" },
    ],
  },
  {
    label: "Camera",
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

function SlateDemo() {
  const [location, setLocation] = useState("");
  const [sent, setSent] = useState("");
  const send = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSent(`Slated location=${data.get("location") || "(none)"} take=${data.get("take")}`);
  };
  return (
    <form onSubmit={send} className="grid w-full max-w-sm gap-6">
      <Combobox
        label="Location"
        name="location"
        options={LOCATIONS}
        value={location}
        onValueChange={setLocation}
        placeholder="Search 30 locations"
        hint="Accents are optional: zurich finds Zürich."
      />
      <TextField label="Take name" name="take" mono defaultValue="take_04" spellCheck={false} />
      <div className="grid gap-3">
        <Button variant="primary" type="submit">
          Slate take
        </Button>
        <Status>{sent}</Status>
      </div>
    </form>
  );
}

function TakeTagsDemo() {
  const [tags, setTags] = useState(["ambience", "interior"]);
  return (
    <div className="grid w-full max-w-md gap-3">
      <Combobox
        multiple
        label="Tags for take_04"
        name="tags"
        options={TAGS}
        value={tags}
        onValueChange={setTags}
        placeholder="Add a tag"
        hint="Tag everything you hear. Backspace removes the last one."
      />
      <Status>{tags.length ? `Tagged ${tags.map((v) => labelIn(TAGS, v)).join(", ")}` : "No tags yet"}</Status>
    </div>
  );
}

function CrewStatesDemo() {
  const [boom, setBoom] = useState("");
  const [error, setError] = useState<string | null>("Choose who holds the boom on scene 12.");
  return (
    <div className="grid w-full max-w-2xl gap-x-6 gap-y-8 sm:grid-cols-2">
      <Combobox
        label="Boom operator"
        options={CREW}
        value={boom}
        error={error}
        placeholder="Search the crew"
        onValueChange={(next) => {
          setBoom(next);
          setError(next ? null : "Choose who holds the boom on scene 12.");
        }}
      />
      <Combobox
        multiple
        disabled
        label="Archived tags"
        options={TAGS}
        defaultValue={["dialogue", "interior"]}
        hint="Set when the take was archived, so they cannot change."
      />
    </div>
  );
}

function ListenDemo() {
  const [open, setOpen] = useState(false);
  const [listener, setListener] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!listener) {
      setError("Choose who listens to the take.");
      e.currentTarget.querySelector("input")?.focus();
      return;
    }
    setOpen(false);
    setStatus(`take_04.wav sent to ${labelIn(CREW, listener)}.`);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) {
            setListener("");
            setError(null);
          }
          setOpen(next);
        }}
      >
        <DialogTrigger asChild>
          <Button>Ask for a listen</Button>
        </DialogTrigger>
        <DialogContent
          title="Ask for a listen"
          description="They get a link to take_04.wav · 48 kHz · 24 bit."
          footer={
            <>
              <DialogClose asChild>
                <Button>Cancel</Button>
              </DialogClose>
              <Button variant="primary" type="submit" form="listen-form">
                Send take
              </Button>
            </>
          }
        >
          <form id="listen-form" onSubmit={submit} noValidate className="grid gap-6">
            <Combobox
              label="Listener"
              options={CREW}
              value={listener}
              error={error}
              placeholder="Search the crew"
              onValueChange={(next) => {
                setListener(next);
                if (next) setError(null);
              }}
            />
            <TextField label="Note" placeholder="A car passes at 00M 41S. Keep it?" />
          </form>
        </DialogContent>
      </Dialog>
      <Status>{status}</Status>
    </div>
  );
}

function LocationTile() {
  const [location, setLocation] = useState("");
  return (
    <div className="w-full max-w-xs">
      <Combobox
        label="Location"
        name="location"
        options={LOCATIONS}
        value={location}
        onValueChange={setLocation}
        placeholder="Search 30 locations"
        hint="Accents are optional: zurich finds Zürich."
      />
    </div>
  );
}

/* ---------- Flat's own (plans/024, phase 3): where a post's picture was taken ---------- */

const PLACES: ComboboxOption[] = [
  { value: "north-pier", label: "North pier", group: "Along the coast" },
  { value: "long-sands", label: "Long Sands", group: "Along the coast" },
  { value: "the-point", label: "The point", group: "Along the coast" },
  { value: "sea-wall", label: "Sea wall", group: "Along the coast" },
  { value: "seal-rocks", label: "Seal rocks", group: "Along the coast" },
  { value: "dune-path", label: "Dune path", group: "Along the coast" },
  { value: "lighthouse", label: "The lighthouse", group: "Along the coast" },
  { value: "salt-marsh", label: "Salt marsh", group: "Along the coast" },
  { value: "cove", label: "Smugglers' cove", group: "Along the coast" },
  { value: "tide-pools", label: "Tide pools", group: "Along the coast" },
  { value: "back-garden", label: "The back garden", group: "At home" },
  { value: "kitchen-window", label: "Kitchen window", group: "At home" },
  { value: "allotment", label: "The allotment", group: "At home" },
  { value: "church-lane", label: "Church lane", group: "At home" },
  { value: "old-quarry", label: "The old quarry", group: "At home" },
  { value: "river-path", label: "River path", group: "At home" },
  { value: "market", label: "Saturday market", group: "At home" },
  { value: "bus-stop", label: "The bus stop at dusk", group: "At home" },
  { value: "orchard", label: "The orchard", group: "At home" },
  { value: "ferry", label: "The morning ferry", group: "At home" },
  { value: "zurich", label: "Zürich", group: "Away" },
  { value: "malmo", label: "Malmö", group: "Away" },
  { value: "arhus", label: "Århus", group: "Away" },
  { value: "san-sebastian", label: "San Sebastián", group: "Away" },
  { value: "lisbon", label: "Lisbon", group: "Away" },
  { value: "cadiz", label: "Cádiz", group: "Away" },
  { value: "porto", label: "Porto", group: "Away" },
  { value: "bergen", label: "Bergen", group: "Away" },
  { value: "trondheim", label: "Trondheim", group: "Away" },
  { value: "reykjavik", label: "Reykjavík", group: "Away" },
];

function NewPostDemo() {
  const [place, setPlace] = useState("");
  const [sent, setSent] = useState("");
  const send = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSent(`Sent place=${data.get("place") || "(none)"} title=${data.get("title")}`);
  };
  return (
    <form onSubmit={send} className="grid w-full max-w-sm gap-6">
      <Combobox
        label="Where was it taken?"
        name="place"
        options={PLACES}
        value={place}
        onValueChange={setPlace}
        placeholder="Search 30 places"
        hint="Readers see it under the picture, in the post and in Issue 14."
      />
      <TextField label="Post title" name="title" defaultValue="Open water" />
      <div className="grid gap-3">
        <Button variant="primary" type="submit">
          Save post
        </Button>
        <Status>{sent}</Status>
      </div>
    </form>
  );
}

function PlaceTile() {
  const [place, setPlace] = useState("");
  return (
    <div className="w-full max-w-xs">
      <Combobox
        label="Where was it taken?"
        name="place"
        options={PLACES}
        value={place}
        onValueChange={setPlace}
        placeholder="Search 30 places"
        hint="Readers see it under the picture, in the post and in Issue 14."
      />
    </div>
  );
}

export default function ComboboxPage() {
  return (
    <Page meta={meta} docs={docs} tile={<ClientTile />} tileByWorld={{ device: <LocationTile />, flat: <PlaceTile /> }}>
      <Stage
        title="A client for a new project"
        tier="responsive"
        size="lg"
        align="start"
        code="NewProjectDemo"
        byWorld={{
          flat: {
            demo: <NewPostDemo />,
            title: "A place for a new post",
            code: "NewPostDemo",
            caption:
              "Thirty places in three groups, where the pictures were taken. Type and the list grows out of the field and slides a quarter of the travel token on the responsive tier, then filters at once, with the first match lit and no change of height animated. Accents are optional, so zurich finds Zürich. Enter picks, the field shows the place, and Save post sends it through the field's name.",
          },
          device: {
            demo: <SlateDemo />,
            title: "A location on the slate",
            code: "SlateDemo",
            caption:
              "Thirty locations in three groups, as a recorder keeps them for its slate. Type and the list grows out of the field and slides a quarter of the travel token on the responsive tier, then filters at once, with the first match lit. Accents are optional, so zurich finds Zürich. Enter picks, the glass shows the location, and Slate take sends it with the take's name through the fields' names.",
          },
        }}
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
        byWorld={{
          device: {
            demo: <TakeTagsDemo />,
            title: "Tags on a take",
            code: "TakeTagsDemo",
            caption:
              "With multiple, each pick becomes a token before the text, and the list stays open for the next one. A new token comes in while its neighbours slide, and a removed one goes, on the responsive tier. Pick a checked tag again, press its x, or press Backspace in an empty field to remove one.",
          },
        }}
        caption="With multiple, each pick becomes a raised token before the text, a block you can lift back out of the field, and the list stays open for the next one. A new token fades in while its neighbors slide, and a removed one fades out, on the responsive tier. Pick a checked framework again, press its x, or press Backspace in an empty field to remove one."
      >
        <SiteStackDemo />
      </Stage>

      <Stage
        title="Error and disabled"
        tier="instant"
        code="StatesDemo"
        byWorld={{ device: { demo: <CrewStatesDemo />, code: "CrewStatesDemo" } }}
        caption="The line turns to danger on an error, and to the focus color with a ring on focus, both on the instant tier, and the box never moves. The message says how to fix it and clears on a pick. The disabled field lies flat, muted and skipped by Tab, and its tokens lie flat with it and stay readable."
      >
        <StatesDemo />
      </Stage>

      <Stage
        title="Inside a dialog"
        tier="responsive"
        align="start"
        code="ReviewDemo"
        byWorld={{ device: { demo: <ListenDemo />, code: "ListenDemo" } }}
        caption="Glass never sits on glass. The dialog is glass, so the list opens solid: surface 2 with the float shadow. Esc closes only the list, and a second Esc closes the dialog. Ilse is on leave, so the arrows skip her."
      >
        <ReviewDemo />
      </Stage>
    </Page>
  );
}
