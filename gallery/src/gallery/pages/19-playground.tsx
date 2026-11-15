/**
 * The Playground: the one page that can override the locked tokens, and each world's object to feel it on (plans/018).
 *
 * Every other page runs the motion and shape from tokens.css. Here the Tune panel moves them, and "Lock it" prints
 * the tokens to paste back into litt.md. Leaving the page removes every override.
 *
 * The object (play-object/contract.tsx) is the world the World switch picks, made a thing you could hold: Device's is
 * the recorder (bodies/device.tsx), and a world not drawn yet stands on the bare body. Its screen (PlayScreen) runs
 * takes one at a time, chosen on the object's tablist: the studio app (play-app.tsx) first, the same in every world,
 * then the world's own scenes. The screen carries that world's data-material and a MaterialProvider, and its
 * OverlayRoot keeps the sheet, menus, tooltips and toasts inside it, in its world. The gallery around it stays in its
 * own world. Nothing plays by itself and nothing makes a sound. The Tune panel's Frame switch swaps the object for a
 * desktop window that holds the sampler, so the desktop paths (hover tooltips, the flyout submenu, the centred dialog)
 * keep a place to be tuned. The World and Frame switches are page state, so leaving the page puts them back, like
 * every other override.
 *
 * Type and shape are not here: the header's Customize panel tunes them on every page.
 */
import { startTransition, useState, type ReactNode } from "react";
import { Button } from "@/components/button";
import { CommandMenu, useCommandShortcut, type CommandGroup } from "@/components/command-menu";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/dialog";
import { Kbd } from "@/components/kbd";
import { ChevronDownIcon, CopyIcon, FileIcon, FolderIcon, PlusIcon, SearchIcon, SettingsIcon, ShareIcon, TrashIcon, ArchiveIcon } from "@/components/icons";
import { ProjectList } from "@/components/list";
import { Menu, MenuItem, MenuSeparator, MenuSub } from "@/components/menu";
import { Tabs, TabsList, TabsPanel, TabsPanels, TabsTrigger } from "@/components/tabs";
import { useToast } from "@/components/toast";
import { Tooltip } from "@/components/tooltip";
import { PROJECTS } from "../fixtures";
import { TierChip, Page, useReplay, type PageMeta } from "../kit";
import { useDevice, type Tier } from "@/motion";
import { useCustomize, useDark } from "../customize-state";
import { MATERIALS, type Material } from "../look";
import { MotionPanel, type PlayFrameSize } from "../motion-panel";
import { PlayApp, type PlaySettings } from "../play-app";
import { PlayObject } from "../play-object/contract";
import { PlayScreen } from "../play-object/screen";

export const meta: PageMeta = {
  id: "playground",
  title: "Playground",
  lede: "Each world's own object, running one small app and then the world's scenes. Turn the dials and it follows.",
  order: 40,
  tune: true,
  summary:
    "Each world as an object you could hold, Device's a recorder, its screen running one small studio app and then that world's scenes, one take at a time, in Press, Flat, Device, Plain, Rack or Heat. The app's sheet, menus, tooltips and toasts open inside the screen and wear its world. Turn the motion dials and it follows; switch the frame to a desktop to tune the desktop paths. Every other page runs the locked motion from the tokens.",
  tiers: ["instant", "responsive", "expressive"],
};

/* ---------- the sampler ---------- */

function Row({ id, title, tiers, phone, aside, children }: { id: string; title: string; tiers: Tier[]; phone?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={`sample-${id}`} className="grid gap-4 border-t border-line py-8 first:border-t-0 first:pt-0 last:pb-0 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-8">
      <div className="grid content-start gap-3">
        <h2 id={`sample-${id}`} className="text-body text-fg">{title}</h2>
        <div className="flex flex-wrap gap-2">
          {tiers.map((t) => (
            <TierChip key={t} tier={t} />
          ))}
        </div>
        {phone && <p className="text-caption font-normal text-fg-subtle">{phone}</p>}
        {aside}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

const COMMANDS: CommandGroup[] = [
  {
    id: "go",
    heading: "Go to",
    items: [
      { id: "projects", label: "All projects", icon: <FolderIcon /> },
      { id: "templates", label: "Templates", icon: <FileIcon /> },
      { id: "settings", label: "Settings", icon: <SettingsIcon />, shortcut: "⌘," },
    ],
  },
  {
    id: "do",
    heading: "Actions",
    items: [
      { id: "new", label: "New project", icon: <PlusIcon />, shortcut: "⌘N" },
      { id: "link", label: "Copy share link", icon: <CopyIcon />, shortcut: "⌘L" },
    ],
  },
];

const FOLDERS = ["Client work", "Templates", "Experiments", "Archive 2025"];

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3 last:border-b-0 last:pb-0">
      <dt className="text-small text-fg-subtle">{label}</dt>
      <dd className="text-small text-fg">{children}</dd>
    </div>
  );
}

function PublishDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Publish litt.design v3</Button>
      </DialogTrigger>
      <DialogContent
        title="Publish litt.design v3?"
        description="Home, Work and Journal go live on litt.design. You can roll back from the history."
        footer={
          <>
            <DialogClose asChild>
              <Button>Cancel</Button>
            </DialogClose>
            <Button
              variant="primary"
              data-autofocus
              onClick={() => {
                setOpen(false);
                toast({ title: "Published v3", description: "Home, Work and Journal are live.", tone: "success" });
              }}
            >
              Publish
            </Button>
          </>
        }
      >
        <dl className="grid gap-3">
          <Fact label="Pages changed">3</Fact>
          <Fact label="Build size">
            <span className="tabular-nums text-caption font-normal">418 kB</span>
          </Fact>
          <Fact label="Domain">
            <span className="text-caption font-normal">litt.design</span>
          </Fact>
        </dl>
      </DialogContent>
    </Dialog>
  );
}

function Sampler() {
  const { toast } = useToast();
  const { coarse } = useDevice();
  const [listKey, replayList] = useReplay();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [openedBy, setOpenedBy] = useState<"keyboard" | "pointer">("keyboard");

  useCommandShortcut(() => {
    setOpenedBy("keyboard");
    setPaletteOpen((o) => !o);
  });

  return (
    <div className="litt-raised rounded-surface p-6 sm:p-8">
      <Row id="button" title="Button" tiers={["instant"]}>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Start a project</Button>
          <Button variant="secondary">View work</Button>
          <Button variant="ghost">Cancel</Button>
        </div>
      </Row>

      <Row id="tooltip" title="Tooltip" tiers={["responsive"]} phone="On a phone, press and hold a button to read its label.">
        <div role="group" aria-label="Project actions" className="flex items-center gap-1">
          <Tooltip content="Copy link" shortcut="⇧⌘C">
            <Button iconOnly variant="ghost" aria-label="Copy link"><CopyIcon /></Button>
          </Tooltip>
          <Tooltip content="Share" shortcut="⇧⌘S">
            <Button iconOnly variant="ghost" aria-label="Share"><ShareIcon /></Button>
          </Tooltip>
          <Tooltip content="Project settings" shortcut="⌘,">
            <Button iconOnly variant="ghost" aria-label="Project settings"><SettingsIcon /></Button>
          </Tooltip>
        </div>
      </Row>

      <Row id="tabs" title="Tabs" tiers={["instant", "responsive"]}>
        <Tabs defaultValue="overview" className="w-full max-w-md">
          <TabsList aria-label="Atelier Nord">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="deploys">Deploys</TabsTrigger>
          </TabsList>
          <TabsPanels className="min-h-20 px-control-pad-md pt-4">
            <TabsPanel value="overview">
              <p className="text-small text-fg-muted">12,480 visits in the last 7 days across 18 pages.</p>
            </TabsPanel>
            <TabsPanel value="activity">
              <p className="text-small text-fg-muted">Published to production 4 minutes ago.</p>
            </TabsPanel>
            <TabsPanel value="deploys">
              <p className="text-small text-fg-muted">Build 5f2e9c1 finished in 42 seconds.</p>
            </TabsPanel>
          </TabsPanels>
        </Tabs>
      </Row>

      <Row id="menu" title="Menu" tiers={["instant", "responsive"]} phone="On a phone, Move to replaces the list instead of flying out.">
        <Menu label="Project actions" trigger={<Button iconRight={<ChevronDownIcon />}>Actions</Button>}>
          <MenuItem icon={<FileIcon />} shortcut="↵">Open</MenuItem>
          <MenuItem icon={<CopyIcon />} shortcut="⌘D">Duplicate</MenuItem>
          <MenuItem icon={<ShareIcon />} shortcut="⌘L">Share link</MenuItem>
          <MenuSub icon={<FolderIcon />} label="Move to">
            {FOLDERS.map((f) => (
              <MenuItem key={f} icon={<FolderIcon />} onSelect={() => toast({ title: `Moved to ${f}` })}>{f}</MenuItem>
            ))}
          </MenuSub>
          <MenuSeparator />
          <MenuItem icon={<ArchiveIcon />}>Archive</MenuItem>
          <MenuItem icon={<TrashIcon />} destructive>Delete</MenuItem>
        </Menu>
      </Row>

      <Row id="command-menu" title="Command menu" tiers={["responsive"]} phone="On a phone, it sits at the top edge with a Cancel button.">
        <Button
          icon={<SearchIcon />}
          iconRight={coarse ? undefined : <Kbd>⌘K</Kbd>}
          onClick={(e) => {
            setOpenedBy(e.detail === 0 ? "keyboard" : "pointer");
            setPaletteOpen(true);
          }}
        >
          Search
        </Button>
        <CommandMenu
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          groups={COMMANDS}
          openedBy={openedBy}
          onSelect={(item) => toast({ title: `Picked ${item.label}` })}
        />
      </Row>

      <Row id="dialog" title="Dialog" tiers={["expressive"]} phone="On a phone, a bottom sheet. Drag it down to close.">
        <PublishDialog />
      </Row>

      <Row id="toast" title="Toast" tiers={["expressive"]} phone="On a phone, swipe a toast sideways to dismiss it.">
        <Button onClick={() => toast({ title: "Saved", description: "Home hero is up to date.", tone: "success" })}>
          Save changes
        </Button>
      </Row>

      <Row
        id="list"
        title="List"
        tiers={["expressive"]}
        aside={<Button size="sm" variant="secondary" onClick={replayList} className="justify-self-start">Replay entrance</Button>}
      >
        <ProjectList key={listKey} projects={PROJECTS.slice(0, 4)} />
      </Row>
    </div>
  );
}

