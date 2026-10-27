import { useCallback, useState } from "react";
import { Button } from "@/components/button";
import {
  ArchiveIcon,
  ChevronDownIcon,
  CopyIcon,
  FileIcon,
  FolderIcon,
  MoreIcon,
  ShareIcon,
  SlidersIcon,
  TrashIcon,
} from "@/components/icons";
import { DeviceProvider } from "@/motion";
import {
  Menu,
  MenuCheckboxItem,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
} from "@/components/menu";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "menu",
  title: "Menu",
  lede: "A glass dropdown with one gliding highlight.",
  order: 10, group: "Overlays",
  verbs: ["open", "select"],
  summary:
    "A glass dropdown with one highlight that glides from row to row. It grows from its trigger and travels from the side it really opens on. On a phone a submenu replaces the list in the same panel.",
  fun: "Move down the rows: the highlight reaches for each one, then gathers itself there.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["menu", "icons", "button"],
  exports: ["Menu", "MenuItem", "MenuSub", "MenuCheckboxItem", "MenuRadioGroup", "MenuRadioItem", "MenuLabel", "MenuGroup", "MenuSeparator"],
  usage: `import { Button } from "@/components/button";
import { CopyIcon, FolderIcon, MoreIcon, TrashIcon } from "@/components/icons";
import {
  Menu,
  MenuCheckboxItem,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
} from "@/components/menu";

<Menu
  align="end"
  trigger={
    <Button iconOnly variant="ghost" aria-label="Project actions">
      <MoreIcon />
    </Button>
  }
>
  <MenuItem icon={<CopyIcon />} shortcut="⌘D" onSelect={duplicate}>Duplicate</MenuItem>
  <MenuSub icon={<FolderIcon />} label="Move to">
    <MenuItem icon={<FolderIcon />} onSelect={() => move("Templates")}>Templates</MenuItem>
    <MenuItem icon={<FolderIcon />} onSelect={() => move("Archive 2025")}>Archive 2025</MenuItem>
  </MenuSub>
  <MenuSeparator />
  <MenuItem icon={<TrashIcon />} destructive onSelect={remove}>Delete</MenuItem>
</Menu>

{/* Options go inside a Menu too. It stays open while they change. */}
<MenuRadioGroup value={density} onValueChange={setDensity}>
  <MenuRadioItem value="comfortable">Comfortable</MenuRadioItem>
  <MenuRadioItem value="compact">Compact</MenuRadioItem>
</MenuRadioGroup>
<MenuCheckboxItem checked={thumbs} onCheckedChange={setThumbs}>Thumbnails</MenuCheckboxItem>`,
  use: [
    "Several related actions behind one control, such as Open, Duplicate, Move and Delete on a project.",
    "A more-actions button on a row or a card. It keeps the row quiet until someone needs the rest.",
    "View options that change in one visit. Checkbox and radio rows keep the menu open, so several can change at once.",
    "A destructive action. Put it last, after a separator, and mark it destructive so it takes the danger color.",
    "Submenus that must also work on a phone. Below 640px a submenu replaces the list inside the same panel, with a Back row first, so it can never land off the screen.",
  ],
  skip: [
    "The click goes to another page. Use a link (<a>), because a menu row has no href and cannot open in a new tab.",
    "There is only one action. Use a Button.",
    "Switching between views of the same content. Use Tabs.",
    "Searching across many pages, projects and actions. Use the Command menu.",
    "The choice needs a form, a longer explanation or a confirmation. Use a Dialog.",
  ],
  keyboard: [
    [["Enter", "Space", "ArrowDown"], "On the trigger: opens the menu and moves focus to the first row, which lights with a focus ring."],
    [["ArrowDown"], "Moves to the next row. It wraps from the last row to the first and skips disabled rows."],
    [["ArrowUp"], "Moves to the previous row, the same way."],
    [["Home", "End"], "Moves to the first or last row. PageUp and PageDown do the same."],
    [["Type"], "Typeahead: jumps to the next row whose label starts with what you type."],
    [["Enter", "Space"], "Chooses the row. The menu closes and focus returns to the trigger. Checkbox and radio rows toggle and stay open."],
    [["ArrowRight", "Enter", "Space"], "On a row that opens a submenu: opens it and moves focus into it. On a phone the list is replaced in place and focus lands on the Back row."],
    [["ArrowLeft"], "In a submenu: closes it and returns to the row that opened it. On a phone it does what the Back row does."],
    [["Enter", "Space"], "On the Back row of a phone submenu: returns to the list and puts focus on the row that opened the submenu."],
    [["Escape"], "Closes the menu and returns focus to the trigger. From a submenu it closes the whole menu."],
    [["Tab"], "Does nothing while the menu is open. Focus stays inside it until it closes."],
  ],
  a11y: [
    "Radix supplies the roles: menu, menuitem, menuitemcheckbox, menuitemradio and separator. Checkbox and radio rows set aria-checked, and the check mark shows it too, so the state is never color alone.",
    "The menu takes its name from label, or from its trigger when there is no label. An icon-only trigger needs its own aria-label either way.",
    "The menu is modal. Focus stays inside it, the rest of the page is inert and hidden from screen readers, and Esc or a choice returns focus to the trigger.",
    "Rows keep real DOM focus, and the gliding highlight is aria-hidden, so a screen reader hears the row and never the highlight. A pointer open lights nothing until the pointer moves. A keyboard open lights the first row with an inset 1px focus ring, because a faint fill alone is too weak to see.",
    "Rows are 44px tall. The icon or check sits in a fixed 16px cell, so toggling an option never shifts a label.",
    "The shortcut prop is text only. It does not bind the key, so wire the real shortcut yourself. A screen reader reads the hint after the label. On touch screens the hint is hidden, so a shortcut must never be the only way to reach an action.",
    "A disabled row is skipped by the arrow keys. If the reason is not obvious, say it in text elsewhere.",
    "Name a destructive row with a verb, such as Delete or Stop sharing. The danger color only backs the word up.",
    "On a phone a submenu is a list inside the same menu, not a second menu. Its first row is Back, a real menu item that takes the same keys as any other. The list that is not showing is hidden and its rows are disabled, so the arrow keys, Home, End and typeahead only reach what is on screen. After a keyboard move focus rests on a row (Back going in, the opening row going back). After a tap focus rests on the menu itself, so no row is lit. Name the Back row for your language with backLabel.",
    "Rows are 44px on every screen. On touch screens a row fills while it is pressed, which is the only feedback a finger gets, because there is no hover.",
    "Under reduced motion the menu appears and leaves at once, with no travel, and the highlight jumps to the row. On a phone the two lists swap in place with no slide.",
  ],
};

