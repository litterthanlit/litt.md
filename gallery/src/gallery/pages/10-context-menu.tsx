import { useState } from "react";
import { Button } from "@/components/button";
import { ContextMenu } from "@/components/context-menu";
import { ArchiveIcon, ChevronDownIcon, CopyIcon, EditIcon, FileIcon, FolderIcon, MoreIcon, SlidersIcon, TrashIcon } from "@/components/icons";
import { StatusTag, type ProjectStatus } from "@/components/list";
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
import { DeviceProvider } from "@/motion";
import { PlayIcon } from "@/components/icons";
import { Tag, type TagStatus } from "@/components/tag";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "context-menu",
  title: "Context menu",
  lede: "The menu, right where you clicked.",
  order: 5.05,
  group: "Overlays",
  verbs: ["open", "select"],
  summary:
    "The Menu at the pointer: a right-click, Shift+F10 or a press and hold on touch. The same glass, rows and gliding highlight, grown from the pointer's corner. Every action in it is also somewhere else.",
  fun: "Move down the rows: the highlight reaches for each one, then gathers itself there.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["context-menu", "menu", "icons", "button"],
  exports: ["ContextMenu"],
  usage: `import { Button } from "@/components/button";
import { ContextMenu } from "@/components/context-menu";
import { FileIcon, FolderIcon, MoreIcon, TrashIcon } from "@/components/icons";
import { Menu, MenuItem, MenuSeparator, MenuSub } from "@/components/menu";

// Write the rows once. The context menu is a shortcut to the same actions as the row's ⋯ Menu.
const actions = (
  <>
    <MenuItem icon={<FileIcon />} onSelect={open}>Open</MenuItem>
    <MenuSub icon={<FolderIcon />} label="Move to">
      <MenuItem icon={<FolderIcon />} onSelect={() => move("Templates")}>Templates</MenuItem>
    </MenuSub>
    <MenuSeparator />
    <MenuItem icon={<TrashIcon />} destructive onSelect={remove}>Delete</MenuItem>
  </>
);

<ContextMenu
  label="Founder landing actions"
  trigger={
    <li className="flex items-center">
      <button type="button" onClick={open}>Founder landing</button>
      <Menu
        label="Founder landing actions"
        align="end"
        trigger={
          <Button iconOnly variant="ghost" aria-label="More actions for Founder landing">
            <MoreIcon />
          </Button>
        }
      >
        {actions}
      </Menu>
    </li>
  }
>
  {actions}
</ContextMenu>`,
  use: [
    "Actions on the thing under the pointer: a project row, a file, a card, a canvas.",
    "People who right-click out of habit. It saves them the trip to the row's ⋯ button, and never replaces it.",
    "View options for a whole area, such as Show hidden files on a folder. Checkbox and radio rows keep it open while several change.",
    "Touch screens, where a press and hold opens it at the finger, the same hold that opens a tooltip.",
  ],
  skip: [
    "The actions live nowhere else. A context menu is a shortcut that touch and keyboard users may never find, so put them on a ⋯ Menu, a toolbar or a shortcut first.",
    "A button opens it. Use the Menu.",
    "Searching across pages, projects and actions. Use the Command menu.",
    "Text people copy and links people open in a new tab. The browser's own menu matters more there, and this one replaces it.",
  ],
  keyboard: [
    [["Shift+F10", "Menu key"], "On something focused inside the target: opens the menu at that element's bottom-left corner and lights the first row with a focus ring."],
    [["ArrowDown", "ArrowUp"], "Moves between rows. It wraps at either end and skips disabled rows."],
    [["Home", "End"], "Moves to the first or last row."],
    [["Type"], "Typeahead: jumps to the next row whose label starts with what you type."],
    [["Enter", "Space"], "Chooses the row. The menu closes and focus returns to where it was. Checkbox and radio rows toggle and stay open."],
    [["ArrowRight", "Enter", "Space"], "On a row that opens a submenu: opens it and moves focus into it. On a phone the list is replaced in place and focus lands on the Back row."],
    [["ArrowLeft"], "In a submenu: closes it and returns to the row that opened it. On a phone it does what the Back row does."],
    [["Escape"], "Closes the menu and returns focus to where it was."],
  ],
  a11y: [
    "Radix supplies the roles (menu, menuitem, menuitemcheckbox, menuitemradio and separator) and the focus handling. The menu is named by label, which is required, because the target has no name to lend it.",
    "Nothing tells a screen reader that a target has a context menu. That is why every action in it must also be reachable another way: a ⋯ Menu on the row, a toolbar or a real shortcut.",
    "Shift+F10 and the menu key open it from whatever is focused inside the target, so put something focusable in it. A keyboard open lights the first row with an inset focus ring. A right-click or a hold lights nothing until the pointer moves.",
    "The menu is modal. Focus stays inside it, the rest of the page is inert, and Esc or a choice returns focus to where it was. While it is open the browser's own menu stays shut, so the two never stack.",
    "On touch it opens after a 500ms press and hold, the tooltip's hold. Lifting early, moving the finger or scrolling cancels it, and the tap the hold leaves behind is swallowed, so the target's own action does not run too. The browser's callout and text selection are off on the target on touch screens.",
    "A target inside another target opens its own menu, never both. Events from a Menu or a Dialog opened inside the target stay with them.",
    "The rows are the Menu's, with the same guarantees: 44px tall, checks in a fixed 16px cell, real focus on the row and an aria-hidden highlight. The Menu page documents them.",
    "Under reduced motion it appears and leaves at once, with no travel, and the highlight jumps to the row.",
  ],
};

