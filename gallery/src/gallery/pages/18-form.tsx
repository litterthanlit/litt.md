import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/button";
import { Checkbox, Radio, RadioGroup } from "@/components/checkbox";
import { ErrorSummary, Fieldset, FormActions, FormSection, Optional, focusFirstInvalid } from "@/components/form";
import { TextField, Textarea } from "@/components/input";
import { Segmented } from "@/components/segmented";
import { SelectField } from "@/components/select";
import { Slider } from "@/components/slider";
import { Switch } from "@/components/switch";
import { Toaster, toast } from "@/components/toast";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "form",
  title: "Forms",
  lede: "Fields that make a page.",
  order: 15.5,
  group: "Layout",
  verbs: ["type"],
  summary:
    "How the fields make a page: one left-aligned column, sections on a settings page, and an error summary that takes focus when a submit fails. Fields and link colors answer on the instant tier, and the saved toast is the view's one expressive moment.",
  tiers: ["instant", "expressive"],
};

export const docs: PageDocs = {
  components: ["form"],
  exports: ["FormSection", "Fieldset", "ErrorSummary", "FormActions", "Optional", "focusFirstInvalid"],
  usage: `import { Button } from "@/components/button";
import { ErrorSummary, Fieldset, FormActions, FormSection, Optional, focusFirstInvalid } from "@/components/form";
import { TextField } from "@/components/input";
import { Switch } from "@/components/switch";

// A page form: an error summary, sections, then one row of actions.
<form noValidate onSubmit={save} aria-label="Studio settings">
  <ErrorSummary errors={errors} focusKey={failedSubmits} />
  <FormSection title="Profile" description="Shown to clients you invite.">
    <TextField id="name" label="Name" error={errors.name} />
    <TextField id="phone" label={<>Phone<Optional /></>} />
    <Fieldset legend="Invoice address" description="Printed on every invoice.">
      <TextField label="Street" />
      <TextField label="City" />
    </Fieldset>
  </FormSection>
  <FormSection title="Notifications" description="What we email you about.">
    {/* rows: switches carry their own padding, so they sit flush with hairlines between them. */}
    <Fieldset legend="Email" rows>
      <Switch align="end" label="Weekly digest" checked={digest} onCheckedChange={setDigest} />
      <Switch align="end" label="Build finished" checked={builds} onCheckedChange={setBuilds} />
    </Fieldset>
  </FormSection>
  {/* fields: Save lines up with the fields column from 1024 up, not under the section titles. */}
  <FormActions align="fields" className="mt-12">
    <Button variant="primary" type="submit">Save changes</Button>
    <Button variant="ghost" onClick={cancel}>Cancel</Button>
  </FormActions>
</form>

// errors is the list the fields use, in page order: [{ id: "name", message: "Enter a name." }].

// A form of three fields or fewer skips the summary and focuses the first invalid field.
useEffect(() => {
  if (failedSubmits) focusFirstInvalid(formRef.current);
}, [failedSubmits]);`,
  use: [
    "A settings page with several groups of fields. Give each group a FormSection, and the title and description sit beside the fields on a wide screen.",
    "Fields that mean one thing together, such as an address. Put them in a Fieldset so a screen reader reads the legend with each field.",
    "A settings list of switches. Put them in a Fieldset with rows and give each Switch align=\"end\", so they read as one list with hairlines between the rows.",
    "A form with four fields or more that can fail. The ErrorSummary names every problem in one place and links to each.",
    "The buttons of a page form. FormActions puts the submit first, then Cancel, and stacks them on a phone. On a settings page, set align=\"fields\" so Save lines up with the fields.",
    "A field the person may leave empty. Add Optional to its label, and leave the required ones unmarked.",
  ],
  skip: [
    "A dialog's fields. Keep them md, with the actions bottom right and the primary last. Use Dialog.",
    "A form of three fields or fewer. Skip the summary and call focusFirstInvalid, because the errors sit right under the fields.",
    "Checkboxes or radios that share one choice. CheckboxGroup and RadioGroup are fieldsets already, with a legend, a hint and an error.",
    "One field beside its button, such as an email signup. Use Input at size lg next to a size lg Button.",
    "A message about one field. Show it under that field with the error prop of TextField, because a toast leaves and the field stays wrong.",
  ],
  keyboard: [
    [["Tab", "Shift+Tab"], "Moves through the fields and buttons in reading order. After a failed submit, Tab from the summary goes to its first link."],
    [["Enter"], "On an error link, moves focus to that field. In a single-line field, submits the form."],
  ],
  a11y: [
    "ErrorSummary follows the GOV.UK pattern. The panel is a region named by its heading, it can take focus (tabindex -1), and each error is a link. When focusKey changes while errors exist, focus moves to the panel, so a screen reader reads the heading and every problem.",
    "The summary is not a live region. The demos pass the live error list, so fixing a field updates the count without announcing it again on every keystroke. The next failed submit reads it out once more.",
    "A link moves focus by hand and calls preventDefault, so it never changes location.hash. That matters in an app that routes by hash, like this gallery. The href still names the field.",
    "A link goes to the element with its id. When the id sits on a wrapper such as a fieldset, focus goes to its first enabled control, and the page scrolls only if that control is near the top or bottom edge.",
    "Fieldset is a real fieldset with a legend. Its description and its hint or error are linked with aria-describedby, and disabled disables every control inside it. With rows it only changes the layout, so the switches are still separate controls, each with its own label.",
    "The summary does not replace the inline errors. Each field must still show its own message with aria-invalid and aria-describedby, as TextField and Textarea do, and the form should be noValidate so the browser's own bubbles do not compete.",
    "Optional is part of the label's text, so a screen reader says \"Company (optional)\". Do not use an asterisk, and do not disable the submit to say a field is wrong.",
    "A loading button is disabled, which can drop focus to the page. The demos put focus back on the submit when the save ends.",
    "FormSection is a section named by its title. Below 1024 it is one column, in reading order. FormActions with align=\"fields\" only moves the row to the fields column, so the submit still comes first in the source and the tab order matches the screen, stacked or not.",
  ],
};