const FOLDERS = ["Client work", "Templates", "Experiments", "Archive 2025"];

function ProjectMenu() {
  const [last, setLast] = useState("Nothing picked yet");
  const pick = (what: string) => () => setLast(what);
  return (
    <div className="grid w-full max-w-md gap-4">
      <div className="flex items-center justify-between gap-4 bg-surface-2 p-4 pl-6 shadow-[inset_0_0_0_1px_var(--line)] rounded-surface">
        <div className="grid min-w-0 gap-1">
          <span className="truncate text-body font-title text-fg">Northwind site</span>
          <span className="truncate text-small text-fg-subtle">Framer · published 2 days ago</span>
        </div>
        <Menu
          label="Project actions"
          align="end"
          trigger={
            <Button iconOnly variant="ghost" aria-label="More actions">
              <MoreIcon />
            </Button>
          }
        >
          <MenuItem icon={<FileIcon />} shortcut="↵" onSelect={pick("Opened Northwind site")}>Open</MenuItem>
          <MenuItem icon={<CopyIcon />} shortcut="⌘D" onSelect={pick("Duplicated Northwind site")}>Duplicate</MenuItem>
          <MenuItem icon={<ShareIcon />} shortcut="⌘L" onSelect={pick("Copied the share link")}>Share link</MenuItem>
          <MenuSub icon={<FolderIcon />} label="Move to">
            {FOLDERS.map((f) => (
              <MenuItem key={f} icon={<FolderIcon />} onSelect={pick(`Moved to ${f}`)}>{f}</MenuItem>
            ))}
          </MenuSub>
          <MenuSeparator />
          <MenuItem icon={<ArchiveIcon />} onSelect={pick("Archived Northwind site")}>Archive</MenuItem>
          <MenuItem icon={<TrashIcon />} destructive onSelect={pick("Deleted Northwind site")}>Delete</MenuItem>
        </Menu>
      </div>
      <p className="text-caption font-normal text-fg-subtle" role="status">{last}</p>
    </div>
  );
}

