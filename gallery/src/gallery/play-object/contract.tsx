/**
 * The object (plans/018): a world made a thing you could hold, after the player in Nick's components repo. Its screen
 * runs the world's set, the dozen parts that show it best, one take at a time, each its own tile drawn in that world's
 * body. Every other part is in the world's gallery view (#<world>/components), one link away. One contract, a body per
 * world, as the parts have (proposals/worlds.md, decisions 13 and 15): the contract owns the takes, the roles and keys,
 * Play, Index, Details and Page, and the state. A body (bodies/<world>.tsx) only draws. A world with no body yet, or
 * whose body fails to load, draws bodies/bare.tsx.
 *
 * - The screen opens on Index: the world's introduction, the set to pick from, and a link to every component. A body
 *   may draw that list in its own grammar (body.Home: Heat's, a column of rows with the current row's part live beside
 *   it), handed the list, its keys, the pick and the link; the contract still owns all four. Beside a take, a rail of
 *   the set, unless the body's screen holds the take alone (body.rail false: Device's recorder).
 * - The selector is a slider over Index and the set, as the player's tape is. One tab stop. Right and Down go to the
 *   next take, Left and Up to the previous, wrapping through Index. The Home key goes to Index, End to the last take. A
 *   hand's change is said once in a polite live region.
 * - Play is a key the viewer presses (R4: nothing moves on load). Pressed, it runs the set, a take every 4s, wrapping.
 *   A press, key, wheel or drag on the screen, or any take picked by hand, stops it. A take change is instant in every
 *   motion.
 * - Index goes back to the list (a part is called Menu, so the key is not). Inside the object the list is called Index
 *   everywhere: the readout, the selector's first cell and the key; Home is only the top row's way out of the world
 *   (plans/audits/heat-fixes.md, finding 3). Details says what the take (or the world) is. Page opens its page.
 * - The screen is rendered once, into a host element the body's slot adopts, so a body that comes or goes never
 *   remounts what is on the screen. Nothing makes a sound (decision 2).
 */
import { Suspense, use, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/button";
import { useDevice } from "@/motion";
import { useCustomize } from "../customize-state";
import { PreviewContext } from "../kit";
import { lookAttributes, materialOf, MATERIALS, type Material } from "../look";
import { isPlayerRoute, takeAddress, takeOfRoute, worldTitle } from "../route";
import { bare } from "./bodies/bare";
import type { PlayObjectBody, PlayObjectBodyProps, PlayObjectHomeProps } from "./body";
import { PlayScreen } from "./screen";
import { shelvesOf, takesOf, type Take } from "./takes";

export type { PlayObjectBody, PlayObjectBodyProps, PlayObjectHomeProps } from "./body";

/** How long Play holds each take. */
export const TAKE_MS = 4000;

/** The six worlds' bodies, loaded on demand. A body that fails to load falls back to bare. */
const BODIES: Partial<Record<Material, () => Promise<PlayObjectBody>>> = {
  press: () => import("./bodies/press").then((m) => m.press),
  flat: () => import("./bodies/flat").then((m) => m.flat),
  device: () => import("./bodies/device").then((m) => m.device),
  plain: () => import("./bodies/plain").then((m) => m.plain),
  rack: () => import("./bodies/rack").then((m) => m.rack),
  heat: () => import("./bodies/heat").then((m) => m.heat),
};

const bodies = new Map<Material, Promise<PlayObjectBody>>();
function bodyOf(material: Material): Promise<PlayObjectBody> {
  let p = bodies.get(material);
  if (!p) bodies.set(material, (p = (BODIES[material]?.() ?? Promise.resolve(bare)).catch(() => bare)));
  return p;
}

/** The element the screen's host lives in while this body shows. */
function ScreenSlot({ host }: { host: HTMLElement }) {
  const slot = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = slot.current!;
    el.append(host);
    return () => {
      if (host.parentNode === el) el.removeChild(host);
    };
  }, [host]);
  return <div ref={slot} className="contents" />;
}

type Props = {
  material: Material;
  dark: boolean;
  /** What leads the object's top row, before Index, Details and Page: the world's own nav. */
  lead?: ReactNode;
  /** World-level controls placed before Index, Details and Page (so Page stays last before the selector). */
  actions?: ReactNode;
};

