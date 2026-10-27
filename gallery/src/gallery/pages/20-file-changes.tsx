import { useEffect, useRef, useState } from "react";
import { Composer } from "@/components/composer";
import { FileChanges, type FileChange, type FileChangesProps, type FileDecision } from "@/components/file-changes";
import { ToolCall } from "@/components/tool-call";
import { DeviceProvider } from "@/motion";
import { Page, Stage, TryIt, useReplay, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "file-changes",
  title: "File changes",
  lede: "What an agent changed, to keep or undo file by file.",
  order: 18.965,
  group: "Agents",
  verbs: ["press", "open"],
  summary:
    "What an agent changed in a codebase, to review before keeping it: a header that counts the files and lines and what is left to review, and a row per file with its kind and its lines added and removed, a diff that opens under it, and Keep and Undo beside it. A decision settles the row at once and the count rolls down; when every file is decided the header becomes a receipt. Send keeps the view's accent, so Keep all is a raised block.",
  fun: "Press Keep all: the check of each file pops in, one after another down the list.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["file-changes"],
  exports: ["FileChanges"],
  usage: `import { useState } from "react";
import { FileChanges, type FileChange, type FileDecision } from "@/components/file-changes";
import { ToolCall } from "@/components/tool-call";

// The decisions are yours: hold the changes in state and set each one's state in onDecide.
const [changes, setChanges] = useState<FileChange[]>(turn.changes); // every state "pending" at first
const decide = (ids: string[], decision: FileDecision) => {
  setChanges((all) => all.map((c) => (ids.includes(c.id) ? { ...c, state: decision } : c)));
  decision === "kept" ? repo.keep(ids) : repo.revert(ids);
};

// The end of a turn: every file, Keep all and Undo all. Send keeps the accent.
<FileChanges changes={changes} onDecide={decide} />

// An edit call: its one file, the diff open, no header (the call's row says the rest).
<ToolCall action="Edited" target="src/styles/fonts.css" result="+2 −2"
  details={<FileChanges changes={[fonts]} onDecide={decide} summary={false} defaultOpen />} />

// A review screen with no composer: Keep all is the one accent fill, and diffs load when a row opens.
<FileChanges changes={changes} onDecide={decide} accent
  onOpenChange={(change, open) => open && !change.diff && loadDiff(change.id)} />`,
  use: [
    "An agent changed files and the person should decide whether to keep them: a fix, a refactor, a migration. One row per file says what happened in words and figures, and Keep and Undo sit on the row.",
    "The end of a turn reviews every file. The header counts the files and the lines, says what is left to review, and offers Keep all and Undo all, which act on the files still pending only.",
    "An edit call should show what it changed. Put the one file in the call's details with summary off and defaultOpen, and the call's row says the rest.",
    "A review screen has no composer. Pass accent and Keep all becomes the view's one accent fill. In a chat leave it off: Send keeps the accent while the person can still reply.",
    "Diffs are large or come from a server. Leave diff out, pass onOpenChange, and fetch it when a row first opens: the row says Loading the diff until you pass it.",
  ],
  skip: [
    "You are showing one diff with nothing to decide. Use Code block with lang \"diff\".",
    "The agent needs a yes before it acts. Use Tool approval: it blocks the agent and borrows the accent while Send is off.",
    "You want to list files with no changes in them, such as a project's tree. Use Tree.",
    "You want the decisions to undo themselves after a while, or to be kept here and not by you. The component holds no decision: the state you give back is what it shows.",
  ],
  keyboard: [
    [["Tab"], "Moves to each file's row, then to its Keep and Undo, then on to the next file. An open diff's scroller is a stop after its row."],
    [["Enter", "Space"], "Opens or closes the focused file's diff, or presses the focused Keep, Undo, Keep all or Undo all."],
    [["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"], "Scroll a focused diff."],
  ],
  a11y: [
    "The files are a list named by label (\"Files changed\"). Each row that opens is a button with aria-expanded, named in one run by the path, the kind, the lines and the decision: \"src/styles/type.css, renamed from src/styles/typography.css, 1 line added, 1 removed, kept\". While its diff is open it points to it with aria-controls.",
    "Keep and Undo are named with the file (\"Keep src/styles/fonts.css\"), so a list of them reads apart. A row shows only the verbs that differ from its state, and each verb keeps its place.",
    "The signs are hidden from screen readers and the figures read as words. A decision is said in words, \"Kept\" or \"Undone\", never by color or a strikethrough.",
    "One polite status says \"Kept src/styles/fonts.css\", \"Undid 3 files\" and \"All reviewed: 3 kept, 1 undone\" when the states change, whoever changed them. It never speaks on the first render.",
    "When the button you pressed had focus and goes, focus moves to the verb that replaces it, or to the header once Keep all and Undo all have gone, so a keyboard never falls back to the top of the page.",
    "The caller keeps the view's one accent fill: leave accent off wherever a Composer's Send can be on.",
    "Rows, verbs and the header's buttons are 44px on a finger. The diff fades in and travels a quarter of the travel token on the responsive tier, and appears at once under reduced motion.",
  ],
};

