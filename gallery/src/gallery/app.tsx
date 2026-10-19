/**
 * The gallery shell: glass header, page list, the page, and on wide screens a rail with the latest release and who
 * made it. Only the Playground tunes motion.
 *
 * - The page has no light of its own (Nick, 2026-10-19: "remove the gradient from the page"). The header's glass is
 *   the only material in the chrome.
 * - The current page is a filled row, as in the app shell's sidebar (surface-2, the text at fg). The fill glides from
 *   the old row to the new one with layoutId on the responsive tier, as the Tabs indicator does, so moving between
 *   pages says where you went. Hover is fg at 6% on the instant tier.
 */
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { MotionDialProvider, useTransition } from "@/motion";
import { pageRuns, pages, prefetchPages, type PageEntry } from "./registry";
import { useRoute } from "./route";
import { TooltipProvider } from "@/components/tooltip";
import { Avatar } from "@/components/avatar";
import { ArrowUpRightIcon, MonitorIcon, MoonIcon, SunIcon } from "@/components/icons";
import changelog from "../generated/changelog.json";

/** Who made litt, for the credit in the rail. One place to change it. */
const MADE_BY = { name: "Nick", href: "https://github.com/litterthanlit" };
const REPO_URL = "https://github.com/litterthanlit/litt.md";

/* Header, body and footer share one frame. It widens on xl screens, where the rail takes its column, so the page
   keeps the width it had beside the sidebar alone. */
const FRAME = "mx-auto max-w-wide px-gutter xl:max-w-[90rem]";

type ThemeChoice = "system" | "light" | "dark";
const THEMES = [
  { id: "system", label: "System", Icon: MonitorIcon },
  { id: "light", label: "Light", Icon: SunIcon },
  { id: "dark", label: "Dark", Icon: MoonIcon },
] satisfies { id: ThemeChoice; label: string; Icon: typeof SunIcon }[];

