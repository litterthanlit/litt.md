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
  order: 11.11,
  group: "Agents",
  verbs: ["press", "open"],
  summary:
    "What an agent changed in a codebase, to review before keeping it: a header that counts the files and lines and what is left to review, and a row per file with its kind and its lines added and removed, a diff that opens under it, and Keep and Undo beside it. A decision settles the row at once and the count rolls down; when every file is decided the header becomes a receipt. Send keeps the view's accent, so Keep all is a secondary button.",
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

/* ---------- Device's own (plans/024, phase 3): Litt fixes the lavs that clip, and reroutes a scene ----------

   The takes on card A clipped because the limiter was off on both lavs. Four files: the field preset, a test that every
   channel is limited, the old preset gone, and the scene's routing renamed to point at the fixed preset. */

const PRESET_DIFF = `@@ -4,8 +4,8 @@
   "sampleRate": 48000,
   "bitDepth": 24,
   "channels": [
     { "name": "Boom", "limiter": true },
-    { "name": "Lav 1", "limiter": false },
-    { "name": "Lav 2", "limiter": false },
+    { "name": "Lav 1", "limiter": true },
+    { "name": "Lav 2", "limiter": true },
     { "name": "Room", "limiter": true }`;

const PRESET_TEST_DIFF = `@@ -0,0 +1,9 @@
+import { describe, expect, it } from "vitest";
+import field from "./field.json";
+
+describe("field preset", () => {
+  it("limits every channel at −1 dBFS", () => {
+    for (const channel of field.channels) expect(channel.limiter).toBe(true);
+    expect(field.limiterThreshold).toBe(-1);
+  });
+});`;

const OLD_PRESET_DIFF = `@@ -1,6 +0,0 @@
-{
-  "name": "Field (old)",
-  "sampleRate": 44100,
-  "bitDepth": 16,
-  "channels": []
-}`;

const ROUTING_DIFF = `@@ -1,5 +1,5 @@
 {
-  "preset": "./presets/field-old.json",
+  "preset": "./presets/field.json",
   "scene": 12,
   "inputs": ["boom", "lav1", "lav2", "room"],
   "outputs": ["card-a", "card-b"]`;

const PRESET: FileChange = { id: "preset", path: "presets/field.json", kind: "modified", diff: PRESET_DIFF };

const LAVS: FileChange[] = [
  PRESET,
  { id: "preset-test", path: "presets/field.test.ts", kind: "added", diff: PRESET_TEST_DIFF },
  { id: "old-preset", path: "presets/field-old.json", kind: "deleted", diff: OLD_PRESET_DIFF },
  { id: "routing", path: "routing/scene-12.json", kind: "renamed", from: "routing/scene-12-draft.json", diff: ROUTING_DIFF },
];

/* Litt has routed Scene 14 through a stereo mix bus, on a branch for review. The counts come with the list, and each
   diff is fetched when its row first opens. */

const MIX_BUS_DIFFS: Record<string, string> = {
  bus: `@@ -1,8 +1,10 @@
 {
-  "mode": "split",
-  "left": ["boom", "room.L"],
-  "right": ["boom", "room.R"],
+  "mode": "bus",
+  "bus": "mix",
+  "inputs": ["boom", "lav1", "lav2", "room.L", "room.R"],
+  "pan": { "room.L": -100, "room.R": 100 },
+  "trim": -3,
   "record": ["card-a", "card-b"]
 }`,
  "bus-ts": `@@ -0,0 +1,9 @@
+import type { Input } from "@recorder/sdk";
+
+export function mixBus(inputs: Input[]) {
+  return {
+    name: "Mix",
+    channels: 2,
+    sources: inputs.map((input) => input.id),
+  };
+}`,
  split: `@@ -1,7 +0,0 @@
-import type { Input } from "@recorder/sdk";
-
-export function legacySplit(inputs: Input[]) {
-  return inputs.map((input, i) => ({ ...input, side: i % 2 ? "R" : "L" }));
-}
-
-export default legacySplit;`,
  scene: `@@ -1,6 +1,6 @@
 {
-  "name": "Scene 14 (draft)",
-  "routing": "../routing/legacy-split.ts",
-  "takes": 0,
+  "name": "Scene 14",
+  "routing": "../routing/mix-bus.json",
+  "takes": 6,
   "sampleRate": 48000
 }`,
  monitor: `@@ -2,5 +2,5 @@
   "headphones": {
-    "source": "split",
+    "source": "mix",
     "level": -12
   }`,
};

