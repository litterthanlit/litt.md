import { useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/button";
import { Input, TextField, Textarea } from "@/components/input";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "input",
  title: "Input",
  lede: "A roomy field that answers in color, not motion.",
  order: 2,
  group: "Controls",
  summary:
    "A roomy, slightly rounded field on the same 32, 44 and 56 scale as Button. Focus turns the edge to the focus color and adds a ring, and an error turns it to danger, both on the instant tier, so the field answers without ever moving its box.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["input"],
  exports: ["TextField", "Input", "Textarea"],
  usage: `import { Input, TextField, Textarea } from "@/components/input";
import { Button } from "@/components/button";

<TextField label="Project name" help="Shown in the dashboard." value={name} onChange={(e) => setName(e.target.value)} />
<TextField label="Work email" type="email" error="Enter a full address, like nina@halo.studio." />

// An inline form: no visible label, so the input gets an aria-label.
<form className="grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={send}>
  <Input size="lg" type="email" aria-label="Work email" placeholder="you@studio.com" />
  <Button size="lg" variant="primary" type="submit">Get the template</Button>
</form>

<Textarea label="Project brief" rows={5} help="What you are building, and when it ships." />`,
  use: [
    "One line of text: a name, an email, a slug, a domain. Use TextField, which carries the label, the hint and the error.",
    "A field beside its submit button, such as an email signup. Use Input at size lg next to a size lg primary Button.",
    "A filter or search in a table or toolbar. Use Input at size sm.",
    "Longer text, such as a brief or a note. Use Textarea.",
    "Data like a slug or a domain. Add mono for Geist Mono.",
  ],
  skip: [
    "A choice from a few fixed options. Use Segmented for two to five, or radios for more.",
    "A yes or no. Use a Checkbox.",
    "A search that jumps to pages and actions. Use the Command menu.",
    "A placeholder that stands in for a label. It vanishes while you type, so every field needs a real label.",
  ],
  keyboard: [
    [["Tab"], "Moves focus to the field. A disabled field is skipped."],
    [["Shift+Tab"], "Moves focus to the previous control."],
    [["Enter"], "In a single-line field inside a form, submits the form. In a Textarea it starts a new line."],
  ],
  a11y: [
    "TextField and Textarea use a real <label for>, so clicking the label focuses the field and a screen reader reads it. The bare Input has no label, so give it an aria-label or aria-labelledby.",
    "The hint and the error are linked with aria-describedby, so they are read after the label when focus lands. An error also sets aria-invalid.",
    "An error is not announced when it appears. After a failed submit, move focus to the first invalid field, and it reads the label and the message together.",
    "The error edge is never alone: the message under the field says what is wrong and how to fix it, in words.",
    "Focus turns the edge to the focus color and draws a 2px ring. The ring is the only focus cue, so it is never removed without being replaced.",
    "Text is 16px on touch screens so iOS does not zoom, and the small field grows from 32px to 44px tall there. Set type, inputMode and autoComplete so phones show the right keyboard and password managers can help.",
    "A disabled field is muted, skipped by Tab and exempt from contrast rules. If the reason is not obvious, say it in the hint.",
  ],
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function StatesDemo() {
  return (
    <div className="grid w-full max-w-2xl gap-x-6 gap-y-8 sm:grid-cols-2">
      <TextField label="Project name" defaultValue="Halo site" help="Shown in the dashboard and the browser tab." />
      <TextField
        label="Custom domain"
        mono
        defaultValue="halo studio"
        spellCheck={false}
        error="Use letters, numbers and dots only, like halo.studio."
      />
      <TextField label="Client email" type="email" inputMode="email" placeholder="name@studio.com" help="The invoice goes here." />
      <TextField label="Framer project" mono defaultValue="halo-site" disabled help="Linked at kickoff, so it cannot change." />
    </div>
  );
}

function SizesDemo() {
  return (
    <div className="grid w-full max-w-xl gap-6">
      <Input size="sm" aria-label="Filter deploys" placeholder="Filter deploys" />
      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
        <Input size="md" aria-label="Project name" defaultValue="Halo site" />
        <Button size="md">Rename</Button>
      </div>
      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
        <Input size="lg" aria-label="Work email" placeholder="you@studio.com" />
        <Button size="lg" variant="primary">
          Invite
        </Button>
      </div>
    </div>
  );
}

function InlineFormDemo() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const noteId = useId();

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setSent(null);
      setError("Enter a full address, like nina@halo.studio.");
      input.current?.focus(); // the field reads its label and its error together
      return;
    }
    setError(null);
    setSent(`Sent. The Framer template is on its way to ${email.trim()}.`);
  };

  return (
    <form onSubmit={submit} noValidate aria-label="Get the Framer template" className="grid w-full max-w-xl gap-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          ref={input}
          size="lg"
          type="email"
          inputMode="email"
          autoComplete="email"
          aria-label="Work email"
          aria-describedby={error ? noteId : undefined}
          placeholder="you@studio.com"
          value={email}
          invalid={!!error}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
        />
        <Button size="lg" variant="primary" type="submit">
          Get the template
        </Button>
      </div>
      <p id={noteId} role="status" className={"min-h-5 text-small " + (error ? "text-danger" : "text-fg-subtle")}>
        {error ?? sent}
      </p>
    </form>
  );
}

