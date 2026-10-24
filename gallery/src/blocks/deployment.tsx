/**
 * Deployment: one deploy as a screen, from the first line of its build to the site going live. A block: a whole
 * screen built from the litt parts, to copy and make your own. Swap the sample deploy, its files and `useBuild` (which
 * plays a script) for your build's stream; the layout stays.
 *
 * Where the deploy sits, then its name and a line in two inks, with who started it behind a hover card. The status in
 * words, the facts in a row, and a progress rail while it builds. Then the work: the files this deploy changed in a
 * tree beside the build log, with a line between them to drag. Pick a file and the right side shows its diff; the log
 * is one press away. On a phone the two take turns behind a segmented control. Visit site is the one accent fill, and
 * it waits until the site is live.
 */
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/avatar";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/button";
import { CodeBlock } from "@/components/code-block";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/hover-card";
import { ArrowUpRightIcon, RetryIcon } from "@/components/icons";
import { LogView, type LogLine } from "@/components/log-view";
import { Progress } from "@/components/progress";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/resizable";
import { Segmented } from "@/components/segmented";
import { Tag } from "@/components/tag";
import { Tree, type TreeNode } from "@/components/tree";
import { useDevice } from "@/motion";

/* ----------------------------------------------------------------- data */

/** The deploy. Point the links at your routes. */
const DEPLOY = {
  id: "8f2ka1c",
  project: "Halo site",
  branch: "main",
  commit: "Swap Inter for Geist in the layout",
  domain: "halo.studio",
  trail: [
    { label: "Projects", href: "/projects" },
    { label: "Halo site", href: "/projects/halo" },
    { label: "Deployments", href: "/projects/halo/deployments" },
    { label: "8f2ka1c", href: "/projects/halo/deployments/8f2ka1c" },
  ],
  author: { name: "Ines Duarte", role: "Design lead, Halo Studio", href: "/people/ines", note: "Owns the studio site. 312 deploys since March 2024." },
};

/** The files this deploy changed, as a tree. The detail is the change: M for modified, + for added. */
const FILES: TreeNode[] = [
  {
    id: "src",
    label: "src",
    children: [
      { id: "src/app", label: "app", children: [{ id: "src/app/layout.tsx", label: "layout.tsx", detail: "M" }] },
      { id: "src/fonts.ts", label: "fonts.ts", detail: "+" },
    ],
  },
  { id: "package.json", label: "package.json", detail: "M" },
];

/** Each changed file's diff. */
const DIFFS: Record<string, string> = {
  "src/app/layout.tsx": `@@ -1,6 +1,6 @@
-import "@fontsource/inter/400.css";
-import "@fontsource/inter/600.css";
+import { sans } from "../fonts";

 export default function Layout({ children }) {
-  return <html lang="en"><body>{children}</body></html>;
+  return <html lang="en" className={sans.className}><body>{children}</body></html>;
 }`,
  "src/fonts.ts": `@@ -0,0 +1,3 @@
+import { GeistSans } from "geist/font/sans";
+
+export const sans = GeistSans;`,
  "package.json": `@@ -8,7 +8,7 @@
   "dependencies": {
-    "@fontsource/inter": "5.2.5",
+    "geist": "1.5.1",
     "next": "16.3.6",`,
};

/** The build's output, in order, each line with its own id. useBuild plays it; replace it with your build's stream. */
const SCRIPT: LogLine[] = [
  { id: "clone", text: "Cloning github.com/halo-studio/site (branch main, commit 8f2ka1c)" },
  { id: "cache", text: "Restored build cache from the last deploy" },
  { id: "install", text: 'Running "npm ci"' },
  { id: "installed", text: "added 412 packages in 6s", level: "debug" },
  { id: "build", text: 'Running "npm run build"' },
  { id: "next", text: "▲ Next.js 16.3.6" },
  { id: "optimize", text: "Creating an optimized production build ..." },
  { id: "og-image", text: "Image /public/og.png is 2.4 MB; it will be served as is.", level: "warn" },
  { id: "compiled", text: "✓ Compiled successfully in 13.8s" },
  { id: "static", text: "Generating static pages (12/12)" },
  { id: "upload", text: "Uploading build output: 38 files, 2.1 MB" },
  { id: "domains", text: "Assigning domains: halo.studio, www.halo.studio" },
  { id: "live", text: "Build completed in 29s. halo.studio is live.", level: "success" },
];

/* ----------------------------------------------------------------- the run */

/** Plays the script a line at a time, unevenly, as a real build writes. Replace it with your build's stream. */
function useBuild(run: number) {
  const [lines, setLines] = useState<LogLine[]>([]);
  useEffect(() => {
    setLines([]);
    let i = 0;
    let at = 0;
    let timer = 0;
    const next = () => {
      const line = SCRIPT[i];
      if (!line) return;
      at += 0.8 + (i % 3) * 1.4;
      /* Made before the update: React may run the updater later, after i and at have moved on. */
      const written = { ...line, time: `+${at.toFixed(1)}s` };
      setLines((all) => [...all, written]);
      i++;
      timer = window.setTimeout(next, 260 + (i % 4) * 160);
    };
    timer = window.setTimeout(next, 500);
    return () => window.clearTimeout(timer);
  }, [run]);
  return lines;
}

/* ----------------------------------------------------------------- the screen */

