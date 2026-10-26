import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { Button } from "@/components/button";
import { TextField } from "@/components/input";
import { CalendarIcon, CheckIcon, ChevronDownIcon, CopyIcon, FolderIcon, ShareIcon, SlidersIcon, UserIcon } from "@/components/icons";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/popover";
import { DeviceProvider, useDevice } from "@/motion";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "popover",
  title: "Popover",
  lede: "A floating glass panel for a small task.",
  order: 9, group: "Overlays",
  verbs: ["open"],
  summary:
    "A floating glass panel for a small form, a share link or a detail card. It grows from its trigger's corner and slides in from the side it really opens on. On a phone it becomes a bottom sheet.",
  tiers: ["instant", "responsive", "expressive"],
};

export const docs: PageDocs = {
  components: ["popover", "button", "icons"],
  exports: ["Popover", "PopoverTrigger", "PopoverContent", "PopoverClose"],
  usage: `import { Button } from "@/components/button";
import { ChevronDownIcon, ShareIcon } from "@/components/icons";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/popover";

<Popover>
  <PopoverTrigger asChild>
    <Button icon={<ShareIcon />} iconRight={<ChevronDownIcon />}>Share</Button>
  </PopoverTrigger>
  <PopoverContent label="Share a preview link" size="lg" align="start">
    <p>Anyone with the link can see the latest draft.</p>
    <input aria-label="Preview link" readOnly value={link} />
    <Button variant="primary" data-autofocus onClick={copy}>Copy</Button>
    <PopoverClose asChild>
      <Button>Done</Button>
    </PopoverClose>
  </PopoverContent>
</Popover>

// Control it with <Popover open={open} onOpenChange={setOpen}>.
// For a set of rows, such as options, use <PopoverContent padded={false}> and 44px rows.
// For a list of commands, use Menu instead.
// On a phone (a screen narrower than 640px) the same popover is a bottom sheet, and label is its heading.
// Write label as a short title, and do not repeat it at the top of the content.`,
  use: [
    "A small form that belongs to one thing on the page: a due date and status, a rename, a filter set.",
    "A share panel or a detail card that needs a link, a button or a few lines of text next to the thing it describes.",
    "Options that apply as you change them, such as filters. Turn padded off and use 44px rows, so the whole row is the target.",
    "Anything the person should answer without losing their place. The panel opens next to its trigger and the page stays where it is.",
    "A phone, with no change from you. Below 640px the same content opens as a bottom sheet that can be dragged away, with label as its heading, because a form or a picker needs the width and a place above the keyboard.",
  ],
  skip: [
    "A list of commands. Use Menu, which has typeahead, arrow keys and a gliding highlight.",
    "A hint for an icon or a shortcut. Use Tooltip, which has no controls inside it.",
    "A decision that needs the whole page's attention, or a confirmation. Use a Dialog.",
    "A long form, or one with several steps. Give it a page or a Dialog, because the panel is at most 384px wide and scrolls when it is tall.",
    "Content that should appear on hover. A popover opens on click or tap, because hover does not exist on touch.",
    "A list of commands that should stay beside its button on a phone. Use Menu, which stays anchored there. Only a popover becomes a sheet.",
    "Two sheet heights, or a sheet that stays open while the page behind it is used. A phone sheet is a modal with one height: its content, up to the screen less a margin.",
  ],
  keyboard: [
    [["Enter", "Space"], "On the trigger: opens the popover. Focus moves to the control marked data-autofocus, else the first control inside, else the panel."],
    [["Tab"], "Moves to the next control inside the popover. After the last one it wraps to the first."],
    [["Shift+Tab"], "Moves to the previous control, and wraps the same way."],
    [["Esc"], "Closes the popover and returns focus to the trigger. On a phone it closes the sheet the same way."],
    [["Enter", "Space"], "On a PopoverClose button, such as Cancel: closes the popover and returns focus to the trigger."],
    [["Enter"], "In a field: submits its form, if it has one."],
  ],
  a11y: [
    "Radix supplies the semantics. The panel is role=\"dialog\", and the trigger gets aria-haspopup=\"dialog\", aria-expanded and aria-controls. The label prop is required, because a dialog needs a name.",
    "The popover is not modal by default. The rest of the page stays reachable, and a click outside closes it. A click on the trigger toggles it. Pass modal to Popover to make the page inert while it is open. On a phone it is always modal, because it is a sheet.",
    "Focus moves into the panel on open and back to the trigger on close. If you click somewhere else to close it, focus stays where you clicked instead of jumping back.",
    "Mark the control a person should reach first with data-autofocus: the Copy button in a share panel, not the read-only field. Opened by pointer, a button shows no ring until a key is pressed; a text field always shows its own.",
    "The panel is drawn at the end of the page, not next to its trigger. Focus moves into it, so a screen reader reads it right away. Do not depend on reading order.",
    "The surface is glass over the page, and solid when its trigger sits inside glass, such as a dialog or the header, or inside another popover, because glass never sits on glass. Pass solid to force it.",
    "Nothing opens on hover, so keyboard and touch get the same thing. The padding and the sizes sit on the 8px grid. Make your own buttons and rows 44px, and fields 16px on touch, as the gallery's fields do.",
    "On a phone the panel is a sheet, and the sheet is a modal dialog named by label, which it also shows as its heading. A caller must pass a label that works as a title, and should not repeat it as a heading in the content. The page behind is inert, focus is trapped, and the sheet is labelled by that heading.",
    "A sheet can be dragged down to close it, and every drag has a button that does the same thing: the Close button (44px on touch), Esc and a tap on the dimmed page all close it too. The grabber at the top is decoration and is hidden from screen readers. A drag never starts in a focused text field, a slider, a region marked data-no-drag, or a body scrolled away from its top.",
    "On a touch screen focus lands on the sheet, or on the control marked data-autofocus, so the keyboard does not open while the sheet is still rising. Mark a field data-autofocus when typing is the point. With a mouse or keyboard the rule above applies. Closing returns focus to the trigger.",
    "A popover opened from inside a sheet, a dialog or the header is solid on a phone too, because glass never sits on glass.",
    "Under reduced motion the panel appears and leaves at once, with no travel. A dragged sheet still follows the finger, and letting go is instant.",
  ],
};

