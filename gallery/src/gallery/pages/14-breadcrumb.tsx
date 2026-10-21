import { useEffect, useRef, useState, type ReactNode, type Ref, type RefObject } from "react";
import { Breadcrumb, type BreadcrumbItem, type BreadcrumbLinkProps } from "@/components/breadcrumb";
import { Button } from "@/components/button";
import { ShareIcon } from "@/components/icons";
import { DeviceProvider } from "@/motion";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "breadcrumb",
  title: "Breadcrumb",
  lede: "Where a page sits.",
  order: 14.5,
  group: "Layout",
  verbs: ["open"],
  summary:
    "Where a page sits, with a slash between the levels and the current page in the foreground. A long trail folds its middle into a menu, and a phone shows the last two levels.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["breadcrumb", "menu", "button", "icons"],
  exports: ["Breadcrumb"],
  usage: `import { Breadcrumb } from "@/components/breadcrumb";

<Breadcrumb
  items={[
    { label: "Studio", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: "Marlow Labs", href: "/projects/marlow-labs" },
    { label: "Settings", href: "/projects/marlow-labs/settings" },
  ]}
/>

// With a router, draw the links with its Link and navigate from the folded menu too.
// In Next.js these are functions, so build the breadcrumb in a "use client" file.
<Breadcrumb
  items={items}
  renderLink={(item, props) => <Link href={item.href} {...props} />}
  onNavigate={(item) => router.push(item.href)}
/>`,
  use: [
    "A page two or more levels deep, where people need to see where it sits and step back up: a project's settings, a docs article, a folder.",
    "The top of a page or an app's bar, beside the page's own actions.",
    "Long trails. Past four levels the middle folds into a menu, so the line never wraps.",
    "Phones. Only the current page and its parent show, and the rest is one tap away.",
  ],
  skip: [
    "A flat site with one level under home. The header's current link already says where you are.",
    "The steps of a flow, such as checkout or onboarding. A breadcrumb is a place, not progress: say the step in the title.",
    "Switching between sibling pages. Use Tabs.",
    "The main navigation. Use the Glass header or the App shell's sidebar.",
  ],
  keyboard: [
    [["Tab"], "Moves through the links and the \"…\" button, in order. The current page is text, so Tab skips it."],
    [["Enter"], "Follows the focused link."],
    [["Enter", "Space", "ArrowDown"], "On the \"…\" button: opens the menu of folded levels and moves focus to the first one."],
    [["ArrowDown", "ArrowUp"], "In the menu: moves between the folded levels."],
    [["Enter"], "In the menu: follows the level, or runs onNavigate when you pass it, and closes the menu."],
    [["Escape"], "Closes the menu and returns focus to the \"…\" button."],
  ],
  a11y: [
    "It is a nav landmark named Breadcrumb (label) around an ordered list, so a screen reader announces the landmark and how many levels it holds. Give each breadcrumb on a page its own label.",
    "The current page carries aria-current=\"page\" and the full text color, a lightness step from the links, never a hue or a dot. It is text, not a link to the page you are on.",
    "The slashes are aria-hidden, because the list already says where one level ends.",
    "The \"…\" button is named for what it hides (\"Show 3 more levels\"), and the menu's rows are real links (role menuitem on an anchor), so a modifier key or a middle click opens them in a new tab. With onNavigate they call your router instead and lose that.",
    "Links are 32px tall with a mouse. On touch screens their hit area and the \"…\" button's grow to 44px through an invisible layer, so the text never moves and the row keeps its height. A pressed link turns the full text color. Keyboard focus draws a 2px outline at a 2px offset.",
    "The current page truncates with an ellipsis instead of wrapping. Its full text stays in the DOM for a screen reader, so keep the page's title on the page too.",
    "The breadcrumb itself never moves. Under reduced motion the menu of folded levels appears and leaves at once.",
  ],
};

/* ---------------------------------------------------------------- shared demo parts */

