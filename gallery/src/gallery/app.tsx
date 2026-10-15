/** The gallery shell: glass header, page list and the page. Only the Playground tunes motion. */
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { MotionDialProvider } from "@/motion";
import { pageRuns, pages, prefetchPages, type PageEntry } from "./registry";
import { useRoute } from "./route";
import { TooltipProvider } from "@/components/tooltip";
import { MonitorIcon, MoonIcon, SunIcon } from "@/components/icons";

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

  const navLink = (p: PageEntry, compact = false) => (
    <a
      key={p.id}
      href={`#${p.id}`}
      aria-current={p.id === page?.id ? "page" : undefined}
      className={
        "flex items-center gap-2 text-small transition-colors duration-(--dur-instant) ease-litt " +
        (compact ? "h-control-sm shrink-0 px-3 " : "h-8 ") +
        (p.id === page?.id ? "text-fg" : "text-fg-subtle hover:text-fg")
      }
    >
      {p.title}
    </a>
  );

  return (
    <div className="relative min-h-screen">
      <div aria-hidden="true" className="litt-lit litt-grain litt-grain-fade pointer-events-none absolute inset-x-0 top-0 h-140" />

      <button
        type="button"
        onClick={() => mainRef.current?.focus()}
        className="sr-only z-50 bg-accent px-4 py-2 text-accent-fg focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </button>

      {/* Full-bleed, so no corners: .litt-glass carries the surface radius. */}
      <header className="litt-glass sticky top-[env(safe-area-inset-top,0px)] z-30 rounded-none">
        <div className="mx-auto flex h-16 max-w-wide items-center justify-between gap-4 px-gutter">
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

      <div className="relative mx-auto grid max-w-wide gap-x-12 px-gutter lg:grid-cols-[176px_minmax(0,1fr)]">
        <nav aria-label="Components" className="hidden lg:block">
          {/* Its own scroller, so a short window still reaches the last group. */}
          <div className="sticky top-16 grid max-h-[calc(100svh-4rem)] content-start gap-6 overflow-y-auto pt-24 pb-12 [scrollbar-width:none]">
            {pageRuns().map((run) =>
              run.group ? (
                <div key={run.group} role="group" aria-labelledby={`nav-${run.group}`} className="grid gap-1">
                  <p id={`nav-${run.group}`} className="pb-1 text-caption text-fg-subtle">
                    {run.group}
                  </p>
                  {run.pages.map((p) => navLink(p))}
                </div>
              ) : (
                <div key={run.pages[0]!.id} className="grid gap-1">
                  {run.pages.map((p) => navLink(p))}
                </div>
              ),
            )}
          </div>
        </nav>

        <main id="main" ref={mainRef} tabIndex={-1} className="min-w-0 pt-16 outline-none lg:pt-24">
          {/* Holds the page's room while its chunk loads, so the footer does not jump. */}
          <Suspense fallback={<div aria-hidden="true" className="min-h-[60svh]" />}>
            {page ? <page.Component key={page.id} /> : <p>No pages yet.</p>}
          </Suspense>
        </main>
      </div>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-wide flex-wrap justify-between gap-4 px-gutter py-8 text-caption text-fg-subtle">
          <span>litt.md Gallery v{__GALLERY_VERSION__} · tokens from litt.md v{__LITT_MD_VERSION__}</span>
          <span>Light and material stay still. Only objects move.</span>
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