/** The world's object. Key it by world, so each world starts on its first take. */
export function PlayObject(props: Props) {
  return (
    <Suspense fallback={<div className="min-h-[clamp(30rem,calc(100dvh-22rem),46rem)]" />}>
      <Loaded {...props} />
    </Suspense>
  );
}

function Loaded({ material, dark, lead, actions }: Props) {
  const body = use(bodyOf(material));
  const takes = takesOf(material);
  const shelves = shelvesOf(material);
  const total = shelves.reduce((t, s) => t + s.pages.length, 0);
  const world = materialOf(material);
  const { look } = useCustomize();
  const { compact } = useDevice();
  const id = useId();
  /* null is Index: the world's introduction and its set, inside the screen. A world opens there, or on the take its
     address names (#<world>/take/<id>, route.ts), so Back from a take's page returns to it. */
  const fromAddress = () => {
    const i = takes.findIndex((t) => t.id === takeOfRoute(location.hash));
    return i < 0 ? null : i;
  };
  const [at, setAt] = useState<number | null>(fromAddress);
  const [playing, setPlaying] = useState(false);
  const [said, setSaid] = useState("");
  const [details, setDetails] = useState(false);
  /* On a body's own Index (body.Home), the row under the keys or the pointer, whose part is live beside the list. */
  const [cue, setCue] = useState(0);
  /* The row under the pointer now, or null: a body may draw it apart from the current row. */
  const [pointer, setPointer] = useState<number | null>(null);
  const rows = useRef<(HTMLButtonElement | null)[]>([]);
  const [host] = useState(() => Object.assign(document.createElement("div"), { className: "contents" }));
  const n = takes.length;
  const take = at === null ? null : takes[at]!;
  const pad = (i: number) => String(i).padStart(Math.max(2, String(n).length), "0");
  const homeText = `Index, ${n} in the set`;

  /* Every world's body loads in the background, so the next world finds its body ready. */
  useEffect(() => {
    for (const m of MATERIALS) void bodyOf(m.id);
  }, []);

  /* The take is in the address: replaced as the hand or Play steps, never pushed, so Back leaves the player in one step.
     Only while the address is this player's: a link away (Page) has already put its own address in. */
  const takeId = at === null ? null : (takes[at]?.id ?? null);
  useEffect(() => {
    if (!isPlayerRoute(location.hash, material)) return;
    const want = takeAddress(material, takeId);
    if (location.hash !== want) history.replaceState(history.state, "", `${location.pathname}${location.search}${want}`);
  }, [material, takeId]);
  /* And read back when the address moves under the player: the world's name in the top row (#<world>) opens Index. A
     move of the address is a hand's pick, as any other: through go, so Play stops (the top row is outside the screen,
     whose hand stops it), Index's current row is the take just left, and the change is said. Through a ref, so the
     listener never reads a stale place. */
  const picked = useRef<(to: number | null) => void>(() => {});
  useEffect(() => {
    const read = () => {
      if (isPlayerRoute(location.hash, material)) picked.current(fromAddress());
    };
    window.addEventListener("hashchange", read);
    window.addEventListener("popstate", read);
    return () => {
      window.removeEventListener("hashchange", read);
      window.removeEventListener("popstate", read);
    };
  }, [material, takes]);

  /* Play runs the set: the next take every TAKE_MS, wrapping, until a hand stops it. From Home it starts at the first. */
  useEffect(() => {
    if (!playing || !n) return;
    const next = (i: number | null) => (i === null ? 0 : (i + 1) % n);
    setAt(next);
    const t = setInterval(() => setAt(next), TAKE_MS);
    return () => clearInterval(t);
  }, [playing, n]);

  /* A hand on the screen stops Play: a press, a key, a wheel. */
  useEffect(() => {
    if (!playing) return;
    const stop = () => setPlaying(false);
    const opts = { capture: true } as const;
    host.addEventListener("pointerdown", stop, opts);
    host.addEventListener("keydown", stop, opts);
    host.addEventListener("wheel", stop, opts);
    return () => {
      host.removeEventListener("pointerdown", stop, opts);
      host.removeEventListener("keydown", stop, opts);
      host.removeEventListener("wheel", stop, opts);
    };
  }, [playing, host]);

  /** A place picked by hand, a take or Index: Play stops, and the change is said. */
  const go = (to: number | null) => {
    setPlaying(false);
    if (to === at) return;
    /* Back to Index, the list's current row is the take just shown. */
    if (to === null && at !== null) setCue(at);
    setAt(to);
    setSaid(to === null ? homeText : `${takes[to]!.title}, ${to + 1} of ${n}`);
  };
  picked.current = go;
  /** The place `by` along the cycle Index, take 0 … take n-1, wrapping. */
  const along = (by: number) => {
    const k = ((((at === null ? 0 : at + 1) + by) % (n + 1)) + n + 1) % (n + 1);
    return k === 0 ? null : k - 1;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const to: Record<string, number | null> = {
      ArrowRight: along(1),
      ArrowDown: along(1),
      ArrowLeft: along(-1),
      ArrowUp: along(-1),
      Home: null,
      End: n - 1,
    };
    if (!(e.key in to)) return;
    e.preventDefault();
    go(to[e.key]!);
  };

  const where = body.name === "bare" ? `in ${world.name}` : `in ${world.name}, on its ${world.object}`;

  /* The tab names the take showing, so the player never shares a title with the take's own page ("Poll · Press"). */
  const titled = `${take ? take.title : "Index"}, on the ${body.name === "bare" ? "player" : world.object}`;
  useEffect(() => {
    document.title = worldTitle(titled, world.name);
  }, [titled, world.name]);
  const here = take ? `#${material}/${take.id}` : `#${material}/about`;

  const bodyProps: PlayObjectBodyProps = {
    world,
    takes,
    at,
    selector: {
      role: "slider",
      tabIndex: 0,
      "aria-label": "Take",
      "aria-valuemin": 0,
      "aria-valuemax": n,
      "aria-valuenow": at === null ? 0 : at + 1,
      "aria-valuetext": take ? `${take.title}, ${at! + 1} of ${n}` : homeText,
      "aria-orientation": "horizontal",
      onKeyDown,
    },
    pick: go,
    step: (by) => ({ type: "button", tabIndex: -1, "aria-label": by > 0 ? "Next" : "Previous", onClick: () => go(along(by)) }),
    index: { type: "button", tabIndex: -1, "aria-label": "Index", "data-play-to": "index", onClick: () => go(null) },
    everything: { href: `#${material}/components`, tabIndex: -1, "aria-label": `Every component in ${world.name}` },
    turn: (by) => go(along(by)),
    play: { type: "button", "aria-label": "Play", "aria-pressed": playing, onClick: () => setPlaying((p) => !p) },
    readout: {
      count: `${pad(at === null ? 0 : at + 1)} / ${pad(n)}`,
      group: take ? take.group : null,
      title: take ? take.title : "Index",
      props: { "data-play-readout": "", "aria-hidden": true },
    },
    screen: <ScreenSlot host={host} />,
    compact,
  };

  /* A body's own Index: the contract owns the list, its order, its keys and what each row opens; the body only draws. */
  const cued = takes[Math.min(cue, n - 1)];
  /* On a phone the live part is drawn above the list only where the body asks for it (body.phonePart). */
  const livePart = !compact || body.phonePart === "above";
  const homeProps: PlayObjectHomeProps | null =
    body.Home && cued
      ? {
          world,
          takes,
          current: cue,
          pointer,
          list: { "aria-label": `The set in ${world.name}`, "data-play-index": "" },
          row: (i) => ({
            type: "button",
            ref: (el: HTMLButtonElement | null) => void (rows.current[i] = el),
            tabIndex: i === cue ? 0 : -1,
            "data-current": i === cue ? "" : undefined,
            "data-pointer": i === pointer ? "" : undefined,
            onClick: () => go(i),
            onFocus: () => setCue(i),
            onPointerEnter: () => (setCue(i), setPointer(i)),
            onPointerLeave: () => setPointer((p) => (p === i ? null : p)),
            onKeyDown: (e) => {
              const to = ({ ArrowDown: (i + 1) % n, ArrowUp: (i - 1 + n) % n, Home: 0, End: n - 1 } as Record<string, number>)[e.key];
              if (to === undefined) return;
              e.preventDefault();
              setCue(to);
              rows.current[to]?.focus();
            },
          }),
          everything: { href: `#${material}/components`, "data-play-everything": "", children: `Every component, ${total} in ${shelves.length} groups` },
          part: ({ scale = 1, className = "" } = {}) =>
            livePart ? (
              <div key={cued.id} data-play-live={cued.id} aria-label={`${cued.title}, live`} role="group" className={"grid w-full min-w-0 justify-items-center " + className}>
                {/* zoom, not a transform, so the part's box, its hit areas and its overlays scale with what is drawn. */}
                <div className="grid w-full min-w-0 justify-items-center" style={scale === 1 ? undefined : { zoom: scale }}>
                  <PreviewContext.Provider value="tile">
                    <Suspense fallback={null}>
                      <cued.Component />
                    </Suspense>
                  </PreviewContext.Provider>
                </div>
              </div>
            ) : null,
          compact,
        }
      : null;

  const LINK =
    "litt-target relative inline-flex h-control-sm items-center rounded-control px-control-pad-sm text-small font-title text-fg-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus pointer-coarse:h-control-md";

  return (
    <div {...lookAttributes({ accent: look.accent, material }, dark)} data-play-object={body.name} className="grid min-w-0 gap-4 bg-transparent">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {lead}
        <div className="flex flex-wrap items-center gap-1">
          {actions}
          <Button size="sm" variant="ghost" data-play-to="index" aria-current={at === null ? "page" : undefined} onClick={() => go(null)}>
            Index
          </Button>
          <Button size="sm" variant="ghost" aria-expanded={details} aria-controls={`${id}-details`} onClick={() => (setPlaying(false), setDetails((d) => !d))}>
            Details
          </Button>
          <a href={here} className={LINK}>
            Page
          </a>
        </div>
      </div>
      <body.Body {...bodyProps} />
      {createPortal(
        <PlayScreen material={material} dark={dark} shape={body.shape(compact)} label={`${take ? take.title : "Index"} ${where}`}>
          {take ? (
            <div className="flex h-full min-h-0">
              {!compact && body.rail && <Rail material={material} takes={takes} total={total} at={at!} open={go} />}
              <div key={take.id} data-play-take={take.id} className="grid h-full min-w-0 flex-1 overflow-auto overscroll-contain p-6 sm:p-10">
                <div className="m-auto grid w-full max-w-2xl min-w-0 justify-items-center">
                  <PreviewContext.Provider value="tile">
                    <Suspense fallback={null}>
                      <take.Component />
                    </Suspense>
                  </PreviewContext.Provider>
                </div>
              </div>
            </div>
          ) : body.Home && homeProps ? (
            <div data-play-take="home" data-play-home="body" className="h-full min-h-0">
              <body.Home {...homeProps} />
            </div>
          ) : (
            <HomeView material={material} takes={takes} total={total} groups={shelves.length} open={go} />
          )}
          {details && (
            <section id={`${id}-details`} aria-label={`About ${take ? take.title : world.name}`} className="litt-raised absolute inset-x-4 bottom-4 grid gap-2 rounded-surface p-5 text-fg">
              <h2 className="text-body text-fg">{take ? take.title : world.name}</h2>
              <p className="text-small text-fg-muted">{take ? take.lede : `${world.tagline} ${world.audience}`}</p>
              <a href={here} className="text-small text-accent-text underline underline-offset-4">
                {take ? `Open the ${take.title} page` : `About ${world.name}`}
              </a>
            </section>
          )}
        </PlayScreen>,
        host,
      )}
      <p role="status" aria-live="polite" aria-atomic className="sr-only">
        {said}
      </p>
    </div>
  );
}