/* ---------------------------------------------------------------- data

   Litt has fixed the Halo build, which failed on a font it could not resolve. Four files: the font imports, a test that
   every font resolves, the old Inter styles gone, and the type styles renamed to point at the new imports. */

const FONTS_DIFF = `@@ -1,8 +1,8 @@
 @import "@fontsource/geist-sans/400.css";
 @import "@fontsource/geist-sans/500.css";
-@import "@fontsource/geist-mono/400.css";
+@import "@fontsource-variable/geist-mono/index.css";

 :root {
   --font-sans: "Geist", system-ui, sans-serif;
-  --font-mono: "Geist Mono", ui-monospace, monospace;
+  --font-mono: "Geist Mono Variable", ui-monospace, monospace;
 }`;

const TEST_DIFF = `@@ -0,0 +1,12 @@
+import { createRequire } from "node:module";
+import { describe, expect, it } from "vitest";
+
+const require = createRequire(import.meta.url);
+
+describe("fonts", () => {
+  it("resolves every font the site imports", () => {
+    expect(() => require.resolve("@fontsource/geist-sans/400.css")).not.toThrow();
+    expect(() => require.resolve("@fontsource/geist-sans/500.css")).not.toThrow();
+    expect(() => require.resolve("@fontsource-variable/geist-mono/index.css")).not.toThrow();
+  });
+});`;

const INTER_DIFF = `@@ -1,6 +0,0 @@
-@import "@fontsource/inter/400.css";
-@import "@fontsource/inter/600.css";
-
-.legacy-copy {
-  font-family: "Inter", system-ui, sans-serif;
-}`;

const TYPE_DIFF = `@@ -1,6 +1,6 @@
-@import "./inter.css";
+@import "./fonts.css";

 h1,
 h2,
 h3 {
   font-family: var(--font-sans);`;

const FONTS: FileChange = { id: "fonts", path: "src/styles/fonts.css", kind: "modified", diff: FONTS_DIFF };

const HALO: FileChange[] = [
  FONTS,
  { id: "test", path: "src/styles/fonts.test.ts", kind: "added", diff: TEST_DIFF },
  { id: "inter", path: "src/styles/inter.css", kind: "deleted", diff: INTER_DIFF },
  { id: "type", path: "src/styles/type.css", kind: "renamed", from: "src/styles/typography.css", diff: TYPE_DIFF },
];

/* Litt has moved the Northwind site from flex columns to the twelve-column grid, on a branch for review. The counts
   come with the list, and each diff is fetched when its row first opens. */