/* ------------------------------------------------------------------ shared by the demos */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Pretends to save for a moment, then runs onSaved. A real form awaits its request here. The loading button is
 * disabled, which can drop focus to the page, so focus goes back to the submit when the save ends.
 */
function useSave(onSaved: () => void) {
  const [saving, setSaving] = useState(false);
  const submit = useRef<HTMLButtonElement>(null);
  const timer = useRef(0);
  const wasSaving = useRef(false);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (wasSaving.current && !saving && document.activeElement === document.body) submit.current?.focus();
    wasSaving.current = saving;
  }, [saving]);

  const save = () => {
    setSaving(true);
    timer.current = window.setTimeout(() => {
      setSaving(false);
      onSaved();
    }, 1400);
  };
  return { saving, save, submit };
}

/* ------------------------------------------------------------------ start a project */

const PROJECT_IDS = {
  name: "project-name",
  email: "project-email",
  company: "project-company",
  budget: "project-budget",
  brief: "project-brief",
  consent: "project-consent",
} as const;
type ProjectField = keyof typeof PROJECT_IDS;
type ProjectValues = { name: string; email: string; company: string; budget: string; brief: string; consent: boolean };
type ProjectErrors = Partial<Record<ProjectField, string>>;

const PROJECT_FIELDS = Object.keys(PROJECT_IDS) as ProjectField[];
const NO_PROJECT: ProjectValues = { name: "", email: "", company: "", budget: "", brief: "", consent: false };

/** What is wrong with one field, or nothing. Each message says how to fix it. */
function checkProject(field: ProjectField, v: ProjectValues): string | undefined {
  switch (field) {
    case "name":
      return v.name.trim() ? undefined : "Enter your name so we know who to reply to.";
    case "email":
      if (!v.email.trim()) return "Enter your email so we can reply.";
      return EMAIL.test(v.email.trim()) ? undefined : "Use a full address, like nina@halo.studio.";
    case "budget":
      return v.budget ? undefined : "Pick the range that is closest.";
    case "brief":
      return v.brief.trim().length >= 40 ? undefined : "Add a little more: what it is, who it is for and when it ships.";
    case "consent":
      return v.consent ? undefined : "Tick the box so we know we can reply.";
    default:
      return undefined;
  }
}

