/**
 * The gallery's menu on phones and tablets (below lg, where the sidebar is hidden).
 *
 * After a competitor's mobile menu Nick liked, taken as an idea and built in litt's own terms: one screen under the
 * header, the site's own pages first, the component groups in a raised card, settings and links at the foot. What
 * stays litt's:
 *
 * - The site's own pages are 28px at the title weight, the current one in --fg and the rest in --fg-subtle: Nick's
 *   call after seeing 18px, 24px and 28px side by side (2026-10-21). It is a gallery exception to the 18px cap and to
 *   P12, for this menu only (journal); the rows in the cards keep P12's selected segment.
 * - Each group row leads with a 16px icon in --fg-subtle and ends with its count and a chevron; the outside links lead
 *   with their mark and end with an arrow. Every other link that is not current is --fg-muted, --fg on hover.
 * - Everything sits on the page gutter, so the cards' edges line up with the header's wordmark.
 * - The groups drill down in place, as litt's Menu does on a phone: a group's row opens its pages in the same card,
 *   with a Back row; the new list comes in from half of the travel token and the old one leaves a quarter of it,
 *   on the responsive tier. A group's row also names the current page when it holds it, so you know where you are.
 * - No call to action and no accent: the menu is navigation. The theme is litt's Segmented control.
 * - Motion: the panel fades in and drops half of the travel token on the responsive tier, and leaves on the exit
 *   token. Rows do not stagger: the view's one expressive moment is the page's, not the menu's.
 *
 * Behavior: the menu button in the header is a disclosure (aria-expanded, aria-controls) and turns into a close
 * button, its two icons cross-fading on the instant tier. While the menu is open the page under it is inert and
 * does not scroll, the header stays live (so the button can close it), and focus moves to the first row. Esc, the
 * button, a link, or growing the window to the sidebar's width closes it, and focus returns to the button.
 */
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { useExit, useTransition, useTravel } from "@/motion";
import { ArrowUpRightIcon, ChevronLeftIcon, ChevronRightIcon, SlidersIcon } from "@/components/icons";
import { PAGE_GROUPS, type PageGroup } from "./kit";
import { pages, type PageEntry } from "./registry";

/** Two lines, the menu glyph. */
const MenuGlyph = ({ className = "" }: { className?: string }) => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true" focusable="false" className={className}>
    <path d="M2.5 5.5h11M2.5 10.5h11" />
  </svg>
);
const CloseGlyph = ({ className = "" }: { className?: string }) => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true" focusable="false" className={className}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </svg>
);

const PANEL_ID = "gallery-menu";

/** The header's menu button: a disclosure that turns into a close button. Hidden where the sidebar shows. */
export function MenuButton({ open, onToggle, ref }: { open: boolean; onToggle: () => void; ref: RefObject<HTMLButtonElement | null> }) {
  return (
    <button
      ref={ref}
      type="button"
      aria-expanded={open}
      aria-controls={PANEL_ID}
      aria-label={open ? "Close menu" : "Menu"}
      onClick={onToggle}
      className={
        "relative grid size-control-sm shrink-0 place-items-center rounded-control text-fg-muted [-webkit-tap-highlight-color:transparent] lg:hidden " +
        "transition-colors duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg " +
        "pointer-coarse:size-control-md pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] " +
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      }
    >
      {/* Both glyphs in one cell, cross-fading on the instant tier, so the button never changes size. */}
      <MenuGlyph className={"col-start-1 row-start-1 transition-opacity duration-(--dur-instant) ease-litt " + (open ? "opacity-0" : "")} />
      <CloseGlyph className={"col-start-1 row-start-1 transition-opacity duration-(--dur-instant) ease-litt " + (open ? "" : "opacity-0")} />
    </button>
  );
}

/* One 16px icon per group, in the icon set's pattern (1.5px stroke, round caps). Sliders comes from the set. */
const Glyph = ({ d }: { d: string }) => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d={d} />
  </svg>
);
const GROUP_ICON: Record<PageGroup, ReactNode> = {
  Controls: <SlidersIcon />,
  Overlays: <Glyph d="M5.75 5.75h7.5v7.5h-7.5zM3.25 10.25v-7h7" />, // a surface over a surface
  Layout: <Glyph d="M2.75 2.75h10.5v10.5H2.75zM2.75 6.25h10.5M6.25 6.25v7" />, // a header and a sidebar
  Data: <Glyph d="M3.25 13.25v-4M8 13.25v-10M12.75 13.25v-6.5" />, // three rails
  Agents: <Glyph d="M8 2.5v3M8 10.5v3M2.5 8h3M10.5 8h3M4.4 4.4l1.6 1.6M10 10l1.6 1.6M4.4 11.6 6 10M10 6l1.6-1.6" />, // a spark
  Commerce: <Glyph d="M3.25 5.25h9.5v9h-9.5zM5.75 5.25V4a2.25 2.25 0 0 1 4.5 0v1.25" />, // a bag, the BagIcon's drawing
  Blocks: <Glyph d="M2.75 2.75h4.5v4.5h-4.5zM8.75 2.75h4.5v4.5h-4.5zM2.75 8.75h4.5v4.5h-4.5zM8.75 8.75h4.5v4.5h-4.5z" />, // four parts, one screen
};

