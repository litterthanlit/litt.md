import { useDeferredValue, useEffect, useId, useMemo, useRef, useState, type ComponentType, type KeyboardEvent, type Ref, type SVGProps } from "react";
import { Button } from "@/components/button";
import * as Icons from "@/components/icons";
import {
  AlertIcon,
  BuildingIcon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  CopyIcon,
  MailIcon,
  MoreIcon,
  SearchIcon,
  SettingsIcon,
  ShareIcon,
  WarningIcon,
} from "@/components/icons";
import { Input } from "@/components/input";
import { Segmented } from "@/components/segmented";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "icons",
  title: "Icons",
  lede: "One set, drawn on one grid.",
  order: 7.5,
  group: "Controls",
  verbs: ["select"],
  summary:
    "Ninety-eight icons and the status mark, drawn by hand on a 16-unit grid with a 1.5 stroke, round caps and joins, in the text color. Each one fits one of four keylines, so a circle, a square and a box read the same size in a row. They are still: an icon never spins, pulses or draws itself in.",
  tiers: [],
};

export const docs: PageDocs = {
  components: ["icons"],
  exports: ["SearchIcon", "StatusIcon"],
  usage: `import { Button } from "@/components/button";
import { AlertIcon, SettingsIcon, ShareIcon } from "@/components/icons";

// Beside a label. The button sizes it and sets the gap.
<Button icon={<ShareIcon />}>Share</Button>

// Alone, the button needs a name.
<Button iconOnly aria-label="Settings" icon={<SettingsIcon />} />

// It takes the text color, so a status color goes on the icon, next to its words.
<p className="flex items-center gap-2 text-small text-fg">
  <AlertIcon className="text-danger" />
  The deploy failed.
</p>

// Larger, for an empty state. The stroke grows with it.
<SearchIcon size={24} className="text-fg-subtle" />`,
  use: [
    "A control needs a mark people already know: close, search, more, copy, settings.",
    "A row of things is easier to scan with a kind at the start: a file, a folder, a person.",
    "A status needs a second signal besides its color. The icon carries the color and the words carry the meaning.",
    "An icon-only button sits where space is tight and the mark is unmistakable. Give it an aria-label and a tooltip.",
  ],
  skip: [
    "The meaning is not obvious. A word is clearer than a clever mark, so write the label.",
    "It would decorate a heading or a paragraph. Icons are for controls and rows, never ornament.",
    "It stands for a person or a company. Use an Avatar.",
    "It would be a feature card's picture. Three cards with an icon each is the default the profile rejects.",
    "The set has no icon for it. Draw one inside the same grid and keylines, or use the word.",
  ],
  keyboard: [
    [["Tab"], "Skips it. An icon is decorative and takes no focus; the button around it does."],
    [["←", "→", "↑", "↓"], "On this page, moves through the set and shows the icon on its grid."],
  ],
  a11y: [
    "Every icon is aria-hidden and not focusable, so a screen reader reads the label beside it once.",
    "An icon-only button must carry aria-label. The icon never names it.",
    "It draws in currentColor, so it meets the contrast of the text it sits in. A status color on the icon is never the only signal: the words say it too.",
    "In forced colors it takes the system text color, because it is drawn in currentColor.",
    "Nothing moves, so there is nothing to reduce under reduced motion. StatusIcon's running mark is half filled, never spinning.",
  ],
};

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
type Entry = { name: string; family: string; meaning: string; words: string };

