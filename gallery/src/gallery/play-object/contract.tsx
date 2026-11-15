/**
 * The object (plans/018): a world made a thing you could hold, after the player in Nick's components repo. Its screen
 * runs every component in the world, one take at a time, each its own tile drawn in that world's body. One contract,
 * a body per world, as the parts have (proposals/worlds.md, decisions 13 and 15): the contract owns the takes, the
 * roles and keys, Play, Menu, Details and Source, and the state; a body (bodies/<world>.tsx) only draws, and a world
 * with no body yet, or whose body fails to load, draws bodies/bare.tsx.
 *
 * - The selector is a slider over the takes, as the player's tape is: one tab stop; the arrows, Page Up and Down, Home
 *   and End move it, and a hand's change is said once in a polite live region.
 * - Play is a key the viewer presses (R4: nothing moves on load). Pressed, a take every 4s, wrapping; a press, key,
 *   wheel or drag on the screen, or any take picked by hand, stops it. A take change is instant in every motion.
 * - Menu finds a take by name on the screen, Details says what the take is, Source opens its page.
 * - The screen is rendered once, into a host element the body's slot adopts, so a body that comes or goes never
 *   remounts what is on the screen. Nothing makes a sound (decision 2).
 */
import { Suspense, use, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/button";
import { CommandMenu } from "@/components/command-menu";
import { useDevice } from "@/motion";
import { useCustomize } from "../customize-state";
import { PreviewContext } from "../kit";
import { lookAttributes, materialOf, MATERIALS, type Material } from "../look";
import { bare } from "./bodies/bare";
import type { PlayObjectBody, PlayObjectBodyProps } from "./body";
import { PlayScreen } from "./screen";
import { takesOf } from "./takes";

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
  const takes = takesOf(material);
  const world = materialOf(material);
  const { look } = useCustomize();
  const { compact } = useDevice();
  const id = useId();
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [said, setSaid] = useState("");
  const [menu, setMenu] = useState(false);
  const [details, setDetails] = useState(false);
  const [host] = useState(() => Object.assign(document.createElement("div"), { className: "contents" }));
  const n = takes.length;
  const take = takes[at]!;
  const digits = String(n).length;
  const pad = (i: number) => String(i).padStart(Math.max(2, digits), "0");

  /* Every world's body loads in the background, so the next world finds its body ready. */
  useEffect(() => {
    for (const m of MATERIALS) void bodyOf(m.id);
  }, []);

  /* Play: the next take every TAKE_MS, wrapping, until a hand stops it. */
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setAt((i) => (i + 1) % n), TAKE_MS);
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

  /** A take picked by hand: Play stops, and the change is said. */
  const go = (to: number) => {
    const next = ((to % n) + n) % n;
    setPlaying(false);
    if (next === at) return;
    setAt(next);
    setSaid(`${takes[next]!.title}, ${next + 1} of ${n}`);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const to = { ArrowRight: at + 1, ArrowUp: at + 1, ArrowLeft: at - 1, ArrowDown: at - 1, PageUp: at + 10, PageDown: at - 10, Home: 0, End: n - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    /* The slider stops at its ends on Page Up and Down; the arrows wrap, as the dial does. */
    go(e.key.startsWith("Page") ? Math.min(n - 1, Math.max(0, to)) : to);
  };

  const where = body.name === "bare" ? `in ${world.name}` : `in ${world.name}, on its ${world.object}`;

  const bodyProps: PlayObjectBodyProps = {
    world,
    takes,
    at,
    selector: {
      role: "slider",
      tabIndex: 0,
      "aria-label": "Components",
      "aria-valuemin": 1,
      "aria-valuemax": n,
      "aria-valuenow": at + 1,
      "aria-valuetext": `${take.title}, ${at + 1} of ${n}`,
      "aria-orientation": "horizontal",
      onKeyDown,
    },
    pick: go,
    step: (by) => ({ type: "button", tabIndex: -1, "aria-label": by > 0 ? "Next component" : "Previous component", onClick: () => go(at + by) }),
    turn: (by) => go(at + by),
    play: { type: "button", "aria-label": "Play", "aria-pressed": playing, onClick: () => setPlaying((p) => !p) },
    readout: { count: `${pad(at + 1)} / ${pad(n)}`, title: take.title, props: { "data-play-readout": "", "aria-hidden": true } },
    screen: <ScreenSlot host={host} />,
    compact,
  };

  const open = (to: boolean, set: (b: boolean) => void) => {
    setPlaying(false);
    set(to);
  };

  return (
    <div {...lookAttributes({ accent: look.accent, material }, dark)} data-play-object={body.name} className="grid min-w-0 gap-4 bg-transparent">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {lead}
        {!compact && (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" aria-haspopup="dialog" onClick={() => open(true, setMenu)}>
              Menu
            </Button>
            <Button size="sm" variant="ghost" aria-expanded={details} aria-controls={`${id}-details`} onClick={() => open(!details, setDetails)}>
              Details
            </Button>
            <a
              href={`#${take.id}`}
              className="litt-target inline-flex h-control-sm items-center rounded-control px-control-pad-sm text-small font-title text-fg-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus pointer-coarse:h-control-md"
            >
              Source
            </a>
          </div>
        )}
      </div>
      <body.Body {...bodyProps} />
      {createPortal(
        <PlayScreen material={material} dark={dark} shape={body.shape(compact)} label={`${take.title} ${where}`}>
          <div key={take.id} data-play-take={take.id} className="grid h-full overflow-auto overscroll-contain p-6 sm:p-10">
            <div className="m-auto grid w-full max-w-2xl min-w-0 justify-items-center">
              <PreviewContext.Provider value="tile">
                <Suspense fallback={null}>
                  <take.Component />
                </Suspense>
              </PreviewContext.Provider>
            </div>
          </div>
          {details && (
            <section id={`${id}-details`} aria-label={`About ${take.title}`} className="litt-raised absolute inset-x-4 bottom-4 grid gap-2 rounded-surface p-5">
              <h2 className="text-body text-fg">{take.title}</h2>
              <p className="text-small text-fg-muted">{take.lede}</p>
              <a href={`#${take.id}`} className="text-small text-accent-text underline underline-offset-4">
                Open the {take.title} page
              </a>
            </section>
          )}
          <CommandMenu
            open={menu}
            onOpenChange={setMenu}
            openedBy="pointer"
            groups={[{ id: "components", heading: `${world.name}'s components`, items: takes.map((t) => ({ id: t.id, label: t.title })) }]}
            onSelect={(item) => go(takes.findIndex((t) => t.id === item.id))}
          />
        </PlayScreen>,
        host,
      )}
      <p role="status" aria-live="polite" aria-atomic className="sr-only">
        {said}
      </p>
    </div>
  );
}