/* ---------- the frame ---------- */

/** The World switch: which world the frame wears. Built like the Tune panel's segmented groups. */
function WorldSwitch({ value, onChange }: { value: Material; onChange: (m: Material) => void }) {
  return (
    <div className="grid gap-2">
      <span id="world-label" className="text-small text-fg-muted">
        World
      </span>
      <div role="group" aria-labelledby="world-label" className="grid grid-cols-3 overflow-hidden rounded-control shadow-[inset_0_0_0_1px_var(--line-strong)] sm:max-w-sm">
        {MATERIALS.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={value === m.id}
            onClick={() => onChange(m.id)}
            className="litt-target relative h-control-sm cursor-pointer px-2 text-small font-title text-fg-subtle transition-colors duration-(--dur-instant) ease-litt hover:text-fg aria-pressed:bg-surface-3 aria-pressed:text-fg"
          >
            {m.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- the page ---------- */

export default function PlaygroundPage() {
  const { look } = useCustomize();
  const pageDark = useDark();
  /* Page state, so leaving the page puts the world back to the gallery's and the frame back to the phone. */
  const [material, setMaterial] = useState<Material>(look.material);
  const [frame, setFrame] = useState<PlayFrameSize>("phone");
  const [settings, setSettings] = useState<PlaySettings>({ alerts: true, digest: false, volume: 60, theme: "system", seats: 6 });
  /* Below sm the reader is on a phone already: the app fills the page and there is no desktop to switch to. */
  const { compact } = useDevice();
  const size: PlayFrameSize = compact ? "phone" : frame;
  const dark = size === "phone" && settings.theme !== "system" ? settings.theme === "dark" : pageDark;
  return (
    <Page meta={meta}>
      <div className="grid items-start gap-12 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid min-w-0 gap-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <WorldSwitch value={material} onChange={(m) => startTransition(() => setMaterial(m))} />
            <div className="xl:hidden">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => document.getElementById("tune")?.scrollIntoView({ block: "start" })}
              >
                Jump to Tune
              </Button>
            </div>
          </div>
          {size === "phone" ? (
            <PlayObject
              key="object"
              material={material}
              dark={dark}
              app={<PlayApp settings={settings} onSettings={(next) => setSettings((s) => ({ ...s, ...next }))} />}
            />
          ) : (
            <PlayScreen key="desktop" size="desktop" material={material} dark={dark}>
              <div className="h-full overflow-y-auto overscroll-contain p-8">
                <Sampler />
              </div>
            </PlayScreen>
          )}
        </div>
        <aside id="tune" aria-label="Tune" className="scroll-mt-24 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:pr-1">
          <MotionPanel frame={frame} onFrameChange={setFrame} />
        </aside>
      </div>
    </Page>
  );
}