/* ---------------------------------------------------------------- shared demo parts */

const PROJECTS: { id: string; name: string; client: string; status: ProjectStatus }[] = [
  { id: "founder", name: "Founder landing", client: "Marlow Labs", status: "live" },
  { id: "foundry", name: "Type foundry site", client: "Grotta Type", status: "review" },
  { id: "archive", name: "Newsletter archive", client: "Sidebar Weekly", status: "draft" },
  { id: "identity", name: "Gallery identity", client: "Halden Gallery", status: "live" },
];
const FOLDERS = ["Client work", "Templates", "Experiments", "Archive 2025"];

/** One set of rows for both ways in: the context menu and the row's ⋯ Menu. */
function ProjectActions({ name, pick }: { name: string; pick: (what: string) => void }) {
  return (
    <>
      <MenuItem icon={<FileIcon />} shortcut="↵" onSelect={() => pick(`Opened ${name}`)}>
        Open
      </MenuItem>
      <MenuItem icon={<EditIcon />} onSelect={() => pick(`Renaming ${name}`)}>
        Rename
      </MenuItem>
      <MenuItem icon={<CopyIcon />} shortcut="⌘D" onSelect={() => pick(`Duplicated ${name}`)}>
        Duplicate
      </MenuItem>
      <MenuSub icon={<FolderIcon />} label="Move to">
        {FOLDERS.map((f) => (
          <MenuItem key={f} icon={<FolderIcon />} onSelect={() => pick(`Moved ${name} to ${f}`)}>
            {f}
          </MenuItem>
        ))}
      </MenuSub>
      <MenuSeparator />
      <MenuItem icon={<ArchiveIcon />} onSelect={() => pick(`Archived ${name}`)}>
        Archive
      </MenuItem>
      <MenuItem icon={<TrashIcon />} destructive onSelect={() => pick(`Deleted ${name}`)}>
        Delete
      </MenuItem>
    </>
  );
}

/* The row fills on hover, while it is pressed on a touch screen, and while its context menu is open
   (the target carries data-state="open"), so you can see which row the menu belongs to. */
const rowFill =
  "flex size-full items-center gap-2 rounded-control pr-2 transition-[background-color] duration-(--dur-instant) ease-litt " +
  "group-hover:bg-[color-mix(in_oklab,var(--fg)_4%,transparent)] group-data-[state=open]:bg-[color-mix(in_oklab,var(--fg)_4%,transparent)] " +
  "pointer-coarse:group-active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]";
const rowButton =
  "flex h-full min-w-0 flex-1 cursor-pointer items-center gap-4 rounded-control pl-4 text-left [-webkit-tap-highlight-color:transparent] " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

/* ----------------------------------------------------------------------- demos */