function StartProjectDemo() {
  const [values, setValues] = useState<ProjectValues>(NO_PROJECT);
  const [errors, setErrors] = useState<ProjectErrors>({});
  const [failedSubmits, setFailedSubmits] = useState(0);
  const { saving, save, submit } = useSave(() =>
    toast({ title: "Brief sent", description: "We reply within a working day.", tone: "success" }),
  );

  /* A field that is already wrong is checked again as it changes, so fixing it clears it. */
  const change = (key: ProjectField, value: string | boolean) => {
    const next = { ...values, [key]: value };
    setValues(next);
    if (errors[key]) setErrors({ ...errors, [key]: checkProject(key, next) });
  };

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const found: ProjectErrors = {};
    for (const key of PROJECT_FIELDS) {
      const message = checkProject(key, values);
      if (message) found[key] = message;
    }
    setErrors(found);
    if (Object.keys(found).length) return setFailedSubmits((n) => n + 1);
    save(); // the values stay in the form
  };

  const summary = PROJECT_FIELDS.filter((key) => errors[key]).map((key) => ({ id: PROJECT_IDS[key], message: errors[key] }));

  return (
    <form onSubmit={send} noValidate aria-label="Start a project" className="grid w-full max-w-100 gap-6">
      <ErrorSummary errors={summary} focusKey={failedSubmits} />
      <TextField
        id={PROJECT_IDS.name}
        label="Name"
        autoComplete="name"
        value={values.name}
        error={errors.name}
        onChange={(e) => change("name", e.target.value)}
      />
      <TextField
        id={PROJECT_IDS.email}
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={values.email}
        error={errors.email}
        onChange={(e) => change("email", e.target.value)}
      />
      <TextField
        id={PROJECT_IDS.company}
        label={
          <>
            Company
            <Optional />
          </>
        }
        autoComplete="organization"
        value={values.company}
        onChange={(e) => change("company", e.target.value)}
      />
      <RadioGroup
        legend="Budget"
        className="my-6"
        value={values.budget}
        onValueChange={(v) => change("budget", v)}
        error={errors.budget}
      >
        <Radio id={PROJECT_IDS.budget} value="under-8k" label="Under $8k" />
        <Radio value="8k-20k" label="$8k to $20k" />
        <Radio value="20k-up" label="$20k and up" />
      </RadioGroup>
      <Textarea
        id={PROJECT_IDS.brief}
        label="Project brief"
        rows={5}
        help="What you are building, who it is for and when it ships."
        value={values.brief}
        error={errors.brief}
        onChange={(e) => change("brief", e.target.value)}
      />
      <Checkbox
        id={PROJECT_IDS.consent}
        label="litt.design may reply to me by email"
        checked={values.consent}
        invalid={!!errors.consent}
        description={errors.consent}
        onChange={(e) => change("consent", e.target.checked)}
      />
      <Button ref={submit} type="submit" variant="primary" block loading={saving}>
        Send brief
      </Button>
    </form>
  );
}

/* ------------------------------------------------------------------ settings */

type Theme = "system" | "light" | "dark";
type Settings = {
  name: string;
  email: string;
  website: string;
  bio: string;
  street: string;
  city: string;
  postcode: string;
  role: string;
  builds: boolean;
  digest: boolean;
  theme: Theme;
  speed: number;
};
type TextKey = "name" | "email" | "website" | "bio" | "street" | "city" | "postcode";

const STUDIO: Settings = {
  name: "Nick",
  email: "hello@litt.design",
  website: "litt.design",
  bio: "A small studio building Framer sites for architects and product teams. Recent work: Atelier Nord, Kiln and Halden Studio.",
  street: "Bryggen 4",
  city: "Bergen",
  postcode: "5003",
  role: "designer",
  builds: true,
  digest: false,
  theme: "system",
  speed: 1,
};

