import { useEffect, useState } from "react";
import { LogView, type LogLine } from "@/components/log-view";
import { Page, Stage, useReplay, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "log-view",
  title: "Log view",
  lede: "A run's output, as it arrives.",
  order: 17.85,
  group: "Data",
  verbs: ["watch"],
  summary:
    "The lines a build or a deploy writes as it runs, on the code block's quiet surface: numbered, timed, with warnings and errors marked in their status color and in words. It follows the newest line while you are at the bottom; scroll up to read and it stays put, with a button that says how many lines came since. Nothing moves on its own.",
  tiers: [],
};

export const docs: PageDocs = {
  components: ["log-view"],
  exports: ["LogView"],
  usage: `import { LogView, type LogLine } from "@/components/log-view";

const [lines, setLines] = useState<LogLine[]>([]);
// Append as the run writes: setLines((all) => [...all, { time: "12:04:31", text: "Compiled successfully" }]).

<LogView label="Build log" lines={lines} height="24rem" />

// Warnings and errors take their color, an alert mark and a hidden word.
<LogView label="Deploy log" wrap lines={[
  { time: "+12.1s", level: "warn", text: "Image is 2.4 MB; it will be served as is." },
  { time: "+31.0s", level: "error", text: "Module not found: Can't resolve '@fontsource/inter/400.css'" },
]} />`,
  use: [
    "Output a person watches or reads after the fact: a build, a deploy, a job, a migration.",
    "Lines that keep arriving, where staying on the newest one matters until someone scrolls back to read.",
  ],
  skip: [
    "Source code or a diff. That is a CodeBlock.",
    "Events people filter and act on, with who and when. That is the Activity block's list, or a Table.",
    "A run's steps and their times at a glance. That is a Timeline, which can sit above the log.",
  ],
  keyboard: [
    [["Tab"], "Moves to the lines, then to Jump to latest when it shows."],
    [["ArrowDown", "ArrowUp", "PageDown", "PageUp"], "Scroll the lines."],
    [["End"], "Scroll to the newest line, and follow again."],
  ],
  a11y: [
    "The lines are a region named by the label and a Tab stop, so a keyboard can scroll them.",
    "A warning or an error starts with a hidden \"Warning:\" or \"Error:\", and has an alert mark: color is never the only signal.",
    "Line numbers are hidden from screen readers and are not copied or selected.",
    "New lines are not read out one by one. Say how the run ended in a status of your own, such as a Progress or a Toast.",
    "Under reduced motion the jump back to the newest line is instant.",
  ],
};

const BUILD: LogLine[] = [
  { id: "clone", text: "Cloning github.com/halo-studio/site (branch main, commit 8f2ka1c)" },
  { id: "clone-done", text: "Cloning completed: 412ms", level: "debug" },
  { id: "cache", text: "Restored build cache from the last deploy" },
  { id: "install", text: "Running \"npm ci\"" },
  { id: "installed", text: "added 418 packages in 6s", level: "debug" },
  { id: "build", text: "Running \"npm run build\"" },
  { id: "next", text: "▲ Next.js 16.3.6" },
  { id: "optimize", text: "Creating an optimized production build ..." },
  { id: "og-image", text: "Image /public/og.png is 2.4 MB; it will be served as is.", level: "warn" },
  { id: "compiled", text: "✓ Compiled successfully in 14.2s" },
  { id: "types", text: "Linting and checking validity of types ..." },
  { id: "page-data", text: "Collecting page data ..." },
  { id: "static-0", text: "Generating static pages (0/12) ..." },
  { id: "static-6", text: "Generating static pages (6/12) ..." },
  { id: "static-12", text: "Generating static pages (12/12)" },
  { id: "finalize", text: "Finalizing page optimization ..." },
  { id: "routes", text: "Route (app)                Size     First Load JS" },
  { id: "route-home", text: "┌ ○ /                       4.1 kB   102 kB" },
  { id: "route-work", text: "├ ○ /work                   2.8 kB   101 kB" },
  { id: "route-slug", text: "└ ● /work/[slug]            3.6 kB   102 kB" },
  { id: "upload", text: "Uploading build output: 38 files, 2.1 MB" },
  { id: "domains", text: "Assigning domains: halo.studio, www.halo.studio" },
  { id: "live", text: "Build completed in 31s. halo.studio is live.", level: "success" },
];

const clock = (s: number) => `12:04:${String(Math.floor(s) % 60).padStart(2, "0")}`;

/** A pretend build: the lines arrive unevenly, as a real one writes them. */
function BuildDemo() {
  const [lines, setLines] = useState<LogLine[]>([]);
  useEffect(() => {
    let i = 0;
    let at = 3;
    let timer = 0;
    const next = () => {
      const line = BUILD[i];
      if (!line) return;
      at += 0.4 + (i % 4) * 0.6;
      /* Made before the update: React may run the updater later, after i and at have moved on. */
      const written = { ...line, time: clock(at) };
      setLines((all) => [...all, written]);
      i++;
      timer = window.setTimeout(next, 180 + (i % 3) * 140);
    };
    timer = window.setTimeout(next, 400);
    return () => window.clearTimeout(timer);
  }, []);
  return <LogView label="Build log" lines={lines} height="16rem" className="w-full max-w-3xl" />;
}

const FAILED: LogLine[] = [
  { time: "+0.0s", text: "Running \"npm run build\"" },
  { time: "+1.2s", text: "▲ Next.js 16.3.6" },
  { time: "+12.1s", level: "warn", text: "Image /public/og.png is 2.4 MB; it will be served as is. Smaller images load faster on a phone." },
  { time: "+31.0s", level: "error", text: "Module not found: Can't resolve '@fontsource/inter/400.css' in '/vercel/path0/src/app'" },
  { time: "+31.0s", level: "error", text: "Import trace: ./src/app/layout.tsx" },
  { time: "+31.1s", level: "error", text: "Build failed because of webpack errors. Fix the import in src/app/layout.tsx, then deploy again." },
];

function FailedDemo() {
  return <LogView label="Deploy log" lines={FAILED} wrap lineNumbers={false} height="auto" className="w-full max-w-3xl" />;
}

export default function LogViewPage() {
  const [run, replay] = useReplay();
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="A build as it runs"
        align="start"
        code="BuildDemo"
        onReplay={replay}
        caption="The lines arrive unevenly, as a real build writes them, and the view follows the newest. Scroll up while it runs: it stays where you are, and a button says how many lines came since; press it to go back to the newest and follow again. The warning is in the warning color, with an alert mark and a hidden word, and the last line says the build is live in its own words."
      >
        <BuildDemo key={run} />
      </Stage>

      <Stage
        title="A failed deploy, wrapped"
        align="start"
        code="FailedDemo"
        caption="Long lines wrap instead of scrolling sideways, and the line numbers are off. Errors are in the danger color and start with a hidden “Error:”, so a screen reader hears what color says. The view is as tall as its lines, so nothing scrolls."
      >
        <FailedDemo />
      </Stage>
    </Page>
  );
}
