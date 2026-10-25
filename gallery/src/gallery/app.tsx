/**
 * The gallery shell: glass header, page list and the page. Only the Playground
 * tunes motion; the header's Customize panel tunes type and shape on every page.
 */
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { MotionDialProvider, useFun } from "@/motion";
import { funPages, pageRuns, pages, prefetchPages, type PageEntry } from "./registry";
import { useRoute } from "./route";
import { Tooltip, TooltipProvider } from "@/components/tooltip";
import { Avatar } from "@/components/avatar";
import { Segmented } from "@/components/segmented";
import { CustomizeProvider } from "./customize-state";
import { NavPreview } from "./nav-preview";
import { MenuButton, MobileMenu } from "./mobile-menu";
import { MonitorIcon, MoonIcon, SlidersIcon, SunIcon } from "@/components/icons";

/* The panel and the popover load on their own; until then the button holds its place. */
const Customize = lazy(() => import("./customize"));
/* The language canvas (#canvas) is not a page: it takes the whole window, and only loads when asked for. */
const LanguageCanvas = lazy(() => import("../canvas/canvas"));

function CustomizeFallback() {
  return (
    <span aria-hidden="true" className="inline-flex h-control-sm items-center gap-2 px-3 text-small font-title text-fg-subtle max-sm:w-control-sm max-sm:justify-center max-sm:px-0">
      <SlidersIcon />
      <span className="max-sm:hidden">Customize</span>
    </span>
  );
}

type ThemeChoice = "system" | "light" | "dark";
const THEMES = [
  { id: "system", label: "System", Icon: MonitorIcon },
  { id: "light", label: "Light", Icon: SunIcon },
  { id: "dark", label: "Dark", Icon: MoonIcon },
] satisfies { id: ThemeChoice; label: string; Icon: typeof SunIcon }[];

/** The theme, read from the attribute the pre-paint script set, and written back with the choice. The canvas uses it too. */
export function useTheme(): [ThemeChoice, (t: ThemeChoice) => void] {
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
  return [theme, choose];
}

/* litt's own Segmented: a quiet track with the chosen segment raised in it, and native radios underneath.
   In the header, icons on a phone, where three words would crowd the wordmark; the word stays for screen readers.
   In the menu (`full`), the whole width with icons and words. */
export function ThemeSwitch({ theme, onChange, full = false }: { theme: ThemeChoice; onChange: (t: ThemeChoice) => void; full?: boolean }) {
  return (
    <Segmented
      legend="Theme"
      size={full ? "md" : "sm"}
      block={full}
      value={theme}
      onValueChange={onChange}
      options={THEMES.map(({ id, label, Icon }) => ({
        value: id,
        label: full ? (
          <span className="flex items-center gap-2">
            <Icon aria-hidden="true" />
            {label}
          </span>
        ) : (
          <>
            <Icon aria-hidden="true" className="sm:hidden" />
            <span className="max-sm:sr-only">{label}</span>
          </>
        ),
      }))}
    />
  );
}

const REPO = "https://github.com/litterthanlit/litt.md";
const MAKER = { name: "Nick", handle: "@litterthanli7", href: "https://x.com/litterthanli7", photo: `${import.meta.env.BASE_URL}nick.jpg` };

/** GitHub's mark (Octicons, MIT), in the text color. */
function GitHubMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={"size-4 shrink-0 " + className} fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

const iconLink =
  "grid size-control-sm shrink-0 place-items-center rounded-control text-fg-subtle transition-colors duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg pointer-coarse:size-control-md";