function ProjectRowsDemo() {
  const [last, setLast] = useState("Nothing picked yet");
  return (
    <div className="grid w-full max-w-xl gap-4">
      <ul aria-label="Projects" className="w-full rounded-surface p-1 shadow-[inset_0_0_0_1px_var(--line)]">
        {PROJECTS.map((p) => (
          <ContextMenu
            key={p.id}
            label={`${p.name} actions`}
            trigger={
              <li className="group h-16 border-b border-line last:border-b-0">
                <div className={rowFill}>
                  <button type="button" className={rowButton} onClick={() => setLast(`Opened ${p.name}`)}>
                    <span className="grid min-w-0 flex-1 gap-1">
                      <span className="truncate text-body font-title text-fg">{p.name}</span>
                      <span className="truncate text-caption text-fg-subtle">{p.client}</span>
                    </span>
                    <StatusTag status={p.status} className="shrink-0" />
                  </button>
                  <Menu
                    label={`${p.name} actions`}
                    align="end"
                    trigger={
                      <Button iconOnly variant="ghost" aria-label={`More actions for ${p.name}`}>
                        <MoreIcon />
                      </Button>
                    }
                  >
                    <ProjectActions name={p.name} pick={setLast} />
                  </Menu>
                </div>
              </li>
            }
          >
            <ProjectActions name={p.name} pick={setLast} />
          </ContextMenu>
        ))}
      </ul>
      <p role="status" className="text-caption font-normal text-fg-subtle">
        {last}
      </p>
    </div>
  );
}

function PhoneRowsDemo() {
  return (
    <DeviceProvider mode="phone">
      <div className="mx-auto w-full max-w-sm">
        <ProjectRowsDemo />
      </div>
    </DeviceProvider>
  );
}

type Sort = "name" | "edited" | "size";
type AssetFile = { name: string; ext: string; kb: number; edited: string; hidden?: boolean };

const ASSETS: AssetFile[] = [
  { name: "hero", ext: "png", kb: 1240, edited: "2026-10-16" },
  { name: "og-image", ext: "png", kb: 312, edited: "2026-10-12" },
  { name: "logo", ext: "svg", kb: 8, edited: "2026-09-30" },
  { name: "brand-guide", ext: "pdf", kb: 4810, edited: "2026-09-21" },
  { name: "launch-copy", ext: "md", kb: 6, edited: "2026-10-18" },
  { name: "type-specimen", ext: "pdf", kb: 2210, edited: "2026-10-02" },
  { name: ".env", ext: "local", kb: 1, edited: "2026-10-01", hidden: true },
  { name: ".DS_Store", ext: "", kb: 6, edited: "2026-10-18", hidden: true },
];

const size = (kb: number) => (kb >= 1000 ? `${(kb / 1000).toFixed(1)} MB` : `${kb} KB`);
const ORDER: Record<Sort, (a: AssetFile, b: AssetFile) => number> = {
  name: (a, b) => a.name.replace(/^\./, "").localeCompare(b.name.replace(/^\./, "")),
  edited: (a, b) => b.edited.localeCompare(a.edited),
  size: (a, b) => b.kb - a.kb,
};

/** The folder's view options: the same rows in the context menu and in the toolbar's View menu. */
function FolderOptions({
  hidden,
  onHidden,
  extensions,
  onExtensions,
  sort,
  onSort,
}: {
  hidden: boolean;
  onHidden: (on: boolean) => void;
  extensions: boolean;
  onExtensions: (on: boolean) => void;
  sort: Sort;
  onSort: (sort: Sort) => void;
}) {
  return (
    <>
      <MenuCheckboxItem checked={hidden} onCheckedChange={onHidden}>
        Show hidden files
      </MenuCheckboxItem>
      <MenuCheckboxItem checked={extensions} onCheckedChange={onExtensions}>
        Show file extensions
      </MenuCheckboxItem>
      <MenuSeparator />
      <MenuLabel>Sort by</MenuLabel>
      <MenuRadioGroup value={sort} onValueChange={(v) => onSort(v as Sort)}>
        <MenuRadioItem value="name">Name</MenuRadioItem>
        <MenuRadioItem value="edited">Last edited</MenuRadioItem>
        <MenuRadioItem value="size">Size</MenuRadioItem>
      </MenuRadioGroup>
    </>
  );
}

