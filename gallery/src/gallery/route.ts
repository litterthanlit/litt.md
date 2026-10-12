/** Hash routing: #button, #playground. The hash is the page id. */
import { startTransition, useEffect, useLayoutEffect, useRef, useState } from "react";
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

/** The current route. Navigating scrolls back to the top, as a new page would. */
export function useRoute(): string {
  const [route, setRoute] = useState(readHash);
  useEffect(() => {
    /* A transition keeps the old page up while the new page's chunk loads. */
    const onHash = () => startTransition(() => setRoute(readHash()));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
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
