import { useState } from "react";
import { Tree, type TreeNode } from "@/components/tree";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "tree",
  title: "Tree",
  lede: "Things inside things, a level at a time.",
  order: 6.05,
  group: "Navigation",
  worlds: ["press", "device", "plain", "rack", "heat"],
  verbs: ["select", "press"],
  summary:
    "Things inside things, opened a level at a time: a project's files, a docs site's pages. Rows of 32px indented 16px a level, with a hairline guide down each level, and the selected row in the selected segment's look. The chevron turns on the responsive tier and the children appear in place, with nothing growing. It has the keys of a file tree.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["tree"],
  exports: ["Tree"],
  usage: `import { Tree, type TreeNode } from "@/components/tree";

// An item with children (even none yet) is a branch. detail sits at the end of the row.
const files: TreeNode[] = [
  { id: "src", label: "src", children: [
    { id: "src/app", label: "app", children: [
      { id: "src/app/layout.tsx", label: "layout.tsx", detail: "M" },
    ] },
  ] },
  { id: "package.json", label: "package.json" },
];

<Tree label="Files" items={files} defaultExpanded={["src", "src/app"]} onSelect={(id) => open(id)} />

// Inside a raised panel, so the selected row steps up from surface-1.
<Tree label="Pages" items={pages} on="surface-1" />`,
  use: [
    "A hierarchy people move through and open parts of: a project's files, a docs site's pages, nested folders of assets.",
    "A side panel that picks what the main area shows, such as the file a diff is about.",
  ],
  skip: [
    "One or two levels that always show. Use a list with headings, or SidebarNav in the app shell.",
    "Rows people compare by their fields. That is a Table.",
    "Sections of one page that open in place. That is an Accordion.",
  ],
  keyboard: [
    [["ArrowDown", "ArrowUp"], "The next or previous row that shows."],
    [["ArrowRight"], "Opens a closed branch, or moves to the first item inside an open one."],
    [["ArrowLeft"], "Closes an open branch, or moves to the parent."],
    [["Home", "End"], "The first or the last row that shows."],
    [["Enter", "Space"], "Selects the row, and opens or closes a branch."],
    [["*"], "Opens every branch beside the focused one."],
    [["a–z"], "Jumps to the next row whose name starts with what was typed."],
  ],
  a11y: [
    "role=\"tree\" named by the label; each row is a treeitem with its level, its place among its siblings, aria-expanded on a branch and aria-selected.",
    "One Tab stop, on the selected row (or the first), and the arrow keys inside, as in a file manager.",
    "The nesting is drawn by indent and a hairline guide, never by color alone.",
    "Rows are 44px tall on a touch screen.",
    "The chevron's turn is the only motion; under reduced motion it snaps.",
  ],
};

const FILES: TreeNode[] = [
  {
    id: "src",
    label: "src",
    children: [
      {
        id: "src/app",
        label: "app",
        children: [
          { id: "src/app/layout.tsx", label: "layout.tsx", detail: "M" },
          { id: "src/app/page.tsx", label: "page.tsx" },
          { id: "src/app/work", label: "work", children: [{ id: "src/app/work/[slug]/page.tsx", label: "[slug]/page.tsx", detail: "+" }] },
        ],
      },
      {
        id: "src/components",
        label: "components",
        children: [
          { id: "src/components/header.tsx", label: "header.tsx" },
          { id: "src/components/case-study.tsx", label: "case-study.tsx", detail: "+" },
        ],
      },
      { id: "src/fonts.ts", label: "fonts.ts", detail: "M" },
    ],
  },
  { id: "public", label: "public", children: [{ id: "public/og.png", label: "og.png", detail: "48 kB" }] },
  { id: "package.json", label: "package.json", detail: "M" },
  { id: "next.config.ts", label: "next.config.ts" },
];

function FilesDemo() {
  const [selected, setSelected] = useState<string | null>("src/app/layout.tsx");
  return (
    <div className="grid w-full max-w-xs gap-4">
      <Tree label="Files" items={FILES} defaultExpanded={["src", "src/app"]} selected={selected} onSelect={(id, node) => !node.children && setSelected(id)} />
      <p className="text-caption font-normal text-fg-subtle">{selected ?? "No file open"}</p>
    </div>
  );
}

const PAGES: TreeNode[] = [
  { id: "start", label: "Getting started", children: [{ id: "install", label: "Install" }, { id: "first-site", label: "Your first site" }] },
  { id: "guides", label: "Guides", children: [{ id: "domains", label: "Domains" }, { id: "previews", label: "Preview links" }, { id: "cms", label: "The CMS" }] },
  { id: "reference", label: "Reference", children: [{ id: "cli", label: "CLI" }, { id: "api", label: "API" }] },
];

function PanelDemo() {
  return (
    <div className="litt-raised w-full max-w-xs rounded-surface p-2">
      <Tree label="Pages" items={PAGES} on="surface-1" defaultExpanded={["guides"]} defaultSelected="previews" />
    </div>
  );
}

/* ---------- Flat's own (plans/024, phase 3): a small site's pages ---------- */

const SITE: TreeNode[] = [
  {
    id: "posts",
    label: "Posts",
    children: [
      {
        id: "posts/spring",
        label: "Spring series",
        children: [
          { id: "posts/spring/open-water", label: "Open water", detail: "6 pictures" },
          { id: "posts/spring/dusk-tide", label: "Dusk tide", detail: "2 pictures" },
          { id: "posts/spring/red-sun", label: "A red sun in March", detail: "Draft" },
        ],
      },
      {
        id: "posts/garden",
        label: "The garden",
        children: [{ id: "posts/garden/what-it-did", label: "What the garden did", detail: "4 pictures" }],
      },
      { id: "posts/silk", label: "Notes on a slow shutter", detail: "Draft" },
    ],
  },
  { id: "letter", label: "Letter", children: [{ id: "letter/14", label: "Issue 14", detail: "Friday" }] },
  { id: "about", label: "About" },
  { id: "subscribe", label: "Subscribe" },
];

function SitePagesDemo() {
  const [selected, setSelected] = useState<string | null>("posts/spring/open-water");
  return (
    <div className="grid w-full max-w-xs gap-4">
      <Tree label="Your site" items={SITE} defaultExpanded={["posts", "posts/spring"]} selected={selected} onSelect={(id, node) => !node.children && setSelected(id)} />
      <p className="text-caption font-normal text-fg-subtle">{selected ?? "No page open"}</p>
    </div>
  );
}

export default function TreePage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="A project's files"
        tier="responsive"
        align="start"
        code="FilesDemo"
        byWorld={{
          flat: {
            demo: <SitePagesDemo />,
            title: "A site's pages",
            code: "SitePagesDemo",
            caption:
              "Press a folder to open it: the chevron turns a quarter on the responsive tier and the pages appear in place. Press a page to open it. Tab in and try the arrows: right opens and goes in, left closes and goes out. Type a letter to jump to a name. The words at the ends say how many pictures a post holds, or that it is a draft.",
          },
        }}
        caption="Press a folder to open it: the chevron turns a quarter on the responsive tier and the files appear in place. Press a file to open it. Tab in and try the arrows: right opens and goes in, left closes and goes out. Type a letter to jump to a name. M and + at the ends are change marks."
      >
        <FilesDemo />
      </Stage>

      <Stage
        title="On a panel"
        tier="responsive"
        align="start"
        code="PanelDemo"
        caption="On a raised panel the selected row steps up to surface-2, one surface above what it sits on, as the selected segment does everywhere. The hairline guides keep the levels apart without color."
      >
        <PanelDemo />
      </Stage>
    </Page>
  );
}
