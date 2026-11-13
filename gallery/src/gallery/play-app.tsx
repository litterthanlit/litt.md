/**
 * The Playground's app: one small studio app for Atelier Nord, the same in every world, worn by whichever world the
 * page's World switch picks. Three screens under a tab bar:
 *
 * - Today: two figures with their trends, visits this week, four projects, and the one accent fill, New project,
 *   which opens a bottom sheet; creating raises a toast. The search button opens the command menu at the top edge,
 *   and its tooltip shows on press and hold.
 * - Projects: a filter, and rows with a tick and a More menu with a Move to drill-down.
 * - Settings: switches, a slider, a select, a number field and a slide to confirm.
 *
 * It is built from @/components and the fixtures only. Every screen's state lives here, in the app, so a world switch
 * (which swaps the parts' bodies) keeps the screen and what was set on it. Nothing moves until touched (R4): the
 * list and the chart play their entrance when their tab is opened, not on load. No landmark and no heading above h3:
 * the page names the frame.
 */
import { useState, type ReactNode } from "react";
import { Button } from "@/components/button";
import { BarChart } from "@/components/chart";
import { Checkbox } from "@/components/checkbox";
import { CommandMenu, type CommandGroup } from "@/components/command-menu";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/dialog";
import {
  ArchiveIcon,
  CopyIcon,
  FileIcon,
  FolderIcon,
  HomeIcon,
  MoreIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  ShareIcon,
  TrashIcon,
} from "@/components/icons";
import { TextField } from "@/components/input";
import { ProjectList, StatusTag, type Project } from "@/components/list";
import { Menu, MenuItem, MenuSeparator, MenuSub } from "@/components/menu";
import { NumberField } from "@/components/number-field";
import { Segmented } from "@/components/segmented";
import { SelectField } from "@/components/select";
import { SlideConfirm } from "@/components/slide-confirm";
import { Slider } from "@/components/slider";
import { Sparkline } from "@/components/sparkline";
import { Stat } from "@/components/stat";
import { Switch } from "@/components/switch";
import { useToast } from "@/components/toast";
import { Tooltip } from "@/components/tooltip";
import { useOverlayRoot } from "@/motion";
import { PROJECTS } from "./fixtures";

export type PlayScreen = "today" | "projects" | "settings";
export type PlayTheme = "system" | "light" | "dark";