/** A quiet status line beside a trigger, so each stage shows what the popover did. */
function Status({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="min-h-5 text-caption font-normal text-fg-subtle">
      {children}
    </p>
  );
}

/** A labelled native input on the 44px control scale, 16px text on touch. The label is a real label, never a placeholder. */
/** A native checkbox or radio in a 44px row, concentric in the popover's 4px inset. The whole row is the label. */
function Choice({
  type,
  name,
  checked,
  onChange,
  children,
}: {
  type: "checkbox" | "radio";
  name?: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}) {
  return (
    <label
      className={
        "flex h-control-md cursor-pointer items-center gap-2 rounded-control px-3 text-small text-fg-muted " +
        "transition-colors duration-(--dur-instant) ease-litt " +
        "hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg " +
        "has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-focus"
      }
    >
      <input
        type={type}
        name={name}
        className="size-4 shrink-0 cursor-pointer accent-accent focus-visible:outline-none"
        checked={checked}
        onChange={onChange}
      />
      <span className="min-w-0 truncate">{children}</span>
    </label>
  );
}

/* ------------------------------------------------------------------ share */

const PREVIEW_LINK = "https://northwind-8f2c.framer.app";

function ShareDemo() {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  /* On a phone the label is the sheet's heading, so the panel's own heading would say it twice. */
  const { compact } = useDevice();

  useEffect(() => {
    if (state !== "copied") return;
    const t = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(t);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PREVIEW_LINK);
      setState("copied");
    } catch {
      setState("failed"); // the field selects itself on focus, so the person can press the shortcut
    }
  };

  return (
    <Popover onOpenChange={(open) => open && setState("idle")}>
      <PopoverTrigger asChild>
        <Button icon={<ShareIcon />} iconRight={<ChevronDownIcon />}>
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent label="Share a preview link" size="lg">
        <div className="grid gap-4">
          <div className="grid gap-1">
            {!compact && <p className="text-body font-title text-fg">Share a preview</p>}
            <p className="text-small text-fg-subtle">
              Anyone with the link can see the latest Northwind draft. It stops working when you unpublish.
            </p>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
            <TextField
              label="Preview link"
              readOnly
              spellCheck={false}
              value={PREVIEW_LINK}
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button
              variant="primary"
              className="w-28"
              data-autofocus
              icon={state === "copied" ? <CheckIcon /> : <CopyIcon />}
              onClick={copy}
            >
              {state === "copied" ? "Copied" : "Copy"}
            </Button>
          </div>
          <p role="status" className={state === "failed" ? "text-small text-danger" : "sr-only"}>
            {state === "copied" && "Link copied."}
            {state === "failed" && "The browser would not copy it. Select the link and press the copy shortcut."}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------------------------- a client card, a filter set */

function ClientCardDemo() {
  const [last, setLast] = useState("Nothing opened yet");
  return (
    <div className="flex items-center gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button icon={<UserIcon />}>Nina Morgan</Button>
        </PopoverTrigger>
        <PopoverContent label="Client details">
          <div className="grid gap-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center rounded-pill bg-surface-3 text-small text-fg"
              >
                NM
              </span>
              <div className="grid min-w-0">
                <p className="truncate text-body font-title text-fg">Nina Morgan</p>
                <p className="truncate text-small text-fg-subtle">Head of brand, Northwind</p>
              </div>
            </div>
            <dl className="grid gap-3 border-t border-line pt-4">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-small text-fg-subtle">Projects</dt>
                <dd className="text-small text-fg">2 live</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-small text-fg-subtle">Last build</dt>
                <dd className="text-small text-fg">2 days ago</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-small text-fg-subtle">Email</dt>
                <dd className="min-w-0 truncate text-caption font-normal text-fg">nina@northwind.co</dd>
              </div>
            </dl>
            <PopoverClose asChild>
              <Button block onClick={() => setLast("Opened Nina Morgan")}>
                Open client
              </Button>
            </PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
      <Status>{last}</Status>
    </div>
  );
}

const PROJECTS = [
  { name: "Northwind site", client: "Northwind", status: "Live" },
  { name: "Northwind pricing", client: "Northwind", status: "In review" },
  { name: "Atlas portfolio", client: "Atlas", status: "In review" },
  { name: "Atlas wordmark", client: "Atlas", status: "Draft" },
  { name: "Halo site", client: "Halo", status: "Live" },
  { name: "Halo launch page", client: "Halo", status: "Draft" },
  { name: "Halo brand guide", client: "Halo", status: "Live" },
] as const;
const STATUSES = ["Live", "In review", "Draft"];
const CLIENTS = ["Northwind", "Atlas", "Halo"];

function FilterGroup({ legend, options, picked, onToggle }: { legend: string; options: string[]; picked: string[]; onToggle: (value: string) => void }) {
  return (
    <fieldset>
      <legend className="flex h-control-sm items-center px-3 text-caption text-fg-subtle">{legend}</legend>
      {options.map((o) => (
        <Choice key={o} type="checkbox" checked={picked.includes(o)} onChange={() => onToggle(o)}>
          {o}
        </Choice>
      ))}
    </fieldset>
  );
}

function FiltersDemo() {
  const [status, setStatus] = useState<string[]>(["Live", "In review"]);
  const [client, setClient] = useState<string[]>([]);
  const toggle = (list: string[], set: (next: string[]) => void) => (value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  const shown = PROJECTS.filter(
    (p) => (!status.length || status.includes(p.status)) && (!client.length || client.includes(p.client)),
  );
  return (
    <div className="flex items-center gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button icon={<SlidersIcon />} iconRight={<ChevronDownIcon />}>
            Filters
          </Button>
        </PopoverTrigger>
        <PopoverContent label="Filter projects" size="lg" padded={false}>
          <div className="grid grid-cols-2">
            <FilterGroup legend="Status" options={STATUSES} picked={status} onToggle={toggle(status, setStatus)} />
            <FilterGroup legend="Client" options={CLIENTS} picked={client} onToggle={toggle(client, setClient)} />
          </div>
          <div className="-mx-1 my-1 h-px bg-line" />
          <Button
            variant="ghost"
            block
            onClick={() => {
              setStatus([]);
              setClient([]);
            }}
          >
            Clear filters
          </Button>
        </PopoverContent>
      </Popover>
      <Status>
        {shown.length} of {PROJECTS.length} projects
      </Status>
    </div>
  );
}

function ClientAndFilters() {
  return (
    <div className="flex flex-wrap items-center gap-x-12 gap-y-6">
      <ClientCardDemo />
      <FiltersDemo />
    </div>
  );
}

/* ------------------------------------------------------- opens upward, a form */

const STATE_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "In review" },
  { value: "live", label: "Live" },
] as const;
type ProjectState = (typeof STATE_OPTIONS)[number]["value"];

