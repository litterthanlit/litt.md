import { useEffect, useRef, useState, type MouseEvent, type ReactNode, type Ref, type RefObject } from "react";
import { Button } from "@/components/button";
import { Header, type HeaderLink, type HeaderLinkProps } from "@/components/header";
import { ProjectCover, type CoverName } from "@/components/list-cover";
import { DeviceProvider } from "@/motion";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "header",
  title: "Glass header",
  lede: "A sticky glass bar that folds when narrow.",
  order: 14, group: "Layout",
  summary:
    "A sticky glass bar with a wordmark, a nav and your actions. The page blurs under it as it scrolls. When the bar is narrow, the links fold behind a menu button instead of squeezing.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["header", "menu", "button", "icons"],
  exports: ["Header"],
  usage: `import { Button } from "@/components/button";
import { Header } from "@/components/header";

<Header
  wordmark={<a href="/">Litt Studio</a>}
  navLabel="Main"
  links={[
    { label: "Work", href: "/work", current: true },
    { label: "Services", href: "/services" },
    { label: "Journal", href: "/journal" },
    { label: "Contact", href: "/contact" },
  ]}
  actions={<Button variant="primary">Start a project</Button>}
/>

// With a router, draw the links with its Link and navigate from the menu too.
// In Next.js these are functions, so build the header in a "use client" file.
<Header
  wordmark={<Link href="/">Litt Studio</Link>}
  links={links}
  renderLink={(link, props) => <Link href={link.href} {...props} />}
  onNavigate={(link) => router.push(link.href)}
/>

// Keep a focused control or an in-page anchor from hiding under the bar:
// <html className="scroll-pt-[calc(var(--header-h)+var(--space-6))]">`,
  use: [
    "The top of a site or an app, on every page: a wordmark, a few links and the main action.",
    "Pages that scroll. Glass only earns its blur when content passes under it.",
    "Four to six short links. They show in the bar from 1024px wide, or from 640px with navFrom=\"sm\", and fold behind a menu button below that.",
    "A studio site, a docs site or the shell of a small app, where one bar can stay put while the page moves.",
    "A phone. The nav stays behind the menu button, which opens a dropdown beside it, and the bar stays at the top of the screen while the page scrolls under it.",
  ],
  skip: [
    "A page that does not scroll, or has nothing behind the bar. Glass over a flat page is a gray box. Use a plain bar with a hairline.",
    "More than six links, or links with children. Keep the main pages in the bar and add a Command menu to actions.",
    "A bar inside a card, a panel or a dialog. Glass is only for surfaces that float over the page. Use Tabs or a row of Buttons.",
    "Switching between views of one page. Use Tabs.",
  ],
  keyboard: [
    [["Tab"], "Moves through the wordmark, each link, the actions and, on a narrow bar, the menu button, in reading order."],
    [["Enter"], "Follows the focused link, or opens the menu from its button."],
    [["Enter", "Space", "ArrowDown"], "On the menu button: opens the menu and moves focus to the first row."],
    [["ArrowDown", "ArrowUp"], "In the menu: moves between the links. Home and End jump to the first and last."],
    [["Enter", "Space"], "In the menu: follows the link, or runs onNavigate when you pass it, and closes the menu."],
    [["Escape"], "Closes the menu and returns focus to the menu button."],
  ],
  a11y: [
    "The nav is a real <nav> with a name (navLabel, Main by default). Only one is ever visible: the link list in the bar, or the menu button when the bar folds. The other is display: none, so a screen reader never meets two. If a page has several headers, give each its own navLabel.",
    "Links are real anchors, so they open in a new tab and work with the middle click. The current page gets aria-current=\"page\" and the selected segment's look: the full text color on a raised fill with a hairline, so it shows without relying on a hue. In the menu, the current row carries a check and says \"current page\" in hidden text.",
    "Menu rows are real links (role menuitem on an anchor), so a modifier key or a middle click opens them in a new tab. With onNavigate they call your router instead, and lose that, so keep important pages reachable from the page too.",
    "The menu button is a real button named by menuLabel, and Radix sets aria-haspopup and aria-expanded. The menu is named by navLabel. Menu documents the rest of its keyboard and focus behavior.",
    "Keyboard focus draws a 2px outline at a 2px offset on every link, the wordmark link and the buttons. Links are 32px tall with a mouse. On touch screens the links, the wordmark link and the menu button are all 44px tall, and a pressed link fills the way a hovered one does, because a finger has no hover. The menu button and its rows are 44px on every screen.",
    "The bar never hides on scroll and never moves out of reach: it sticks at the top, below the safe-area inset on a notched phone, so the menu button is always where the thumb expects it. Add viewport-fit=cover to your viewport meta tag for the inset to apply.",
    "A sticky bar can cover the control you tab to. Set scroll-padding-top on the scrolling element to the header height plus some air, as the usage note shows. The header cannot do it for you.",
    "Add a \"Skip to content\" link before the header. The header does not include one, because only you know where the content starts.",
    "Under reduced transparency the glass becomes solid surface-1, and where backdrop-filter is missing it goes almost opaque, so the links keep their contrast. Under reduced motion the menu appears and leaves at once.",
  ],
};

