import { useState, type ReactNode } from "react";
import { AppShell, SidebarLink, SidebarNav } from "@/components/app-shell";
import { Card, CardBody, CardDescription, CardTitle } from "@/components/card";
import { FolderIcon, SettingsIcon, UserIcon } from "@/components/icons";
import { DatabaseIcon, FileIcon } from "@/components/icons";
import { DeviceProvider } from "@/motion";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "app-shell",
  title: "App shell",
  lede: "The frame around an app's pages.",
  order: 6.04, group: "Navigation",
  verbs: ["open"],
  summary:
    "The frame around an app's pages: a 240px sidebar that runs the full height of the page, with its links kept in view as the page scrolls. On a phone the sidebar goes, a glass top bar holds a menu button, and the nav opens in the same bottom sheet as Dialog and Popover.",
  tiers: ["instant", "expressive"],
};

export const docs: PageDocs = {
  components: ["app-shell"],
  exports: ["AppShell", "SidebarNav", "SidebarLink"],
  usage: `import { AppShell, SidebarLink, SidebarNav } from "@/components/app-shell";

// The shell takes the wordmark, the nav and the page. The nav is the sidebar on a desktop
// and the bottom sheet on a phone, so write it once.
<AppShell
  wordmark={<a href="/">litt.design</a>}
  nav={
    <SidebarNav label="Main">
      <SidebarLink href="/" current>Overview</SidebarLink>
      <SidebarLink href="/projects">Projects</SidebarLink>
      <SidebarLink href="/clients">Clients</SidebarLink>
      <SidebarLink href="/settings">Settings</SidebarLink>
    </SidebarNav>
  }
>
  <h1 className="text-h3 text-fg">Overview</h1>
  {/* the page */}
</AppShell>

// With a router, draw each link yourself. It receives the same props as an anchor.
<SidebarLink as={Link} href="/projects" current={pathname === "/projects"}>Projects</SidebarLink>

// In a scrolling frame instead of a page, say how tall the window is so the sidebar can stick.
<AppShell viewportHeight="34rem" … />`,
  use: [
    "An app has a handful of top-level pages that people move between all day: overview, projects, clients, settings. A sidebar keeps them one click away.",
    "The pages are long. The sidebar column fills the page, and its links stay in view while the page scrolls.",
    "It must work on a phone. The same nav becomes a bottom sheet behind one menu button, with no second copy to keep in step.",
    "You want one landmark for the nav and one for the page, with the current page marked for assistive tech.",
  ],
  skip: [
    "A marketing site with a handful of links. Use the Header, which sits across the top of the page.",
    "A page with its own tabs. Use Tabs inside the page, below the shell.",
    "More than about eight top-level links, or links nested several deep. A sidebar this plain does not collapse or nest; use the Command menu to jump anywhere.",
    "An app that needs a fixed-height shell with its own scrolling panes. This shell lets the page scroll as one document, so a full-page screenshot and the browser's own find work.",
  ],
  keyboard: [
    [["Tab"], "Moves through the links in the sidebar, then into the page. On a phone it reaches the menu button first."],
    [["Enter", "Space"], "On a phone, the menu button opens the sheet. A link follows its href, and picking one closes the sheet."],
    [["Esc"], "Closes the sheet. Focus returns to the menu button."],
  ],
  a11y: [
    "The sidebar holds a nav landmark per SidebarNav, each with its own name, and the page is a main landmark. The current link has aria-current=\"page\" and a fill, so it does not rely on color.",
    "On a phone the menu button is named \"Open navigation\", and Radix sets aria-expanded and aria-controls on it. The sheet is a modal dialog with the heading \"Navigation\": focus is trapped in it, Esc and a tap on the scrim close it, and focus returns to the button.",
    "The close button and the menu button are 44px on a touch screen, and so are the rows in the sheet. Rows in the sidebar are 36px, or 44px on a coarse pointer.",
    "Dragging the sheet down closes it, and the close button does the same, so the gesture is never the only way.",
    "Inside the main area, lay a page out with a one-column grid (grid grid-cols-1), not a bare grid. A wide table or chart would otherwise stretch the grid's track past the screen. The table and the chart both measure their container, so they then fit.",
    "The wordmark shows in the sidebar and in the top bar, but only one is ever visible, so a screen reader reads it once. Do not give it an id.",
    "The sidebar's links and the top bar's button have a visible focus ring. Nothing moves except the sheet, which rises on the expressive spring and, under reduced motion, appears in place.",
  ],
};