/* What each icon means and the words people search for, by family. The order is the set's order in icons.tsx. */
const FAMILIES: [family: string, icons: [name: string, meaning: string, words: string][]][] = [
  ["Navigation", [
    ["ChevronLeft", "Goes back, or moves to the previous item.", "back previous left prev"],
    ["ChevronRight", "Opens a submenu, or moves to the next item.", "next submenu forward"],
    ["ChevronUp", "Collapses a section, or moves up.", "collapse up caret"],
    ["ChevronDown", "Opens a list below the control, such as a select.", "expand dropdown open"],
    ["ChevronsUpDown", "Opens a list with options above and below, such as a combobox.", "select combobox picker sort"],
    ["ArrowLeft", "Goes back, or moves left.", "back previous left"],
    ["ArrowRight", "Continues, or moves right.", "next forward right continue"],
    ["ArrowUp", "Sends, moves up or goes to the top.", "up top send increase"],
    ["ArrowDown", "Moves down, or jumps to the latest.", "down bottom latest decrease"],
    ["ArrowUpRight", "Leaves the site: the one arrow a link to elsewhere carries.", "external open link visit"],
    ["Home", "The start page, or the top of the app.", "house start dashboard"],
    ["Menu", "Opens the navigation on a phone.", "hamburger navigation lines"],
    ["Sidebar", "Shows or hides the sidebar.", "panel toggle layout drawer"],
    ["Expand", "Enters full screen, or enlarges.", "fullscreen maximize enlarge"],
    ["Shrink", "Leaves full screen, or makes smaller.", "exit fullscreen minimize collapse"],
    ["Undo", "Undoes the last change.", "back revert history"],
    ["Redo", "Redoes the change that was undone.", "forward repeat history"],
    ["Retry", "Tries again, or reloads.", "reload refresh again rebuild"],
    ["LogOut", "Signs out of the account.", "sign out exit leave logout"],
  ]],
  ["Actions", [
    ["Search", "Searches, or opens the command menu.", "find look up magnifier"],
    ["Plus", "Creates something new.", "add new create"],
    ["Minus", "Removes one, or steps down.", "remove subtract zoom out"],
    ["X", "Closes a dialog, a sheet or a toast, or clears a field.", "close dismiss clear cancel"],
    ["Check", "Marks the current option, or says something worked.", "done selected tick confirm"],
    ["Edit", "Edits or renames the thing in front of you.", "pencil rename write modify"],
    ["Copy", "Copies a value, a link or code.", "duplicate clipboard"],
    ["Link", "A URL, or joining one thing to another.", "url chain href connect"],
    ["Share", "Shares a link, or sends a file out.", "export send upload"],
    ["Download", "Saves a copy to this device.", "save export get"],
    ["Send", "Sends a message or an invite.", "submit post plane message"],
    ["Paperclip", "Attaches a file.", "attach attachment file"],
    ["Trash", "Deletes something for good.", "delete remove bin"],
    ["Archive", "Moves something out of the way without deleting it.", "box store hide"],
    ["Filter", "Narrows a list down to what matches.", "funnel narrow refine"],
    ["Sort", "Reorders a column or a list.", "order arrange ascending descending"],
    ["Sliders", "Opens filters or display options.", "options adjust controls"],
    ["Settings", "Opens settings.", "preferences gear configure cog"],
    ["More", "Opens a menu of more actions.", "overflow ellipsis dots actions"],
    ["Grip", "A drag handle: grab it to move the row.", "drag handle reorder move"],
    ["Eye", "Shows something, or previews it.", "view show visible preview"],
    ["EyeOff", "Hides something, or stops showing it.", "hide hidden invisible password"],
    ["Lock", "Locked, private or protected.", "secure private protected password"],
    ["Unlock", "Unlocked, or open to change.", "open unprotected access"],
    ["Star", "Marks a favorite.", "favorite favourite bookmark rating"],
    ["Pin", "Pins something to the top, where it stays.", "pushpin tack keep sticky"],
  ]],
  ["Objects", [
    ["File", "A page, a document or a file.", "document page"],
    ["Folder", "A project or a group of files.", "project directory group"],
    ["Image", "A picture, or a picture that failed to load.", "picture photo media asset"],
    ["Play", "Starts playback, or runs something.", "start run preview video"],
    ["Pause", "Pauses playback.", "hold video"],
    ["Stop", "Stops an agent while it answers.", "stop halt cancel"],
    ["Code", "Code, or a code component.", "brackets source develop"],
    ["Terminal", "A command line or a shell.", "console cli shell prompt"],
    ["Monitor", "The desktop, or the system theme.", "desktop screen system display"],
    ["Globe", "A website, a domain or a language.", "web site domain language"],
    ["Layers", "A stack of layers or frames.", "stack layer arrange pages"],
    ["Frame", "The frame tool: an artboard with crop marks.", "artboard crop canvas"],
    ["Cursor", "The pointer or the select tool.", "pointer select arrow mouse"],
    ["Grid", "The grid view of items.", "tiles cards gallery view"],
    ["List", "The list view of items.", "rows bullets view outline"],
    ["Box", "A package: a deploy, a release or an npm package.", "package deploy release npm"],
    ["Database", "Stored data, or a database.", "data storage table"],
    ["GitBranch", "A branch in version history.", "git fork version merge"],
    ["Calendar", "A date, or a schedule.", "date schedule day"],
  ]],
  ["Status and system", [
    ["Info", "Something worth knowing, beside its words.", "information about note"],
    ["Alert", "Something went wrong and needs a fix, beside its words.", "error problem attention"],
    ["CheckCircle", "Something worked or passed, beside its words.", "success done complete passed ok"],
    ["XCircle", "Something failed, beside its words.", "error failed invalid"],
    ["Warning", "Something needs attention soon, beside its words.", "caution alert hazard"],
    ["Help", "Opens help, or explains a term.", "question support faq"],
    ["Bell", "Notifications.", "notification alert remind"],
    ["Clock", "A time, or a duration.", "time schedule duration pending"],
    ["History", "Recent items and past versions.", "recent versions restore"],
    ["Zap", "A build, an instant action or speed.", "bolt lightning fast build"],
    ["Activity", "Activity, logs and uptime.", "pulse logs uptime heartbeat"],
    ["Shield", "Security, protection and permissions.", "security protect permissions safe"],
    ["Key", "API keys, tokens and passwords.", "api key token password secret"],
    ["Flag", "A report, a mark or a milestone.", "report mark milestone"],
    ["Cloud", "Hosting, sync and cloud storage.", "hosting sync storage"],
    ["Sun", "The light theme.", "light theme day"],
    ["Moon", "The dark theme.", "dark theme night"],
    ["Sparkle", "Something an agent made or can make.", "ai magic generate agent"],
    ["Lightbulb", "A tip.", "tip idea hint"],
  ]],
  ["People and data", [
    ["User", "A person, or the account.", "person account profile"],
    ["Users", "A team, or a list of members.", "team members people group"],
    ["Building", "A company, an organisation or a workspace.", "company organization office workspace"],
    ["Mail", "An email address, or a message by email.", "email envelope contact"],
    ["Inbox", "Incoming items waiting to be triaged.", "tray triage incoming"],
    ["Message", "A comment or a chat message.", "comment chat bubble reply"],
    ["AtSign", "A mention of a person.", "mention at handle"],
    ["Hash", "A channel, a tag or an ID.", "channel tag number pound"],
    ["Command", "The command menu and keyboard shortcuts.", "cmd shortcut key palette"],
    ["ChartBar", "Values side by side.", "bars chart statistics analytics"],
    ["ChartLine", "A value over time.", "line chart graph analytics"],
    ["ChartPie", "Parts of a whole.", "pie chart share breakdown"],
    ["TrendUp", "A value rising.", "trending growth increase"],
    ["TrendDown", "A value falling.", "trending decline decrease"],
    ["CreditCard", "Billing, payment and plans.", "billing payment card plan"],
    ["Bag", "A store's cart, and buying.", "cart shop store basket buy checkout"],
  ]],
];

