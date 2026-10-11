/** The gallery shell: glass header, page list and the page. Only the Playground tunes motion. */
import { useEffect, useRef, useState } from "react";
import { MotionDialProvider } from "@/motion";
import { pages, type PageEntry } from "./registry";
import { useRoute } from "./route";
import { TooltipProvider } from "@/components/tooltip";

type ThemeChoice = "system" | "light" | "dark";
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
    <div className="hidden overflow-hidden rounded-control shadow-[inset_0_0_0_1px_var(--line-strong)] sm:inline-flex" role="group" aria-label="Theme">
      {(["system", "light", "dark"] as ThemeChoice[]).map((t) => (
        <button
          key={t} type="button" aria-pressed={theme === t} onClick={() => choose(t)}
          className="h-control-sm cursor-pointer px-3 text-small capitalize text-fg-subtle transition-colors duration-(--dur-instant) ease-litt hover:text-fg aria-pressed:bg-surface-3 aria-pressed:text-fg"
        >
          {t}
        </button>
      ))}
    </div>
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
      <span className={"size-1.5 rounded-pill " + (p.id === page?.id ? "bg-accent" : "bg-transparent")} aria-hidden="true" />
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
        <nav aria-label="Components" className="flex overflow-x-auto border-t border-line px-[calc(var(--gutter)-12px)] [scrollbar-width:none] lg:hidden">
          {pages.map((p) => navLink(p, true))}
        </nav>
      </header>

      <div className="relative mx-auto grid max-w-wide gap-x-12 px-gutter lg:grid-cols-[176px_minmax(0,1fr)]">
        <nav aria-label="Components" className="hidden lg:block">
          <div className="sticky top-16 grid gap-1 pt-24">{pages.map((p) => navLink(p))}</div>
        </nav>

        <main id="main" ref={mainRef} tabIndex={-1} className="min-w-0 pt-16 outline-none lg:pt-24">
          {page ? <page.Component key={page.id} /> : <p>No pages yet.</p>}
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
