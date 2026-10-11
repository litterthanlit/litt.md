/** Hash routing: #button, #playground. The hash is the page id. */
import { useEffect, useState } from "react";
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
    const onHash = () => {
      setRoute(readHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route;
}
