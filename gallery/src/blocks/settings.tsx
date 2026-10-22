/**
 * Settings: an account's settings page. A block: a whole screen built from the litt parts, to copy and make your own.
 * Swap the saved values at the top for your user's, and `save` for your request; the sections and their words stay.
 *
 * One left-aligned column of sections: the profile, what we email you about, and how the app looks to you, then Save
 * and Cancel. From 1024 up each section's title takes the left third. A failed save puts a summary on top that takes
 * focus, and a good one ends in a toast. Deleting the studio sits apart, after a hairline, behind a slide to confirm.
 * Save is the one accent fill. Render it inside your app's shell (the dashboard block's AppShell, for one), and mount
 * the Toaster once near your root so the saved toast shows.
 */
import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/button";
import { ErrorSummary, Fieldset, FormActions, FormSection, type FormError } from "@/components/form";
import { TextField } from "@/components/input";
import { Segmented } from "@/components/segmented";
import { SelectField } from "@/components/select";
import { SlideConfirm } from "@/components/slide-confirm";
import { Slider } from "@/components/slider";
import { Switch } from "@/components/switch";
import { toast } from "@/components/toast";

/* ----------------------------------------------------------------- data */

type Values = {
  name: string;
  email: string;
  role: string;
  builds: boolean;
  digest: boolean;
  theme: string;
  speed: number;
};

/** What is saved now. Load yours from your user. */
const SAVED: Values = {
  name: "Ines Ortega",
  email: "ines@halo.studio",
  role: "designer",
  builds: true,
  digest: false,
  theme: "system",
  speed: 1,
};

const ROLES = [
  { value: "designer", label: "Designer" },
  { value: "developer", label: "Developer" },
  { value: "producer", label: "Producer" },
  { value: "lead", label: "Studio lead" },
];

const STUDIO = "Halo Studio";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Ids = { name: string; email: string };

/** What is wrong with the fields, in the order they appear, linked to the ids the summary moves focus to. */
function check(v: Values, ids: Ids): FormError[] {
  const errors: FormError[] = [];
  if (!v.name.trim()) errors.push({ id: ids.name, message: "Enter your name." });
  if (!EMAIL.test(v.email.trim())) errors.push({ id: ids.email, message: "Use a full address, like ines@halo.studio." });
  return errors;
}

/**
 * Pretends to save for a moment, then runs onSaved. Await your request here instead. The loading button is disabled,
 * which can drop focus to the page, so focus goes back to Save when the save ends.
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
    }, 1200);
  };
  return { saving, save, submit };
}

/* ----------------------------------------------------------------- the screen */

export function Settings() {
  /* Ids of its own, so two of these on a page never send the summary's links to the other one. */
  const uid = useId();
  const ids: Ids = { name: `${uid}-name`, email: `${uid}-email` };
  const [saved, setSaved] = useState(SAVED);
  const [values, setValues] = useState(SAVED);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [failedSaves, setFailedSaves] = useState(0);
  const { saving, save, submit } = useSave(() => {
    setSaved(values);
    toast({ title: "Settings saved", description: "Your profile is up to date.", tone: "success" });
  });

  /* A change to one setting that keeps the rest. A field that was wrong is checked again as you type. */
  const set =
    <K extends keyof Values>(key: K) =>
    (value: Values[K]) => {
      const next = { ...values, [key]: value };
      setValues(next);
      if (errors.length) setErrors(check(next, ids));
    };
  const text = (key: "name" | "email") => ({
    id: ids[key],
    value: values[key],
    error: errors.find((e) => e.id === ids[key])?.message,
    onChange: (e: ChangeEvent<HTMLInputElement>) => set(key)(e.target.value),
  });

  return (
    <div className="@container grid w-full max-w-3xl grid-cols-1 gap-12">
      <header className="grid gap-1">
        <h1 className="text-h1 text-fg">Settings</h1>
        <p className="text-body text-fg-muted">Your profile, your email and how {STUDIO} looks to you.</p>
      </header>

      <form
        noValidate
        aria-label="Account settings"
        onSubmit={(e) => {
          e.preventDefault();
          if (saving) return;
          const found = check(values, ids);
          setErrors(found);
          if (found.length) return setFailedSaves((n) => n + 1);
          save();
        }}
      >
        {/* With errors, the summary comes first, and Profile takes the 48px and the hairline every later section has. */}
        <ErrorSummary errors={errors} focusKey={failedSaves} />

        <FormSection title="Profile" description="Shown to the clients you invite to a project.">
          <TextField label="Name" autoComplete="name" {...text("name")} />
          <TextField label="Email" type="email" inputMode="email" autoComplete="email" {...text("email")} />
          <SelectField label="Role" name="role" value={values.role} onValueChange={set("role")} options={ROLES} />
        </FormSection>

        <FormSection title="Notifications" description="What we email you about. Each switch takes effect when you save.">
          {/* rows: the switches sit flush as one list, with hairlines between them. */}
          <Fieldset legend="Email" rows>
            <Switch align="end" name="builds" label="Email me when a build finishes" checked={values.builds} onCheckedChange={set("builds")} />
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

        <FormSection title="Appearance" description="How the app looks to you. It does not change what clients see.">
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
          <Button
            variant="ghost"
            disabled={saving}
            onClick={() => {
              setValues(saved);
              setErrors([]);
            }}
          >
            Cancel
          </Button>
        </FormActions>
      </form>

      {/* Apart from the form: it is not saved with it, and a slide is harder to do by accident than a press. */}
      <div className="border-t border-line pt-12">
        <FormSection title="Delete studio" description={`Removes ${STUDIO}, its projects and every deploy. This cannot be undone.`}>
          <SlideConfirm
            label={`Slide to delete ${STUDIO}`}
            confirmedLabel="Studio deleted"
            onConfirm={() => toast({ title: `${STUDIO} deleted`, description: "Its projects and deploys are gone.", tone: "neutral" })}
          />
        </FormSection>
      </div>
    </div>
  );
}