function ThemeSwitch() {
  const [theme, setTheme] = useState<ThemeChoice>(() => {
    const t = document.documentElement.getAttribute("data-theme");
    return t === "light" || t === "dark" ? t : "system";
  });
  const choose = (t: ThemeChoice) => {
    setTheme(t);
    if (t === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem("litt-gallery:theme", t);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="inline-flex overflow-hidden rounded-control shadow-[inset_0_0_0_1px_var(--line-strong)]" role="group" aria-label="Theme">
      {/* Icons on a phone, where three labels would crowd the wordmark; words from sm up. */}
      {THEMES.map(({ id, label, Icon }) => (
        <button
          key={id} type="button" aria-pressed={theme === id} aria-label={label} onClick={() => choose(id)}
          className="grid h-control-sm min-w-control-sm cursor-pointer place-items-center text-small text-fg-subtle transition-colors duration-(--dur-instant) ease-litt hover:text-fg aria-pressed:bg-surface-3 aria-pressed:text-fg pointer-coarse:h-control-md pointer-coarse:min-w-control-md sm:px-3"
        >
          <Icon className="sm:hidden" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

/** Room the edge fades take, and the margin kept around the active link. Keep it equal to the 32px in the classes below. */
const FADE = 32;

/**
 * The phone nav. It scrolls sideways with no scrollbar, so each edge fades while
 * more links sit behind it, and a route change brings the active link into view.
 */
function NavStrip({ activeId, children }: { activeId: string | undefined; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  /* The fades follow the scroll position, so they show only where there is more to see. */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      el.toggleAttribute("data-fade-start", el.scrollLeft > 1);
      el.toggleAttribute("data-fade-end", el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(el);
    Array.from(el.children).forEach((link) => resize.observe(link)); // links change width when the font loads
    return () => {
      el.removeEventListener("scroll", update);
      resize.disconnect();
    };
  }, []);

  /* Scroll the strip itself, instantly. scrollIntoView could move the page too. */
  useEffect(() => {
    const el = ref.current;
    const link = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!el || !link) return;
    const strip = el.getBoundingClientRect();
    const box = link.getBoundingClientRect();
    const hiddenAtStart = strip.left + FADE - box.left;
    const hiddenAtEnd = box.right - (strip.right - FADE);
    if (hiddenAtStart > 0) el.scrollTo({ left: el.scrollLeft - hiddenAtStart, behavior: "instant" });
    else if (hiddenAtEnd > 0) el.scrollTo({ left: el.scrollLeft + hiddenAtEnd, behavior: "instant" });
  }, [activeId]);

  return (
    <nav
      ref={ref}
      aria-label="Components"
      className="flex overflow-x-auto px-[calc(var(--gutter)-12px)] [scrollbar-width:none] data-[fade-start]:[--fade-start:32px] data-[fade-end]:[--fade-end:32px] [&:is([data-fade-start],[data-fade-end])]:[mask-image:linear-gradient(to_right,transparent,var(--fg)_var(--fade-start,0px),var(--fg)_calc(100%_-_var(--fade-end,0px)),transparent)]"
    >
      {children}
    </nav>
  );
}

function Shell({ page }: { page: PageEntry | undefined }) {
  const mainRef = useRef<HTMLElement>(null);

  /* Each page names itself in the tab, so history and screen readers can tell them apart. */
  useEffect(() => {
    document.title = !page || page.id === pages[0]?.id ? "litt.md Gallery" : `${page.title} · litt.md Gallery`;
  }, [page]);

  const enter = useTransition("responsive");
  const navLink = (p: PageEntry, compact = false) => {
    const current = p.id === page?.id;
    return (
      <a
        key={p.id}
        href={`#${p.id}`}
        aria-current={current ? "page" : undefined}
        className={
          "relative isolate flex h-control-sm items-center rounded-control px-3 text-small transition-[background-color,color] duration-(--dur-instant) ease-litt " +
          (compact ? "shrink-0 " : "") +
          (current
            ? "text-fg"
            : "text-fg-subtle hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]")
        }
      >
        {current && (
          <motion.span
            layoutId={compact ? "nav-current-strip" : "nav-current"}
            transition={enter}
            aria-hidden="true"
            className="absolute inset-0 -z-10 rounded-control bg-surface-2"
          />
        )}
        {p.title}
      </a>
    );
  };
  const latest = changelog.releases[0];

  return (
    <div className="relative min-h-screen">

      <button
        type="button"
        onClick={() => mainRef.current?.focus()}
        className="sr-only z-50 bg-accent px-4 py-2 text-accent-fg focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </button>

      {/* Full-bleed, so no corners: .litt-glass carries the surface radius. */}
      <header className="litt-glass sticky top-[env(safe-area-inset-top,0px)] z-30 rounded-none">
        <div className={FRAME + " flex h-16 items-center justify-between gap-4"}>
          <a href={`#${pages[0]?.id ?? ""}`} className="flex items-baseline gap-2 text-body text-fg">
            litt.md <span className="text-fg-subtle">Gallery</span>
          </a>
          <ThemeSwitch />
        </div>
        {/* The hairline sits out here so the edge fades do not mask it. */}
        <div className="border-t border-line lg:hidden">
          <NavStrip activeId={page?.id}>{pages.map((p) => navLink(p, true))}</NavStrip>
        </div>
      </header>

      <div className={FRAME + " relative grid gap-x-16 lg:grid-cols-[176px_minmax(0,1fr)] xl:grid-cols-[176px_minmax(0,1fr)_176px]"}>
        <nav aria-label="Components" className="hidden lg:block">
          {/* Its own scroller, so a short window still reaches the last group. The rows reach 12px into the gutter,
              so their labels line up with the wordmark above. */}
          <div className="sticky top-16 -mx-3 grid max-h-[calc(100svh-4rem)] content-start gap-6 overflow-y-auto pt-32 pb-12 [scrollbar-width:none]">
            {pageRuns().map((run) =>
              run.group ? (
                <div key={run.group} role="group" aria-labelledby={`nav-${run.group}`} className="grid gap-px">
                  <p id={`nav-${run.group}`} className="px-3 pb-2 text-caption text-fg-subtle">
                    {run.group}
                  </p>
                  {run.pages.map((p) => navLink(p))}
                </div>
              ) : (
                <div key={run.pages[0]!.id} className="grid gap-px">
                  {run.pages.map((p) => navLink(p))}
                </div>
              ),
            )}
          </div>
        </nav>

        <main id="main" ref={mainRef} tabIndex={-1} className="min-w-0 pt-24 outline-none lg:pt-32">
          {/* Holds the page's room while its chunk loads, so the footer does not jump. */}
          <Suspense fallback={<div aria-hidden="true" className="min-h-[60svh]" />}>
            {page ? <page.Component key={page.id} /> : <p>No pages yet.</p>}
          </Suspense>
        </main>

        {/* The rail: what shipped last, where the code and the agent docs live, and who made it. */}
        <aside aria-label="About litt.md" className="hidden xl:block">
          <div className="sticky top-16 grid h-[calc(100svh-4rem)] content-between gap-12 pt-32 pb-12">
            <div className="grid content-start gap-8">
              <div className="grid gap-2">
                <p className="text-caption text-fg-subtle">Latest release</p>
                <a href="#changelog" className="group grid gap-1 rounded-control">
                  <span className="text-small text-fg transition-colors duration-(--dur-instant) ease-litt group-hover:text-accent-text">{latest.title}</span>
                  <span className="font-mono text-caption text-fg-subtle">{latest.version}</span>
                </a>
              </div>
              <ul aria-label="Links" className="grid gap-px">
                {[
                  ["Source on GitHub", REPO_URL],
                  ["Registry", "/r/registry.json"],
                  ["Docs for agents", "/llms.txt"],
                ].map(([label, href]) => (
                  <li key={href}>
                    <a
                      href={href}
                      {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="-mx-3 flex h-control-sm items-center justify-between gap-2 rounded-control px-3 text-small text-fg-subtle transition-[background-color,color] duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg"
                    >
                      {label}
                      <ArrowUpRightIcon aria-hidden="true" className="shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            {/* The whole credit is the link, so it never relies on color alone inside a line of text. */}
            <a href={MADE_BY.href} target="_blank" rel="noopener noreferrer" className="group flex w-fit items-center gap-2 rounded-control text-small text-fg-subtle transition-colors duration-(--dur-instant) ease-litt hover:text-fg-muted">
              <Avatar name={MADE_BY.name} size="sm" decorative />
              <span>
                Made by <span className="text-fg-muted transition-colors duration-(--dur-instant) ease-litt group-hover:text-fg">{MADE_BY.name}</span>
              </span>
            </a>
          </div>
        </aside>
      </div>

      <footer className="border-t border-line">
        <div className={FRAME + " flex flex-wrap justify-between gap-4 py-8 text-caption text-fg-subtle"}>
          <span>litt.md Gallery v{__GALLERY_VERSION__} · tokens from litt.md v{__LITT_MD_VERSION__}</span>
          <a href={MADE_BY.href} target="_blank" rel="noopener noreferrer" className="group rounded-control transition-colors duration-(--dur-instant) ease-litt hover:text-fg-muted xl:hidden">
            Made by <span className="text-fg-muted transition-colors duration-(--dur-instant) ease-litt group-hover:text-fg">{MADE_BY.name}</span>
          </a>
          <span className="hidden xl:inline">Light and material stay still. Only objects move.</span>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  const route = useRoute();
  const page = pages.find((p) => p.id === route) ?? pages[0];
  useEffect(prefetchPages, []);
  return (
    /* One provider for the whole gallery, so the 300ms tooltip skip window carries across pages.
       It writes no CSS variables unless the page sets `tune`. */
    <MotionDialProvider tuning={page?.tune === true}>
      <TooltipProvider>
        <Shell page={page} />
      </TooltipProvider>
    </MotionDialProvider>
  );
}
