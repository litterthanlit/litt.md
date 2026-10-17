import { useState, type ReactNode } from "react";
import { AppShell, SidebarLink, SidebarNav } from "@/components/app-shell";
import { Card, CardBody, CardDescription, CardTitle } from "@/components/card";
import { FolderIcon, SettingsIcon, UserIcon } from "@/components/icons";
import { DeviceProvider } from "@/motion";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "app-shell",
  title: "App shell",
  order: 15.7, group: "Layout and data",
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

function DemoPage({ page }: { page: PageName }) {
  return (
    <div className="grid gap-6">
      <h1 className="text-h3 text-fg">{page}</h1>
      <ul className="grid gap-4">
        {PROJECTS.map(([name, text]) => (
          <li key={name}>
            <Card as="div">
              <CardBody>
                <CardTitle>{name}</CardTitle>
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
        "relative h-136 w-full overflow-y-auto overscroll-contain rounded-surface bg-canvas outline-1 -outline-offset-1 outline-line " +
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

export default function AppShellPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Desktop"
        tier="instant"
        size="lg"
        code="ShellDemo"
        caption="The sidebar is 240px on surface-1 with a hairline on its edge. Scroll the page inside the frame: the main area moves and the sidebar's links stay in view, because its content is sticky and as tall as the window. Its column runs the full height of the page, so on a long page the sidebar still reaches the bottom. The current page is fg on a surface-2 fill, and hover fills a link at fg 6%. Nothing is a dot or an accent."
      >
        <ShellDemo />
      </Stage>

      <Stage
        title="Phone"
        tier="expressive"
        size="lg"
        code="PhoneDemo"
        caption="On a phone the sidebar is gone and a glass top bar holds the wordmark and a 44px menu button. The button opens the same nav in the bottom sheet that Dialog and Popover use: it rises by its own height on the expressive spring, never uses up the view's one moment, and drags down to close. Picking a link closes it. The sheet covers the whole window, as it would on a phone."
      >
        <PhoneDemo />
      </Stage>

      <Stage
        title="With icons"
        tier="instant"
        code="IconsDemo"
        caption="A link takes an optional 16px icon. The icon is decorative and stays fg-subtle, so the label still says everything, and the current page is still shown by its fill and brighter text."
      >
        <IconsDemo />
      </Stage>
    </Page>
  );
}