function ViewMenu() {
  const [density, setDensity] = useState("comfortable");
  const [thumbs, setThumbs] = useState(true);
  const [status, setStatus] = useState(true);
  const [archived, setArchived] = useState(false);
  const shown = [thumbs && "thumbnails", status && "status", archived && "archived"].filter(Boolean).join(", ") || "nothing extra";
  return (
    <div className="grid justify-items-start gap-4">
      <Menu
        label="View options"
        trigger={
          <Button icon={<SlidersIcon />} iconRight={<ChevronDownIcon />}>
            View
          </Button>
        }
      >
        <MenuLabel>Density</MenuLabel>
        <MenuRadioGroup value={density} onValueChange={setDensity}>
          <MenuRadioItem value="comfortable">Comfortable</MenuRadioItem>
          <MenuRadioItem value="compact">Compact</MenuRadioItem>
        </MenuRadioGroup>
        <MenuSeparator />
        <MenuLabel>Show</MenuLabel>
        <MenuCheckboxItem checked={thumbs} onCheckedChange={setThumbs}>Thumbnails</MenuCheckboxItem>
        <MenuCheckboxItem checked={status} onCheckedChange={setStatus}>Publish status</MenuCheckboxItem>
        <MenuCheckboxItem checked={archived} onCheckedChange={setArchived}>Archived projects</MenuCheckboxItem>
      </Menu>
      <p className="text-caption font-normal text-fg-subtle" role="status">
        {density} · {shown}
      </p>
    </div>
  );
}

function FlipMenu() {
  const [boundary, setBoundary] = useState<Element | null>(null);
  /* The stage is the collision boundary, so the menu flips up every time, wherever the page is scrolled. */
  const ref = useCallback((el: HTMLDivElement | null) => setBoundary(el?.parentElement ?? null), []);
  return (
    <div ref={ref}>
      <Menu
        label="Share"
        align="end"
        collisionBoundary={boundary}
        trigger={
          <Button icon={<ShareIcon />} iconRight={<ChevronDownIcon />}>
            Share
          </Button>
        }
      >
        <MenuItem icon={<CopyIcon />} shortcut="⌘L">Copy link</MenuItem>
        <MenuItem icon={<FileIcon />}>Open preview</MenuItem>
        <MenuItem icon={<FolderIcon />}>Add to a folder</MenuItem>
        <MenuSeparator />
        <MenuItem icon={<TrashIcon />} destructive>Stop sharing</MenuItem>
      </Menu>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Project actions"
        tier="responsive"
        size="lg"
        align="start"
        code="ProjectMenu"
        caption="The panel fades and scales from 0.98 out of the trigger's corner, and slides a quarter of the travel. One highlight glides between rows on the responsive tier. Open it with the pointer and nothing is lit until you move; open it with Enter or ArrowDown and the first row lights with a focus ring. Hover Move to for the submenu: it is solid, because glass never sits on glass."
      >
        <ProjectMenu />
      </Stage>

      <Stage
        title="On a phone"
        tier="responsive"
        size="lg"
        align="start"
        code="ProjectMenu"
        caption="On a narrow screen the menu still opens beside its button, but a submenu does not fly out sideways, where it would land off the screen. Open Move to: the list is replaced inside the same panel, with a Back row first. The two lists cross-fade and slide the way Tabs panels do, and the panel snaps to the height of the new list. On a touch screen a row also fills while it is pressed and the shortcut hints go. This stage forces the phone behavior, so a mouse can try it."
      >
        <DeviceProvider mode="phone">
          <ProjectMenu />
        </DeviceProvider>
      </Stage>

      <Stage
        title="Checkbox and radio"
        tier="responsive"
        align="start"
        code="ViewMenu"
        caption="The check lives in a fixed 16px cell, so toggling an option never shifts a label. The menu stays open while you change several options, and the highlight keeps gliding."
      >
        <ViewMenu />
      </Stage>

      <Stage
        title="Opens upward"
        tier="responsive"
        size="lg"
        align="end"
        code="FlipMenu"
        caption="This trigger sits in the bottom-right corner, so the menu flips up. The entrance follows the side it opens on: it rises out of the trigger instead of sinking, and the scale grows from the bottom-right corner."
      >
        <FlipMenu />
      </Stage>
    </Page>
  );
}
