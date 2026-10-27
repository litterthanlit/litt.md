/**
 * Tree: things inside things, opened a level at a time: a project's files, a docs site's pages, folders of assets
 * (components.md, "Tree"). The WAI-ARIA tree pattern, from data: pass `items` and the tree draws and wires itself.
 *
 * - Rows: 32px (44px on a touch screen) at the control radius, indented 16px a level. A 16px chevron for a branch, an
 *   icon (a folder or a file unless the item brings its own), the label at the small size, truncated, and an optional
 *   detail at the end in tabular figures at the caption size in --fg-subtle (a size, a change mark). A 1px --line guide runs
 *   down each level, under the chevrons, so the nesting reads without color.
 * - Hover fills fg 6% on the instant tier. The selected row is raised (R3, selected is raised): the press material's
 *   block (--block, --block-lift) on whatever the tree sits on, and its label in --fg at the title weight. Never the
 *   accent. A pressed row on a touch screen takes the hover fill.
 * - Opening: the chevron turns a quarter on the responsive tier. The children appear in place, at once; no height
 *   animates, as in the Accordion. A closed branch does not render its children.
 * - Keys (one Tab stop, on the selected row or the first): ↑ ↓ move through the open rows, → opens a branch or goes
 *   to its first child, ← closes it or goes to the parent, Home and End go to the ends, Enter and Space select (and
 *   open or close a branch), * opens every branch beside the focused one, and typing a name's first letters jumps to it.
 * - Accessibility: role="tree" named by `label`, each row a treeitem with aria-level, aria-setsize, aria-posinset,
 *   aria-expanded on branches and aria-selected, and children in a group. Focus shows the 2px ring inside the row.
 */
import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronRightIcon, FileIcon, FolderIcon } from "@/components/icons";

export type TreeNode = {
  /** Unique in the tree. */
  id: string;
  /** The row's text. Typing its first letters jumps to it. */
  label: string;
  /** A 16px icon in place of the folder or file. */
  icon?: ReactNode;
  /** A short note at the end of the row: a size, a count, a change mark ("M", "+12"). */
  detail?: ReactNode;
  /** The items inside it. An item with children, even an empty list, is a branch that opens. */
  children?: TreeNode[];
};

type Row = { node: TreeNode; level: number; parent: string | null; size: number; pos: number };

/** The rows that show, in order: every item whose ancestors are all open. */
function visibleRows(items: TreeNode[], open: Set<string>, level = 1, parent: string | null = null, out: Row[] = []): Row[] {
  items.forEach((node, i) => {
    out.push({ node, level, parent, size: items.length, pos: i + 1 });
    if (node.children && open.has(node.id)) visibleRows(node.children, open, level + 1, node.id, out);
  });
  return out;
}

const ROW =
  "relative flex h-8 min-w-0 cursor-pointer items-center gap-2 rounded-control pr-2 text-small select-none [-webkit-tap-highlight-color:transparent] " +
  "transition-[background-color,color] duration-(--dur-instant) ease-litt pointer-coarse:h-11";

/* The focus ring sits on the focused item's own row only: items nest, so a group-focus-visible ring would also light
   every row inside an open branch. The row is the item's one direct div; its children are in a ul. */
const ITEM_FOCUS = "[&:focus-visible>div]:outline-2 [&:focus-visible>div]:-outline-offset-2 [&:focus-visible>div]:outline-focus";

const IDLE =
  "text-fg-muted hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]";

/* Selected is raised (R3): the press material's block, the same on the canvas and on a surface. */
const SELECTED = {
  canvas: "bg-block font-title text-fg shadow-(--block-lift) forced-colors:border",
  "surface-1": "bg-block font-title text-fg shadow-(--block-lift) forced-colors:border",
} as const;

const INDENT = 16; // px per level
const START = 8; // px before the first level's chevron

export type TreeProps = {
  /** What the tree holds, for screen readers: "Files", "Pages". */
  label: string;
  /** The items at the top level. */
  items: TreeNode[];
  /** The open branches. Pair it with onExpandedChange. Leave it out and the tree keeps its own. */
  expanded?: string[];
  /** The branches open to start with, when you do not control them. */
  defaultExpanded?: string[];
  /** Called with every open branch whenever one opens or closes. */
  onExpandedChange?: (expanded: string[]) => void;
  /** The selected item. Pair it with onSelect. Leave it out and the tree keeps its own. */
  selected?: string | null;
  /** The item selected to start with, when you do not control it. */
  defaultSelected?: string | null;
  /** Called when a row is chosen by a click, Enter or Space, with the item. */
  onSelect?: (id: string, node: TreeNode) => void;
  /** What the tree sits on, so the selected row is one surface up from it: the canvas, or a surface-1 panel. */
  on?: "canvas" | "surface-1";
  /** Extra classes for the tree, such as a width. */
  className?: string;
};