function SettingsDemo() {
  const [saved, setSaved] = useState(STUDIO);
  const [values, setValues] = useState(STUDIO);
  const { saving, save, submit } = useSave(() => {
    setSaved(values);
    toast({ title: "Settings saved", description: "Your studio profile is up to date.", tone: "success" });
  });

  /* A change to one setting that keeps the rest. */
  const set =
    <K extends keyof Settings>(key: K) =>
    (value: Settings[K]) =>
      setValues({ ...values, [key]: value });

  /* The props every text field and textarea shares: its value, and a change that keeps the rest. */
  const text = (key: TextKey) => ({
    value: values[key],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(key)(e.target.value),
  });

  return (
    <form
      noValidate
      aria-label="Studio settings"
      className="w-full max-w-3xl"
      onSubmit={(e) => {
        e.preventDefault();
        if (!saving) save();
      }}
    >
      <FormSection title="Profile" description="Shown to the clients you invite to a project.">
        <TextField label="Name" autoComplete="name" {...text("name")} />
        <TextField label="Email" type="email" inputMode="email" autoComplete="email" {...text("email")} />
        <SelectField
          label="Role"
          name="role"
          value={values.role}
          onValueChange={set("role")}
          options={[
            { value: "designer", label: "Designer" },
            { value: "developer", label: "Developer" },
            { value: "producer", label: "Producer" },
            { value: "lead", label: "Studio lead" },
          ]}
        />
      </FormSection>

      <FormSection title="Studio" description="What clients see on your public page and on every invoice.">
        <TextField label="Website" type="url" inputMode="url" mono spellCheck={false} autoComplete="url" {...text("website")} />
        <Textarea label="Bio" rows={4} help="Shown under your studio name. Keep it to a sentence or two." {...text("bio")} />
        <Fieldset legend="Invoice address" description="Printed on every invoice.">
          <TextField label="Street" autoComplete="address-line1" {...text("street")} />
          <TextField label="City" autoComplete="address-level2" {...text("city")} />
          <TextField label="Postcode" autoComplete="postal-code" {...text("postcode")} />
        </Fieldset>
      </FormSection>

      <FormSection title="Notifications" description="What we email you about. Each switch takes effect when you save.">
        {/* rows: the switches carry their own padding, so they sit flush as one list with hairlines between them. */}
        <Fieldset legend="Email" rows>
          <Switch
            align="end"
            name="builds"
            label="Email me when a build finishes"
            checked={values.builds}
            onCheckedChange={set("builds")}
          />
          <Switch
            align="end"
            name="digest"
            label="Weekly digest"
            description="A Monday email with visits and deploys."
            checked={values.digest}
            onCheckedChange={set("digest")}
          />
        </Fieldset>
      </FormSection>

      <FormSection title="Appearance" description="How the dashboard looks to you. It does not change what clients see.">
        <Segmented
          legend="Theme"
          showLegend
          value={values.theme}
          onValueChange={set("theme")}
          options={[
            { value: "system", label: "System" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />
        <Slider
          label="Animation speed"
          name="speed"
          min={0.5}
          max={2}
          step={0.1}
          value={values.speed}
          onValueChange={set("speed")}
          minLabel="Slower"
          maxLabel="Faster"
          showValue
          formatValue={(v) => `${v.toFixed(1)}x`}
        />
      </FormSection>

      <FormActions align="fields" className="mt-12">
        <Button ref={submit} type="submit" variant="primary" loading={saving}>
          Save changes
        </Button>
        <Button variant="ghost" disabled={saving} onClick={() => setValues(saved)}>
          Cancel
        </Button>
      </FormActions>
    </form>
  );
}

/* ------------------------------------------------------------------ sign in */

type SignIn = { email: string; password: string };

/** What is wrong with each field of the sign-in form. A field with nothing wrong has no message. */
function checkSignIn(v: SignIn): Partial<Record<keyof SignIn, string>> {
  return {
    email: !v.email.trim() ? "Enter your email." : EMAIL.test(v.email.trim()) ? undefined : "Use a full address, like nina@halo.studio.",
    password: v.password ? undefined : "Enter your password.",
  };
}

function SignInDemo() {
  const form = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<SignIn>({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof SignIn, string>>>({});
  const [failedSubmits, setFailedSubmits] = useState(0);
  const [signedIn, setSignedIn] = useState(false);
  const { saving, save, submit } = useSave(() => setSignedIn(true));

  /* Two fields are too few for a summary. Once the errors have rendered, focus the first invalid field. */
  useEffect(() => {
    if (failedSubmits) focusFirstInvalid(form.current);
  }, [failedSubmits]);

  const change = (key: keyof SignIn, value: string) => {
    const next = { ...values, [key]: value };
    setValues(next);
    if (errors[key]) setErrors({ ...errors, [key]: checkSignIn(next)[key] });
  };

  return (
    <form
      ref={form}
      noValidate
      aria-label="Sign in"
      className="grid w-full max-w-100 gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (saving) return;
        setSignedIn(false);
        const found = checkSignIn(values);
        setErrors(found);
        if (found.email || found.password) return setFailedSubmits((n) => n + 1);
        save();
      }}
    >
      <TextField
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={values.email}
        error={errors.email}
        onChange={(e) => change("email", e.target.value)}
      />
      <TextField
        label="Password"
        type="password"
        autoComplete="current-password"
        value={values.password}
        error={errors.password}
        onChange={(e) => change("password", e.target.value)}
      />
      <Button ref={submit} type="submit" variant="primary" block loading={saving}>
        Sign in
      </Button>
      <p role="status" className="min-h-5 text-small text-fg-subtle">
        {signedIn ? "Signed in. A real form would open your dashboard now." : ""}
      </p>
    </form>
  );
}

/* ------------------------------------------------------------------ page */

/* ---------- the overview's tile ---------- */

/** One section of a settings form: its title and line on one side, its fields on the other. */
function ProfileTile() {
  return (
    <div className="w-full max-w-md">
      <FormSection title="Profile" description="Shown to the clients you invite to a project.">
        <TextField label="Name" autoComplete="name" defaultValue="Ines Ortega" />
        <TextField label="Email" type="email" inputMode="email" autoComplete="email" defaultValue="ines@halo.studio" />
      </FormSection>
    </div>
  );
}

export default function FormPage() {
  return (
    <Page meta={meta} docs={docs} tile={<ProfileTile />}>
      <Toaster>
        <Stage
          title="Start a project"
          tier="expressive"
          align="start"
          code="StartProjectDemo"
          caption="A narrow column of md fields, a consent box above a full-width lg submit. Send it empty: each wrong field shows its error under it, and the summary on top takes focus. Its links move focus to the fields. Typing in a wrong field checks it again, so its error and its summary line clear as soon as the value is fine. A good send shows the button's loading state, then a toast, and keeps what you typed."
        >
          <StartProjectDemo />
        </Stage>

        <Stage
          title="Settings page"
          tier="instant"
          align="start"
          code="SettingsDemo"
          caption="From 1024 up each section's title and description take the left third and the fields the rest. Below that they stack. A hairline and 48px of air separate sections, and a group of fields sits 48px from its neighbours. The two switches are one list: a Fieldset with rows puts a hairline between them and at both ends. Save is lg and primary, then a ghost Cancel. From 1024 up they line up with the fields. Below 640 they stack full width with Save on top. Cancel puts back every saved value, the select, switches and slider included."
        >
          <SettingsDemo />
        </Stage>

        <Stage
          title="Sign in"
          tier="instant"
          align="start"
          code="SignInDemo"
          caption="Two fields are too few for a summary, so the errors stay under the fields and focus lands on the first invalid one. Send it empty and focus goes to Email. Fill in the email and send again, and focus goes to Password."
        >
          <SignInDemo />
        </Stage>
      </Toaster>
    </Page>
  );
}