const NORTHWIND_DIFFS: Record<string, string> = {
  grid: `@@ -1,8 +1,10 @@
 .page {
-  display: flex;
-  gap: 24px;
+  display: grid;
+  grid-template-columns: repeat(12, minmax(0, 1fr));
+  column-gap: var(--space-6);
+  row-gap: var(--space-8);
 }

 .page > * {
-  flex: 1;
+  grid-column: 1 / -1;
 }`,
  "case-grid": `@@ -0,0 +1,9 @@
+import type { ReactNode } from "react";
+
+export function CaseGrid({ children }: { children: ReactNode }) {
+  return (
+    <section className="page case-grid" aria-label="Case studies">
+      {children}
+    </section>
+  );
+}`,
  legacy: `@@ -1,7 +0,0 @@
-import type { ReactNode } from "react";
-
-export function LegacyColumns({ children }: { children: ReactNode }) {
-  return <div className="columns columns--three">{children}</div>;
-}
-
-export default LegacyColumns;`,
  work: `@@ -1,6 +1,6 @@
-import { LegacyColumns } from "../components/legacy-columns";
+import { CaseGrid } from "../components/case-grid";
 import { cases } from "../content/cases";

-export default function Projects() {
-  return <LegacyColumns>{cases.map((c) => <CaseCard key={c.slug} {...c} />)}</LegacyColumns>;
+export default function Work() {
+  return <CaseGrid>{cases.map((c) => <CaseCard key={c.slug} {...c} />)}</CaseGrid>;
 }`,
  header: `@@ -8,5 +8,5 @@ export function SiteHeader() {
     <nav aria-label="Main">
-      <a href="/projects">Projects</a>
+      <a href="/work">Work</a>
       <a href="/journal">Journal</a>
     </nav>`,
};

const NORTHWIND: FileChange[] = [
  { id: "grid", path: "src/styles/grid.css", kind: "modified", added: 5, removed: 3 },
  { id: "case-grid", path: "src/components/case-grid.tsx", kind: "added", added: 9, removed: 0 },
  { id: "legacy", path: "src/components/legacy-columns.tsx", kind: "deleted", added: 0, removed: 7 },
  { id: "work", path: "src/pages/work.tsx", kind: "renamed", from: "src/pages/projects.tsx", added: 3, removed: 3 },
  { id: "header", path: "src/components/site-header.tsx", kind: "modified", added: 1, removed: 1 },
];

/** The page holds the decisions, as a host would: onDecide sets each change's state. */
function useReview(start: FileChange[]) {
  const [changes, setChanges] = useState(start);
  const decide = (ids: string[], decision: FileDecision) =>
    setChanges((all) => all.map((c) => (ids.includes(c.id) ? { ...c, state: decision } : c)));
  return [changes, decide] as const;
}

/* ---------------------------------------------------------------- demos */

function TurnDemo() {
  const [changes, decide] = useReview(HALO);
  return (
    <div className="grid w-full min-w-0 max-w-xl gap-6">
      <div className="grid gap-3">
        <p className="text-body text-fg-muted">
          The build passes now. The mono font pointed at a package the site never installed, so I switched it to the variable one, added a test that every
          font resolves, and folded the old Inter styles away.
        </p>
        <FileChanges changes={changes} onDecide={decide} />
      </div>
      <Composer placeholder="Message Litt" label="Message Litt" className="w-full" />
    </div>
  );
}

function EditCallDemo() {
  const [changes, decide] = useReview([FONTS]);
  return (
    <div className="grid w-full min-w-0 max-w-xl">
      <ToolCall action="Read" target="src/styles/fonts.css" duration={0.1} />
      <ToolCall
        action="Edited"
        target="src/styles/fonts.css"
        result="+2 −2"
        duration={0.3}
        defaultOpen
        details={<FileChanges changes={changes} onDecide={decide} summary={false} defaultOpen />}
      />
      <ToolCall action="Ran" target="npm run build" result="Exit 0" duration={6.1} />
    </div>
  );
}

/** Fetches a diff when its row first opens, as a review screen would from its server. */
function useLazyDiffs() {
  const [diffs, setDiffs] = useState<Record<string, string>>({});
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const load: FileChangesProps["onOpenChange"] = (change, open) => {
    if (!open || diffs[change.id] !== undefined) return;
    timers.current.push(window.setTimeout(() => setDiffs((all) => ({ ...all, [change.id]: NORTHWIND_DIFFS[change.id] })), 700));
  };
  return [diffs, load] as const;
}

function ReviewScreenDemo() {
  const [changes, decide] = useReview(NORTHWIND);
  const [diffs, load] = useLazyDiffs();
  return (
    <div className="grid w-full min-w-0 max-w-2xl gap-6">
      <div className="grid gap-1">
        <p className="text-body font-title text-fg">Move the Northwind site to the grid</p>
        <p className="text-small text-fg-muted">Litt's branch litt/new-grid. Nothing reaches the site until you keep it.</p>
      </div>
      <FileChanges changes={changes.map((c) => ({ ...c, diff: diffs[c.id] }))} onDecide={decide} onOpenChange={load} accent />
    </div>
  );
}