function Shell({ page }: { page: PageEntry | undefined }) {
  const mainRef = useRef<HTMLElement>(null);
  /* With fun mode on, the pages it changes come first: a Fun group after the site's own pages. They stay in their
     own groups too, so the nav never reshuffles under you. */
  const fun = useFun();
  const runs: { group?: string; pages: PageEntry[] }[] = pageRuns();
  if (fun && funPages.length) runs.splice(runs[0]?.group ? 0 : 1, 0, { group: "Fun", pages: funPages });
  const [theme, setTheme] = useTheme();
  const [menu, setMenu] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  /* Esc and the button give focus back to the button; a link moves it to the page it opened. The focus moves once
     the menu has closed, because the page is inert until then and would refuse it. */
  const focusAfter = useRef<"button" | "main" | null>(null);
  const closeMenu = useCallback((restore: boolean) => {
    focusAfter.current = restore ? "button" : "main";
    setMenu(false);
  }, []);
  useEffect(() => {
    if (menu || !focusAfter.current) return;
    (focusAfter.current === "button" ? menuButton.current : mainRef.current)?.focus({ preventScroll: true });
    focusAfter.current = null;
  }, [menu]);

  /* While the menu covers the page, the page under it is inert and does not scroll; the header stays live. */
  useEffect(() => {
    if (!menu) return;
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = before;
    };
  }, [menu]);

  /* Each page names itself in the tab, so history and screen readers can tell them apart. */
  useEffect(() => {
    document.title = !page || page.id === pages[0]?.id ? "litt.md Gallery" : `${page.title} · litt.md Gallery`;
  }, [page]);

  /* The current page wears the segmented control's selected segment: surface-1, the hairline and the
     top highlight. The others take the header's hover fill. In the sidebar the fill bleeds 12px past
     the text, so names stay aligned with the group headings. A component's name previews it on hover. */
  const navLink = (p: PageEntry, compact = false) => (
    <a
      key={p.id}
      href={`#${p.id}`}
      aria-current={p.id === page?.id ? "page" : undefined}
      data-preview={compact || !p.group ? undefined : p.id}
      className={
        "flex items-center gap-2 rounded-control px-3 text-small select-none [-webkit-tap-highlight-color:transparent] " +
        "transition-[background-color,color,box-shadow] duration-(--dur-instant) ease-litt " +
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
        (compact ? "h-control-sm shrink-0 " : "-mx-3 h-8 ") +
        (p.id === page?.id
          ? "bg-surface-1 text-fg shadow-[inset_0_0_0_1px_var(--line),var(--highlight)]"
          : "text-fg-subtle hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg")
      }
    >
      {p.title}
    </a>
  );

  return (
    <div className="relative min-h-screen">
      <button
        type="button"
        onClick={() => mainRef.current?.focus()}
        className="sr-only z-50 bg-accent px-4 py-2 font-title text-accent-fg focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </button>

      {/* Full-bleed, so no corners: .litt-glass carries the surface radius. */}
      <header className="litt-glass sticky top-[env(safe-area-inset-top,0px)] z-30 rounded-none">
        <div className="mx-auto flex h-16 max-w-wide items-center justify-between gap-4 px-gutter">
          {/* The wordmark sits in a segmented control's anatomy: the quiet track at the surface radius with
              the 4px inset, and one raised segment at the control radius, as tall as the theme switch at the
              other end of the bar, so the two ends match. */}
          <a
            href={`#${pages[0]?.id ?? ""}`}
            className="inline-grid h-control-sm rounded-surface bg-[color-mix(in_oklab,var(--fg)_5%,transparent)] p-1 shadow-[inset_0_0_0_1px_var(--line)] select-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus pointer-coarse:h-control-md"
          >
            <span className="grid place-items-center rounded-control bg-surface-1 px-control-pad-sm text-small font-title text-fg shadow-[inset_0_0_0_1px_var(--line),var(--highlight)]">
              <span className="litt-trim">litt.md</span>
            </span>
          </a>
          <div className="flex items-center gap-1 sm:gap-2">
            <Suspense fallback={<CustomizeFallback />}>
              <Customize />
            </Suspense>
            <Tooltip content="Source on GitHub">
              <a href={REPO} target="_blank" rel="noreferrer" aria-label="litt.md on GitHub" className={iconLink + " max-sm:hidden"}>
                <GitHubMark />
              </a>
            </Tooltip>
            <Tooltip content={`Made by ${MAKER.name}, ${MAKER.handle}`}>
              <a href={MAKER.href} target="_blank" rel="noreferrer" aria-label={`Made by ${MAKER.name}, ${MAKER.handle} on X`} className={iconLink + " max-sm:hidden"}>
                <Avatar name={MAKER.name} src={MAKER.photo} size="sm" decorative />
              </a>
            </Tooltip>
            <span aria-hidden="true" className="mx-1 h-5 w-px bg-line max-sm:hidden" />
            {/* On a phone the theme and GitHub live in the menu, so the bar keeps the wordmark, Customize and the menu. */}
            <div className="max-sm:hidden">
              <ThemeSwitch theme={theme} onChange={setTheme} />
            </div>
            <MenuButton open={menu} onToggle={() => (menu ? closeMenu(true) : setMenu(true))} ref={menuButton} />
          </div>
        </div>
      </header>

      <MobileMenu
        open={menu}
        onClose={closeMenu}
        current={page}
        theme={<ThemeSwitch theme={theme} onChange={setTheme} full />}
        links={[
          { label: "Source on GitHub", href: REPO, detail: "litterthanlit/litt.md", lead: <GitHubMark className="text-fg-subtle" /> },
          { label: `Made by ${MAKER.name}`, href: MAKER.href, detail: MAKER.handle, lead: <Avatar name={MAKER.name} src={MAKER.photo} size="sm" decorative /> },
        ]}
      />

      {/* A wall page (the overview) is its own way in, so it takes the sidebar's column too. */}
      <div inert={menu} className={"relative mx-auto grid max-w-wide gap-x-12 px-gutter " + (page?.wall ? "" : "lg:grid-cols-[176px_minmax(0,1fr)]")}>
        <nav aria-label="Components" className={page?.wall ? "hidden" : "hidden lg:block"}>
          <NavPreview className="h-full">
            {/* Its own scroller, so a short window still reaches the last group. It reaches 12px past the
                column on each side, so the selected fill and the focus ring are never clipped. */}
            {/* Each group is its own segment: a hairline above it, its name and count, then its pages. */}
            <div className="sticky top-16 -mx-3 grid max-h-[calc(100svh-4rem)] content-start overflow-y-auto px-3 pt-24 pb-12 [scrollbar-width:none]">
              {runs.map((run) =>
                run.group ? (
                  <div key={run.group} role="group" aria-labelledby={`nav-${run.group}`} className="grid border-t border-line py-4">
                    <p className="flex items-baseline justify-between pb-2 text-caption">
                      <span id={`nav-${run.group}`} className="text-fg-muted">{run.group}</span>
                      <span aria-hidden="true" className="font-mono font-normal text-fg-subtle tabular-nums">{run.pages.length}</span>
                    </p>
                    {run.pages.map((p) => navLink(p))}
                  </div>
                ) : (
                  <div key={run.pages[0]!.id} className="grid border-t border-line py-4 first:border-t-0 first:pt-0">
                    {run.pages.map((p) => navLink(p))}
                  </div>
                ),
              )}
            </div>
          </NavPreview>
        </nav>

        <main id="main" ref={mainRef} tabIndex={-1} className="min-w-0 pt-16 outline-none lg:pt-24">
          {/* Holds the page's room while its chunk loads, so the footer does not jump. */}
          <Suspense fallback={<div aria-hidden="true" className="min-h-[60svh]" />}>
            {page ? <page.Component key={page.id} /> : <p>No pages yet.</p>}
          </Suspense>
        </main>
      </div>

      <footer inert={menu} className="border-t border-line">
        <div className="mx-auto flex max-w-wide flex-wrap items-center justify-between gap-4 px-gutter py-8 text-caption text-fg-subtle">
          <a href={MAKER.href} target="_blank" rel="noreferrer" className="group flex items-center gap-2 transition-colors duration-(--dur-instant) ease-litt hover:text-fg">
            <Avatar name={MAKER.name} src={MAKER.photo} size="sm" decorative />
            <span>
              Made by <span className="text-fg">{MAKER.name}</span> <span className="font-normal">{MAKER.handle}</span>
            </span>
          </a>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="font-normal">litt.md Gallery v{__GALLERY_VERSION__} · tokens from litt.md v{__LITT_MD_VERSION__}</span>
            <a href={REPO} target="_blank" rel="noreferrer" className="flex items-center gap-2 transition-colors duration-(--dur-instant) ease-litt hover:text-fg">
              <GitHubMark />
              litterthanlit/litt.md
            </a>
          </div>
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
      <CustomizeProvider>
        <TooltipProvider>
          {route === "canvas" ? (
            <Suspense fallback={null}>
              <LanguageCanvas />
            </Suspense>
          ) : (
            <Shell page={page} />
          )}
        </TooltipProvider>
      </CustomizeProvider>
    </MotionDialProvider>
  );
}