function BriefDemo() {
  const [brief, setBrief] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (brief.trim().length < 40) {
      setSent(false);
      setError("Add a little more: what it is, who it is for and when it ships.");
      e.currentTarget.querySelector("textarea")?.focus();
      return;
    }
    setError(null);
    setSent(true);
  };

  return (
    <form onSubmit={submit} noValidate className="grid w-full max-w-lg gap-6">
      <Textarea
        label="Project brief"
        rows={5}
        placeholder="A portfolio site for a small architecture studio, launching in March."
        help="What you are building, who it is for and when it ships."
        value={brief}
        error={error}
        onChange={(e) => {
          setBrief(e.target.value);
          if (error) setError(null);
        }}
      />
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="primary" type="submit">
          Send brief
        </Button>
        <p role="status" className="text-small text-fg-subtle">
          {sent ? "Thanks. You will hear back within a day." : ""}
        </p>
      </div>
    </form>
  );
}

export default function InputPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Fields"
        tier="instant"
        caption="Label above, hint below. Click into a field and the edge turns to the focus color with a ring. The error turns the edge to danger and says how to fix it. The disabled field is muted and skipped by Tab. Each change fades on the instant tier, and the box never moves."
        code="StatesDemo"
      >
        <StatesDemo />
      </Stage>

      <Stage
        title="Sizes"
        tier="instant"
        caption="Small is 32, medium is 44 and large is 56, the same scale as Button, so a field and a button of one size sit flush. Use small in tables and toolbars, and large beside a large button. On a touch screen every field uses 16px text, so iOS does not zoom, and the small field grows to 44."
        code="SizesDemo"
      >
        <SizesDemo />
      </Stage>

      <Stage
        title="Inline form"
        tier="instant"
        caption="A large input and a large primary button, side by side from 640px and stacked full width below it. The label is an aria-label, because the button says what the field is for. Try sending an invalid address: the edge turns to danger, the message is linked to the field and focus returns to it."
        code="InlineFormDemo"
      >
        <InlineFormDemo />
      </Stage>

      <Stage
        title="Textarea"
        tier="instant"
        caption="For longer text. The spec has no textarea, so this one reuses the Input rules exactly: the same edge, focus ring, error and label. The height comes from rows, and you can drag the corner to make it taller."
        code="BriefDemo"
      >
        <BriefDemo />
      </Stage>

      <TryIt of="TextField" component={TextField} props={{ label: "Site name", help: "Shown in the browser tab.", error: "", placeholder: "Atelier Nord" }} controls={["label", "help", "error", "size", "mono", { name: "placeholder", type: "text" }, { name: "disabled", type: "boolean" }]} />
    </Page>
  );
}
