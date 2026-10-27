/**
 * Search: ⌘K, or the Search button in the header and on the overview, opens litt's own Command menu over every page
 * of the gallery and a few of the Customize choices.
 *
 * - One menu for the whole gallery, owned here and mounted by the shell. Its code (search-menu.tsx) loads the first
 *   time someone opens it, so the shell stays small.
 * - The shortcut listens in the capture phase and stops there, so a Command menu demo on the overview's wall, which
 *   binds ⌘K for itself, never opens a second menu. The Command menu's own page keeps ⌘K for its demo, which is what
 *   that page documents, and its Search button still opens the gallery's.
 */
import { createContext, lazy, Suspense, useContext, useEffect, useState, type ReactNode } from "react";
import { useDevice } from "@/motion";
import { Button } from "@/components/button";
import { SearchIcon } from "@/components/icons";
import { Kbd } from "@/components/kbd";

type OpenedBy = "keyboard" | "pointer";

const SearchMenu = lazy(() => import("./search-menu"));
const OpenSearch = createContext<(by: OpenedBy) => void>(() => {});

/** The gallery's search, for the page on screen. The Command menu's page keeps ⌘K for its own demo. */
export function SearchProvider({ pageId, children }: { pageId: string | undefined; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [openedBy, setOpenedBy] = useState<OpenedBy>("keyboard");
  const [used, setUsed] = useState(false);
  const show = (by: OpenedBy) => {
    setOpenedBy(by);
    setUsed(true);
    setOpen(true);
  };

  useEffect(() => {
    if (pageId === "command-menu") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing || !(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey || e.key.toLowerCase() !== "k") return;
      e.preventDefault();
      e.stopPropagation();
      setOpenedBy("keyboard");
      setUsed(true);
      setOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [pageId]);

  return (
    <OpenSearch.Provider value={show}>
      {children}
      {used && (
        <Suspense fallback={null}>
          <SearchMenu open={open} onOpenChange={setOpen} openedBy={openedBy} />
        </Suspense>
      )}
    </OpenSearch.Provider>
  );
}

/**
 * The button that opens search. In the header it is quiet (ghost, sm) and an icon on a phone; on the overview it is a
 * hero action beside Get started, so lg (R9), as a raised block. The ⌘K hint shows where there is a keyboard to press.
 */
export function SearchButton({ place }: { place: "header" | "hero" }) {
  const open = useContext(OpenSearch);
  const { compact, coarse } = useDevice();
  const by = (detail: number): OpenedBy => (detail === 0 ? "keyboard" : "pointer");
  if (place === "header" && compact) {
    return (
      <Button size="sm" variant="ghost" iconOnly aria-label="Search" onClick={(e) => open(by(e.detail))}>
        <SearchIcon />
      </Button>
    );
  }
  return (
    <Button
      size={place === "hero" ? "lg" : "sm"}
      variant={place === "hero" ? "secondary" : "ghost"}
      icon={<SearchIcon />}
      iconRight={coarse ? undefined : <Kbd>⌘K</Kbd>}
      aria-keyshortcuts="Meta+K Control+K"
      onClick={(e) => open(by(e.detail))}
    >
      {place === "hero" ? "Search components" : "Search"}
    </Button>
  );
}
