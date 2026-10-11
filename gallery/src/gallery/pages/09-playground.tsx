/**
 * The Playground: the one page that can override the locked tokens.
 *
 * Every other page runs the motion and shape from tokens.css. Here the Tune
 * panel moves them, the sampler shows all eight components following along,
 * and "Lock it" prints the tokens to paste back into litt.md. Leaving the page
 * removes every override.
 */
import { useState, type ReactNode } from "react";
import { Button } from "@/components/button";
import { CommandMenu, Kbd, useCommandShortcut, type CommandGroup } from "@/components/command-menu";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/dialog";
import { ChevronDownIcon, CopyIcon, FileIcon, FolderIcon, PlusIcon, SearchIcon, SettingsIcon, ShareIcon, TrashIcon, ArchiveIcon } from "@/components/icons";
import { ProjectList } from "@/components/list";
import { Menu, MenuItem, MenuSeparator } from "@/components/menu";
import { Tabs, TabsList, TabsPanel, TabsPanels, TabsTrigger } from "@/components/tabs";
import { Toaster, useToast } from "@/components/toast";
import { Tooltip } from "@/components/tooltip";
import { PROJECTS } from "../fixtures";
import { TierChip, Page, useReplay, type PageMeta } from "../kit";
import type { Tier } from "@/motion";
import { MotionPanel } from "../motion-panel";

export const meta: PageMeta = {
  id: "playground",
  title: "Playground",
  order: 9,
  tune: true,
  summary:
    "Turn the dials and the components on this page follow. Every other page always runs the locked values from the tokens.",
  tiers: ["instant", "responsive", "expressive"],
};

/* ---------- the sampler ---------- */

function Row({ id, title, tiers, aside, children }: { id: string; title: string; tiers: Tier[]; aside?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={`sample-${id}`} className="grid gap-4 border-t border-line py-8 first:border-t-0 first:pt-0 last:pb-0 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-8">
      <div className="grid content-start gap-3">
        <h2 id={`sample-${id}`} className="text-body text-fg">{title}</h2>
        <div className="flex flex-wrap gap-2">
          {tiers.map((t) => (
            <TierChip key={t} tier={t} />
          ))}
        </div>
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
      />
    </Dialog>
  );
}

function Sampler() {
  const { toast } = useToast();
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

      <Row id="tooltip" title="Tooltip" tiers={["responsive"]}>
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

      <Row id="menu" title="Menu" tiers={["instant", "responsive"]}>
        <Menu label="Project actions" trigger={<Button iconRight={<ChevronDownIcon />}>Actions</Button>}>
          <MenuItem icon={<FileIcon />} shortcut="↵">Open</MenuItem>
          <MenuItem icon={<CopyIcon />} shortcut="⌘D">Duplicate</MenuItem>
          <MenuItem icon={<ShareIcon />} shortcut="⌘L">Share link</MenuItem>
          <MenuSeparator />
          <MenuItem icon={<ArchiveIcon />}>Archive</MenuItem>
          <MenuItem icon={<TrashIcon />} destructive>Delete</MenuItem>
        </Menu>
      </Row>

      <Row id="command-menu" title="Command menu" tiers={["responsive"]}>
        <Button
          icon={<SearchIcon />}
          iconRight={<Kbd>⌘K</Kbd>}
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

      <Row id="dialog" title="Dialog" tiers={["expressive"]}>
        <PublishDialog />
      </Row>

      <Row id="toast" title="Toast" tiers={["expressive"]}>
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

/* ---------- the page ---------- */

export default function PlaygroundPage() {
  return (
    <Page meta={meta}>
      <div className="grid items-start gap-12 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid min-w-0 gap-4">
          <div className="xl:hidden">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => document.getElementById("tune")?.scrollIntoView({ block: "start" })}
            >
              Jump to Tune
            </Button>
          </div>
          <Toaster>
            <Sampler />
          </Toaster>
        </div>
        <aside id="tune" aria-label="Tune" className="scroll-mt-24 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:pr-1">
          <MotionPanel />
        </aside>
      </div>
    </Page>
  );
}