const MIX_BUS: FileChange[] = [
  { id: "bus", path: "routing/mix-bus.json", kind: "modified", added: 5, removed: 3 },
  { id: "bus-ts", path: "routing/bus.ts", kind: "added", added: 9, removed: 0 },
  { id: "split", path: "routing/legacy-split.ts", kind: "deleted", added: 0, removed: 7 },
  { id: "scene", path: "scenes/scene-14.json", kind: "renamed", from: "scenes/scene-14-draft.json", added: 3, removed: 3 },
  { id: "monitor", path: "presets/monitor.json", kind: "modified", added: 1, removed: 1 },
];

function LavsTurnDemo() {
  const [changes, decide] = useReview(LAVS);
  return (
    <div className="grid w-full min-w-0 max-w-xl gap-6">
      <div className="grid gap-3">
        <p className="text-body text-fg-muted">
          The lavs stop clipping now. The limiter was off on both of them in the field preset, so I turned it on, added a test that every channel is
          limited at −1 dBFS, and removed the old preset the scene still pointed at.
        </p>
        <FileChanges changes={changes} onDecide={decide} />
      </div>
      <Composer placeholder="Message Litt" label="Message Litt" className="w-full" />
    </div>
  );
}

function PresetCallDemo() {
  const [changes, decide] = useReview([PRESET]);
  return (
    <div className="grid w-full min-w-0 max-w-xl">
      <ToolCall action="Read" target="presets/field.json" duration={0.1} />
      <ToolCall
        action="Edited"
        target="presets/field.json"
        result="+2 −2"
        duration={0.3}
        defaultOpen
        details={<FileChanges changes={changes} onDecide={decide} summary={false} defaultOpen />}
      />
      <ToolCall action="Ran" target="rec check --preset field" result="Exit 0" duration={6.1} />
    </div>
  );
}

/** Fetches a routing diff when its row first opens, as a review screen would from its server. */
function useLazyBusDiffs() {
  const [diffs, setDiffs] = useState<Record<string, string>>({});
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const load: FileChangesProps["onOpenChange"] = (change, open) => {
    if (!open || diffs[change.id] !== undefined) return;
    timers.current.push(window.setTimeout(() => setDiffs((all) => ({ ...all, [change.id]: MIX_BUS_DIFFS[change.id] })), 700));
  };
  return [diffs, load] as const;
}

function MixBusReviewDemo() {
  const [changes, decide] = useReview(MIX_BUS);
  const [diffs, load] = useLazyBusDiffs();
  return (
    <div className="grid w-full min-w-0 max-w-2xl gap-6">
      <div className="grid gap-1">
        <p className="text-body font-title text-fg">Route Scene 14 through the mix bus</p>
        <p className="text-small text-fg-muted">Litt's branch litt/mix-bus. Nothing reaches the recorder until you keep it.</p>
      </div>
      <FileChanges changes={changes.map((c) => ({ ...c, diff: diffs[c.id] }))} onDecide={decide} onOpenChange={load} accent />
    </div>
  );
}

