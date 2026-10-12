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
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "command-menu",
  title: "Command menu",
  order: 11, group: "Overlays",
  summary:
    "Search every page, project and action from the keyboard. The panel drops in over a dimmed canvas, and one highlight glides between rows as you arrow through them.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["command-menu", "icons", "button"],
  exports: ["CommandMenu", "useCommandShortcut", "CommandPanel"],
  usage: `import { useState } from "react";
import { Button } from "@/components/button";
import { CommandMenu, CommandPanel, useCommandShortcut, type CommandGroup } from "@/components/command-menu";
import { FolderIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { Kbd } from "@/components/kbd";

/* A group is { id, heading, items }.
   An item is { id, label, icon?, shortcut?, disabled? }. */
const groups: CommandGroup[] = [
  {
    id: "projects",
    heading: "Projects",
    items: [
      { id: "northwind", label: "Northwind site", icon: <FolderIcon /> },
      { id: "atlas", label: "Atlas portfolio", icon: <FolderIcon /> },
    ],
  },
  {
    id: "actions",
    heading: "Actions",
    items: [{ id: "new", label: "New project", icon: <PlusIcon />, shortcut: "⌘N" }],
  },
];

function Search() {
  const [open, setOpen] = useState(false);
  useCommandShortcut(() => setOpen((o) => !o));
  return (
    <>
      <Button icon={<SearchIcon />} iconRight={<Kbd>⌘K</Kbd>} onClick={() => setOpen(true)}>
        Search
      </Button>
      <CommandMenu open={open} onOpenChange={setOpen} groups={groups} onSelect={(item) => run(item.id)} />
    </>
  );
}

{/* Without the dialog: CommandPanel inside a surface you provide. */}
<CommandPanel groups={groups} query={query} onQueryChange={setQuery} onSelect={(item) => run(item.id)} />`,
  use: [
    "Jumping to any page, project or action from the keyboard, when a nav cannot hold them all.",
    "A phone layout that hides the nav. The command menu can hold those pages.",
    "Long lists where typing is faster than scrolling: projects, templates, settings.",
    "Actions that have no place on the page, such as Switch theme or Invite a teammate.",
    "Always with a visible Search button that shows the ⌘K hint, so people can find it without knowing the shortcut.",
  ],
  skip: [
    "A few actions on one thing. Use a Menu.",
    "Filtering a list that is already on the page. Use a search field above that list, because the command menu jumps somewhere and does not filter a view.",
    "Switching between views of the same content. Use Tabs.",
    "Ranked or fuzzy results. It matches a piece of the label, ignoring case, and keeps the original order, so use a real search for content.",
    "A form or a confirmation. Use a Dialog.",
  ],
  keyboard: [
    [["⌘K", "Ctrl+K"], "Opens the menu, or closes it when it is open. useCommandShortcut listens for it while the page that calls it is mounted."],
    [["Type"], "Filters the rows by label, ignoring case. The order stays the same and the first enabled row is lit."],
    [["ArrowDown"], "Lights the next enabled row. It wraps from the last row to the first and skips disabled rows."],
    [["ArrowUp"], "Lights the previous enabled row, the same way."],
    [["Enter"], "Chooses the lit row and closes the menu. With no match, nothing happens."],
    [["Escape"], "Clears the query first. With an empty field it closes the menu and returns focus to where it was."],
    [["Tab"], "Stays in the search field, because it is the only thing in the dialog that takes focus."],
  ],
  a11y: [
    "The field is a combobox and the rows are options in a listbox. Focus never leaves the field, and aria-activedescendant names the lit row, so a screen reader reads the row while you keep typing. Clicking a row does not steal focus either.",
    "In the dialog form, Radix Dialog traps focus, hides the page behind from screen readers and closes on Esc. The dialog is named Command menu, and focus goes back to whatever had it before the menu opened.",
    "The field, the Results list and each group have a label, and the group label is its heading. The labels are written in English inside the component, so edit them in the file for another language.",
    "A keyboard-driven highlight gets an inset 1px focus ring, because a faint fill alone is too weak to see. A pointer-driven highlight shows no ring.",
    "A disabled row is marked aria-disabled, is never lit, and Enter and clicks skip it. If the reason is not obvious, say it in text elsewhere.",
    "When nothing matches, the empty state is a status region that names the query and gives a hint. The footer drops the Enter hint, since there is nothing to open.",
    "Rows are 44px and the field is 52px. On touch screens the field uses 16px text, so iOS does not zoom in when it is focused.",
    "While an input method is composing a word, Enter, Esc, the arrows and the shortcut do nothing to the menu.",
    "Give every item an id that is unique across all groups, because the ids name the rows for screen readers. The shortcut text on a row is a hint and does not bind the key.",
    "Under reduced motion the dialog appears and leaves at once, with no travel, and the highlight jumps to the row.",
  ],
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

function OpenDemo() {
  const [open, setOpen] = useState(false);
  const [openedBy, setOpenedBy] = useState<"keyboard" | "pointer">("keyboard");
  const [last, setLast] = useState("Nothing picked yet");

  useCommandShortcut(() => {
    setOpenedBy("keyboard");
    setOpen((o) => !o);
  });

  return (
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
      <CommandMenu
        open={open}
        onOpenChange={setOpen}
        groups={GROUPS}
        openedBy={openedBy}
        onSelect={(item: CommandItem) => setLast(`Picked ${item.label}`)}
      />
    </div>
  );
}

/* The same panel body, without the dialog. A solid surface: it is not floating here. */
function PanelDemo({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  return (
    <div className="w-full min-w-0 max-w-140 rounded-surface bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]">
      <CommandPanel groups={GROUPS} query={query} onQueryChange={setQuery} onSelect={() => {}} initialSource="pointer" />
    </div>
  );
}

function EmptyDemo() {
  return <PanelDemo initialQuery="figma" />;
}

export default function CommandMenuPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Open it"
        tier="responsive"
        caption="The overlay fades on opacity only. The panel fades, drops half the travel and scales from 0.98, all on the responsive tier, and leaves with the quicker exit. ⌘K or Ctrl+K opens it while this page is open."
        code="OpenDemo"
      >
        <OpenDemo />
      </Stage>

      <Stage
        title="Keyboard and glide"
        tier="responsive"
        size="lg"
        caption="The first enabled row is always lit. Arrows move and wrap, skipping disabled rows, and Enter fires only on the lit row. Esc clears the query first, then closes. The highlight glides to the row nearest the pointer, or follows the arrow keys with a focus ring. Typing changes the list instantly and the panel never animates its height."
        code="PanelDemo"
      >
        <PanelDemo />
      </Stage>

      <Stage
        title="Empty state"
        tier="instant"
        caption="Filtering keeps the original order. When nothing matches, the panel says so and the footer drops the Enter hint, since there is nothing to open."
        code="EmptyDemo"
      >
        <EmptyDemo />
      </Stage>
    </Page>
  );
}
