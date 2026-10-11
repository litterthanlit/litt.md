/** The gallery shell: glass header, page list, the page, and the motion instrument. */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MotionDialProvider, useExit, useTransition, useTravel } from "@/motion";
import { pages } from "./registry";
import { TooltipProvider } from "@/components/tooltip";
import { MotionPanel } from "./motion-panel";
import { Button } from "@/components/button";
import { SlidersIcon, XIcon } from "@/components/icons";

const readHash = () => decodeURIComponent(location.hash.replace(/^#/, "")) || pages[0]?.id || "";

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
      localStorage.setItem("litt-ui-theme", t);
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

function MobileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const travel = useTravel();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog" aria-label="Tune" aria-modal="false"
          className="litt-glass fixed inset-x-0 bottom-0 z-40 max-h-[78vh] rounded-t-surface overflow-y-auto px-gutter pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] [--glass-shadow:var(--shadow-modal)] xl:hidden"
          initial={{ opacity: 0, y: travel }}
          animate={{ opacity: 1, y: 0, transition: enter }}
          exit={{ opacity: 0, y: travel, transition: exit }}
        >
          <div className="mb-2 flex justify-end">
            <Button iconOnly size="sm" variant="ghost" aria-label="Close tune panel" onClick={onClose}>
              <XIcon />
            </Button>
          </div>
          <MotionPanel />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Shell() {
  const [route, setRoute] = useState(readHash);
  const [panelOpen, setPanelOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onHash = () => {
      setRoute(readHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const page = pages.find((p) => p.id === route) ?? pages[0];

  const navLink = (p: (typeof pages)[number], compact = false) => (
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

      <header className="litt-glass sticky top-[env(safe-area-inset-top,0px)] z-30">
        <div className="mx-auto flex h-16 max-w-wide items-center justify-between gap-4 px-gutter">
          <a href={`#${pages[0]?.id ?? ""}`} className="flex items-baseline gap-2 text-body text-fg">
            litt.md <span className="text-fg-subtle">Gallery</span>
          </a>
          <div className="flex items-center gap-3">
            <ThemeSwitch />
            <Button size="sm" variant="secondary" icon={<SlidersIcon />} className="xl:hidden" onClick={() => setPanelOpen((v) => !v)} aria-expanded={panelOpen}>
              Tune
            </Button>
          </div>
        </div>
        <nav aria-label="Components" className="flex overflow-x-auto border-t border-line px-[calc(var(--gutter)-12px)] [scrollbar-width:none] lg:hidden">
          {pages.map((p) => navLink(p, true))}
        </nav>
      </header>

      <div className="relative mx-auto grid max-w-wide gap-x-12 px-gutter lg:grid-cols-[176px_minmax(0,1fr)] xl:grid-cols-[176px_minmax(0,1fr)_304px]">
        <nav aria-label="Components" className="hidden lg:block">
          <div className="sticky top-16 grid gap-1 pt-24">{pages.map((p) => navLink(p))}</div>
        </nav>

        <main id="main" ref={mainRef} tabIndex={-1} className="min-w-0 pt-16 outline-none lg:pt-24">
          {page ? <page.Component key={page.id} /> : <p>No pages yet.</p>}
        </main>

        <aside aria-label="Tune" className="hidden xl:block">
          <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto pt-24 pb-12 [scrollbar-width:thin]">
            <MotionPanel />
          </div>
        </aside>
      </div>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-wide flex-wrap justify-between gap-4 px-gutter py-8 text-caption text-fg-subtle">
          <span>litt.md Gallery v0.1 · tokens synced from litt.md v0.4</span>
          <span>Light and material stay still. Only objects move.</span>
        </div>
      </footer>

      <MobileSheet open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  );
}

export function App() {
  return (
    <MotionDialProvider>
      {/* One provider for the whole gallery, so the 300ms skip window carries across pages. */}
      <TooltipProvider>
        <Shell />
      </TooltipProvider>
    </MotionDialProvider>
  );
}