function FileGridDemo() {
  const [hidden, setHidden] = useState(false);
  const [extensions, setExtensions] = useState(true);
  const [sort, setSort] = useState<Sort>("name");
  const [last, setLast] = useState("Nothing opened yet");
  const options = (
    <FolderOptions hidden={hidden} onHidden={setHidden} extensions={extensions} onExtensions={setExtensions} sort={sort} onSort={setSort} />
  );
  const files = ASSETS.filter((f) => hidden || !f.hidden).sort(ORDER[sort]);
  const fileName = (f: AssetFile) => (extensions && f.ext ? `${f.name}.${f.ext}` : f.name);
  return (
    <div className="grid w-full max-w-2xl gap-4">
      <ContextMenu
        label="Assets folder options"
        trigger={
          <section aria-label="Assets folder" className="grid gap-4 rounded-surface p-4 shadow-[inset_0_0_0_1px_var(--line)]">
            <div className="flex items-center justify-between gap-4">
              <div className="grid min-w-0 gap-1">
                <h3 className="truncate text-body text-fg">Assets</h3>
                <p className="truncate text-caption text-fg-subtle">Marlow Labs · {files.length} files</p>
              </div>
              <Menu
                label="View options"
                align="end"
                trigger={
                  <Button size="sm" icon={<SlidersIcon />} iconRight={<ChevronDownIcon />}>
                    View
                  </Button>
                }
              >
                {options}
              </Menu>
            </div>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {files.map((f) => (
                <li key={f.name}>
                  <button
                    type="button"
                    onClick={() => setLast(`Opened ${f.name}${f.ext ? "." + f.ext : ""}`)}
                    className={
                      "grid w-full cursor-pointer gap-3 rounded-control p-3 text-left [-webkit-tap-highlight-color:transparent] " +
                      "transition-[background-color] duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_4%,transparent)] " +
                      "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] " +
                      "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
                    }
                  >
                    <span className="grid size-10 place-items-center rounded-control bg-surface-2 text-fg-muted">
                      <FileIcon />
                    </span>
                    <span className="grid min-w-0 gap-1">
                      <span className="truncate text-small font-title text-fg">{fileName(f)}</span>
                      <span className="tabular-nums text-caption font-normal text-fg-subtle">{size(f.kb)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        }
      >
        {options}
      </ContextMenu>
      <p role="status" className="text-caption font-normal text-fg-subtle">
        {last} · {hidden ? "hidden files shown" : "hidden files hidden"} · by {sort === "edited" ? "last edited" : sort}
      </p>
    </div>
  );
}

/* ---------- Device's own (plans/024, phase 3): a card's takes, and the card's own folder ---------- */

const TAKES: { id: string; name: string; scene: string; status: TagStatus; word: string }[] = [
  { id: "take_04", name: "take_04.wav", scene: "Scene A · interview", status: "success", word: "Saved" },
  { id: "take_05", name: "take_05.wav", scene: "Scene A · room tone", status: "warning", word: "Copying" },
  { id: "take_06", name: "take_06.wav", scene: "Scene B · scratch", status: "neutral", word: "Scratch" },
  { id: "take_07", name: "take_07.wav", scene: "Scene B · the marsh", status: "success", word: "Saved" },
];
const SCENES = ["Scene A", "Scene B", "Scene C", "Archive 2026"];

/** One set of rows for both ways in: the context menu and the row's ⋯ Menu. */
function TakeActions({ name, pick }: { name: string; pick: (what: string) => void }) {
  return (
    <>
      <MenuItem icon={<PlayIcon />} shortcut="↵" onSelect={() => pick(`Playing ${name}`)}>
        Play
      </MenuItem>
      <MenuItem icon={<EditIcon />} onSelect={() => pick(`Renaming ${name}`)}>
        Rename
      </MenuItem>
      <MenuItem icon={<CopyIcon />} shortcut="⌘D" onSelect={() => pick(`Duplicated ${name}`)}>
        Duplicate
      </MenuItem>
      <MenuSub icon={<FolderIcon />} label="Move to">
        {SCENES.map((s) => (
          <MenuItem key={s} icon={<FolderIcon />} onSelect={() => pick(`Moved ${name} to ${s}`)}>
            {s}
          </MenuItem>
        ))}
      </MenuSub>
      <MenuSeparator />
      <MenuItem icon={<ArchiveIcon />} onSelect={() => pick(`Archived ${name}`)}>
        Archive
      </MenuItem>
      <MenuItem icon={<TrashIcon />} destructive onSelect={() => pick(`Deleted ${name}`)}>
        Delete take
      </MenuItem>
    </>
  );
}

function TakeRowsDemo() {
  const [last, setLast] = useState("Nothing picked yet");
  return (
    <div className="grid w-full max-w-xl gap-4">
      <ul aria-label="Takes on card A" className="w-full rounded-surface p-1 shadow-[inset_0_0_0_1px_var(--line)]">
        {TAKES.map((t) => (
          <ContextMenu
            key={t.id}
            label={`${t.name} actions`}
            trigger={
              <li className="group h-16 border-b border-line last:border-b-0">
                <div className={rowFill}>
                  <button type="button" className={rowButton} onClick={() => setLast(`Playing ${t.name}`)}>
                    <span className="grid min-w-0 flex-1 gap-1">
                      <span className="truncate text-body font-title text-fg">{t.name}</span>
                      <span className="truncate text-caption text-fg-subtle">{t.scene}</span>
                    </span>
                    <Tag status={t.status} className="shrink-0">{t.word}</Tag>
                  </button>
                  <Menu
                    label={`${t.name} actions`}
                    align="end"
                    trigger={
                      <Button iconOnly variant="ghost" aria-label={`More actions for ${t.name}`}>
                        <MoreIcon />
                      </Button>
                    }
                  >
                    <TakeActions name={t.name} pick={setLast} />
                  </Menu>
                </div>
              </li>
            }
          >
            <TakeActions name={t.name} pick={setLast} />
          </ContextMenu>
        ))}
      </ul>
      <p role="status" className="text-caption font-normal text-fg-subtle">
        {last}
      </p>
    </div>
  );
}

function PhoneTakeRowsDemo() {
  return (
    <DeviceProvider mode="phone">
      <div className="mx-auto w-full max-w-sm">
        <TakeRowsDemo />
      </div>
    </DeviceProvider>
  );
}

const CARD_FILES: AssetFile[] = [
  { name: "take_04", ext: "wav", kb: 13000, edited: "2026-10-18" },
  { name: "take_03", ext: "wav", kb: 9200, edited: "2026-10-18" },
  { name: "take_02", ext: "wav", kb: 345600, edited: "2026-10-16" },
  { name: "take_01", ext: "wav", kb: 2100, edited: "2026-10-12" },
  { name: "take_04_mix", ext: "mp3", kb: 1880, edited: "2026-10-18" },
  { name: "slate", ext: "jpg", kb: 412, edited: "2026-10-12" },
  { name: ".index", ext: "db", kb: 88, edited: "2026-10-18", hidden: true },
  { name: ".trashes", ext: "", kb: 1, edited: "2026-10-01", hidden: true },
];

function CardFolderDemo() {
  const [hidden, setHidden] = useState(false);
  const [extensions, setExtensions] = useState(true);
  const [sort, setSort] = useState<Sort>("name");
  const [last, setLast] = useState("Nothing opened yet");
  const options = (
    <FolderOptions hidden={hidden} onHidden={setHidden} extensions={extensions} onExtensions={setExtensions} sort={sort} onSort={setSort} />
  );
  const files = CARD_FILES.filter((f) => hidden || !f.hidden).sort(ORDER[sort]);
  const fileName = (f: AssetFile) => (extensions && f.ext ? `${f.name}.${f.ext}` : f.name);
  return (
    <div className="grid w-full max-w-2xl gap-4">
      <ContextMenu
        label="Card A folder options"
        trigger={
          <section aria-label="Card A folder" className="grid gap-4 rounded-surface p-4 shadow-[inset_0_0_0_1px_var(--line)]">
            <div className="flex items-center justify-between gap-4">
              <div className="grid min-w-0 gap-1">
                <h3 className="truncate text-body text-fg">Card A</h3>
                <p className="truncate text-caption text-fg-subtle">Scene A · {files.length} files</p>
              </div>
              <Menu
                label="View options"
                align="end"
                trigger={
                  <Button size="sm" icon={<SlidersIcon />} iconRight={<ChevronDownIcon />}>
                    View
                  </Button>
                }
              >
                {options}
              </Menu>
            </div>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {files.map((f) => (
                <li key={f.name}>
                  <button
                    type="button"
                    onClick={() => setLast(`Opened ${f.name}${f.ext ? "." + f.ext : ""}`)}
                    className={
                      "grid w-full cursor-pointer gap-3 rounded-control p-3 text-left [-webkit-tap-highlight-color:transparent] " +
                      "transition-[background-color] duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_4%,transparent)] " +
                      "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] " +
                      "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
                    }
                  >
                    <span className="grid size-10 place-items-center rounded-control bg-surface-2 text-fg-muted">
                      <FileIcon />
                    </span>
                    <span className="grid min-w-0 gap-1">
                      <span className="truncate text-small font-title text-fg">{fileName(f)}</span>
                      <span className="tabular-nums text-caption font-normal text-fg-subtle">{size(f.kb)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        }
      >
        {options}
      </ContextMenu>
      <p role="status" className="text-caption font-normal text-fg-subtle">
        {last} · {hidden ? "hidden files shown" : "hidden files hidden"} · by {sort === "edited" ? "last edited" : sort}
      </p>
    </div>
  );
}

export default function ContextMenuPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Right-click a project"
        tier="responsive"
        size="lg"
        align="start"
        code="ProjectRowsDemo"
        caption="Right-click a row, or focus one and press Shift+F10. It is the Menu, opened at the pointer: the same glass and rows, and one highlight that glides between them. It grows from the pointer's corner and slides a quarter of the travel from the side it opens on. Move to opens a solid submenu. The row keeps its fill while its menu is open. Every action is also on the row's ⋯ button, because a context menu is a shortcut that touch and keyboard users may never find."
        byWorld={{
          device: {
            demo: <TakeRowsDemo />,
            title: "Right-click a take",
            code: "TakeRowsDemo",
            caption:
              "The takes on a recorder's card. Right-click a row, or focus one and press Shift+F10. It is the Menu, opened at the pointer: the same glass and rows, and the chosen row lit. It grows from the pointer's corner and slides a quarter of the travel from the side it opens on. Move to opens a submenu of scenes. The row keeps its fill while its menu is open. Every action is also on the row's ⋯ button, because a context menu is a shortcut that touch and keyboard users may never find.",
          },
        }}
      >
        <ProjectRowsDemo />
      </Stage>

      <Stage
        title="On a phone"
        tier="responsive"
        size="lg"
        align="start"
        code="PhoneRowsDemo"
        caption="On a touch screen a press and hold opens it at the finger, the same hold that opens a tooltip, and the tap that follows does not also open the project. The browser's callout and text selection stay off on the row. The menu stays beside the finger, and Move to replaces the list in place with a Back row first. This stage forces the phone behavior, so a mouse press and hold stands in for the finger."
        byWorld={{
          device: {
            demo: <PhoneTakeRowsDemo />,
            code: "PhoneTakeRowsDemo",
            caption:
              "On a touch screen a press and hold opens it at the finger, the same hold that opens a tooltip, and the tap that follows does not also play the take. The browser's callout and text selection stay off on the row. The menu stays beside the finger, and Move to replaces the list in place with a Back row first. This stage forces the phone behaviour, so a mouse press and hold stands in for the finger.",
          },
        }}
      >
        <PhoneRowsDemo />
      </Stage>

      <Stage
        title="View options on a folder"
        tier="responsive"
        size="lg"
        align="start"
        code="FileGridDemo"
        caption="Right-click anywhere in the folder. The checks sit in a fixed 16px cell, so a label never shifts, and the menu stays open while you change several options. The grid follows at once. The View button holds the same rows, so nothing lives only in the context menu."
        byWorld={{
          device: {
            demo: <CardFolderDemo />,
            title: "View options on a card",
            code: "CardFolderDemo",
            caption:
              "Right-click anywhere on the card's folder. The checks sit in a fixed 16px cell, so a label never shifts, and the menu stays open while you change several options. The grid follows at once. The View button holds the same rows, so nothing lives only in the context menu.",
          },
        }}
      >
        <FileGridDemo />
      </Stage>
    </Page>
  );
}