/* ---------------------------------------------------------------- rows */

const rowBase =
  "flex w-full items-center gap-3 rounded-control px-3 text-left select-none [-webkit-tap-highlight-color:transparent] " +
  "transition-[background-color,color,box-shadow] duration-(--dur-instant) ease-litt " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus ";
const rowIdle = "text-fg-muted hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]";
const rowCurrent = "bg-surface-1 text-fg shadow-[inset_0_0_0_1px_var(--line),var(--highlight)]";

function PageRow({ page, current, size }: { page: PageEntry; current: boolean; size: "lg" | "md" }) {
  if (size === "md") {
    return (
      <a href={`#${page.id}`} aria-current={current ? "page" : undefined} className={rowBase + "h-control-md text-body " + (current ? rowCurrent : rowIdle)}>
        <span className="truncate">{page.title}</span>
      </a>
    );
  }
  /* Nick's call (2026-10-21): the site's own pages are 28px at the title weight, and the
     current one is marked by ink alone, full --fg against --fg-subtle. A gallery exception to the 18px cap and to
     P12's raised segment, for this menu only; the language keeps both. */
  return (
    <a
      href={`#${page.id}`}
      aria-current={current ? "page" : undefined}
      className={
        "flex h-13 items-center rounded-control px-3 text-[28px] leading-[34px] font-title select-none [-webkit-tap-highlight-color:transparent] " + // litt-allow: Nick's 28px exception for the gallery menu
        "transition-colors duration-(--dur-instant) ease-litt " +
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
        (current ? "text-fg" : "text-fg-subtle hover:text-fg pointer-coarse:active:text-fg")
      }
    >
      {page.title}
    </a>
  );
}

/** A small label above a block: 12px at the label weight, 4px above what it names. Every block's text starts 16px in
    from the panel's edge (the cards' 4px inset plus a row's 12px), so the labels, the big rows and the rows in the
    cards line up. */
const Label = ({ id, children }: { id: string; children: ReactNode }) => (
  <p id={id} className="px-4 pb-1 text-caption text-fg-subtle">
    {children}
  </p>
);

/* ---------------------------------------------------------------- the panel */

export type MobileMenuProps = {
  open: boolean;
  /** Closes the menu. `restore` puts focus back on the menu button. */
  onClose: (restore: boolean) => void;
  current: PageEntry | undefined;
  /** The theme control, as the header shows it but at full width with its words. */
  theme: ReactNode;
  /** The site's outside links, as rows: GitHub and the maker. */
  links: { label: string; href: string; detail?: string; lead?: ReactNode }[];
};