const RAIL_ROW =
  "litt-target relative flex h-control-sm w-full cursor-pointer items-center rounded-control px-2 text-left text-small " +
  "hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus pointer-coarse:h-control-md";

/**
 * The menu, always there while a part shows (Nick, 2026-11-16): a slim rail on the screen's left, the set in the quiet
 * ink and the one showing in the ink, then a link to every component at its foot. Under the hand or the keys it comes
 * to the full ink.
 */
function Rail({ material, takes, total, at, open }: { material: Material; takes: Take[]; total: number; at: number; open: (i: number) => void }) {
  const world = materialOf(material);
  return (
    <nav
      aria-label={`The set in ${world.name}`}
      data-play-rail=""
      className="flex w-48 shrink-0 flex-col gap-4 overflow-auto overscroll-contain border-r border-line px-2 py-4 text-fg-subtle hover:text-fg-muted focus-within:text-fg-muted"
    >
      <ul className="grid">
        {takes.map((t, i) => (
          <li key={t.id}>
            <button type="button" aria-current={i === at ? "page" : undefined} className={RAIL_ROW + (i === at ? " text-fg" : "")} onClick={() => open(i)}>
              {t.title}
            </button>
          </li>
        ))}
      </ul>
      <a href={`#${material}/components`} className={RAIL_ROW + " mt-auto justify-between gap-2"}>
        Every component
        <span className="text-caption tabular-nums">{total}</span>
      </a>
    </nav>
  );
}

