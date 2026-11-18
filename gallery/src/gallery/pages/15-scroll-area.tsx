import { useLayoutEffect, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { ProjectCover, type CoverName } from "@/components/list-cover";
import { ScrollArea } from "@/components/scroll-area";
import { Tag } from "@/components/tag";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "scroll-area",
  title: "Scroll area",
  lede: "A box that scrolls inside the page.",
  order: 7.07,
  group: "Layout",
  verbs: ["drag"],
  summary:
    "A region that scrolls inside the page, never the page itself. The scrolling is the browser's own; only the thumb is litt's, shown while it scrolls or a mouse is over it, and a hairline marks each edge that has more beyond it. Both fade on the instant tier.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["scroll-area"],
  exports: ["ScrollArea"],
  usage: `import { ScrollArea } from "@/components/scroll-area";

// A height and a label. While it scrolls, the region is a Tab stop named "Build log".
<ScrollArea label="Build log" className="h-64">
  <ol className="pr-3 font-mono text-caption font-normal">…</ol>
</ScrollArea>

// Sideways: the content keeps its own width. Leave room under it for the thumb.
<ScrollArea label="Recent work" orientation="horizontal">
  <ul className="flex gap-4 pb-4">…</ul>
</ScrollArea>

// Start a log at its newest line with viewportRef, the element that scrolls.
const viewport = useRef<HTMLDivElement>(null);
useLayoutEffect(() => {
  const el = viewport.current;
  if (el) el.scrollTop = el.scrollHeight;
}, []);
<ScrollArea label="Deploy log" className="h-64" viewportRef={viewport}>…</ScrollArea>`,
  use: [
    "A list or a log that would make the page too long, in a box of fixed height: a deploy log, a feed in a card.",
    "A side panel whose list scrolls on its own while the page stays still, such as a long client list.",
    "A strip of covers or chips that runs past the width of its column.",
  ],
  skip: [
    "The page itself. Let the page scroll as a page, so the browser's own scrolling, find and anchors keep working.",
    "A short list that nearly fits. A box that scrolls for three more rows hides them for nothing, so let it grow.",
    "Text people read from start to finish, such as terms. Put it on the page, or on a page of its own.",
    "The list in a Menu, Select or the command menu. Those scroll their own lists.",
  ],
  keyboard: [
    [["Tab"], "Moves to the region while it scrolls, then into anything focusable inside it. A box that does not scroll is not a stop."],
    [["ArrowDown", "ArrowUp"], "Scroll the focused region a little at a time."],
    [["ArrowLeft", "ArrowRight"], "Scroll it sideways, when it scrolls that way."],
    [["PageDown", "PageUp", "Space"], "Scroll it by about a box's height."],
    [["Home", "End"], "Go to the start or the end."],
  ],
  a11y: [
    "The scrolling is the browser's own, so the wheel, touch, momentum, the keyboard and assistive tech work as they do on the page.",
    "While it scrolls, the viewport is a region named by label and a Tab stop. Keyboard focus draws a 2px focus ring inside its edges, so nothing around it can cut the ring off.",
    "The thumb and the hairlines are hidden from screen readers, because they only mirror the scroll position.",
    "The thumb is only there while scrolling or under a mouse, so it never says on its own that there is more. The hairline on an edge does, and so does content that is visibly cut off at the edge.",
    "On touch screens the thumb shows only while the content moves, because there is no hover. It is 10px wide, too small for a finger, so on touch the content itself is what you drag.",
    "Under reduced motion the thumb and the hairlines appear and go at once.",
    "Give the box a height or a max height. Without one it grows with its content and never scrolls.",
  ],
};

/* ---------- (a) A deploy log in a fixed-height card ---------- */

const LOG: [at: string, line: string][] = [
  ["00:00.2", "Cloning github.com/litt-studio/marlow-labs, branch main"],
  ["00:01.9", "Cloned in 1.7s"],
  ["00:02.0", "Restoring the build cache from the last deploy"],
  ["00:02.6", "Restored 182 MB"],
  ["00:02.7", "Running npm ci"],
  ["00:14.3", "Added 412 packages in 11.6s"],
  ["00:14.4", "Running npm run build"],
  ["00:16.2", "Building for production"],
  ["00:19.8", "Transformed 1,284 modules"],
  ["00:24.1", "Rendering chunks"],
  ["00:24.9", "dist/index.html 2.31 kB"],
  ["00:24.9", "dist/assets/index.css 38.20 kB"],
  ["00:24.9", "dist/assets/index.js 212.66 kB"],
  ["00:25.0", "Built in 8.8s"],
  ["00:25.3", "Optimizing 46 images"],
  ["00:29.7", "Saved 3.1 MB across 46 images"],
  ["00:29.8", "Uploading the build output"],
  ["00:33.4", "Uploaded 61 files"],
  ["00:33.5", "Assigning marlowlabs.com"],
  ["00:34.1", "Assigning www.marlowlabs.com"],
  ["00:34.6", "Purging the cache for 2 domains"],
  ["00:35.2", "Live on marlowlabs.com"],
];

