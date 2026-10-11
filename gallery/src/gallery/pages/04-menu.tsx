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
import { Page, Stage, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "menu",
  title: "Menu",
  order: 4,
  summary:
    "A glass dropdown with one highlight that glides from row to row. It grows from its trigger and travels from the side it really opens on.",
  tiers: ["instant", "responsive"],
};

const FOLDERS = ["Client work", "Templates", "Experiments", "Archive 2025"];

function ProjectMenu() {
  const [last, setLast] = useState("Nothing picked yet");
  const pick = (what: string) => () => setLast(what);
  return (
    <div className="grid w-full max-w-md gap-4">
      <div className="flex items-center justify-between gap-4 bg-surface-2 p-4 pl-6 shadow-[inset_0_0_0_1px_var(--line)] rounded-surface">
        <div className="grid min-w-0 gap-1">
          <span className="truncate text-body text-fg">Northwind site</span>
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
      <p className="font-mono text-caption text-fg-subtle" role="status">{last}</p>
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
      <p className="font-mono text-caption text-fg-subtle" role="status">
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
    <Page meta={meta}>
      <Stage
        title="Project actions"
        tier="responsive"
        size="lg"
        align="start"
        caption="The panel fades and scales from 0.98 out of the trigger's corner, and slides a quarter of the travel. One highlight glides between rows on the responsive tier. Open it with the pointer and nothing is lit until you move; open it with Enter or ArrowDown and the first row lights with a focus ring. Hover Move to for the submenu: it is solid, because glass never sits on glass."
      >
        <ProjectMenu />
      </Stage>

      <Stage
        title="Checkbox and radio"
        tier="responsive"
        align="start"
        caption="The check lives in a fixed 16px cell, so toggling an option never shifts a label. The menu stays open while you change several options, and the highlight keeps gliding."
      >
        <ViewMenu />
      </Stage>

      <Stage
        title="Opens upward"
        tier="responsive"
        size="lg"
        align="end"
        caption="This trigger sits in the bottom-right corner, so the menu flips up. The entrance follows the side it opens on: it rises out of the trigger instead of sinking, and the scale grows from the bottom-right corner."
      >
        <FlipMenu />
      </Stage>
    </Page>
  );
}