/* ---------------------------------------------------------------- shared demo parts */

const NAV = [
  { label: "Work", href: "/work" },
  { label: "Services", href: "/services" },
  { label: "Journal", href: "/journal" },
  { label: "Contact", href: "/contact" },
];

/** The main action. Small on a mouse, so it matches the 32px links, and 44px on a touch screen. */
function StartButton() {
  return (
    <Button variant="primary" size="sm" className="pointer-coarse:h-control-md pointer-coarse:px-control-pad-md">
      Start a project
    </Button>
  );
}

/** A stand-in for your router: the current path lives in state, and the browser stays on this page. */
function useDemoRouter(initial: string) {
  const [path, setPath] = useState(initial);
  return {
    links: NAV.map((l) => ({ ...l, current: l.href === path })),
    home: (e: MouseEvent) => {
      e.preventDefault();
      setPath("/work");
    },
    renderLink: (l: HeaderLink, props: HeaderLinkProps) => (
      <a
        href={l.href}
        {...props}
        onClick={(e) => {
          e.preventDefault();
          setPath(l.href);
        }}
      />
    ),
    onNavigate: (l: HeaderLink) => setPath(l.href),
  };
}

/**
 * The page's own scroller. The header is its first child, so it sticks to the top of this
 * box. The scroll-padding keeps a focused control or a jump target from hiding under the bar.
 */
function Frame({
  ref,
  label,
  onScroll,
  className = "",
  children,
}: {
  ref?: Ref<HTMLDivElement>;
  label: string;
  onScroll?: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      ref={ref}
      onScroll={onScroll}
      role="region"
      aria-label={label}
      tabIndex={0}
      className={
        "@container relative scroll-pt-[calc(var(--header-h)+var(--space-6))] w-full overflow-y-auto overscroll-contain rounded-surface bg-canvas shadow-[inset_0_0_0_1px_var(--line)] " +
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
        className
      }
    >
      {children}
    </div>
  );
}

/** Opens the frame partway down, with the marked block just under the bar, so the glass has content to blur from the start. */
function useStartUnderBar(frame: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const start = () => {
      const box = frame.current;
      const mark = box?.querySelector<HTMLElement>("[data-under-glass]");
      if (box && mark) box.scrollTo({ top: mark.offsetTop - 24 });
    };
    start();
    void document.fonts.ready.then(start); // the web font changes the text height, so measure again
  }, [frame]);
}

const WORK: { name: string; client: string; cover: CoverName }[] = [
  { name: "litt.design v3", client: "Litt Studio", cover: "system" },
  { name: "Gallery identity", client: "Halden Gallery", cover: "identity" },
  { name: "Founder landing", client: "Marlow Labs", cover: "landing" },
  { name: "Type foundry site", client: "Grotta Type", cover: "type" },
];
const SERVICES = [
  ["Framer sites", "Design and build, from the first sketch to the published domain."],
  ["Identities", "A wordmark, a grid and a color system that hold up across the whole site."],
  ["Launch pages", "One focused page for a product, a template or a dev tool."],
];
const JOURNAL = [
  ["Why the studio site moved to Framer", "Oct 2026"],
  ["Motion that explains instead of decorating", "Sep 2026"],
  ["Notes on a 44px touch target", "Aug 2026"],
];

