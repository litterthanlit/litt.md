/**
 * The object (plans/018): a world made a thing you could hold, after the player in Nick's components repo. Its screen
 * runs every component in the world, one take at a time, each its own tile drawn in that world's body. One contract,
 * a body per world, as the parts have (proposals/worlds.md, decisions 13 and 15): the contract owns the takes, the
 * roles and keys, Play, Menu, Details and Source, and the state; a body (bodies/<world>.tsx) only draws, and a world
 * with no body yet, or whose body fails to load, draws bodies/bare.tsx.
 *
 * - The screen opens on Home: the world's introduction, its core set and an index of every component on its shelf (a
 *   group), after design.how's systems, so a person chooses a group, then a part.
 * - The selector is a slider over Home and the takes, as the player's tape is: one tab stop; Left and Right step within
 *   a group, Up and Down (and Page Up and Down) move a group, Home goes Home and End to the last part, and a hand's
 *   change is said once in a polite live region.
 * - Play is a key the viewer presses (R4: nothing moves on load). Pressed, it runs the core set, a part every 4s,
 *   wrapping; a press, key, wheel or drag on the screen, or any take picked by hand, stops it. A take change is instant
 *   in every motion.
 * - Menu goes back to Home, Details says what the take (or the world) is, Source opens its page.
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
import { bare } from "./bodies/bare";
import type { PlayObjectBody, PlayObjectBodyProps } from "./body";
import { PlayScreen } from "./screen";
import { scenesOf } from "../systems";
import { shelfOf, takesOf, type Shelf, type Take } from "./takes";

export type { PlayObjectBody, PlayObjectBodyProps } from "./body";

/** How long Play holds each take. */
export const TAKE_MS = 4000;

/** The bodies drawn so far, loaded on demand. A world not here, or one whose body fails to load, draws bare. */
const BODIES: Partial<Record<Material, () => Promise<PlayObjectBody>>> = {
  device: () => import("./bodies/device").then((m) => m.device),
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
  /** What leads the object's top row, before Menu, Details and Source: the page's way to the other worlds. */
  lead?: ReactNode;
};

/** The world's object. Key it by world, so each world starts on its first take. */
export function PlayObject(props: Props) {
  return (
    <Suspense fallback={<div className="min-h-[clamp(38rem,calc(100dvh-var(--header-h)-16rem),48rem)]" />}>
      <Loaded {...props} />
    </Suspense>
  );
}

