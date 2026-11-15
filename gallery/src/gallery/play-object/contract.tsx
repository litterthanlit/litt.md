/**
 * The object (plans/018): each world's own thing, holding the Playground's screen and running takes on it, one at a
 * time: the studio app, then the world's scenes. One contract, a body per world, as the parts have (proposals/worlds.md,
 * decisions 13 and 15). The contract owns the takes, the roles and keys, and the state; a body (bodies/<world>.tsx)
 * only draws, and a world with no body yet draws bodies/bare.tsx.
 *
 * - The takes are a tablist, one tab stop, and the screen is its tabpanel: arrows, Home and End change the take, and
 *   the change is said once in a polite live region.
 * - The app stays mounted while a scene shows (hidden and inert), so its screen and what was set on it survive a take
 *   change and a world switch. A scene mounts when its take is reached.
 * - The screen is rendered once, into a host element the body's slot adopts, so a world switch that swaps the body
 *   (the recorder for bare) moves the screen's DOM and never remounts the app.
 * - Nothing plays (R4; decision 1 waits on Nick) and nothing makes a sound (decision 2).
 */
import { Suspense, use, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useDevice } from "@/motion";
import { useCustomize } from "../customize-state";
import { lookAttributes, materialOf, MATERIALS, type Material } from "../look";
import { bare } from "./bodies/bare";
import { OBJECT_HEIGHT, type PlayObjectBody, type PlayObjectBodyProps } from "./body";
import { PlayScreen } from "./screen";
import { takesOf } from "./takes";

export type { PlayObjectBody, PlayObjectBodyProps } from "./body";

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

const pad = (n: number) => String(n).padStart(2, "0");

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
  /** The studio app, take 0. */
  app: ReactNode;
};

/** The world's object. Wrap the world switch that changes `material` in startTransition, so the old object stays up while a new world's body and scenes load. */
export function PlayObject(props: Props) {
  return (
    <Suspense fallback={<div className={"mx-auto w-full max-w-sm " + OBJECT_HEIGHT} />}>
      <Loaded {...props} />
    </Suspense>
  );
}

function Loaded({ material, dark, app }: Props) {
  const takes = use(takesOf(material));
  const body = use(bodyOf(material));
  const world = materialOf(material);
  const { look } = useCustomize();
  const { compact } = useDevice();
  const id = useId();
  const [picked, setPicked] = useState(0);
  const [said, setSaid] = useState("");
  const [host] = useState(() => Object.assign(document.createElement("div"), { className: "contents" }));
  const refocus = useRef(false);
  const at = Math.min(picked, takes.length - 1);
  const n = takes.length;
  const take = takes[at];
  const tabId = (i: number) => `${id}-take-${i}`;
  const panelId = `${id}-screen`;

  /* Every world's scenes and body load in the background, so a world switch finds them ready. */
  useEffect(() => {
    for (const m of MATERIALS) {
      void takesOf(m.id);
      void bodyOf(m.id);
    }
  }, []);

  useLayoutEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    document.getElementById(tabId(at))?.focus();
  });

  const go = (to: number, focus = false) => {
    const next = ((to % n) + n) % n;
    if (next === at) return;
    refocus.current = focus;
    setPicked(next);
    setSaid(`${takes[next].title}, take ${next + 1} of ${n}`);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const to = { ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: n - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    go(to, true);
  };

  const bodyProps: PlayObjectBodyProps = {
    world,
    takes,
    at,
    selector: { role: "tablist", "aria-label": "Takes", onKeyDown },
    tab: (i) => ({
      type: "button",
      role: "tab",
      id: tabId(i),
      "aria-label": takes[i].title,
      "aria-selected": i === at,
      "aria-controls": panelId,
      tabIndex: i === at ? 0 : -1,
      onClick: () => go(i),
    }),
    step: (by) => ({ type: "button", tabIndex: -1, "aria-label": by > 0 ? "Next take" : "Previous take", onClick: () => go(at + by) }),
    turn: (by) => go(at + by),
    readout: { count: `${pad(at + 1)} / ${pad(n)}`, title: take.title, props: { "data-play-readout": "", "aria-hidden": true } },
    screen: <ScreenSlot host={host} />,
    compact,
  };

  return (
    <div {...lookAttributes({ accent: look.accent, material }, dark)} data-play-object={body.name} className="bg-transparent">
      <body.Body {...bodyProps} />
      {createPortal(
        <PlayScreen
          size="phone"
          material={material}
          dark={dark}
          shape={body.shape(compact)}
          panel={{ role: "tabpanel", id: panelId, "aria-labelledby": `${tabId(at)} ${id}-where` }}
        >
          {/* The app keeps the 40px the phone's clock row gave it, so a tooltip over Search opens inside the screen. */}
          <div data-play-take="studio" hidden={at !== 0} inert={at !== 0} className="flex h-full flex-col pt-10">
            {app}
          </div>
          {take.kind === "scene" && (
            <div key={take.id} data-play-take={take.id} className="h-full overflow-y-auto overscroll-contain px-4 py-8">
              <div className="mx-auto grid max-w-md">
                <take.Render />
              </div>
            </div>
          )}
        </PlayScreen>,
        host,
      )}
      <span id={`${id}-where`} hidden>
        {body.name === "bare" ? `in ${world.name}` : `in ${world.name}, on its ${world.object}`}
      </span>
      <p role="status" aria-live="polite" aria-atomic className="sr-only">
        {said}
      </p>
    </div>
  );
}