const ROW =
  "litt-target relative grid w-full cursor-pointer content-start gap-0.5 rounded-control px-3 py-2 text-left in-[[data-material=flat]]:gap-1 in-[[data-material=flat]]:py-3 " +
  "hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

/**
 * Home, inside the screen (Nick, 2026-11-15, after design.how's systems): the world's name and line, then the set to
 * pick from, each part with its one line, then the way to every component in the world. A row's name is the thing to
 * press, so it takes the title weight in the ink, and its line the reading weight in the muted ink; rows hold to their
 * tops, so a line that wraps never lifts its name above its neighbours' (plans/audits/heat-fixes.md, finding 6).
 *
 * Under Flat (plans/024, Flat, leftovers) nothing on Home is under body size, and Home fills the screen: the set gets
 * room to breathe and the way to every component sits at its foot. Every other world draws it as it was.
 */
const FLAT_HOME = {
  view: "in-[[data-material=flat]]:grid-rows-[auto_auto_minmax(0,1fr)] in-[[data-material=flat]]:gap-10",
  name: "in-[[data-material=flat]]:text-h1",
  audience: "in-[[data-material=flat]]:text-body in-[[data-material=flat]]:text-fg-muted",
  title: "in-[[data-material=flat]]:text-body",
  lede: "in-[[data-material=flat]]:text-body in-[[data-material=flat]]:text-fg-muted",
  everything: "in-[[data-material=flat]]:self-end in-[[data-material=flat]]:text-body",
};