const link =
  "rounded-control text-fg underline decoration-line-strong underline-offset-4 transition-colors duration-(--dur-instant) ease-litt hover:decoration-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function Deployment() {
  const { compact } = useDevice();
  const [run, setRun] = useState(0);
  const lines = useBuild(run);
  const done = lines.length === SCRIPT.length;
  const [file, setFile] = useState<string | null>(null);
  const [pane, setPane] = useState<"log" | "diff" | "files">("log");

  const facts = useMemo(
    () => [
      { label: "Branch", value: DEPLOY.branch, mono: true },
      { label: "Commit", value: DEPLOY.id, mono: true },
      { label: "Duration", value: done ? "29s" : "Building", mono: false },
      { label: "Domain", value: DEPLOY.domain, mono: true },
    ],
    [done],
  );

  const open = (id: string, node: TreeNode) => {
    if (node.children) return;
    setFile(id);
    setPane("diff");
  };

  const log = <LogView label="Build log" lines={lines} height="fill" className="h-full" />;
  const diff = file ? (
    <CodeBlock code={DIFFS[file] ?? ""} lang="diff" filename={file} lineNumbers />
  ) : (
    <p className="text-small text-fg-subtle">Pick a file to see what changed.</p>
  );
  const tree = <Tree label="Changed files" items={FILES} defaultExpanded={["src", "src/app"]} selected={file} onSelect={open} />;

  return (
    <div className="@container grid w-full gap-8">
      <header className="grid gap-6">
        <Breadcrumb label="Where this deploy is" items={DEPLOY.trail} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-1">
            <h1 className="text-h1 text-fg">{DEPLOY.commit}</h1>
            <p className="text-body text-fg-muted">
              Deploy {DEPLOY.id} of {DEPLOY.project}, started by{" "}
              <HoverCard>
                <HoverCardTrigger>
                  <a href={DEPLOY.author.href} className={link}>
                    {DEPLOY.author.name}
                  </a>
                </HoverCardTrigger>
                <HoverCardContent>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={DEPLOY.author.name} size="lg" decorative />
                      <div className="grid gap-1">
                        <p className="text-small font-title text-fg">{DEPLOY.author.name}</p>
                        <p className="text-small text-fg-subtle">{DEPLOY.author.role}</p>
                      </div>
                    </div>
                    <p className="text-small text-fg-muted">{DEPLOY.author.note}</p>
                  </div>
                </HoverCardContent>
              </HoverCard>
              .
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" icon={<RetryIcon />} disabled={!done} onClick={() => setRun((r) => r + 1)}>
              Redeploy
            </Button>
            <Button size="sm" variant="primary" iconRight={<ArrowUpRightIcon />} disabled={!done}>
              Visit site
            </Button>
          </div>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-x-8 gap-y-6 border-y border-line py-6 @min-[40rem]:grid-cols-5">
        <div className="grid content-start gap-1">
          <dt className="text-caption text-fg-subtle">Status</dt>
          <dd>
            <Tag status={done ? "success" : "warning"}>{done ? "Ready" : "Building"}</Tag>
          </dd>
        </div>
        {facts.map((f) => (
          <div key={f.label} className="grid content-start gap-1">
            <dt className="text-caption text-fg-subtle">{f.label}</dt>
            <dd className={f.mono ? "truncate font-mono text-small font-normal text-fg" : "text-small text-fg"}>{f.value}</dd>
          </div>
        ))}
      </dl>

      <Progress
        label={done ? "Built" : "Building"}
        value={lines.length}
        max={SCRIPT.length}
        valueText={`${lines.length} of ${SCRIPT.length} steps`}
        status={done ? "done" : "active"}
        message={done ? `${DEPLOY.domain} is live.` : "Started a moment ago."}
      />

      {compact ? (
        <section aria-label="Build" className="grid gap-4">
          <Segmented
            legend="Show"
            size="sm"
            block
            value={pane === "diff" ? "files" : pane}
            onValueChange={(v) => setPane(v)}
            options={[
              { value: "log", label: "Build log" },
              { value: "files", label: "Changed files" },
            ]}
          />
          {pane === "log" ? <div className="h-96">{log}</div> : (
            <div className="grid gap-4">
              {tree}
              {file && diff}
            </div>
          )}
        </section>
      ) : (
        <section aria-label="Build" className="litt-raised h-112 overflow-hidden rounded-surface">
          <ResizablePanelGroup direction="horizontal" autoSaveId="litt-deployment" className="h-full">
            <ResizablePanel defaultSize={28} minSize={20} maxSize={45} className="p-2">
              <Tree label="Changed files" items={FILES} on="surface-1" defaultExpanded={["src", "src/app"]} selected={file} onSelect={open} />
            </ResizablePanel>
            <ResizableHandle label="Resize the changed files" />
            <ResizablePanel minSize={40} className="grid grid-rows-[auto_minmax(0,1fr)] gap-3 p-3">
              <Segmented
                legend="Show"
                size="sm"
                value={pane === "files" ? "log" : pane}
                onValueChange={(v) => setPane(v)}
                options={[
                  { value: "log", label: "Build log" },
                  { value: "diff", label: file ? file.split("/").pop()! : "Diff", disabled: !file },
                ]}
              />
              <div className="min-h-0 overflow-auto">{pane === "diff" && file ? diff : log}</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </section>
      )}
    </div>
  );
}