/** Things inside things, opened a level at a time, with the keys of a file tree. Pass the items as data. */
export function Tree({
  label,
  items,
  expanded: expandedProp,
  defaultExpanded = [],
  onExpandedChange,
  selected: selectedProp,
  defaultSelected = null,
  onSelect,
  on = "canvas",
  className = "",
}: TreeProps) {
  const [innerOpen, setInnerOpen] = useState<string[]>(defaultExpanded);
  const openList = expandedProp ?? innerOpen;
  const open = useMemo(() => new Set(openList), [openList]);
  const [innerSelected, setInnerSelected] = useState<string | null>(defaultSelected);
  const selected = selectedProp !== undefined ? selectedProp : innerSelected;

  const rows = useMemo(() => visibleRows(items, open), [items, open]);
  const [focusId, setFocusId] = useState<string | null>(null);
  /* The one Tab stop: the focused row if it still shows, else the selected one, else the first. */
  const stop = rows.find((r) => r.node.id === focusId)?.node.id ?? rows.find((r) => r.node.id === selected)?.node.id ?? rows[0]?.node.id;
  const tree = useRef<HTMLUListElement>(null);

  const setOpen = (next: string[]) => {
    if (expandedProp === undefined) setInnerOpen(next);
    onExpandedChange?.(next);
  };
  const toggle = (id: string, to = !open.has(id)) => {
    if (to === open.has(id)) return;
    setOpen(to ? [...openList, id] : openList.filter((x) => x !== id));
  };
  const choose = (node: TreeNode) => {
    if (selectedProp === undefined) setInnerSelected(node.id);
    onSelect?.(node.id, node);
  };
  const focus = (id: string | undefined) => {
    if (!id) return;
    setFocusId(id);
    tree.current?.querySelector<HTMLElement>(`[data-tree-id="${CSS.escape(id)}"]`)?.focus();
  };

  /* Typing a name's first letters jumps to the next row that starts with them. */
  const typed = useRef({ text: "", at: 0 });

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-tree-id]");
    if (!target || e.altKey || e.ctrlKey || e.metaKey) return;
    const i = rows.findIndex((r) => r.node.id === target.dataset.treeId);
    const row = rows[i];
    if (!row) return;
    const branch = row.node.children !== undefined;
    const isOpen = open.has(row.node.id);
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const inKey = rtl ? "ArrowLeft" : "ArrowRight";
    const outKey = rtl ? "ArrowRight" : "ArrowLeft";

    if (e.key === "ArrowDown") focus(rows[i + 1]?.node.id);
    else if (e.key === "ArrowUp") focus(rows[i - 1]?.node.id);
    else if (e.key === "Home") focus(rows[0]?.node.id);
    else if (e.key === "End") focus(rows[rows.length - 1]?.node.id);
    else if (e.key === inKey) {
      if (branch && !isOpen) toggle(row.node.id, true);
      else if (branch && row.node.children!.length) focus(rows[i + 1]?.node.id);
    } else if (e.key === outKey) {
      if (branch && isOpen) toggle(row.node.id, false);
      else focus(row.parent ?? undefined);
    } else if (e.key === "Enter" || e.key === " ") {
      choose(row.node);
      if (branch) toggle(row.node.id);
    } else if (e.key === "*") {
      const siblings = rows.filter((r) => r.parent === row.parent && r.node.children !== undefined).map((r) => r.node.id);
      setOpen([...new Set([...openList, ...siblings])]);
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      const now = performance.now();
      typed.current = { text: (now - typed.current.at < 500 ? typed.current.text : "") + e.key.toLowerCase(), at: now };
      const q = typed.current.text;
      const order = [...rows.slice(i + (q.length === 1 ? 1 : 0)), ...rows.slice(0, i + (q.length === 1 ? 1 : 0))];
      focus(order.find((r) => r.node.label.toLowerCase().startsWith(q))?.node.id);
    } else return;
    e.preventDefault();
  };

  const render = (nodes: TreeNode[], level: number): ReactNode =>
    nodes.map((node, i) => {
      const branch = node.children !== undefined;
      const isOpen = branch && open.has(node.id);
      const isSelected = node.id === selected;
      return (
        <li
          key={node.id}
          role="treeitem"
          data-tree-id={node.id}
          aria-level={level}
          aria-setsize={nodes.length}
          aria-posinset={i + 1}
          aria-expanded={branch ? isOpen : undefined}
          aria-selected={isSelected}
          tabIndex={node.id === stop ? 0 : -1}
          onFocus={(e) => {
            if (e.target === e.currentTarget) setFocusId(node.id);
          }}
          className={"outline-none " + ITEM_FOCUS}
        >
          <div
            className={ROW + " " + (isSelected ? SELECTED[on] : IDLE)}
            style={{ paddingInlineStart: START + (level - 1) * INDENT }}
            onClick={() => {
              focus(node.id);
              choose(node);
              if (branch) toggle(node.id);
            }}
          >
            {/* One guide per level above this one, under that level's chevrons. */}
            {Array.from({ length: level - 1 }, (_, l) => (
              <span
                key={l}
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 w-px bg-line"
                style={{ insetInlineStart: START + l * INDENT + 7.5 }}
              />
            ))}
            <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center text-fg-subtle">
              {branch && (
                <ChevronRightIcon
                  className={
                    "transition-[rotate] duration-(--dur-responsive) ease-responsive rtl:-scale-x-100 " + (isOpen ? "rotate-90 rtl:-rotate-90" : "")
                  }
                />
              )}
            </span>
            <span aria-hidden="true" className={"grid size-4 shrink-0 place-items-center " + (isSelected ? "text-fg" : "text-fg-subtle")}>
              {node.icon ?? (branch ? <FolderIcon /> : <FileIcon />)}
            </span>
            <span className="min-w-0 flex-1 truncate">{node.label}</span>
            {node.detail !== undefined && (
              <span className="shrink-0 text-caption font-normal text-fg-subtle tabular-nums">{node.detail}</span>
            )}
          </div>
          {isOpen && node.children!.length > 0 && (
            <ul role="group" className="m-0 list-none p-0">
              {render(node.children!, level + 1)}
            </ul>
          )}
        </li>
      );
    });

  return (
    <ul ref={tree} role="tree" aria-label={label} onKeyDown={onKeyDown} className={"m-0 min-w-0 list-none p-0 " + className}>
      {render(items, 1)}
    </ul>
  );
}