const day = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** The form is mounted fresh each time the popover opens, so it always starts from the saved values. */
function ScheduleForm({
  due,
  state,
  onSave,
}: {
  due: string;
  state: ProjectState;
  onSave: (due: string, state: ProjectState) => void;
}) {
  const [nextDue, setNextDue] = useState(due);
  const [nextState, setNextState] = useState(state);
  const name = useId();
  return (
    <form
      noValidate
      className="grid gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(nextDue, nextState);
      }}
    >
      <TextField label="Due date" type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-small font-title text-fg">Status</legend>
        <div className="-mx-3 flex">
          {STATE_OPTIONS.map((o) => (
            <Choice key={o.value} type="radio" name={name} checked={nextState === o.value} onChange={() => setNextState(o.value)}>
              {o.label}
            </Choice>
          ))}
        </div>
      </fieldset>
      <div className="flex justify-end gap-3">
        <PopoverClose asChild>
          <Button>Cancel</Button>
        </PopoverClose>
        <Button variant="primary" type="submit">
          Save
        </Button>
      </div>
    </form>
  );
}

function ScheduleDemo() {
  const [open, setOpen] = useState(false);
  const [due, setDue] = useState("2026-10-30");
  const [state, setState] = useState<ProjectState>("review");
  const [boundary, setBoundary] = useState<Element | null>(null);
  /* The stage is the collision boundary, so the popover flips up every time, wherever the page is scrolled. */
  const ref = useCallback((el: HTMLDivElement | null) => setBoundary(el?.parentElement ?? null), []);
  const label = STATE_OPTIONS.find((o) => o.value === state)!.label;
  return (
    <div ref={ref} className="flex items-center gap-6">
      <div className="grid justify-items-end">
        <span className="text-small font-title text-fg">Northwind site</span>
        <span role="status" className="text-caption text-fg-subtle">
          {label}
        </span>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button icon={<CalendarIcon />}>Due {day(due)}</Button>
        </PopoverTrigger>
        <PopoverContent label="Due date and status" align="end" collisionBoundary={boundary}>
          <ScheduleForm
            due={due}
            state={state}
            onSave={(nextDue, nextState) => {
              setDue(nextDue);
              setState(nextState);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

/* ------------------------------------------------------------- over glass */

const ACCESS = [
  { value: "link", title: "Anyone with the link", note: "Can open the preview without signing in." },
  { value: "studio", title: "People in Halo Studio", note: "Needs a workspace account." },
  { value: "invited", title: "Only people you invite", note: "Each person gets an email with a link." },
] as const;
type Access = (typeof ACCESS)[number]["value"];

function AccessDemo() {
  const [access, setAccess] = useState<Access>("link");
  const { compact } = useDevice();
  const group = useId();
  const current = ACCESS.find((a) => a.value === access)!;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button icon={<UserIcon />} iconRight={<ChevronDownIcon />}>
          Access
        </Button>
      </PopoverTrigger>
      <PopoverContent label="Preview access">
        <div className="grid gap-6">
          <div className="grid gap-4">
            {!compact && <p className="text-body font-title text-fg">Preview access</p>}
            <div className="grid gap-2">
              <span className="text-small font-title text-fg">Who can view</span>
              {/* Opened from inside a glass popover, so this panel is solid. */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button block iconRight={<ChevronDownIcon />}>
                    {current.title}
                  </Button>
                </PopoverTrigger>
                <PopoverContent label="Who can view" padded={false}>
                  <fieldset>
                    <legend className="sr-only">Who can view</legend>
                    {ACCESS.map((a) => (
                      <label
                        key={a.value}
                        className={
                          "flex min-h-control-md cursor-pointer items-start gap-2 rounded-control px-3 py-3 " +
                          "transition-colors duration-(--dur-instant) ease-litt " +
                          "hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] " +
                          "has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-focus"
                        }
                      >
                        <input
                          type="radio"
                          name={group}
                          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-accent focus-visible:outline-none"
                          checked={access === a.value}
                          onChange={() => setAccess(a.value)}
                        />
                        <span className="grid min-w-0">
                          <span className="text-small font-title text-fg">{a.title}</span>
                          <span className="text-caption font-normal text-fg-subtle">{a.note}</span>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                </PopoverContent>
              </Popover>
              <p className="text-small text-fg-subtle">{current.note}</p>
            </div>
          </div>
          <PopoverClose asChild>
            <Button variant="primary" block>
              Done
            </Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ----------------------------------------------------------- on a phone, a form */

/** A short form with a text field: the reason a phone gets a sheet. Mounted fresh on each open, so it starts from the saved name. */
function RenameForm({ name, onSave }: { name: string; onSave: (name: string) => void }) {
  const [next, setNext] = useState(name);
  const empty = next.trim() === "";
  return (
    <form
      noValidate
      className="grid gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!empty) onSave(next.trim());
      }}
    >
      <TextField
        label="Project name"
        value={next}
        autoComplete="off"
        error={empty ? "A project needs a name." : undefined}
        onChange={(e) => setNext(e.target.value)}
      />
      <div className="flex justify-end gap-3">
        <PopoverClose asChild>
          <Button>Cancel</Button>
        </PopoverClose>
        <Button variant="primary" type="submit">
          Save name
        </Button>
      </div>
    </form>
  );
}

function RenameDemo() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Northwind site");
  return (
    <div className="flex items-center gap-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button icon={<FolderIcon />}>Rename</Button>
        </PopoverTrigger>
        <PopoverContent label="Rename project">
          <RenameForm
            name={name}
            onSave={(next) => {
              setName(next);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <Status>{name}</Status>
    </div>
  );
}

/** The same popovers forced to the phone path so a desktop can preview them. A real phone needs no wrapper. */
function PhoneDemo() {
  return (
    <DeviceProvider mode="phone">
      <div className="flex flex-wrap items-center gap-x-12 gap-y-6">
        <RenameDemo />
        <FiltersDemo />
      </div>
    </DeviceProvider>
  );
}

export default function PopoverPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Share a preview link"
        tier="responsive"
        size="lg"
        align="start"
        code="ShareDemo"
        caption="The panel fades in, grows from the press scale out of the trigger's corner and slides a quarter of the travel token, on the responsive tier. Focus lands on Copy, so Enter copies at once. Esc closes it and focus goes back to Share. A click outside closes it too, and focus stays where you clicked."
      >
        <ShareDemo />
      </Stage>

      <Stage
        title="A client card and a filter set"
        tier="responsive"
        size="lg"
        align="start"
        code="ClientAndFilters"
        caption="A popover holds any content. The card is read-only text and one button. The filters are native checkboxes in 44px rows, so the whole row is the target, and they apply as you tick them, so there is nothing to confirm. Both open on click or tap, never on hover, so touch gets the same thing."
      >
        <ClientAndFilters />
      </Stage>

      <Stage
        title="Opens upward"
        tier="responsive"
        size="lg"
        align="end"
        code="ScheduleDemo"
        caption="This trigger sits in the bottom-right corner, so the popover flips up. The entrance follows the side it opens on: it rises out of the trigger and grows from the bottom-right corner. Save and Cancel are md, as in a dialog. Cancel throws the edits away, and focus goes back to the trigger either way."
      >
        <ScheduleDemo />
      </Stage>

      <Stage
        title="Over glass"
        tier="responsive"
        size="lg"
        align="start"
        code="AccessDemo"
        caption="Glass never sits on glass. The picker is opened from inside a glass popover, so its panel is solid: surface 2 with the float shadow, as Menu's submenus are. It finds that out from its trigger when it opens, and solid forces it. A popover opened from a dialog or the glass header turns solid the same way. Options change live and the picker stays open, like Menu's radio rows, so Esc closes only the picker."
      >
        <AccessDemo />
      </Stage>

      <Stage
        title="On a phone"
        tier="expressive"
        align="start"
        code="PhoneDemo"
        caption="On a phone a popover is a bottom sheet, because a form needs the width and a place above the keyboard. The same content shows, under label as a heading. It rises from the bottom edge on the expressive tier and leaves the same way, and it follows your finger when you drag it down. Close, Esc and a tap on the dimmed page do the same thing. A touch screen puts focus on the sheet, so the keyboard waits until you tap the field."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
