import { useState } from "react";
import { Button } from "@/components/button";
import { Kbd } from "@/components/kbd";
import {
  CommandMenu,
  CommandPanel,
  useCommandShortcut,
  type CommandGroup,
  type CommandItem,
} from "@/components/command-menu";
import {
  ArrowUpRightIcon,
  CopyIcon,
  FileIcon,
  FolderIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  SunIcon,
  UserIcon,
} from "@/components/icons";
import { Page, Stage, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "command-menu",
  title: "Command menu",
  order: 5,
  summary:
    "Search every page, project and action from the keyboard. The panel drops in over a dimmed canvas, and one highlight glides between rows as you arrow through them.",
  tiers: ["instant", "responsive"],
};

const GROUPS: CommandGroup[] = [
  {
    id: "pages",
    heading: "Pages",
    items: [
      { id: "overview", label: "Overview", icon: <FileIcon /> },
      { id: "projects", label: "All projects", icon: <FolderIcon /> },
      { id: "templates", label: "Templates", icon: <FileIcon /> },
      { id: "settings", label: "Settings", icon: <SettingsIcon />, shortcut: "⌘," },
    ],
  },
  {
    id: "projects",
    heading: "Projects",
    items: [
      { id: "northwind", label: "Northwind site", icon: <FolderIcon /> },
      { id: "atlas", label: "Atlas portfolio", icon: <FolderIcon /> },
      { id: "brand", label: "Brand refresh", icon: <FolderIcon /> },
      { id: "lumen", label: "Lumen docs", icon: <FolderIcon /> },
    ],
  },
  {
    id: "actions",
    heading: "Actions",
    items: [
      { id: "new", label: "New project", icon: <PlusIcon />, shortcut: "⌘N" },
      { id: "link", label: "Copy share link", icon: <CopyIcon />, shortcut: "⌘L" },
      { id: "theme", label: "Switch theme", icon: <SunIcon /> },
      { id: "invite", label: "Invite a teammate", icon: <UserIcon /> },
      { id: "export", label: "Export build", icon: <ArrowUpRightIcon />, disabled: true },
    ],
  },
];

/* The same panel body, without the dialog. A solid surface: it is not floating here. */
function Preview({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  return (
    <div className="w-full min-w-0 max-w-140 rounded-surface bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]">
      <CommandPanel groups={GROUPS} query={query} onQueryChange={setQuery} onSelect={() => {}} initialSource="pointer" />
    </div>
  );
}

export default function CommandMenuPage() {
  const [open, setOpen] = useState(false);
  const [openedBy, setOpenedBy] = useState<"keyboard" | "pointer">("keyboard");
  const [last, setLast] = useState("Nothing picked yet");

  useCommandShortcut(() => {
    setOpenedBy("keyboard");
    setOpen((o) => !o);
  });

  return (
    <Page meta={meta}>
      <Stage
        title="Open it"
        tier="responsive"
        caption="The overlay fades on opacity only. The panel fades, drops half the travel and scales from 0.98, all on the responsive tier, and leaves with the quicker exit. ⌘K or Ctrl+K opens it while this page is open."
      >
        <div className="grid justify-items-center gap-6">
          <Button
            icon={<SearchIcon />}
            iconRight={<Kbd>⌘K</Kbd>}
            onClick={(e) => {
              setOpenedBy(e.detail === 0 ? "keyboard" : "pointer");
              setOpen(true);
            }}
          >
            Search
          </Button>
          <p className="font-mono text-caption text-fg-subtle" role="status">{last}</p>
        </div>
      </Stage>

      <Stage
        title="Keyboard and glide"
        tier="responsive"
        size="lg"
        caption="The first enabled row is always lit. Arrows move and wrap, skipping disabled rows, and Enter fires only on the lit row. Esc clears the query first, then closes. The highlight glides to the row nearest the pointer, or follows the arrow keys with a focus ring. Typing changes the list instantly and the panel never animates its height."
      >
        <Preview />
      </Stage>

      <Stage
        title="Empty state"
        tier="instant"
        caption="Filtering keeps the original order. When nothing matches, the panel says so and the footer drops the Enter hint, since there is nothing to open."
      >
        <Preview initialQuery="figma" />
      </Stage>

      <CommandMenu
        open={open}
        onOpenChange={setOpen}
        groups={GROUPS}
        openedBy={openedBy}
        onSelect={(item: CommandItem) => setLast(`Picked ${item.label}`)}
      />
    </Page>
  );
}