function PhoneDemo() {
  const [changes, decide] = useReview(HALO);
  return (
    <div className="mx-auto w-full max-w-[22.375rem]">
      <div className="rounded-surface bg-canvas p-4 outline-1 -outline-offset-1 outline-line">
        <DeviceProvider mode="phone">
          <div className="grid gap-6">
            <p className="litt-raised ml-auto max-w-[85%] px-4 py-3 text-body text-fg">The Halo build is failing on a font. Can you fix it?</p>
            <div className="grid gap-3">
              <p className="text-body text-fg-muted">Fixed. Here is what I changed.</p>
              <FileChanges changes={changes} onDecide={decide} />
            </div>
            <Composer placeholder="Message Litt" label="Message Litt" className="w-full" />
          </div>
        </DeviceProvider>
      </div>
    </div>
  );
}

/* ---------- the overview's tile ---------- */

function ReviewTile() {
  const [changes, decide] = useReview(HALO);
  return (
    <div className="w-full max-w-md">
      <FileChanges changes={changes} onDecide={decide} />
    </div>
  );
}

/** TryIt's stand-in: FileChanges with the Halo files, holding the decisions as a host would. */
function TryFileChanges(props: Omit<FileChangesProps, "changes" | "onDecide">) {
  const [changes, decide] = useReview(HALO);
  return <FileChanges {...props} changes={changes} onDecide={decide} />;
}

export default function FileChangesPage() {
  const [turnKey, resetTurn] = useReplay();
  const [reviewKey, resetReview] = useReplay();
  return (
    <Page meta={meta} docs={docs} tile={<ReviewTile />}>
      <Stage
        title="The end of a turn"
        tier="responsive"
        size="lg"
        align="start"
        code="TurnDemo"
        onReplay={resetTurn}
        replayLabel="Reset"
        caption="Litt fixed the Halo build and lists what it changed: one row per file with its kind and its lines added and removed. Press Keep or Undo on a row and it settles at once: the verbs give way to the word, the path steps back on the instant tier, and the count of what is left rolls down on the responsive tier. Keep all and Undo all then say the rest, and act on the files still pending only. When every file is decided the header becomes a receipt. Send keeps the view's one accent fill, so Keep all is a raised block."
      >
        <TurnDemo key={turnKey} />
      </Stage>

      <Stage
        title="In an edit call"
        tier="responsive"
        size="lg"
        align="start"
        code="EditCallDemo"
        caption="An edit call's details are the one file it changed, with no header: the call's row already says +2 −2. Its diff starts open, and Keep and Undo sit on the row, so the person can decide while the agent works on. Open or close the row and the diff fades in and travels a quarter of the travel token on the responsive tier, and its height snaps."
      >
        <EditCallDemo />
      </Stage>

      <Stage
        title="A review screen"
        tier="responsive"
        size="lg"
        align="start"
        code="ReviewScreenDemo"
        onReplay={resetReview}
        replayLabel="Reset"
        caption="A screen with no composer has no Send, so accent makes Keep all the view's one accent fill. The counts come with the list and each diff is fetched when its row first opens: the row says Loading the diff in words until it arrives, then the diff takes its place at once."
      >
        <ReviewScreenDemo key={reviewKey} />
      </Stage>

      <Stage
        title="On a phone"
        tier="instant"
        align="start"
        code="PhoneDemo"
        caption="In a phone-wide turn the kind, the counts and the word drop to a second line under the path, and Keep all and Undo all sit under the header's words. The directory is cut first and the file name never. On a finger the rows, the verbs and the buttons are 44px, and a verb's tooltip opens on a press and hold."
      >
        <PhoneDemo />
      </Stage>

      <TryIt of="FileChanges" component={TryFileChanges} props={{ label: "Files changed", className: "w-full max-w-xl" }} controls={["label", "summary", "accent"]} />
    </Page>
  );
}