function LavsPhoneDemo() {
  const [changes, decide] = useReview(LAVS);
  return (
    <div className="mx-auto w-full max-w-[22.375rem]">
      <div className="rounded-surface bg-canvas p-4 outline-1 -outline-offset-1 outline-line">
        <DeviceProvider mode="phone">
          <div className="grid gap-6">
            <p className="litt-raised ml-auto max-w-[85%] px-4 py-3 text-body text-fg">The lavs on card A keep clipping. Can you fix it?</p>
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

function LavsReviewTile() {
  const [changes, decide] = useReview(LAVS);
  return (
    <div className="w-full max-w-md">
      <FileChanges changes={changes} onDecide={decide} />
    </div>
  );
}

/* ---------- Flat's own (plans/024, phase 3): Litt mends the spring series' picture links ---------- */

const OPEN_WATER_DIFF = `@@ -3,7 +3,7 @@
 The first of the spring series. I stood on the north pier
 for forty minutes before the light came.

-![Open water](/photos/open-water.jpg)
+![Deep blue water in long ripples](/pictures/open-water.jpg)

 Six pictures follow, one for each week of the series.`;

const DUSK_DIFF = `@@ -1,4 +1,4 @@
 # Dusk tide

-![](/photos/dusk-tide.jpg)
+![Violet water, pink light on the crests](/pictures/dusk-tide.jpg)
 Twenty minutes after sunset, from the same pier.`;

const LINKS_DIFF = `@@ -0,0 +1,3 @@
+/photos/*      /pictures/*
+/blog/*        /posts/*
+/newsletter    /letter`;

const OLD_DIFF = `@@ -1,3 +0,0 @@
-# Coming soon
-
-Pictures from the coast, once the spring series starts.`;

const SPRING: FileChange[] = [
  { id: "open-water", path: "posts/spring/open-water.md", kind: "modified", diff: OPEN_WATER_DIFF },
  { id: "dusk-tide", path: "posts/spring/dusk-tide.md", kind: "modified", diff: DUSK_DIFF },
  { id: "links", path: "old-links.txt", kind: "added", diff: LINKS_DIFF },
  { id: "soon", path: "posts/coming-soon.md", kind: "deleted", diff: OLD_DIFF },
];

function PicturesTurnDemo() {
  const [changes, decide] = useReview(SPRING);
  return (
    <div className="grid w-full min-w-0 max-w-xl gap-6">
      <div className="grid gap-3">
        <p className="text-body text-fg-muted">
          The pictures show again. They moved from /photos to /pictures, so I pointed both posts at the new place, wrote what each picture shows for readers
          who cannot see it, sent the old links on, and took away the old Coming soon page.
        </p>
        <FileChanges changes={changes} onDecide={decide} />
      </div>
      <Composer placeholder="Message Litt" label="Message Litt" className="w-full" />
    </div>
  );
}

function PicturesReviewTile() {
  const [changes, decide] = useReview(SPRING);
  return (
    <div className="w-full max-w-md">
      <FileChanges changes={changes} onDecide={decide} />
    </div>
  );
}

export default function FileChangesPage() {
  const [turnKey, resetTurn] = useReplay();
  const [reviewKey, resetReview] = useReplay();
  return (
    <Page meta={meta} docs={docs} tile={<ReviewTile />} tileByWorld={{ device: <LavsReviewTile />, flat: <PicturesReviewTile /> }}>
      <Stage
        title="The end of a turn"
        tier="responsive"
        size="lg"
        align="start"
        code="TurnDemo"
        onReplay={resetTurn}
        replayLabel="Reset"
        byWorld={{
          flat: {
            demo: <PicturesTurnDemo key={turnKey} />,
            title: "Mended picture links",
            code: "PicturesTurnDemo",
            caption:
              "Litt mended the spring series' pictures and lists what it changed: one row per file with its kind and its lines added and removed. Press Keep or Undo on a row and it settles at once: the verbs give way to the word, the path steps back on the instant tier, and the count of what is left rolls down on the responsive tier. Keep all and Undo all then say the rest, and act on the files still pending only. When every file is decided the header becomes a receipt.",
          },
          device: {
            demo: <LavsTurnDemo key={turnKey} />,
            code: "LavsTurnDemo",
            caption:
              "Litt stopped the lavs clipping and lists what it changed: one row per file with its kind and its lines added and removed. Press Keep or Undo on a row and it settles at once: the verbs give way to the word, the path steps back on the instant tier, and the count of what is left rolls down on the responsive tier. Keep all and Undo all then say the rest, and act on the files still pending only. When every file is decided the header becomes a receipt. Send stays the view's primary key, so Keep all is a key like the others.",
          },
        }}
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
        byWorld={{ device: { demo: <PresetCallDemo />, code: "PresetCallDemo" } }}
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
        byWorld={{ device: { demo: <MixBusReviewDemo key={reviewKey} />, code: "MixBusReviewDemo" } }}
        caption="A screen with no composer has no Send, so accent makes Keep all the view's one accent fill. The counts come with the list and each diff is fetched when its row first opens: the row says Loading the diff in words until it arrives, then the diff takes its place at once."
      >
        <ReviewScreenDemo key={reviewKey} />
      </Stage>

      <Stage
        title="On a phone"
        tier="instant"
        align="start"
        code="PhoneDemo"
        byWorld={{ device: { demo: <LavsPhoneDemo />, code: "LavsPhoneDemo" } }}
        caption="In a phone-wide turn the kind, the counts and the word drop to a second line under the path, and Keep all and Undo all sit under the header's words. The directory is cut first and the file name never. On a finger the rows, the verbs and the buttons are 44px, and a verb's tooltip opens on a press and hold."
      >
        <PhoneDemo />
      </Stage>

      <TryIt of="FileChanges" component={TryFileChanges} props={{ label: "Files changed", className: "w-full max-w-xl" }} controls={["label", "summary", "accent"]} />
    </Page>
  );
}