function DeployLogDemo() {
  const viewport = useRef<HTMLDivElement>(null);
  /* A log starts at its newest line. */
  useLayoutEffect(() => {
    const el = viewport.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  return (
    <section aria-labelledby="deploy-log-title" className="litt-raised w-full max-w-xl overflow-hidden rounded-surface">
      <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
        <div className="grid min-w-0 gap-0.5">
          <h3 id="deploy-log-title" className="truncate text-small text-fg">
            marlowlabs.com, production
          </h3>
          <p className="text-caption text-fg-subtle">Deployed by Nick, 35s</p>
        </div>
        <Tag status="success">Ready</Tag>
      </header>
      <ScrollArea label="Deploy log" className="h-64 rounded-b-surface" viewportRef={viewport}>
        <ol className="grid gap-1 px-4 pt-3 pb-4 font-mono text-caption font-normal">
          {LOG.map(([at, line], i) => (
            <li key={i} className="grid grid-cols-[auto_1fr] gap-x-4 pr-2">
              <span className="text-fg-subtle tabular-nums">{at}</span>
              <span className="min-w-0 break-words text-fg-muted">{line}</span>
            </li>
          ))}
        </ol>
      </ScrollArea>
    </section>
  );
}

/* ---------- (b) A strip of project covers ---------- */

const WORK: { name: string; client: string; cover: CoverName }[] = [
  { name: "Launch page", client: "Marlow Labs", cover: "landing" },
  { name: "Type specimens", client: "Grotta Type", cover: "type" },
  { name: "Newsletter site", client: "Sidebar Weekly", cover: "template" },
  { name: "Identity", client: "Halden Gallery", cover: "identity" },
  { name: "Runway dashboard", client: "Kassa", cover: "dashboard" },
  { name: "Motion study", client: "Litt Studio", cover: "motion" },
  { name: "Site refresh", client: "Atelier Nord", cover: "refresh" },
  { name: "Design system", client: "Northwind", cover: "system" },
];

function CoverStripDemo() {
  return (
    <div className="grid w-full min-w-0 gap-4">
      <h3 className="text-small text-fg">Recent work</h3>
      <ScrollArea label="Recent work" orientation="horizontal">
        <ul className="flex gap-4 pb-4">
          {WORK.map((work) => (
            <li key={work.name} className="w-48 shrink-0">
              <a
                href="#scroll-area"
                className="group/work grid gap-2 rounded-control focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
              >
                <span className="relative block aspect-[8/5] overflow-hidden rounded-control bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)] in-[[data-material=flat]]:shadow-none transition-colors duration-(--dur-instant) ease-litt group-hover/work:bg-surface-3 pointer-coarse:group-active/work:bg-surface-3">
                  <ProjectCover name={work.cover} />
                </span>
                <span className="grid gap-0.5 px-0.5 pb-1">
                  <span className="text-small font-title text-fg">{work.name}</span>
                  <span className="text-caption text-fg-subtle">{work.client}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}

/* ---------- (c) A long client list in a side panel ---------- */

const CLIENTS: { name: string; projects: number; last: string }[] = [
  { name: "Atelier Nord", projects: 3, last: "Site refresh, live" },
  { name: "Atlas Studio", projects: 1, last: "Portfolio, in review" },
  { name: "Brine and Co", projects: 2, last: "Shop, live" },
  { name: "Cormorant Press", projects: 4, last: "Catalogue, draft" },
  { name: "Dovetail", projects: 1, last: "Launch page, live" },
  { name: "Fieldnotes", projects: 2, last: "Journal, live" },
  { name: "Gable Coffee", projects: 1, last: "Menu site, in review" },
  { name: "Grotta Type", projects: 5, last: "Type specimens, draft" },
  { name: "Halden Gallery", projects: 3, last: "Identity, in review" },
  { name: "Harbor Health", projects: 2, last: "Booking flow, live" },
  { name: "Juniper Audio", projects: 1, last: "Product page, live" },
  { name: "Kassa", projects: 2, last: "Runway dashboard, draft" },
  { name: "Kiln", projects: 3, last: "Site and CMS, live" },
  { name: "Lumen Labs", projects: 1, last: "Docs site, in review" },
  { name: "Marlow Labs", projects: 4, last: "Launch page, live" },
  { name: "Moss Architects", projects: 2, last: "Portfolio, live" },
  { name: "Nadir Films", projects: 1, last: "Festival site, draft" },
  { name: "Northwind", projects: 3, last: "Design system, live" },
  { name: "Orbit Cycling", projects: 1, last: "Shop, in review" },
  { name: "Pine Records", projects: 2, last: "Release pages, live" },
  { name: "Sidebar Weekly", projects: 3, last: "Newsletter site, draft" },
  { name: "Solace Yoga", projects: 1, last: "Timetable, live" },
];

function ClientPanelDemo() {
  const [picked, setPicked] = useState("Cormorant Press");
  const client = CLIENTS.find((c) => c.name === picked) ?? CLIENTS[0];

  return (
    <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-[16rem_1fr]">
      <aside aria-labelledby="clients-title" className="litt-raised grid content-start overflow-hidden rounded-surface">
        <div className="flex items-baseline justify-between px-4 pt-4 pb-3">
          <h3 id="clients-title" className="text-small text-fg">
            Clients
          </h3>
          <span className="text-caption font-normal text-fg-subtle tabular-nums">{CLIENTS.length}</span>
        </div>
        {/* A height that cuts the eighth row in half, so the list looks like it goes on. */}
        <ScrollArea label="Clients" className="h-84">
          <ul className="grid p-1 pr-3">
            {CLIENTS.map((c) => {
              const current = c.name === picked;
              return (
                <li key={c.name}>
                  <button
                    type="button"
                    aria-current={current || undefined}
                    onClick={() => setPicked(c.name)}
                    className={
                      "flex h-control-md w-full cursor-pointer items-center gap-3 rounded-control px-3 text-left text-small " +
                      "[-webkit-tap-highlight-color:transparent] transition-colors duration-(--dur-instant) ease-litt " +
                      "hover:bg-[color-mix(in_oklab,var(--fg)_4%,transparent)] pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] " +
                      "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
                      (current ? "bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] text-fg" : "text-fg-muted hover:text-fg")
                    }
                  >
                    <Avatar name={c.name} size="sm" decorative />
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
        <p className="px-4 py-3 text-caption font-normal text-fg-subtle">Archived clients are hidden.</p>
      </aside>
      <div className="grid content-start gap-2 p-4">
        <p className="text-h4 text-fg">{client.name}</p>
        <p className="text-small text-fg-muted">
          {client.projects} {client.projects === 1 ? "project" : "projects"}. Latest: {client.last}.
        </p>
      </div>
    </div>
  );
}

/* ---------- Device's own (plans/024, phase 3): a card's backup log, the day's takes, the crew ---------- */

const BACKUP_LOG: [at: string, line: string][] = [
  ["00:00.2", "Card A found, 128 GB, formatted 14 Nov"],
  ["00:00.9", "Reading the sound report"],
  ["00:01.1", "214 takes in 6 scenes"],
  ["00:01.2", "Checking space in the library"],
  ["00:01.4", "1.2 TB free"],
  ["00:01.5", "Copying Scene 12, 8 takes"],
  ["00:06.8", "Copied take_01.wav to take_08.wav, 1.1 GB"],
  ["00:06.9", "Copying Scene 13, 11 takes"],
  ["00:12.4", "Copied 11 takes, 1.6 GB"],
  ["00:12.5", "Copying Room tone, 4 takes"],
  ["00:13.8", "Copied 4 takes, 412 MB"],
  ["00:13.9", "Copying Field, 2 takes"],
  ["00:20.1", "Copied dawn_chorus.wav, 2.3 GB at 96 kHz"],
  ["00:20.2", "Copying the safety tracks, 189 takes"],
  ["00:29.9", "Copied 189 safety tracks, 9.4 GB"],
  ["00:30.0", "Verifying checksums for 214 takes"],
  ["00:33.8", "214 of 214 match"],
  ["00:33.9", "Naming takes by scene and timecode"],
  ["00:34.3", "Writing the sound report to the library"],
  ["00:34.6", "Card A marked as backed up"],
  ["00:34.9", "Mirror on Card B matches Card A"],
  ["00:35.2", "Safe to format Card A"],
];

function BackupLogDemo() {
  const viewport = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = viewport.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  return (
    <section aria-labelledby="backup-log-title" className="litt-raised w-full max-w-xl overflow-hidden rounded-surface">
      <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
        <div className="grid min-w-0 gap-0.5">
          <h3 id="backup-log-title" className="truncate text-small text-fg">
            Card A, to the library
          </h3>
          <p className="text-caption text-fg-subtle">Started by Nick, 35 s</p>
        </div>
        <Tag status="success">Backed up</Tag>
      </header>
      <ScrollArea label="Backup log" className="h-64 rounded-b-surface" viewportRef={viewport}>
        <ol className="grid gap-1 px-4 pt-3 pb-4 font-mono text-caption font-normal">
          {BACKUP_LOG.map(([at, line], i) => (
            <li key={i} className="grid grid-cols-[auto_1fr] gap-x-4 pr-2">
              <span className="text-fg-subtle tabular-nums">{at}</span>
              <span className="min-w-0 break-words text-fg-muted">{line}</span>
            </li>
          ))}
        </ol>
      </ScrollArea>
    </section>
  );
}

/** A take's waveform as its cover, in the ink: the same bars for the same seed, so a screenshot never changes. */
function Waveform({ seed }: { seed: number }) {
  const bars = Array.from({ length: 48 }, (_, i) => {
    const h = 12 + 70 * Math.abs(Math.sin((i + 1) * seed) * Math.cos(i / (3 + seed)));
    return { x: 16 + i * 6, h };
  });
  return (
    <svg viewBox="0 0 320 200" className="absolute inset-0 size-full" aria-hidden="true" focusable="false">
      <line x1="16" y1="100" x2="304" y2="100" className="stroke-line" vectorEffect="non-scaling-stroke" />
      {bars.map((b) => (
        <rect key={b.x} x={b.x} y={100 - b.h} width="3" height={b.h * 2} className="fill-fg-subtle" />
      ))}
    </svg>
  );
}

const STRIP_TAKES: { name: string; scene: string; seed: number }[] = [
  { name: "take_04.wav", scene: "Scene 12 · 00M 14S", seed: 1.7 },
  { name: "take_05.wav", scene: "Scene 12 · 00M 22S", seed: 2.3 },
  { name: "take_06.wav", scene: "Scene 12 · 00M 19S", seed: 2.9 },
  { name: "take_01.wav", scene: "Scene 13 · 00M 41S", seed: 1.1 },
  { name: "take_02.wav", scene: "Scene 13 · 00M 37S", seed: 2.6 },
  { name: "room_tone_01.wav", scene: "Room tone · 01M 00S", seed: 0.9 },
  { name: "dawn_chorus.wav", scene: "Field · 12M 40S", seed: 3.1 },
  { name: "Mix · take_04", scene: "Mix · −14 LUFS", seed: 1.3 },
];

function TakeStripDemo() {
  return (
    <div className="grid w-full min-w-0 gap-4">
      <h3 className="text-small text-fg">Today's takes</h3>
      <ScrollArea label="Today's takes" orientation="horizontal">
        <ul className="flex gap-4 pb-4">
          {STRIP_TAKES.map((take) => (
            <li key={take.name} className="w-48 shrink-0">
              <a
                href="#scroll-area"
                className="group/work grid gap-2 rounded-control focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
              >
                <span className="relative block aspect-[8/5] overflow-hidden rounded-control bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)] in-[[data-material=flat]]:shadow-none transition-colors duration-(--dur-instant) ease-litt group-hover/work:bg-surface-3 pointer-coarse:group-active/work:bg-surface-3">
                  <Waveform seed={take.seed} />
                </span>
                <span className="grid gap-0.5 px-0.5 pb-1">
                  <span className="text-small font-title text-fg">{take.name}</span>
                  <span className="text-caption tabular-nums text-fg-subtle">{take.scene}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}

const CREW: { name: string; scenes: number; last: string }[] = [
  { name: "Ava Okafor", scenes: 6, last: "boom on Scene 12" },
  { name: "Bruno Lage", scenes: 2, last: "second boom on Scene 9" },
  { name: "Carla Mendes", scenes: 4, last: "playback on Scene 11" },
  { name: "Dara Quinn", scenes: 1, last: "room tone in the kitchen" },
  { name: "Eli Brandt", scenes: 3, last: "lavaliers on Scene 12" },
  { name: "Femi Adeyemi", scenes: 2, last: "timecode on Scene 10" },
  { name: "Greta Lund", scenes: 5, last: "boom on Scene 13" },
  { name: "Hana Ito", scenes: 3, last: "the dawn chorus" },
  { name: "Ines Duarte", scenes: 8, last: "the mix of take_04" },
  { name: "Jonas Weber", scenes: 1, last: "foley for Scene 8" },
  { name: "Kofi Mensah", scenes: 2, last: "lavaliers on Scene 7" },
  { name: "Lena Voss", scenes: 4, last: "the sound report for Card A" },
  { name: "Mara Silva", scenes: 2, last: "wild lines on Scene 12" },
  { name: "Nick", scenes: 9, last: "the backup of Card A" },
  { name: "Omar Haddad", scenes: 1, last: "playback on Scene 6" },
  { name: "Priya Nair", scenes: 3, last: "boom on Scene 11" },
  { name: "Quentin Roux", scenes: 2, last: "room tone on the stairs" },
  { name: "Rui Matos", scenes: 5, last: "the stems of take_04" },
  { name: "Sofia Brandt", scenes: 1, last: "timecode on Scene 13" },
  { name: "Tomas Berg", scenes: 6, last: "the keepers of Scene 12" },
  { name: "Una Park", scenes: 2, last: "foley for Scene 9" },
  { name: "Viktor Ek", scenes: 1, last: "a wind test in the field" },
];

function CrewPanelDemo() {
  const [picked, setPicked] = useState("Carla Mendes");
  const person = CREW.find((c) => c.name === picked) ?? CREW[0];

  return (
    <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-[16rem_1fr]">
      <aside aria-labelledby="crew-title" className="litt-raised grid content-start overflow-hidden rounded-surface">
        <div className="flex items-baseline justify-between px-4 pt-4 pb-3">
          <h3 id="crew-title" className="text-small text-fg">
            Crew
          </h3>
          <span className="text-caption font-normal text-fg-subtle tabular-nums">{CREW.length}</span>
        </div>
        <ScrollArea label="Crew" className="h-84">
          <ul className="grid p-1 pr-3">
            {CREW.map((c) => {
              const current = c.name === picked;
              return (
                <li key={c.name}>
                  <button
                    type="button"
                    aria-current={current || undefined}
                    onClick={() => setPicked(c.name)}
                    className={
                      "flex h-control-md w-full cursor-pointer items-center gap-3 rounded-control px-3 text-left text-small " +
                      "[-webkit-tap-highlight-color:transparent] transition-colors duration-(--dur-instant) ease-litt " +
                      "hover:bg-[color-mix(in_oklab,var(--fg)_4%,transparent)] pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] " +
                      "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
                      (current ? "bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] text-fg" : "text-fg-muted hover:text-fg")
                    }
                  >
                    <Avatar name={c.name} size="sm" decorative />
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
        <p className="px-4 py-3 text-caption font-normal text-fg-subtle">Wrapped crew are hidden.</p>
      </aside>
      <div className="grid content-start gap-2 p-4">
        <p className="text-h4 text-fg">{person.name}</p>
        <p className="text-small text-fg-muted">
          {person.scenes} {person.scenes === 1 ? "scene" : "scenes"}. Latest: {person.last}.
        </p>
      </div>
    </div>
  );
}

export default function ScrollAreaPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="A deploy log"
        tier="instant"
        size="lg"
        code="DeployLogDemo"
        byWorld={{ device: { demo: <BackupLogDemo />, title: "A backup log", code: "BackupLogDemo" } }}
        caption="The log starts at its newest line, so its top edge has a hairline: there is more above. Scroll it and the thumb fades in on the instant tier, then out after a short pause. Reach the top and that hairline goes, and one shows at the bottom. Nothing shows or fades before you reach for it."
      >
        <DeployLogDemo />
      </Stage>

      <Stage
        title="A strip of covers"
        tier="instant"
        code="CoverStripDemo"
        byWorld={{ device: { demo: <TakeStripDemo />, title: "A strip of takes", code: "TakeStripDemo" } }}
        caption="A strip scrolls sideways. The left and right edges take the hairline while there is more past them, and the thumb runs along the bottom, over room the strip leaves for it. Tab to a cover past the edge and the browser scrolls it into view."
      >
        <CoverStripDemo />
      </Stage>

      <Stage
        title="A side panel"
        tier="instant"
        size="lg"
        code="ClientPanelDemo"
        byWorld={{
          device: {
            demo: <CrewPanelDemo />,
            code: "CrewPanelDemo",
            caption:
              "The crew list scrolls on its own and the page stays still. Tab reaches the list as one stop, and the arrow keys scroll it, with the focus ring drawn inside its edges. On a touch screen the thumb shows only while the list moves, because there is no hover.",
          },
        }}
        caption="The client list scrolls on its own and the page stays still. Tab reaches the list as one stop, and the arrow keys scroll it, with the focus ring drawn inside its edges. On a touch screen the thumb shows only while the list moves, because there is no hover."
      >
        <ClientPanelDemo />
      </Stage>
    </Page>
  );
}