const SET = Icons as unknown as Record<string, IconComponent>;
const ENTRIES: Entry[] = FAMILIES.flatMap(([family, icons]) =>
  icons.map(([name, meaning, words]) => ({ name: `${name}Icon`, family, meaning, words })),
);
const COUNT = ENTRIES.length + 1; // and StatusIcon

const SIZES = [
  { value: "16", label: "16" },
  { value: "24", label: "24" },
  { value: "32", label: "32" },
];

/* The selected segment (P12), one surface up from the raised stage. */
const CELL =
  "group/cell grid h-20 min-w-0 content-center justify-items-center gap-3 rounded-control px-1 select-none [-webkit-tap-highlight-color:transparent] " +
  "transition-colors duration-(--dur-instant) ease-litt " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
  "aria-selected:bg-surface-2 aria-selected:text-fg aria-selected:shadow-[inset_0_0_0_1px_var(--line),var(--highlight)] " +
  "not-aria-selected:text-fg-muted not-aria-selected:hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] not-aria-selected:hover:text-fg";

const matches = (e: Entry, q: string) => {
  if (!q) return true;
  const hay = `${e.name} ${e.family} ${e.meaning} ${e.words}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
};

/** The 16-unit grid with every fourth line stronger, and the keylines dashed over it. */
function GridLines({ keyline }: { keyline?: "circle" | "square" | "landscape" | "portrait" }) {
  const lines = Array.from({ length: 15 }, (_, i) => i + 1);
  /* In grid units, like the drawing: a hairline with quarter-unit dashes at every size. */
  const dashed = { stroke: "var(--fg-subtle)" };
  const all = keyline === undefined;
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false" className="absolute inset-0 size-full">
      {lines.map((i) => (
        <path
          key={i}
          d={`M${i} 0V16M0 ${i}H16`}
          vectorEffect="non-scaling-stroke"
          style={{ stroke: i % 4 ? "var(--line)" : "var(--line-strong)" }}
        />
      ))}
      <g style={dashed} strokeWidth={0.05} strokeDasharray="0.25 0.25" opacity={all ? 0.6 : 1}>
        {(all || keyline === "circle") && <circle cx="8" cy="8" r="6.25" />}
        {(all || keyline === "square") && <rect x="2.25" y="2.25" width="11.5" height="11.5" />}
        {(all || keyline === "landscape") && <rect x="1.75" y="3.25" width="12.5" height="9.5" />}
        {(all || keyline === "portrait") && <rect x="3.25" y="1.75" width="9.5" height="12.5" />}
      </g>
    </svg>
  );
}

/* Marks with a solid part, which a hairline skeleton in the canvas color would cover. */
const FILLED = new Set(["StopIcon", "GripIcon"]);

/** An icon drawn at the size of its box, over the grid, with its centre line traced in the canvas color. */
function Board({ name, keyline }: { name: string; keyline?: "circle" | "square" | "landscape" | "portrait" }) {
  const Icon = SET[name]!;
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-control bg-canvas shadow-[inset_0_0_0_1px_var(--line)]">
      <GridLines keyline={keyline} />
      <Icon className="absolute inset-0 size-full text-fg" />
      {/* The skeleton: the same paths at a hairline, so you can see where each stroke is centred. A filled mark has none. */}
      {!FILLED.has(name) && <Icon className="absolute inset-0 size-full text-canvas" strokeWidth={0.06} />}
    </div>
  );
}

function useCopied(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return [
    copied,
    (text) => {
      navigator.clipboard?.writeText(text).catch(() => {});
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1600);
    },
  ];
}

/* Beside the set when wide; above it when narrow, as a card with the board at the start. */
const INSPECTOR =
  "grid content-start gap-6 lg:sticky lg:top-24 " +
  "max-lg:order-first max-lg:grid-cols-[7rem_minmax(0,1fr)] max-lg:gap-x-6 max-lg:gap-y-4 max-lg:scroll-mt-24";

function Inspector({ entry, ref }: { entry: Entry; ref: Ref<HTMLDivElement> }) {
  const Icon = SET[entry.name]!;
  const [copied, copy] = useCopied();
  return (
    <div ref={ref} className={INSPECTOR}>
      <div className="max-lg:row-span-2">
        <Board name={entry.name} />
      </div>
      <div className="flex items-end gap-6 text-fg">
        {[16, 24, 32].map((s) => (
          <figure key={s} className="grid justify-items-center gap-2">
            <Icon size={s} />
            <figcaption className="font-mono text-caption text-fg-subtle">{s}</figcaption>
          </figure>
        ))}
      </div>
      <div className="grid gap-1">
        <h3 className="font-mono text-small text-fg">{entry.name}</h3>
        <p className="text-small text-fg-muted">{entry.meaning}</p>
        <p className="font-mono text-caption text-fg-subtle">
          {entry.family} · {entry.words.split(" ").join(", ")}
        </p>
      </div>
      <div className="max-lg:col-span-full">
        <Button size="sm" icon={copied ? <CheckIcon /> : <CopyIcon />} onClick={() => copy(`<${entry.name} />`)}>
          {copied ? "Copied" : `Copy <${entry.name} />`}
        </Button>
        <span role="status" aria-live="polite" className="sr-only">
          {copied ? `${entry.name} copied` : ""}
        </span>
      </div>
    </div>
  );
}

/** The cell after `from` in the direction of an arrow key, by where the cells sit on screen, so it follows the wrap. */
function nextCell(cells: HTMLElement[], from: number, key: string): number {
  if (key === "ArrowRight") return Math.min(from + 1, cells.length - 1);
  if (key === "ArrowLeft") return Math.max(from - 1, 0);
  if (key === "Home") return 0;
  if (key === "End") return cells.length - 1;
  const here = cells[from]!.getBoundingClientRect();
  const down = key === "ArrowDown";
  const rows = cells
    .map((c, i) => ({ i, r: c.getBoundingClientRect() }))
    .filter(({ r }) => (down ? r.top > here.top + 1 : r.top < here.top - 1));
  if (!rows.length) return from;
  const top = down ? Math.min(...rows.map(({ r }) => r.top)) : Math.max(...rows.map(({ r }) => r.top));
  const centre = here.left + here.width / 2;
  return rows
    .filter(({ r }) => Math.abs(r.top - top) < 1)
    .reduce((a, b) => (Math.abs(b.r.left + b.r.width / 2 - centre) < Math.abs(a.r.left + a.r.width / 2 - centre) ? b : a)).i;
}

function SetDemo() {
  const [query, setQuery] = useState("");
  const [size, setSize] = useState("16");
  const [picked, setPicked] = useState("SettingsIcon");
  const q = useDeferredValue(query.trim());
  const listRef = useRef<HTMLDivElement>(null);
  const inspectorRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const shown = useMemo(() => ENTRIES.filter((e) => matches(e, q)), [q]);
  const groups = FAMILIES.map(([family]) => ({ family, icons: shown.filter((e) => e.family === family) })).filter((g) => g.icons.length);
  const current = ENTRIES.find((e) => e.name === picked)!;
  /* One Tab stop: the picked icon if it is shown, else the first one shown. */
  const stop = shown.some((e) => e.name === picked) ? picked : shown[0]?.name;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) return;
    const cells = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[role=option]") ?? []);
    const from = cells.indexOf(document.activeElement as HTMLElement);
    if (from < 0) return;
    e.preventDefault();
    const to = cells[nextCell(cells, from, e.key)]!;
    to.focus();
    setPicked(to.dataset.name!);
  };

  return (
    <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12">
      <div className="grid min-w-0 content-start gap-8">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-0 flex-[1_1_16rem] sm:max-w-80">
            <span className="sr-only">Search icons</span>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-subtle" />
            <Input
              size="sm"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${COUNT} icons`}
              autoComplete="off"
              aria-controls={id}
              className="pl-9"
            />
          </label>
          <Segmented legend="Size" size="sm" value={size} onValueChange={setSize} options={SIZES} />
        </div>
        <span role="status" aria-live="polite" className="sr-only">
          {q ? `${shown.length} ${shown.length === 1 ? "icon" : "icons"}` : ""}
        </span>
        {groups.length ? (
          <div ref={listRef} id={id} role="listbox" aria-label="Icons" onKeyDown={onKeyDown} className="grid gap-8">
            {groups.map((g) => (
              <div key={g.family} role="group" aria-labelledby={`${id}-${g.family}`} className="grid gap-3">
                <div id={`${id}-${g.family}`} className="flex items-baseline gap-3 text-small text-fg">
                  {g.family}
                  <span className="font-mono text-caption text-fg-subtle">{g.icons.length}</span>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(5.25rem,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(6.75rem,1fr))] gap-1">
                  {g.icons.map((e) => {
                    const Icon = SET[e.name]!;
                    return (
                      <div
                        key={e.name}
                        role="option"
                        aria-selected={e.name === picked}
                        tabIndex={e.name === stop ? 0 : -1}
                        data-name={e.name}
                        title={e.meaning}
                        onClick={() => {
                          setPicked(e.name);
                          /* When narrow the inspector sits above the set, so bring it into view. */
                          if (window.matchMedia("(width < 64rem)").matches) inspectorRef.current?.scrollIntoView({ block: "nearest" });
                        }}
                        className={CELL}
                      >
                        <Icon size={Number(size)} />
                        <span className="max-w-full truncate font-mono text-caption text-fg-subtle group-aria-selected/cell:text-fg-muted">
                          {e.name.replace(/Icon$/, "")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid justify-items-start gap-4 py-8">
            <p className="text-small text-fg-muted">
              No icon matches “{q}”. Use the word, or draw one on the same grid.
            </p>
            <Button size="sm" onClick={() => setQuery("")}>
              Clear search
            </Button>
          </div>
        )}
      </div>
      <Inspector ref={inspectorRef} entry={current} />
    </div>
  );
}

const KEYLINES = [
  { keyline: "circle", name: "AlertIcon", label: "Circle", size: "radius 6.25" },
  { keyline: "square", name: "CalendarIcon", label: "Square", size: "11.5 by 11.5" },
  { keyline: "landscape", name: "MailIcon", label: "Landscape", size: "12.5 by 9.5" },
  { keyline: "portrait", name: "BuildingIcon", label: "Portrait", size: "9.5 by 12.5" },
] as const;

function KeylinesDemo() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
      {KEYLINES.map((k) => (
        <figure key={k.keyline} className="grid gap-3">
          <Board name={k.name} keyline={k.keyline} />
          <figcaption className="grid gap-0.5">
            <span className="text-small text-fg">{k.label}</span>
            <span className="font-mono text-caption text-fg-subtle">{k.size}</span>
          </figcaption>
        </figure>
      ))}
      <div className="col-span-full flex items-center gap-6 text-fg" aria-label="The four in a row at 16px" role="img">
        <AlertIcon />
        <CalendarIcon />
        <MailIcon />
        <BuildingIcon />
      </div>
    </div>
  );
}

function ContextDemo() {
  return (
    <div className="grid w-full max-w-md gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button icon={<ShareIcon />}>Share</Button>
        <Button variant="ghost" iconOnly aria-label="Settings" icon={<SettingsIcon />} />
        <Button variant="ghost" iconOnly aria-label="More actions" icon={<MoreIcon />} />
      </div>
      <ul className="grid gap-3 text-small text-fg">
        <li className="flex items-center gap-2">
          <CheckCircleIcon className="shrink-0 text-success" />
          Deployed to production
        </li>
        <li className="flex items-center gap-2">
          <WarningIcon className="shrink-0 text-warning" />
          The certificate renews in 3 days
        </li>
        <li className="flex items-center gap-2">
          <AlertIcon className="shrink-0 text-danger" />
          The build failed on step 4
        </li>
      </ul>
    </div>
  );
}

export default function IconsPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="The set"
        size="lg"
        align="start"
        caption="Search by name, meaning or what people call it. Pick one, or move with the arrow keys, to see it on its 16-unit grid with the stroke's centre line traced, and at 16, 24 and 32. Copy puts the JSX on the clipboard."
      >
        <SetDemo />
      </Stage>
      <Stage
        title="Four keylines"
        code="KeylinesDemo"
        caption="Every icon fits one of four shapes. A circle is drawn larger than a square because it covers less of its box, and a box is wide or tall rather than square. In a row at 16px the four read as one size."
      >
        <KeylinesDemo />
      </Stage>
      <Stage
        title="Beside words"
        code="ContextDemo"
        caption="An icon takes the color of its text. In a button it is 16px, 8px from the label, and alone it needs an aria-label. A status color goes on the icon only, and the words say the same thing."
      >
        <ContextDemo />
      </Stage>
    </Page>
  );
}