const SCREENS: { id: PlayScreen; label: string; icon: ReactNode }[] = [
  { id: "today", label: "Today", icon: <HomeIcon /> },
  { id: "projects", label: "Projects", icon: <FolderIcon /> },
  { id: "settings", label: "Settings", icon: <SettingsIcon /> },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const VISITS = [1640, 1920, 1810, 2260, 2050, 1290, 1510];
const LIVE_TREND = [7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 10, 10, 11, 12];
const DEPLOYS_TREND = [3, 5, 4, 6, 2, 0, 1, 4, 7, 5, 6, 3, 4, 2];
const FOLDERS = ["Client work", "Templates", "Experiments", "Archive 2025"];
const FILTERS = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "drafts", label: "Drafts" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];
const THEMES = [
  { value: "system", label: "Same as the page" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const COMMANDS: CommandGroup[] = [
  {
    id: "go",
    heading: "Go to",
    items: [
      { id: "today", label: "Today", icon: <HomeIcon /> },
      { id: "projects", label: "Projects", icon: <FolderIcon /> },
      { id: "settings", label: "Settings", icon: <SettingsIcon /> },
    ],
  },
  {
    id: "do",
    heading: "Actions",
    items: [
      { id: "new", label: "New project", icon: <PlusIcon /> },
      { id: "link", label: "Copy share link", icon: <CopyIcon /> },
    ],
  },
];

/** A screen's title row: the studio's name over the screen's, with room for actions on the right. */
function TitleRow({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 pt-2 pb-4">
      <div className="grid min-w-0 gap-0.5">
        <p className="text-caption text-fg-subtle">Atelier Nord</p>
        <h3 className="text-h1 text-fg">{title}</h3>
      </div>
      {children}
    </div>
  );
}

/** A caption over a part of a screen. */
function Label({ children }: { children: ReactNode }) {
  return <p className="pb-2 text-caption text-fg-subtle">{children}</p>;
}

/* ---------------------------------------------------------------- Today */

function Today({
  projects,
  replay,
  onSearch,
}: {
  projects: Project[];
  replay: number;
  onSearch: (by: "keyboard" | "pointer") => void;
}) {
  const { toast } = useToast();
  return (
    <>
      <TitleRow title="Today">
        <Tooltip content="Search">
          <Button iconOnly variant="ghost" aria-label="Search" onClick={(e) => onSearch(e.detail === 0 ? "keyboard" : "pointer")}>
            <SearchIcon />
          </Button>
        </Tooltip>
      </TitleRow>
      <div className="grid gap-6 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="Live sites"
            value={12}
            delta="Up 2 this month"
            tone="good"
            trend={<Sparkline label="Live sites, last 14 weeks" values={LIVE_TREND} height={24} />}
          />
          <Stat
            label="Deploys this week"
            value={38}
            delta="Up 4 on last week"
            tone="good"
            trend={<Sparkline label="Deploys per day, last 14 days" values={DEPLOYS_TREND} height={24} />}
          />
        </div>
        <div>
          <Label>Visits this week</Label>
          <BarChart
            key={`chart-${replay}`}
            entrance={replay > 0}
            label="Visits per day, this week"
            labels={DAYS}
            series={[{ name: "Visits", values: VISITS }]}
            unit={["visit", "visits"]}
            xTitle="Day"
            height={160}
          />
        </div>
        <div>
          <Label>Projects</Label>
          <ProjectList
            key={`list-${replay}`}
            entrance={replay > 0}
            projects={projects.slice(0, 4)}
            onOpen={(p) => toast({ title: `Opened ${p.name}` })}
          />
        </div>
      </div>
    </>
  );
}

/**
 * Today's one accent fill, New project, and the sheet it opens. It sits under the screen's scroller, above the tab
 * bar, so it is always in reach and never covers a row.
 */
function NewProject({ sheet, onSheet, onCreate }: { sheet: boolean; onSheet: (open: boolean) => void; onCreate: (name: string, preview: boolean) => void }) {
  const [name, setName] = useState("Harbor rebrand");
  const [preview, setPreview] = useState(true);
  return (
    <>
      <div className="shrink-0 px-4 pt-2 pb-4">
        <Dialog open={sheet} onOpenChange={onSheet}>
          <DialogTrigger asChild>
            <Button variant="primary" block icon={<PlusIcon />}>
              New project
            </Button>
          </DialogTrigger>
          <DialogContent
            title="New project"
            description="It starts as a draft for Atelier Nord."
            footer={
              <>
                <DialogClose asChild>
                  <Button>Cancel</Button>
                </DialogClose>
                <Button
                  variant="primary"
                  disabled={!name.trim()}
                  onClick={() => {
                    onSheet(false);
                    onCreate(name.trim(), preview);
                  }}
                >
                  Create
                </Button>
              </>
            }
          >
            <div className="grid gap-4">
              <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
              <Switch label="Share a preview link" description="Anyone with the link can look." checked={preview} onCheckedChange={setPreview} align="end" />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- Projects */

function Projects({
  projects,
  filter,
  onFilter,
  ticked,
  onTick,
}: {
  projects: Project[];
  filter: Filter;
  onFilter: (f: Filter) => void;
  ticked: string[];
  onTick: (id: string, on: boolean) => void;
}) {
  const { toast } = useToast();
  /* The menu flips against the phone, not the window (Radix keeps overlays inside the window otherwise). */
  const frame = useOverlayRoot();
  const shown = projects.filter((p) => (filter === "all" ? true : filter === "live" ? p.status === "live" : p.status !== "live"));
  return (
    <>
      <TitleRow title="Projects">
        <p className="pb-0.5 text-caption text-fg-subtle tabular-nums">{ticked.length ? `${ticked.length} ticked` : `${shown.length} shown`}</p>
      </TitleRow>
      <div className="grid gap-4 pb-4">
        <Segmented legend="Show" options={[...FILTERS]} value={filter} onValueChange={onFilter} block />
        <ul aria-label="Projects" className="grid">
          {shown.map((p) => (
            <li key={p.id} className="flex min-h-16 items-center gap-2 border-b border-line last:border-b-0">
              <div className="min-w-0 flex-1">
                <Checkbox label={p.name} description={p.client} checked={ticked.includes(p.id)} onChange={(e) => onTick(p.id, e.target.checked)} />
              </div>
              <StatusTag status={p.status} />
              <Menu
                label={`${p.name} actions`}
                align="end"
                collisionBoundary={frame}
                trigger={
                  <Button iconOnly variant="ghost" aria-label={`More for ${p.name}`}>
                    <MoreIcon />
                  </Button>
                }
              >
                <MenuItem icon={<FileIcon />} onSelect={() => toast({ title: `Opened ${p.name}` })}>Open</MenuItem>
                <MenuItem icon={<CopyIcon />} onSelect={() => toast({ title: `Duplicated ${p.name}` })}>Duplicate</MenuItem>
                <MenuItem icon={<ShareIcon />} onSelect={() => toast({ title: "Share link copied" })}>Share link</MenuItem>
                <MenuSub icon={<FolderIcon />} label="Move to">
                  {FOLDERS.map((f) => (
                    <MenuItem key={f} icon={<FolderIcon />} onSelect={() => toast({ title: `Moved to ${f}`, description: p.name })}>
                      {f}
                    </MenuItem>
                  ))}
                </MenuSub>
                <MenuSeparator />
                <MenuItem icon={<ArchiveIcon />} onSelect={() => toast({ title: `Archived ${p.name}` })}>Archive</MenuItem>
                <MenuItem icon={<TrashIcon />} destructive onSelect={() => toast({ title: `Deleted ${p.name}`, tone: "error" })}>
                  Delete
                </MenuItem>
              </Menu>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- Settings */

export type PlaySettings = { alerts: boolean; digest: boolean; volume: number; theme: PlayTheme; seats: number | null };

function Settings({ settings, onChange }: { settings: PlaySettings; onChange: (next: Partial<PlaySettings>) => void }) {
  const { toast } = useToast();
  return (
    <>
      <TitleRow title="Settings" />
      <div className="grid gap-6 pb-6">
        <div>
          <Label>Notifications</Label>
          <div className="grid">
            <Switch label="Deploy alerts" description="When a build finishes or fails." checked={settings.alerts} onCheckedChange={(alerts) => onChange({ alerts })} align="end" />
            <Switch label="Weekly digest" description="Visits and deploys, on Mondays." checked={settings.digest} onCheckedChange={(digest) => onChange({ digest })} align="end" />
          </div>
        </div>
        <Slider
          label="Alert volume"
          value={settings.volume}
          onValueChange={(volume) => onChange({ volume })}
          min={0}
          max={100}
          step={10}
          formatValue={(v) => `${v}%`}
          minLabel="Quiet"
          maxLabel="Loud"
        />
        <SelectField label="Theme" options={THEMES} value={settings.theme} onValueChange={(v) => onChange({ theme: v as PlayTheme })} />
        <NumberField label="Seats" value={settings.seats} onValueChange={(seats) => onChange({ seats })} min={1} max={20} unit="seats" help="Atelier Nord pays for each seat." />
        <div>
          <Label>Danger zone</Label>
          <SlideConfirm
            label="Slide to delete Atelier Nord"
            confirmedLabel="Deleting Atelier Nord"
            onConfirm={() => toast({ title: "Atelier Nord is safe", description: "This is the Playground: nothing was deleted." })}
          />
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- the app */

/**
 * The app on a phone. The page passes the theme setting up, since it is the frame that wears it.
 */
export function PlayApp({ settings, onSettings }: { settings: PlaySettings; onSettings: (next: Partial<PlaySettings>) => void }) {
  const { toast } = useToast();
  const [screen, setScreen] = useState<PlayScreen>("today");
  /* Opening a tab replays its entrance: the list and the chart remount with their entrance on. */
  const [replay, setReplay] = useState(0);
  const [projects, setProjects] = useState<Project[]>(() => PROJECTS.slice(0, 6));
  const [filter, setFilter] = useState<Filter>("all");
  const [ticked, setTicked] = useState<string[]>([]);
  const [palette, setPalette] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [openedBy, setOpenedBy] = useState<"keyboard" | "pointer">("pointer");

  const go = (next: PlayScreen) => {
    setScreen(next);
    if (next === "today") setReplay((r) => r + 1);
  };

  const create = (name: string, preview: boolean) => {
    const id = `new-${Date.now()}`;
    setProjects((list) => [{ id, name, client: "Atelier Nord", deploy: "No deploy yet", status: "draft", updated: "2026-11-13" }, ...list]);
    toast({ title: `Created ${name}`, description: preview ? "A draft with a preview link." : "A draft, private for now.", tone: "success" });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4">
        {screen === "today" && (
          <Today
            projects={projects}
            replay={replay}
            onSearch={(by) => {
              setOpenedBy(by);
              setPalette(true);
            }}
          />
        )}
        {screen === "projects" && (
          <Projects
            projects={projects}
            filter={filter}
            onFilter={setFilter}
            ticked={ticked}
            onTick={(id, on) => setTicked((t) => (on ? [...t, id] : t.filter((x) => x !== id)))}
          />
        )}
        {screen === "settings" && <Settings settings={settings} onChange={onSettings} />}
      </div>
      {screen === "today" && <NewProject sheet={sheet} onSheet={setSheet} onCreate={create} />}
      <CommandMenu
        open={palette}
        onOpenChange={setPalette}
        groups={COMMANDS}
        openedBy={openedBy}
        onSelect={(item) => {
          if (item.id === "today" || item.id === "projects" || item.id === "settings") go(item.id);
          else if (item.id === "link") toast({ title: "Share link copied" });
          else {
            setScreen("today");
            setSheet(true);
          }
        }}
      />
      <div role="group" aria-label="Screens" className="grid shrink-0 grid-cols-3 border-t border-line bg-canvas px-2">
        {SCREENS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={screen === s.id}
            onClick={() => go(s.id)}
            className="litt-target flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 text-caption text-fg-subtle transition-colors duration-(--dur-instant) ease-litt hover:text-fg aria-pressed:font-title aria-pressed:text-fg"
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
