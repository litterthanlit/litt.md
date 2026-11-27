/** Hash routing: #button, #playground. The hash is the page id. */
import { startTransition, useEffect, useLayoutEffect, useRef, useState } from "react";
import { lookSearch } from "./look";
import { inWorld, pages } from "./registry";

/** The page a visit with no hash opens: the one the path ends in, so litt.design/systems/ opens Systems, or the first. */
function homePage(): string {
  const last = location.pathname.split("/").filter(Boolean).pop();
  return pages.find((p) => p.id === last)?.id ?? pages[0]?.id ?? "";
}

/** The page id in the URL hash, or the home page. A malformed hash falls back instead of throwing. */
export function readHash(): string {
  let raw = location.hash.replace(/^#/, "");
  try {
    raw = decodeURIComponent(raw);
  } catch {
    raw = "";
  }
  const route = raw || homePage();
  const now = canonical(route);
  if (now !== route) history.replaceState(history.state, "", `${location.pathname}${location.search}#${now}`);
  return now;
}

const WORLDS = ["press", "flat", "device", "plain", "rack", "heat"];

/**
 * The player's take in its address (plans/audits/shared-fixes.md, S2): #<world> is the player on Index, and
 * #<world>/take/<id> the player on that take, written with replaceState as the hand steps (so Back never fills with
 * steps) and read on load, so Back from a part's page returns to the take it was opened from. The world stays the first
 * part of the address, so worldOfHash (look.ts), index.html's hand copy of it, canonical and routes.mjs read it as they
 * read any page in the world; a page id is one part with no slash, and no page id may be `take` (test:playground), so
 * neither can be taken for the other.
 */
export const TAKE = "take";
/** The take a player address names: "flat/take/poll" is "poll"; "flat" and any other address name none. */
export function takeOfRoute(route: string): string | null {
  const [, seg, id, ...rest] = route.replace(/^#/, "").split("/");
  return seg === TAKE && id && !rest.length ? id : null;
}
/** Whether an address is this world's player, on Index or on a take. */
export const isPlayerRoute = (route: string, world: string) => {
  const r = route.replace(/^#/, "");
  return r === world || (r.startsWith(`${world}/${TAKE}/`) && takeOfRoute(r) !== null);
};
/** The player's address on a take, or on Index (null). */
export const takeAddress = (world: string, id: string | null) => (id ? `#${world}/${TAKE}/${id}` : `#${world}`);

/** The gallery's own name, last in every title. */
export const GALLERY_NAME = "litt.md Gallery";
/** A world address's tab title: the part or page, then the world, then the gallery ("Button · Press · litt.md Gallery"),
    so a tab, a bookmark, the history list and a screen reader's page announcement tell them apart (WCAG 2.4.2). */
export const worldTitle = (what: string, world: string) => `${what} · ${world} · ${GALLERY_NAME}`;

/**
 * Where an older address lives now (plans/019): each world is closed, so a component's page is in a world. #button
 * opens #flat/button (the gallery's own world), or the first world the part is in when Flat does not hold it (#slider
 * opens #press/slider); #playground/device opens Device's player, #playground the gallery's.
 */
export function canonical(route: string): string {
  const [first, rest] = route.split(/\/(.*)/s);
  if (first === "playground") return rest && WORLDS.includes(rest) ? rest : "flat";
  const page = pages.find((p) => p.id === first);
  if (page && page.group && page.group !== "Worlds" && !page.world) return `${inWorld(page, "flat") ? "flat" : page.worlds![0]}/${route}`;
  return route;
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

let navigated = false;
/** Whether this visit has moved from the page it opened on: a page that arrives then takes focus, a first load never. */
export const hasNavigated = () => navigated;

/** The current route. Navigating scrolls back to the top, as a new page would. */
export function useRoute(): string {
  const [route, setRoute] = useState(readHash);
  useEffect(() => {
    claimEntry(false);
    /* A transition keeps the old page up while the new page's chunk loads. */
    const onHash = () => {
      navigated = true;
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