const SETTINGS: BreadcrumbItem[] = [
  { label: "Studio", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Marlow Labs", href: "/projects/marlow-labs" },
  { label: "Settings", href: "/projects/marlow-labs/settings" },
];

const DOCS_TRAIL: BreadcrumbItem[] = [
  { label: "Docs", href: "/docs" },
  { label: "Guides", href: "/docs/guides" },
  { label: "Publishing", href: "/docs/guides/publishing" },
  { label: "Domains", href: "/docs/guides/publishing/domains" },
  { label: "Custom domains", href: "/docs/guides/publishing/domains/custom" },
  { label: "DNS records", href: "/docs/guides/publishing/domains/custom/dns" },
  { label: "Verify that you own the domain", href: "/docs/guides/publishing/domains/custom/dns/verify" },
];

/** A stand-in for your router: links stay on this page and say where they would have gone. */
function useDemoRouter() {
  const [went, setWent] = useState("Nothing followed yet");
  return {
    went,
    renderLink: (item: BreadcrumbItem, props: BreadcrumbLinkProps) => (
      <a
        href={item.href}
        {...props}
        onClick={(e) => {
          e.preventDefault();
          setWent(`Went to ${item.href}`);
        }}
      />
    ),
    onNavigate: (item: BreadcrumbItem) => setWent(`Went to ${item.href}`),
  };
}

function Status({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="font-mono text-caption font-normal text-fg-subtle">
      {children}
    </p>
  );
}

/* ----------------------------------------------------------------------- demos */

function SettingsTrailDemo() {
  const router = useDemoRouter();
  return (
    <div className="grid w-full max-w-lg gap-4">
      <Breadcrumb items={SETTINGS} renderLink={router.renderLink} />
      <Status>{router.went}</Status>
    </div>
  );
}

function DocsTrailDemo() {
  const router = useDemoRouter();
  return (
    <div className="grid w-full max-w-xl gap-4">
      <Breadcrumb items={DOCS_TRAIL} label="Docs breadcrumb" renderLink={router.renderLink} onNavigate={router.onNavigate} />
      <Status>{router.went}</Status>
    </div>
  );
}

const SECTIONS: { title: string; rows: [string, string][] }[] = [
  {
    title: "General",
    rows: [
      ["Project name", "Founder landing"],
      ["Client", "Marlow Labs"],
      ["Framer project", "marlow-labs-landing"],
    ],
  },
  {
    title: "Domain",
    rows: [
      ["Primary", "marlowlabs.com"],
      ["Redirect", "www.marlowlabs.com"],
      ["Status", "Connected 12 days ago"],
    ],
  },
  {
    title: "Team",
    rows: [
      ["Owner", "Nick"],
      ["Editors", "Ines Marlow, Theo Park"],
      ["Viewers", "Marlow Labs board"],
    ],
  },
  {
    title: "Publishing",
    rows: [
      ["Last deploy", "2 hours ago"],
      ["Build time", "41 s"],
      ["Branch", "main"],
    ],
  },
];

/** The settings page under the bar. Each section is a few label and value rows split by hairlines. */
function SettingsPage() {
  return (
    <div className="grid gap-12 px-gutter pt-12 pb-24">
      <div className="grid max-w-[46ch] gap-2">
        <h3 className="text-h3 text-fg">Settings</h3>
        <p className="text-body text-fg-muted">Everything about the Marlow Labs founder landing, from its domain to who can edit it.</p>
      </div>
      {SECTIONS.map((s, i) => (
        <section key={s.title} data-under-glass={i === 1 ? "" : undefined} className="grid gap-4">
          <h4 className="text-body text-fg">{s.title}</h4>
          <dl className="grid">
            {s.rows.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 border-b border-line py-3 first:border-t">
                <dt className="text-small text-fg-subtle">{k}</dt>
                <dd className="min-w-0 truncate text-small text-fg">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

/** The page's own scroller, with a sticky glass bar first, so the settings scroll under the glass. */
function Frame({ ref, label, className = "", children }: { ref?: Ref<HTMLDivElement>; label: string; className?: string; children: ReactNode }) {
  return (
    <div
      ref={ref}
      role="region"
      aria-label={label}
      tabIndex={0}
      className={
        "relative w-full overflow-y-auto overscroll-contain rounded-surface bg-canvas shadow-[inset_0_0_0_1px_var(--line)] " +
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
        className
      }
    >
      {children}
    </div>
  );
}

/** Opens the frame partway down, so the glass has content to blur from the start. */
function useStartUnderBar(frame: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const start = () => {
      const box = frame.current;
      const mark = box?.querySelector<HTMLElement>("[data-under-glass]");
      if (box && mark) box.scrollTo({ top: mark.offsetTop - 40 });
    };
    start();
    void document.fonts.ready.then(start);
  }, [frame]);
}

function GlassBarDemo() {
  const frame = useRef<HTMLDivElement>(null);
  const router = useDemoRouter();
  useStartUnderBar(frame);
  return (
    <div className="grid w-full gap-4">
      <Frame ref={frame} label="Marlow Labs settings page" className="h-112 max-sm:[--gutter:var(--space-4)]">
        {/* Full-bleed glass, so no corners: .litt-glass carries the surface radius. */}
        <div className="litt-glass sticky top-0 z-10 flex h-(--header-h) items-center gap-3 rounded-none px-gutter">
          <Breadcrumb
            items={SETTINGS}
            renderLink={router.renderLink}
            onNavigate={router.onNavigate}
            /* The 32px row sits 16px above the bar's bottom edge. 8 more clears the bar, so a folded menu floats over the page. */
            menuOffset={24}
            className="flex-1"
          />
          <Button
            iconOnly
            size="sm"
            variant="ghost"
            aria-label="Share settings"
            className="pointer-coarse:h-control-md pointer-coarse:w-control-md"
          >
            <ShareIcon />
          </Button>
        </div>
        <SettingsPage />
      </Frame>
      <Status>{router.went}</Status>
    </div>
  );
}

function PhoneDemo() {
  return (
    /* A phone-wide frame. --gutter is the 16px page gutter a phone has. */
    <DeviceProvider mode="phone">
      <div className="mx-auto w-full max-w-sm [--gutter:var(--space-4)]">
        <GlassBarDemo />
      </div>
    </DeviceProvider>
  );
}

export default function BreadcrumbPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Where a page sits"
        tier="instant"
        align="start"
        code="SettingsTrailDemo"
        caption="Each level is a link in muted text that turns to the full text color on hover, on the instant tier, with no underline and no fill. A slash in the subtle color sits between levels, because a chevron reads as something that opens. The current page is plain text in the full color and the browser hears aria-current. Nothing moves."
      >
        <SettingsTrailDemo />
      </Stage>

      <Stage
        title="A long trail folds"
        tier="responsive"
        size="lg"
        align="start"
        code="DocsTrailDemo"
        caption="Past four levels the middle ones fold into a round ghost button. It opens litt's Menu of them in order, on the responsive tier, and its rows are real links. The first level and the last three stay. The current page is long here, so it truncates with an ellipsis instead of wrapping onto a second line."
      >
        <DocsTrailDemo />
      </Stage>

      <Stage
        title="In a glass bar"
        tier="instant"
        size="lg"
        code="GlassBarDemo"
        caption="A breadcrumb at the top of a page, in a sticky glass bar beside a share button. The settings scroll under the glass. The bar owns no motion, and the breadcrumb keeps one line however long the page title is."
      >
        <GlassBarDemo />
      </Stage>

      <Stage
        title="On a phone"
        tier="responsive"
        size="lg"
        code="PhoneDemo"
        caption="On a narrow screen only the current page and its parent show. The rest fold into the button, which opens the Menu beside it. On a touch screen every link and the button take a 44px hit area through an invisible layer, so the text never moves. This stage forces the phone behavior, so a mouse can try it."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