/** The home page, top to bottom. Each section carries the href of the nav link that opens it. */
function StudioPage() {
  return (
    <div className="grid gap-16 px-gutter pt-16 pb-24">
      <div className="grid max-w-[46ch] gap-4">
        <p className="text-caption text-fg-subtle">Independent design studio</p>
        <h3 className="text-h1 text-fg text-balance">Framer sites that feel finished on day one.</h3>
        <p className="text-reading text-fg-muted">
          Litt Studio designs and builds sites, identities and launch pages for teams that care how it all fits together.
        </p>
      </div>

      <div data-section="/work" className="grid gap-6">
        <h3 className="text-h3 text-fg">Selected work</h3>
        <ul data-under-glass className="grid gap-6 @min-[32rem]:grid-cols-2 @min-[48rem]:grid-cols-4">
          {WORK.map((w) => (
            <li key={w.name} className="grid gap-3">
              <div className="litt-raised relative aspect-[8/5] overflow-hidden bg-surface-2">
                <ProjectCover name={w.cover} />
              </div>
              <div className="grid gap-1">
                <p className="text-body font-title text-fg">{w.name}</p>
                <p className="text-small text-fg-subtle">{w.client}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div data-section="/services" className="grid gap-6">
        <h3 className="text-h3 text-fg">Services</h3>
        <ul className="grid gap-6 @min-[48rem]:grid-cols-3">
          {SERVICES.map(([title, text]) => (
            <li key={title} className="grid content-start gap-2 border-t border-line pt-4">
              <p className="text-body font-title text-fg">{title}</p>
              <p className="text-small text-fg-subtle">{text}</p>
            </li>
          ))}
        </ul>
      </div>

      <div data-section="/journal" className="grid gap-6">
        <h3 className="text-h3 text-fg">Journal</h3>
        <ul>
          {JOURNAL.map(([title, date]) => (
            <li key={title} className="flex items-baseline justify-between gap-4 border-b border-line py-3 first:border-t">
              <span className="text-body font-title text-fg">{title}</span>
              <span className="shrink-0 tabular-nums text-caption font-normal text-fg-subtle">{date}</span>
            </li>
          ))}
        </ul>
      </div>

      <div data-section="/contact" className="grid max-w-[46ch] gap-4">
        <h3 className="text-h3 text-fg">Contact</h3>
        <p className="text-reading text-fg-muted">
          A few lines are enough: what it is, who it is for and when you would like it live.
        </p>
        <p className="text-small text-fg-subtle">hello@litt.design</p>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- demos */

function DesktopDemo() {
  const frame = useRef<HTMLDivElement>(null);
  const router = useDemoRouter("/work");
  useStartUnderBar(frame);
  return (
    <Frame ref={frame} label="Litt Studio home page" className="h-120">
      <Header
        wordmark={<a href="/work" onClick={router.home}>Litt Studio</a>}
        navLabel="Studio site"
        navFrom="sm"
        links={router.links}
        renderLink={router.renderLink}
        onNavigate={router.onNavigate}
        actions={<StartButton />}
      />
      <StudioPage />
    </Frame>
  );
}

function PhoneDemo() {
  const frame = useRef<HTMLDivElement>(null);
  const router = useDemoRouter("/services");
  useStartUnderBar(frame);
  return (
    /* The frame is phone-wide, and the header measures the frame, not the window. --gutter is
       the 16px page gutter a phone has, because the window's own is wider. */
    <div className="mx-auto w-full max-w-sm [--gutter:var(--space-4)]">
      <Frame ref={frame} label="Litt Studio home page, phone" className="h-136">
        <Header
          wordmark={<a href="/work" onClick={router.home}>Litt Studio</a>}
          navLabel="Studio site, phone"
          links={router.links}
          onNavigate={router.onNavigate}
          actions={<StartButton />}
        />
        <StudioPage />
      </Frame>
    </div>
  );
}

function CurrentDemo() {
  const frame = useRef<HTMLDivElement>(null);
  const [path, setPath] = useState("/work");
  useStartUnderBar(frame);

  /* Where each section starts, and how much room the bar takes above it. */
  const top = (href: string) => frame.current?.querySelector<HTMLElement>(`[data-section="${href}"]`)?.offsetTop ?? 0;
  const room = () => parseFloat(getComputedStyle(frame.current!).scrollPaddingTop);
  const go = (href: string) => frame.current?.scrollTo({ top: top(href) - room() });

  /* Scroll by hand and current follows: the last section whose top has passed the bar. */
  const follow = () => {
    const box = frame.current!;
    const atEnd = box.scrollTop + box.clientHeight >= box.scrollHeight - 1;
    const passed = NAV.filter((l) => top(l.href) - room() <= box.scrollTop + 1);
    setPath(atEnd ? NAV[NAV.length - 1]!.href : (passed[passed.length - 1]?.href ?? ""));
  };

  return (
    <div className="grid w-full gap-4">
      <Frame ref={frame} onScroll={follow} label="Litt Studio home page, with jump links" className="h-120">
        <Header
          wordmark={
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                frame.current?.scrollTo({ top: 0 });
              }}
            >
              Litt Studio
            </a>
          }
          navLabel="Studio site, jump links"
          navFrom="sm"
          links={NAV.map((l) => ({ ...l, current: l.href === path }))}
          renderLink={(l, props) => (
            <a
              href={l.href}
              {...props}
              onClick={(e) => {
                e.preventDefault();
                go(l.href);
              }}
            />
          )}
          onNavigate={(l) => go(l.href)}
          actions={<StartButton />}
        />
        <StudioPage />
      </Frame>
      <p role="status" className="text-caption font-normal text-fg-subtle">
        {path ? `aria-current="page" on ${NAV.find((l) => l.href === path)?.label}` : "No link is current at the top of the page"}
      </p>
    </div>
  );
}

/* ---------- the overview's tile ---------- */

/** The glass bar over a page that scrolls under it. Its action is a plain button here: the wall's one accent fill is the Button tile's. */
function HeaderTile() {
  const frame = useRef<HTMLDivElement>(null);
  const router = useDemoRouter("/work");
  useStartUnderBar(frame);
  return (
    <Frame ref={frame} label="Litt Studio home page" className="h-80">
      <Header
        wordmark={<a href="/work" onClick={router.home}>Litt Studio</a>}
        navLabel="Studio site"
        navFrom="sm"
        links={router.links}
        renderLink={router.renderLink}
        onNavigate={router.onNavigate}
        actions={
          <Button size="sm" className="pointer-coarse:h-control-md pointer-coarse:px-control-pad-md">
            Contact
          </Button>
        }
      />
      <StudioPage />
    </Frame>
  );
}

export default function HeaderPage() {
  return (
    <Page meta={meta} docs={docs} tile={<HeaderTile />}>
      <Stage
        title="Desktop"
        tier="instant"
        size="lg"
        code="DesktopDemo"
        caption="The bar is glass, so the page blurs under it as you scroll. That is the one place glass belongs in a page: it floats over content. Hover a link and it takes an fg fill and brighter text on the instant tier. The glass itself never animates. This site has four short links, so the nav shows from 640px wide (navFrom sm) and folds below that."
      >
        <DesktopDemo />
      </Stage>

      <Stage
        title="Phone"
        tier="responsive"
        size="lg"
        code="PhoneDemo"
        caption="On a phone the nav stays behind the menu button. It does not shrink or wrap, and the button opens litt's Menu beside it, which stays anchored because its rows are already big enough for a finger. The bar stays at the top of the screen, below the safe-area inset on a notched phone, and never hides as the page scrolls. On a touch screen the links and the button are 44px tall and a pressed link fills. A check marks the page you are on, and the action stays in the bar. The header measures the frame, not the window, so this is what a phone sees."
      >
        <DeviceProvider mode="phone">
          <PhoneDemo />
        </DeviceProvider>
      </Stage>

      <Stage
        title="Current page"
        tier="instant"
        size="lg"
        code="CurrentDemo"
        caption="Click a link and the page scrolls to its section, stopping below the bar because the frame sets scroll-padding-top. Scroll by hand and the current link follows. The header stays mounted and only current changes, which is all a router has to pass in. The current link wears the selected segment, a raised fill with a hairline, and the browser hears aria-current. At the very top no link is current. Only the fill and the color change, so no link moves or resizes."
      >
        <CurrentDemo />
      </Stage>
    </Page>
  );
}