const PAGES = ["Overview", "Projects", "Clients", "Settings"] as const;
type PageName = (typeof PAGES)[number];

const PROJECTS = [
  ["Halo site", "Framer site for Halo Studio. Deployed 2 minutes ago."],
  ["Northwind rebrand", "Identity and the marketing site. Building now."],
  ["Atlas portfolio", "A portfolio on the Atlas template. Deployed an hour ago."],
  ["Lumen docs", "Docs for the Lumen product. The last deploy failed."],
  ["Kassa pitch deck", "A deck and its landing page. Deployed yesterday."],
  ["Case study template", "The template behind the studio's case studies."],
];

/* `title` is the page title's level: h1 in a page of its own, h3 inside a tile, where the tile's name is the h2. The
   card titles sit one level under it. */
function DemoPage({ page, title: Title = "h1" }: { page: PageName; title?: "h1" | "h3" }) {
  return (
    <div className="grid gap-6">
      <Title className="text-h3 text-fg">{page}</Title>
      <ul className="grid gap-4">
        {PROJECTS.map(([name, text]) => (
          <li key={name}>
            <Card as="div">
              <CardBody>
                <CardTitle as={Title === "h1" ? "h2" : "h4"}>{name}</CardTitle>
                <CardDescription>{text}</CardDescription>
              </CardBody>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A scrolling frame that stands in for the browser window, so the sidebar has something to stick against. */
function Frame({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={
        "relative h-136 w-full overflow-y-auto overscroll-contain rounded-surface bg-canvas outline-1 -outline-offset-1 outline-line in-[[data-material=flat]]:outline-0 " +
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
        className
      }
    >
      {children}
    </div>
  );
}

const ICONS: Record<PageName, ReactNode | undefined> = {
  Overview: undefined,
  Projects: <FolderIcon />,
  Clients: <UserIcon />,
  Settings: <SettingsIcon />,
};

function StudioNav({ page, onPage, icons = false }: { page: PageName; onPage: (p: PageName) => void; icons?: boolean }) {
  return (
    <SidebarNav label="Main">
      {PAGES.map((p) => (
        <SidebarLink
          key={p}
          href={`#${p.toLowerCase()}`}
          current={p === page}
          icon={icons ? ICONS[p] : undefined}
          onClick={(e) => {
            e.preventDefault(); // this is a demo: do not move the gallery's own hash
            onPage(p);
          }}
        >
          {p}
        </SidebarLink>
      ))}
    </SidebarNav>
  );
}

function ShellDemo() {
  const [page, setPage] = useState<PageName>("Overview");
  return (
    <Frame label="Studio dashboard, desktop" className="[--gutter:var(--space-8)]">
      <AppShell
        viewportHeight="34rem"
        wordmark={<a href="#overview" onClick={(e) => { e.preventDefault(); setPage("Overview"); }}>litt.design</a>}
        nav={<StudioNav page={page} onPage={setPage} />}
        footer={<p className="px-3 py-2 text-caption text-fg-subtle">Nick, Litt Studio</p>}
      >
        <DemoPage page={page} />
      </AppShell>
    </Frame>
  );
}

function PhoneDemo() {
  const [page, setPage] = useState<PageName>("Overview");
  return (
    <div className="mx-auto w-full max-w-sm">
      <Frame label="Studio dashboard, phone" className="[--gutter:var(--space-4)]">
        <DeviceProvider mode="phone">
          <AppShell
            viewportHeight="34rem"
            wordmark={<a href="#overview" onClick={(e) => { e.preventDefault(); setPage("Overview"); }}>litt.design</a>}
            nav={<StudioNav page={page} onPage={setPage} />}
          >
            <DemoPage page={page} />
          </AppShell>
        </DeviceProvider>
      </Frame>
    </div>
  );
}

function IconsDemo() {
  const [page, setPage] = useState<PageName>("Projects");
  return (
    <Frame label="Studio dashboard, with icons" className="[--gutter:var(--space-8)] h-96">
      <AppShell
        viewportHeight="24rem"
        wordmark={<a href="#overview">litt.design</a>}
        nav={<StudioNav page={page} onPage={setPage} icons />}
      >
        <DemoPage page={page} />
      </AppShell>
    </Frame>
  );
}

/* ---------- the overview's tile ---------- */

/** The desktop shell, with its page area a div: the gallery's page already has its main landmark, and keeps the one. */
function ShellTile() {
  const [page, setPage] = useState<PageName>("Overview");
  return (
    <Frame label="Studio dashboard, desktop" className="[--gutter:var(--space-8)]">
      <AppShell
        viewportHeight="34rem"
        mainLandmark={false}
        wordmark={<a href="#overview" onClick={(e) => { e.preventDefault(); setPage("Overview"); }}>litt.design</a>}
        nav={<StudioNav page={page} onPage={setPage} />}
        footer={<p className="px-3 py-2 text-caption text-fg-subtle">Nick, Litt Studio</p>}
      >
        <DemoPage page={page} title="h3" />
      </AppShell>
    </Frame>
  );
}

/* ---------- Device's own (plans/024, phase 3): the recorder's library, its takes and its cards ---------- */

const LIBRARY_PAGES = ["Overview", "Takes", "Cards", "Settings"] as const;
type LibraryPage = (typeof LIBRARY_PAGES)[number];

const TAKES = [
  ["take_04.wav", "Scene 12 · 48 kHz · 24 bit · 02M 14S 06F. Circled."],
  ["take_03.wav", "Scene 12 · 48 kHz · 24 bit · 01M 58S 20F. A car passes at 01M 12S."],
  ["take_02.wav", "Scene 12 · 48 kHz · 24 bit · 02M 03S 11F. Offloading now."],
  ["take_01.wav", "Scene 12 · 48 kHz · 24 bit · 00M 42S 11F. Clips at −0.1 dBFS."],
  ["Room tone · Scene 12", "Boom and Room L · 01M 00S 00F. Recorded after the last take."],
  ["Wild lines · Ana", "Lav 1 · 6 takes · 03M 40S 02F. Recorded yesterday."],
];

function LibraryDemoPage({ page, title: Title = "h1" }: { page: LibraryPage; title?: "h1" | "h3" }) {
  return (
    <div className="grid gap-6">
      <Title className="text-h3 text-fg">{page}</Title>
      <ul className="grid gap-4">
        {TAKES.map(([name, text]) => (
          <li key={name}>
            <Card as="div">
              <CardBody>
                <CardTitle as={Title === "h1" ? "h2" : "h4"}>{name}</CardTitle>
                <CardDescription>{text}</CardDescription>
              </CardBody>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

const LIBRARY_ICONS: Record<LibraryPage, ReactNode | undefined> = {
  Overview: undefined,
  Takes: <FileIcon />,
  Cards: <DatabaseIcon />,
  Settings: <SettingsIcon />,
};

function LibraryNav({ page, onPage, icons = false }: { page: LibraryPage; onPage: (p: LibraryPage) => void; icons?: boolean }) {
  return (
    <SidebarNav label="Main">
      {LIBRARY_PAGES.map((p) => (
        <SidebarLink
          key={p}
          href={`#${p.toLowerCase()}`}
          current={p === page}
          icon={icons ? LIBRARY_ICONS[p] : undefined}
          onClick={(e) => {
            e.preventDefault(); // this is a demo: do not move the gallery's own hash
            onPage(p);
          }}
        >
          {p}
        </SidebarLink>
      ))}
    </SidebarNav>
  );
}

function LibraryDemo() {
  const [page, setPage] = useState<LibraryPage>("Overview");
  return (
    <Frame label="Recorder library, desktop" className="[--gutter:var(--space-8)]">
      <AppShell
        viewportHeight="34rem"
        wordmark={<a href="#overview" onClick={(e) => { e.preventDefault(); setPage("Overview"); }}>Library</a>}
        nav={<LibraryNav page={page} onPage={setPage} />}
        footer={<p className="px-3 py-2 text-caption text-fg-subtle">Recorder 2 · Card A</p>}
      >
        <LibraryDemoPage page={page} />
      </AppShell>
    </Frame>
  );
}

function LibraryPhoneDemo() {
  const [page, setPage] = useState<LibraryPage>("Overview");
  return (
    <div className="mx-auto w-full max-w-sm">
      <Frame label="Recorder library, phone" className="[--gutter:var(--space-4)]">
        <DeviceProvider mode="phone">
          <AppShell
            viewportHeight="34rem"
            wordmark={<a href="#overview" onClick={(e) => { e.preventDefault(); setPage("Overview"); }}>Library</a>}
            nav={<LibraryNav page={page} onPage={setPage} />}
          >
            <LibraryDemoPage page={page} />
          </AppShell>
        </DeviceProvider>
      </Frame>
    </div>
  );
}

function LibraryIconsDemo() {
  const [page, setPage] = useState<LibraryPage>("Takes");
  return (
    <Frame label="Recorder library, with icons" className="[--gutter:var(--space-8)] h-96">
      <AppShell viewportHeight="24rem" wordmark={<a href="#overview">Library</a>} nav={<LibraryNav page={page} onPage={setPage} icons />}>
        <LibraryDemoPage page={page} />
      </AppShell>
    </Frame>
  );
}

/** The desktop shell, with its page area a div: the gallery's page already has its main landmark, and keeps the one. */
function LibraryTile() {
  const [page, setPage] = useState<LibraryPage>("Overview");
  return (
    <Frame label="Recorder library, desktop" className="[--gutter:var(--space-8)]">
      <AppShell
        viewportHeight="34rem"
        mainLandmark={false}
        wordmark={<a href="#overview" onClick={(e) => { e.preventDefault(); setPage("Overview"); }}>Library</a>}
        nav={<LibraryNav page={page} onPage={setPage} />}
        footer={<p className="px-3 py-2 text-caption text-fg-subtle">Recorder 2 · Card A</p>}
      >
        <LibraryDemoPage page={page} title="h3" />
      </AppShell>
    </Frame>
  );
}

/* ---------- Flat's own (plans/024, phase 3): a small site's dashboard ---------- */

const SITE_PAGES = ["Overview", "Posts", "Letter", "Settings"] as const;
type SitePageName = (typeof SITE_PAGES)[number];

const SITE_POSTS = [
  ["Open water", "Spring series · published 2 days ago · 612 readers this week."],
  ["Notes on a slow shutter", "A draft, 6 min read. Last edited this morning."],
  ["Dusk tide", "Spring series · published last week · 341 readers."],
  ["Issue 14", "The last of the spring series. Goes out Friday at 9:00."],
  ["What the garden did", "The garden · published in October · 188 readers."],
  ["A winter series", "An idea: the same pier, in the cold."],
];

function SiteDemoPage({ page, title: Title = "h1" }: { page: SitePageName; title?: "h1" | "h3" }) {
  return (
    <div className="grid gap-6">
      <Title className="text-h3 text-fg">{page}</Title>
      <ul className="grid gap-4">
        {SITE_POSTS.map(([name, text]) => (
          <li key={name}>
            <Card as="div">
              <CardBody>
                <CardTitle as={Title === "h1" ? "h2" : "h4"}>{name}</CardTitle>
                <CardDescription>{text}</CardDescription>
              </CardBody>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SiteNav({ page, onPage }: { page: SitePageName; onPage: (p: SitePageName) => void }) {
  return (
    <SidebarNav label="Main">
      {SITE_PAGES.map((p) => (
        <SidebarLink
          key={p}
          href={`#${p.toLowerCase()}`}
          current={p === page}
          onClick={(e) => {
            e.preventDefault(); // this is a demo: do not move the gallery's own hash
            onPage(p);
          }}
        >
          {p}
        </SidebarLink>
      ))}
    </SidebarNav>
  );
}

function SiteDashboardDemo() {
  const [page, setPage] = useState<SitePageName>("Overview");
  return (
    <Frame label="Low Tide dashboard, desktop" className="[--gutter:var(--space-8)]">
      <AppShell
        viewportHeight="34rem"
        wordmark={<a href="#overview" onClick={(e) => { e.preventDefault(); setPage("Overview"); }}>Low Tide</a>}
        nav={<SiteNav page={page} onPage={setPage} />}
        footer={<p className="px-3 py-2 text-caption text-fg-subtle">lowtide.site · 412 subscribers</p>}
      >
        <SiteDemoPage page={page} />
      </AppShell>
    </Frame>
  );
}

function SiteDashboardTile() {
  const [page, setPage] = useState<SitePageName>("Overview");
  return (
    <Frame label="Low Tide dashboard, desktop" className="[--gutter:var(--space-8)]">
      <AppShell
        viewportHeight="34rem"
        mainLandmark={false}
        wordmark={<a href="#overview" onClick={(e) => { e.preventDefault(); setPage("Overview"); }}>Low Tide</a>}
        nav={<SiteNav page={page} onPage={setPage} />}
        footer={<p className="px-3 py-2 text-caption text-fg-subtle">lowtide.site · 412 subscribers</p>}
      >
        <SiteDemoPage page={page} title="h3" />
      </AppShell>
    </Frame>
  );
}

export default function AppShellPage() {
  return (
    <Page meta={meta} docs={docs} tile={<ShellTile />} tileByWorld={{ device: <LibraryTile />, flat: <SiteDashboardTile /> }}>
      <Stage
        title="Desktop"
        tier="instant"
        size="lg"
        code="ShellDemo"
        byWorld={{ flat: { demo: <SiteDashboardDemo />, title: "A site's dashboard", code: "SiteDashboardDemo" }, device: { demo: <LibraryDemo />, code: "LibraryDemo" } }}
        caption="The sidebar is 240px on surface-1 with a hairline on its edge. Scroll the page inside the frame: the main area moves and the sidebar's links stay in view, because its content is sticky and as tall as the window. Its column runs the full height of the page, so on a long page the sidebar still reaches the bottom. The current page is fg on a surface-2 fill, and hover fills a link at fg 6%. Nothing is a dot or an accent."
      >
        <ShellDemo />
      </Stage>

      <Stage
        title="Phone"
        tier="expressive"
        size="lg"
        code="PhoneDemo"
        byWorld={{ device: { demo: <LibraryPhoneDemo />, code: "LibraryPhoneDemo" } }}
        caption="On a phone the sidebar is gone and a glass top bar holds the wordmark and a 44px menu button. The button opens the same nav in the bottom sheet that Dialog and Popover use: it rises by its own height on the expressive spring, never uses up the view's one moment, and drags down to close. Picking a link closes it. The sheet covers the whole window, as it would on a phone."
      >
        <PhoneDemo />
      </Stage>

      <Stage
        title="With icons"
        tier="instant"
        code="IconsDemo"
        byWorld={{ device: { demo: <LibraryIconsDemo />, code: "LibraryIconsDemo" } }}
        caption="A link takes an optional 16px icon. The icon is decorative and stays fg-subtle, so the label still says everything, and the current page is still shown by its fill and brighter text."
      >
        <IconsDemo />
      </Stage>
    </Page>
  );
}