function HomeView({ material, takes, total, groups, open }: { material: Material; takes: Take[]; total: number; groups: number; open: (i: number) => void }) {
  const world = materialOf(material);
  return (
    <div data-play-take="home" data-play-home="contract" className={"grid h-full min-h-0 content-start gap-8 overflow-auto overscroll-contain p-6 sm:p-10 " + FLAT_HOME.view}>
      <header className="grid gap-2">
        <h2 className={"text-h3 text-fg " + FLAT_HOME.name}>{world.name}</h2>
        <p className="max-w-[48ch] text-body text-fg-muted">{world.tagline}</p>
        <p className={"max-w-[56ch] text-small text-fg-subtle " + FLAT_HOME.audience}>{world.audience}</p>
      </header>
      <nav aria-label={`The set in ${world.name}`} data-play-index="" className="-mx-3">
        <ul className="grid gap-x-6 md:grid-cols-2 lg:grid-cols-3">
          {takes.map((t, i) => (
            <li key={t.id} className="grid min-w-0">
              <button type="button" aria-describedby={`set-${material}-${t.id}`} className={ROW} onClick={() => open(i)}>
                <span className={"text-small font-title text-fg " + FLAT_HOME.title}>{t.title}</span>
                <span id={`set-${material}-${t.id}`} aria-hidden="true" className={"line-clamp-2 text-caption font-normal text-fg-muted " + FLAT_HOME.lede}>
                  {t.lede}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <a
        href={`#${material}/components`}
        data-play-everything=""
        className={"litt-target relative justify-self-start rounded-control text-small text-fg underline decoration-line-strong underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " + FLAT_HOME.everything}
      >
        Every component, {total} in {groups} groups
      </a>
    </div>
  );
}