function Loaded({ material, dark, lead }: Props) {
  const body = use(bodyOf(material));
  const { takes, shelves, core } = takesOf(material);
  const world = materialOf(material);
  const { look } = useCustomize();
  const { compact } = useDevice();
  const id = useId();
  /* null is Home: the world's introduction and its index, inside the screen. A world opens there. */
  const [at, setAt] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [said, setSaid] = useState("");
  const [details, setDetails] = useState(false);
  const [host] = useState(() => Object.assign(document.createElement("div"), { className: "contents" }));
  const n = takes.length;
  const S = shelves.length;
  const take = at === null ? null : takes[at]!;
  const digits = String(n).length;
  const pad = (i: number) => String(i).padStart(Math.max(2, digits), "0");

  /* Every world's body loads in the background, so the next world finds its body ready. */
  useEffect(() => {
    for (const m of MATERIALS) void bodyOf(m.id);
  }, []);

  /* Play runs the core set: the next core part every TAKE_MS, wrapping, until a hand stops it. */
  useEffect(() => {
    if (!playing || !core.length) return;
    const next = (i: number | null) => {
      const k = i === null ? -1 : core.indexOf(i);
      return core[(k + 1) % core.length]!;
    };
    setAt((i) => next(i));
    const t = setInterval(() => setAt((i) => next(i)), TAKE_MS);
    return () => clearInterval(t);
  }, [playing, core]);

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

  /** A place picked by hand, a take or Home: Play stops, and the change is said. */
  const go = (to: number | null) => {
    setPlaying(false);
    if (to === at) return;
    setAt(to);
    setSaid(to === null ? `Home, ${n} components in ${S} groups` : `${takes[to]!.title}, ${takes[to]!.group}, ${to + 1} of ${n}`);
  };
  /** The part `by` along within its group, wrapping inside the group. From Home, the first or the last part. */
  const within = (by: number) => {
    if (at === null) return by > 0 ? 0 : n - 1;
    const s = shelves[shelfOf(shelves, at)]!;
    return s.from + ((((at - s.from + by) % s.count) + s.count) % s.count);
  };
  /** The first part of the group `by` groups along, wrapping. From Home, the first group or the last. */
  const across = (by: number) => {
    const k = at === null ? (by > 0 ? -1 : 0) : shelfOf(shelves, at);
    return shelves[(((k + by) % S) + S) % S]!.from;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const to: Record<string, number | null> = {
      ArrowRight: within(1),
      ArrowLeft: within(-1),
      ArrowDown: across(1),
      PageDown: across(1),
      ArrowUp: across(-1),
      PageUp: across(-1),
      Home: null,
      End: n - 1,
    };
    if (!(e.key in to)) return;
    e.preventDefault();
    go(to[e.key]!);
  };

  const where = body.name === "bare" ? `in ${world.name}` : `in ${world.name}, on its ${world.object}`;
  const here = take ? `#${material}/${take.id}` : `#${material}/about`;

  const bodyProps: PlayObjectBodyProps = {
    world,
    takes,
    shelves,
    at,
    selector: {
      role: "slider",
      tabIndex: 0,
      "aria-label": "Components",
      "aria-valuemin": 0,
      "aria-valuemax": n,
      "aria-valuenow": at === null ? 0 : at + 1,
      "aria-valuetext": take ? `${take.title}, ${take.group}, ${at! + 1} of ${n}` : `Home, ${n} components in ${S} groups`,
      "aria-orientation": "horizontal",
      onKeyDown,
    },
    pick: go,
    step: (by) => ({ type: "button", tabIndex: -1, "aria-label": by > 0 ? "Next in the group" : "Previous in the group", onClick: () => go(within(by)) }),
    stepGroup: (by) => ({ type: "button", tabIndex: -1, "aria-label": by > 0 ? "Next group" : "Previous group", onClick: () => go(across(by)) }),
    turn: (by) => go(within(by)),
    play: { type: "button", "aria-label": "Play", "aria-pressed": playing, onClick: () => setPlaying((p) => !p) },
    readout: {
      count: `${pad(at === null ? 0 : at + 1)} / ${pad(n)}`,
      group: take ? take.group : null,
      title: take ? take.title : "Home",
      props: { "data-play-readout": "", "aria-hidden": true },
    },
    screen: <ScreenSlot host={host} />,
    compact,
  };

  const LINK =
    "litt-target inline-flex h-control-sm items-center rounded-control px-control-pad-sm text-small font-title text-fg-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus pointer-coarse:h-control-md";

  return (
    <div {...lookAttributes({ accent: look.accent, material }, dark)} data-play-object={body.name} className="grid min-w-0 gap-4 bg-transparent">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {lead}
        {!compact && (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" aria-current={at === null ? "page" : undefined} onClick={() => go(null)}>
              Menu
            </Button>
            <Button size="sm" variant="ghost" aria-expanded={details} aria-controls={`${id}-details`} onClick={() => (setPlaying(false), setDetails((d) => !d))}>
              Details
            </Button>
            <a href={here} className={LINK}>
              Source
            </a>
          </div>
        )}
      </div>
      <body.Body {...bodyProps} />
      {createPortal(
        <PlayScreen material={material} dark={dark} shape={body.shape(compact)} label={`${take ? take.title : "Home"} ${where}`}>
          {take ? (
            <div key={take.id} data-play-take={take.id} className="grid h-full overflow-auto overscroll-contain p-6 sm:p-10">
              <div className="m-auto grid w-full max-w-2xl min-w-0 justify-items-center">
                <PreviewContext.Provider value="tile">
                  <Suspense fallback={null}>
                    <take.Component />
                  </Suspense>
                </PreviewContext.Provider>
              </div>
            </div>
          ) : (
            <HomeView material={material} takes={takes} shelves={shelves} core={core} open={go} />
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

/** The world's cover scene (systems/<world>.tsx), as the Systems page shows it: still, out of reach. */
function Cover({ material }: { material: Material }) {
  const { scenes, cover } = use(scenesOf(material));
  const scene = scenes.find((s) => s.id === cover) ?? scenes[0];
  if (!scene) return null;
  return (
    <div inert aria-hidden="true" className="pointer-events-none min-w-0 origin-top">
      <scene.Render />
    </div>
  );
}

const ROW =
  "litt-target flex h-control-sm w-full cursor-pointer items-center rounded-control px-2 text-left text-small text-fg-muted " +
  "hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus pointer-coarse:h-control-md";

/**
 * Home, inside the screen (Nick, 2026-11-15, after design.how's systems): every component on its shelf in a sidebar that
 * is always there, and beside it the world's name and line, the core set to start with and its cover scene. A person
 * chooses a group, then a part. Below md the index follows the introduction.
 */
function HomeView({ material, takes, shelves, core, open }: { material: Material; takes: Take[]; shelves: Shelf[]; core: number[]; open: (i: number) => void }) {
  const world = materialOf(material);
  return (
    <div data-play-take="home" className="grid h-full min-h-0 overflow-auto overscroll-contain md:grid-cols-[15rem_minmax(0,1fr)] md:overflow-hidden">
      <nav
        aria-label={`Every component in ${world.name}`}
        data-play-index=""
        className="order-2 grid content-start gap-6 border-line p-4 md:order-1 md:overflow-auto md:overscroll-contain md:border-r md:py-6"
      >
        {shelves.map((s) => (
          <section key={s.group} data-shelf={s.group} aria-labelledby={`shelf-${material}-${s.group}`} className="grid content-start gap-1">
            <h3 id={`shelf-${material}-${s.group}`} className="flex items-baseline justify-between px-2 text-small text-fg">
              {s.group}
              <span className="text-caption font-normal text-fg-subtle tabular-nums">{s.count}</span>
            </h3>
            <ul className="grid">
              {takes.slice(s.from, s.from + s.count).map((t, k) => (
                <li key={t.id}>
                  <button type="button" className={ROW} onClick={() => open(s.from + k)}>
                    {t.title}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
      <div className="order-1 grid min-w-0 content-start gap-8 p-6 md:order-2 md:overflow-auto md:overscroll-contain sm:p-10">
        <header className="grid gap-2">
          <h2 className="text-h3 text-fg">{world.name}</h2>
          <p className="max-w-[48ch] text-body text-fg-muted">{world.tagline}</p>
          <p className="max-w-[56ch] text-small text-fg-subtle">{world.audience}</p>
        </header>
        <section aria-labelledby={`start-${material}`} className="grid gap-3">
          <h3 id={`start-${material}`} className="text-small text-fg">
            Start with
          </h3>
          <div className="flex flex-wrap gap-2">
            {core.map((i) => (
              <Button key={takes[i]!.id} size="sm" variant="secondary" onClick={() => open(i)}>
                {takes[i]!.title}
              </Button>
            ))}
          </div>
        </section>
        <div className="max-w-xl">
          <Suspense fallback={null}>
            <Cover material={material} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
