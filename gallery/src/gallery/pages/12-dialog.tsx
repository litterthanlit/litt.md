import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/dialog";
import { SettingsIcon } from "@/components/icons";
import { TextField } from "@/components/input";
import { Segmented } from "@/components/segmented";
import { DeviceProvider } from "@/motion";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "dialog",
  title: "Dialog",
  order: 12, group: "Overlays",
  summary:
    "The one expressive moment. The panel is placed, not thrown: it rises by the travel token's distance, settles from 0.98 and may bounce slightly. Exits are quicker and never bounce. On a phone it is a bottom sheet you can drag away.",
  tiers: ["instant", "expressive"],
};

export const docs: PageDocs = {
  components: ["dialog", "input", "segmented"],
  exports: ["Dialog", "DialogTrigger", "DialogContent", "DialogClose", "DialogSheet", "TextField", "Segmented"],
  usage: `import { useState } from "react";
import { Button } from "@/components/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/dialog";
import { TextField } from "@/components/input";

const [open, setOpen] = useState(false);
const [name, setName] = useState("litt.design");

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Rename project</Button>
  </DialogTrigger>
  <DialogContent
    title="Rename project"
    description="The new name shows in the dashboard."
    footer={
      <>
        <DialogClose asChild>
          <Button>Cancel</Button>
        </DialogClose>
        <Button variant="primary" type="submit" form="rename-form">
          Save name
        </Button>
      </>
    }
  >
    <form
      id="rename-form"
      onSubmit={(e) => {
        e.preventDefault();
        save(name);
        setOpen(false);
      }}
    >
      <TextField label="Project name" value={name} onChange={(e) => setName(e.target.value)} />
    </form>
  </DialogContent>
</Dialog>

// For a settings sheet, add side="right" to DialogContent.
// When the view has already spent its expressive moment (a list entrance, say), add tier="responsive".
// On a phone (a screen narrower than 640px) every dialog is a bottom sheet, and side="right" is the same sheet.`,
  use: [
    "A decision or a short task needs the person's full attention before anything else: confirm a publish, invite someone, rename a project.",
    "A step that cannot be undone. Make the confirm button secondary with danger text, so the red word is the only loud thing, and ask the person to type the project name.",
    "A short form that is the whole task. Put the buttons in the footer and link the submit to the form with form=\"…\", because the footer sits outside the form.",
    "Settings for the thing on the page. Use side=\"right\" for a sheet: the footer stays pinned while the body scrolls.",
    "A phone, with no change from you. Below 640px the dialog becomes a bottom sheet that can be dragged away, and side=\"right\" becomes the same sheet.",
  ],
  skip: [
    "The message needs no answer, like \"Saved\". Use Toast, because a dialog blocks the whole page.",
    "A short list of actions on one control. Use Menu.",
    "A hint for a button or an icon. Use Tooltip.",
    "The content is long or has several steps. Give it its own page, because the panel is at most 480px wide and its body scrolls.",
    "You want a dialog on top of a dialog. Change the first one's content instead, because glass never sits on glass.",
    "The sheet would need two heights, such as half and full. A phone sheet has one height: its content, up to the screen less a margin.",
  ],
  keyboard: [
    [["Tab"], "Moves to the next control inside the dialog. After the last one it wraps to the first, because focus is trapped."],
    [["Shift+Tab"], "Moves to the previous control, and wraps the same way."],
    [["Esc"], "Closes the dialog and returns focus to the button that opened it."],
    [["Enter", "Space"], "Activates the focused button. Enter in a field submits its form."],
    [["Arrow keys"], "In a Segmented, move to the previous or next option and select it."],
  ],
  a11y: [
    "Radix Dialog does the hard parts: role=\"dialog\", the focus trap and Esc. While the dialog is open the rest of the page is hidden from screen readers, cannot be clicked and cannot scroll. A Toast is the one exception. A toast fired while the dialog is open is announced, its Dismiss button, its action and a swipe work, and a press on it does not close the dialog. Focus stays in the dialog, so F8 and Esc on a toast work once the dialog closes. On a phone, a toast fired over the sheet docks at the top edge, so it never covers the sheet's buttons. The Dialog finds the toast by a data-litt-toaster attribute, so you can install either one without the other.",
    "The title is required, because it names the dialog. The description, when there is one, is linked as the dialog's description. Make the buttons say what happens: Publish, not OK.",
    "With a mouse or keyboard, focus lands on the control marked data-autofocus, else the first control in the body, else the first one in the footer. The close button is the last resort, so it does not grab focus when there is something to do. On a touch screen it lands on the panel instead, so the keyboard does not open while the sheet is still moving. Mark a field with data-autofocus when typing is the point.",
    "Closing returns focus to the DialogTrigger. If you open the dialog another way, such as from a menu item, there is no trigger, so move focus back yourself.",
    "The corner close button is labelled Close, and it is 44px on touch screens. Hide it with hideClose only when the footer has a Cancel, so touch users keep a visible way out.",
    "On a phone the sheet sits above the on-screen keyboard: it follows the visible screen, so the keyboard never covers the footer or the field being typed in.",
    "On a phone the sheet can be dragged down to close it. Every drag has a button that does the same thing: Close, Cancel, Esc and a tap on the dimmed page all close it too. The grabber at the top is decoration and is hidden from screen readers.",
    "A drag never starts in a text field, a slider, a region marked data-no-drag, or a body that is scrolled away from its top. Mark your own scrubber or canvas with data-no-drag.",
    "TextField uses a real label, links the hint and the error with aria-describedby, and sets aria-invalid on an error. The error is not announced by itself, so after a failed submit, move focus to the field. Inputs are 16px on touch, so iOS does not zoom.",
    "Under reduced motion the dialog appears and leaves at once, with no travel. A dragged sheet still follows the finger, and letting go is instant.",
  ],
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

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setError("Enter a full address, like nina@halo.studio.");
      e.currentTarget.querySelector("input")?.focus(); // the field reads its error out (aria-describedby)
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
              <Segmented
                legend="Role"
                showLegend
                block
                name="invite-role"
                value={role}
                onValueChange={setRole}
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
            <Segmented
              legend="Visibility"
              showLegend
              block
              name="settings-visibility"
              value={visibility}
              onValueChange={setVisibility}
              options={[
                { value: "private", label: "Private" },
                { value: "public", label: "Public" },
              ]}
            />
            <Segmented
              legend="Default theme"
              showLegend
              block
              name="settings-theme"
              value={theme}
              onValueChange={setTheme}
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

/** The same settings dialog, forced to the phone path so a desktop can preview it. A real phone needs no wrapper. */
function PhoneDemo() {
  return (
    <DeviceProvider mode="phone">
      <SheetDemo />
    </DeviceProvider>
  );
}

export default function DialogPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Confirm"
        tier="expressive"
        code="PublishDemo"
        caption="The panel fades in, rises by the travel token's distance and settles from 0.98 to full size on the expressive tier. The overlay only fades. Closing is quicker and never bounces. Esc, Cancel or a click outside closes it, and focus returns to the button."
      >
        <PublishDemo />
      </Stage>

      <Stage
        title="Form"
        tier="expressive"
        code="InviteDemo"
        caption="Same entrance, with focus landing in the email field. On a touch screen focus lands on the panel instead, so the keyboard does not open during the rise. Inputs are 44px tall and 16px on touch. The role is a native radio group, so arrow keys move between Viewer and Editor. Try sending an invalid address."
      >
        <InviteDemo />
      </Stage>

      <Stage
        title="Destructive"
        tier="expressive"
        code="DeleteDemo"
        caption="There is no danger fill. Delete is a secondary button with danger text, and it stays disabled until you type the project slug. Nothing in the dialog is filled, so the only loud thing is the red word."
      >
        <DeleteDemo />
      </Stage>

      <Stage
        title="Side sheet"
        tier="expressive"
        code="SheetDemo"
        caption="The sheet is 400px wide and full height, but it travels only the travel token's distance on x, never its own width. It fades in at the right edge and settles. The footer stays pinned while the body scrolls. On a phone it becomes the bottom sheet below."
      >
        <SheetDemo />
      </Stage>

      <Stage
        title="On a phone"
        tier="expressive"
        code="PhoneDemo"
        caption="On a phone the dialog is a bottom sheet, and a right sheet becomes the same one. It rises from the bottom edge by its own height on the expressive tier and leaves the same way. Drag it down from the title, the grabber or the body and it follows your finger. Let go far enough, or flick it, and it leaves. Otherwise it springs back without a bounce. Close, Cancel, Esc and a tap on the dimmed page do the same thing as the drag."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
