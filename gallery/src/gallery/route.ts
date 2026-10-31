/** Hash routing: #button, #playground. The hash is the page id. */
import { startTransition, useEffect, useLayoutEffect, useRef, useState } from "react";
import { lookSearch } from "./look";
import { pages } from "./registry";

/** The page id in the URL hash, or the first page. A malformed hash falls back instead of throwing. */
export function readHash(): string {
  let raw = location.hash.replace(/^#/, "");
  try {
    raw = decodeURIComponent(raw);
  } catch {
    raw = "";
  }
  return raw || pages[0]?.id || "";
}

/* A page's query string (the Table page keeps its filters there) belongs to that page's history entry. A link to
   another page carries the query along, so a new entry drops it, all but a look from a link (look.ts), which belongs to
   the visit; an entry seen before is marked, and keeps its own, so Back brings the filters back with the page. */
const SEEN = "littSeen";
function claimEntry(dropQuery: boolean) {
  const state: unknown = history.state;
  if (state && typeof state === "object" && SEEN in state) return;
  const url = dropQuery ? location.pathname + lookSearch(location.search) + location.hash : location.href;
  history.replaceState({ ...(state && typeof state === "object" ? state : {}), [SEEN]: true }, "", url);
}

/** The current route. Navigating scrolls back to the top, as a new page would. */
export function useRoute(): string {
  const [route, setRoute] = useState(readHash);
  useEffect(() => {
    claimEntry(false);
    /* A transition keeps the old page up while the new page's chunk loads. */
    const onHash = () => {
      claimEntry(true);
      startTransition(() => setRoute(readHash()));
    };
    window.addEventListener("hashchange", onHash);
    /* Back to an entry whose query differs fires only popstate, not hashchange. */
    window.addEventListener("popstate", onHash);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onHash);
    };
  }, []);

  /* Scroll when the new page is on screen, not when the hash changes, so the old page never jumps. */
  const shown = useRef(route);
  useLayoutEffect(() => {
    if (shown.current === route) return;
    shown.current = route;
    window.scrollTo({ top: 0 });
  }, [route]);
  return route;
}