export function MobileMenu({ open, onClose, current, theme, links }: MobileMenuProps) {
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const travel = useTravel();

  /* Esc closes, and the sidebar's width closes it too, since the sidebar then shows the same links. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(true);
    const wide = window.matchMedia("(min-width: 64rem)");
    const onWide = () => wide.matches && onClose(false);
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="menu"
          id={PANEL_ID}
          className="fixed inset-x-0 bottom-0 top-[calc(env(safe-area-inset-top,0px)+4rem)] z-20 overflow-y-auto overscroll-contain bg-canvas lg:hidden"
          initial={{ opacity: 0, y: -travel / 2 }}
          animate={{ opacity: 1, y: 0, transition: enter }}
          exit={{ opacity: 0, transition: exit }}
        >
          <nav aria-label="Gallery" className="mx-auto grid max-w-xl gap-6 px-gutter pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)]">
            <Panel current={current} theme={theme} links={links} onClose={onClose} />
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Panel({ current, theme, links, onClose }: Omit<MobileMenuProps, "open">) {
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const travel = useTravel();
  const [group, setGroup] = useState<PageGroup | null>(null); // it opens on the groups; the current one names this page
  const [dir, setDir] = useState<1 | -1>(1);
  const back = useRef<HTMLButtonElement>(null);
  const opener = useRef<PageGroup | null>(null);
  const first = useRef<HTMLDivElement>(null);

  /* Focus lands on the first row when the menu opens, so Tab starts inside it. */
  useEffect(() => {
    first.current?.querySelector<HTMLElement>("a,button")?.focus({ preventScroll: true });
  }, []);

  const site = pages.filter((p) => !p.group);
  const groups = PAGE_GROUPS.map((g) => ({ group: g, pages: pages.filter((p) => p.group === g) })).filter((g) => g.pages.length);
  const shown = groups.find((g) => g.group === group);

  const drillIn = (g: PageGroup) => {
    setDir(1);
    opener.current = g;
    setGroup(g);
  };
  const drillOut = () => {
    setDir(-1);
    setGroup(null);
  };

  /* After a drill, focus goes where the keys left off: the Back row going in, the group's row coming back. */
  useEffect(() => {
    if (group) back.current?.focus({ preventScroll: true });
    else if (opener.current) document.getElementById(`menu-group-${opener.current}`)?.focus({ preventScroll: true });
  }, [group]);

  const slide: Variants = {
    in: (d: number) => ({ opacity: 0, x: (d * travel) / 2 }),
    still: { opacity: 1, x: 0, transition: enter },
    out: (d: number) => ({ opacity: 0, x: (-d * travel) / 4, transition: exit }),
  };

  return (
    <div className="contents" onClick={(e) => (e.target as HTMLElement).closest("a[href^='#']") && onClose(false)}>
      {/* The site's own pages, the biggest rows on the screen. */}
      <div ref={first} className="grid px-1 pb-2">
        {site.map((p) => (
          <PageRow key={p.id} page={p} current={p.id === current?.id} size="lg" />
        ))}
      </div>

      {/* The components, by group, drilling down in place. */}
      <section aria-labelledby="menu-components" className="grid">
        <Label id="menu-components">Components</Label>
        <div className="litt-raised relative overflow-hidden rounded-surface p-1">
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            {shown ? (
              <motion.div key={shown.group} custom={dir} variants={slide} initial="in" animate="still" exit="out" className="grid">
                <button ref={back} type="button" onClick={drillOut} className={rowBase + "h-control-md text-body " + rowIdle}>
                  <ChevronLeftIcon className="shrink-0" />
                  <span className="flex-1">All groups</span>
                </button>
                <p className="flex items-baseline justify-between px-3 pt-3 pb-1 text-caption">
                  <span className="text-fg">{shown.group}</span>
                  <span aria-hidden="true" className="font-mono font-normal text-fg-subtle tabular-nums">
                    {shown.pages.length}
                  </span>
                </p>
                <div role="group" aria-label={shown.group} className="grid">
                  {shown.pages.map((p) => (
                    <PageRow key={p.id} page={p} current={p.id === current?.id} size="md" />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="groups" custom={dir} variants={slide} initial="in" animate="still" exit="out" className="grid">
                {groups.map(({ group: g, pages: list }) => {
                  const here = list.find((p) => p.id === current?.id);
                  return (
                    <button key={g} id={`menu-group-${g}`} type="button" onClick={() => drillIn(g)} className={rowBase + "h-control-md text-body " + rowIdle}>
                      <span className="shrink-0 text-fg-subtle">{GROUP_ICON[g]}</span>
                      <span className="flex-1 truncate">{g}</span>
                      {here && <span className="truncate text-small text-fg-subtle">{here.title}</span>}
                      <span aria-hidden="true" className="font-mono text-caption font-normal text-fg-subtle tabular-nums">
                        {list.length}
                      </span>
                      <ChevronRightIcon className="shrink-0 text-fg-subtle" />
                      <span className="sr-only">{`, ${list.length} pages${here ? `, including this one, ${here.title}` : ""}`}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Settings and the way out, at the foot. */}
      <section aria-labelledby="menu-theme" className="grid">
        <Label id="menu-theme">Theme</Label>
        <div className="pt-1">{theme}</div>
      </section>

      <section aria-labelledby="menu-more" className="grid">
        <Label id="menu-more">More</Label>
        <div className="litt-raised grid rounded-surface p-1">
          {links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className={rowBase + "h-control-md text-body " + rowIdle}>
              {l.lead}
              <span className="flex-1 truncate">{l.label}</span>
              {l.detail && <span className="truncate text-small text-fg-subtle">{l.detail}</span>}
              <ArrowUpRightIcon className="shrink-0 text-fg-subtle" />
              <span className="sr-only">, opens in a new tab</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
