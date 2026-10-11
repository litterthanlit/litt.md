import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/dialog";
import { SegmentedRadio, TextField } from "@/components/dialog-fields";
import { SettingsIcon } from "@/components/icons";
import { Page, Stage, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "dialog",
  title: "Dialog",
  order: 6,
  summary:
    "The one expressive moment. The panel is placed, not thrown: it rises by the dial's travel distance, settles from 0.98 and may bounce slightly. Exits are quicker and never bounce.",
  tiers: ["instant", "expressive"],
};

/** A trigger with a quiet status line under it, so each stage shows what the dialog did. */
function Launcher({ children, status }: { children: ReactNode; status: string | null }) {
  return (
    <div className="grid justify-items-center gap-4">
      {children}
      <p role="status" className="min-h-5 text-small text-fg-subtle">
        {status}
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3 last:border-b-0 last:pb-0">
      <dt className="text-small text-fg-subtle">{label}</dt>
      <dd className="text-small text-fg">{children}</dd>
    </div>
  );
}

function PublishDemo() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!busy) return;
    const t = setTimeout(() => {
      setBusy(false);
      setOpen(false);
      setStatus("Published v3. Home, Work and Journal are live.");
    }, 1400);
    return () => clearTimeout(t);
  }, [busy]);

  return (
    <Launcher status={status}>
      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogTrigger asChild>
          <Button>Publish litt.design v3</Button>
        </DialogTrigger>
        <DialogContent
          title="Publish litt.design v3?"
          description="Home, Work and Journal go live on litt.design. You can roll back from the history."
          footer={
            <>
              <DialogClose asChild>
                <Button disabled={busy}>Cancel</Button>
              </DialogClose>
              <Button variant="primary" loading={busy} onClick={() => setBusy(true)} data-autofocus>
                Publish
              </Button>
            </>
          }
        >
          <dl className="grid gap-3">
            <Row label="Pages changed">3</Row>
            <Row label="Build size">
              <span className="font-mono text-caption">418 kB</span>
            </Row>
            <Row label="Domain">
              <span className="font-mono text-caption">litt.design</span>
            </Row>
          </dl>
        </DialogContent>
      </Dialog>
    </Launcher>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function InviteDemo() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setError("Enter a full address, like nina@halo.studio.");
      return;
    }
    setOpen(false);
    setStatus(`Invite sent to ${email.trim()} as ${role}.`);
  };

  return (
    <Launcher status={status}>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (o) {
            setEmail("");
            setRole("viewer");
            setError(null);
          }
          setOpen(o);
        }}
      >
        <DialogTrigger asChild>
          <Button>Invite a collaborator</Button>
        </DialogTrigger>
        <DialogContent
          title="Invite a collaborator"
          description="They get an email with a link to litt.design."
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
              label="Email address"
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder="name@studio.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              error={error}
            />
            <div className="grid gap-2">
              <SegmentedRadio
                legend="Role"
                name="invite-role"
                value={role}
                onChange={setRole}
                options={[
                  { value: "viewer", label: "Viewer" },
                  { value: "editor", label: "Editor" },
                ]}
              />
              <p className="text-small text-fg-subtle">
                {role === "viewer" ? "Viewers can open the project and leave comments." : "Editors can change pages and publish."}
              </p>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Launcher>
  );
}

const SLUG = "halo-site";

function DeleteDemo() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const ready = typed.trim() === SLUG;

  return (
    <Launcher status={status}>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (o) setTyped("");
          setOpen(o);
        }}
      >
        <DialogTrigger asChild>
          <Button>Delete project</Button>
        </DialogTrigger>
        <DialogContent
          title="Delete Halo site?"
          description="This permanently deletes the project, its 14 pages and 6 published versions. It cannot be undone."
          footer={
            <>
              <DialogClose asChild>
                <Button>Cancel</Button>
              </DialogClose>
              <Button
                disabled={!ready}
                onClick={() => {
                  setOpen(false);
                  setStatus("Halo site was deleted.");
                }}
              >
                <span className={ready ? "text-danger" : ""}>Delete project</span>
              </Button>
            </>
          }
        >
          <TextField
            label={
              <>
                Type <span className="font-mono text-caption text-fg">{SLUG}</span> to confirm
              </>
            }
            mono
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={SLUG}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
        </DialogContent>
      </Dialog>
    </Launcher>
  );
}

function SheetDemo() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("litt.design");
  const [visibility, setVisibility] = useState<"private" | "public">("public");
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
  const [status, setStatus] = useState<string | null>(null);

  return (
    <Launcher status={status}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button icon={<SettingsIcon />}>Project settings</Button>
        </DialogTrigger>
        <DialogContent
          side="right"
          title="Project settings"
          description="Changes apply to every page in litt.design."
          footer={
            <>
              <DialogClose asChild>
                <Button>Cancel</Button>
              </DialogClose>
              <Button variant="primary" type="submit" form="settings-form">
                Save changes
              </Button>
            </>
          }
        >
          <form
            id="settings-form"
            noValidate
            className="grid gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              setOpen(false);
              setStatus(`Saved settings for ${name || "this project"}.`);
            }}
          >
            <TextField label="Project name" spellCheck={false} value={name} onChange={(e) => setName(e.target.value)} />
            <TextField label="Custom domain" mono spellCheck={false} defaultValue="litt.design" help="Point a CNAME record at framer.app." />
            <SegmentedRadio
              legend="Visibility"
              name="settings-visibility"
              value={visibility}
              onChange={setVisibility}
              options={[
                { value: "private", label: "Private" },
                { value: "public", label: "Public" },
              ]}
            />
            <SegmentedRadio
              legend="Default theme"
              name="settings-theme"
              value={theme}
              onChange={setTheme}
              options={[
                { value: "system", label: "System" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
          </form>
        </DialogContent>
      </Dialog>
    </Launcher>
  );
}

export default function DialogPage() {
  return (
    <Page meta={meta}>
      <Stage
        title="Confirm"
        tier="expressive"
        caption="The panel fades in, rises by the dial's travel distance and settles from 0.98 to full size on the expressive tier. The overlay only fades. Closing is quicker and never bounces. Esc, Cancel or a click outside closes it, and focus returns to the button."
      >
        <PublishDemo />
      </Stage>

      <Stage
        title="Form"
        tier="expressive"
        caption="Same entrance, with focus landing in the email field. Inputs are 44px tall and 16px on touch. The role is a native radio group, so arrow keys move between Viewer and Editor. Try sending an invalid address."
      >
        <InviteDemo />
      </Stage>

      <Stage
        title="Destructive"
        tier="expressive"
        caption="There is no danger fill. Delete is a secondary button with danger text, and it stays disabled until you type the project slug. Nothing in the dialog is filled, so the only loud thing is the red word."
      >
        <DeleteDemo />
      </Stage>

      <Stage
        title="Side sheet"
        tier="expressive"
        caption="The sheet is 400px wide and full height, but it travels only the dial's travel distance on x, never its own width. It fades in at the right edge and settles. The footer stays pinned while the body scrolls."
      >
        <SheetDemo />
      </Stage>
    </Page>
  );
}
