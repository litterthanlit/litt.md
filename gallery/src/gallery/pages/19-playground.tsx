/**
 * The Playground: the one page that can override the locked tokens, and each world's object (plans/018).
 *
 * Every other page runs the motion and shape from tokens.css. Here the Tune panel moves them, and "Lock it" prints
 * the tokens to paste back into litt.md. Leaving the page removes every override.
 *
 * Each world has a page of its own here, #playground/device and the rest, after the studies page in Nick's components
 * repo: the world made an object you could hold (play-object/contract.tsx; Device's is the recorder, and a world not
 * drawn yet stands on the bare body), its screen running every component in that world one take at a time, each drawn
 * as its tile in that world's body. The tape, the dial, the arrows and Menu pick a take; Play steps through them when
 * pressed, and nothing plays on load or makes a sound. The screen carries the world's data-material and a
 * MaterialProvider, and its OverlayRoot keeps every dialog, menu, tooltip and toast a take opens on the screen, in its
 * world. The gallery around it stays in its own. #playground alone opens the world your look is in.
 *
 * Type and shape are not here: the header's Customize panel tunes them on every page.
 */
import { useLayoutEffect } from "react";
import { Page, type PageMeta } from "../kit";
import { useCustomize, useDark } from "../customize-state";
import { MATERIALS, type Material } from "../look";
import { MotionPanel } from "../motion-panel";
import { PlayObject } from "../play-object/contract";
import { useRoute } from "../route";

export const meta: PageMeta = {
  id: "playground",
  title: "Playground",
  lede: "Each world as an object you could hold, running every one of its components. Turn the dials and it follows.",
  order: 40,
  tune: true,
  summary:
    "A page for each world, Press, Flat, Device, Plain, Rack and Heat, each the world made an object, Device's a recorder: its screen runs every component in that world one at a time, live and in that world's own body. Scrub the tape, turn the dial, find one from Menu or press Play. What a component opens stays on the screen, in its world. Turn the motion dials and it follows; every other page runs the locked motion from the tokens.",
  tiers: ["instant", "responsive", "expressive"],
};

const isWorld = (id: string | undefined): id is Material => MATERIALS.some((m) => m.id === id);

/** The six worlds' pages, as links: the one you are on is the current page. */
function Worlds({ current }: { current: Material }) {
  return (
    <nav aria-label="Worlds" className="-mx-2 flex flex-wrap items-center gap-1">
      {MATERIALS.map((m) => (
        <a
          key={m.id}
          href={`#playground/${m.id}`}
          aria-current={m.id === current ? "page" : undefined}
          className="litt-target inline-flex h-control-sm items-center rounded-control px-2 text-small font-title text-fg-subtle hover:text-fg aria-[current=page]:text-fg aria-[current=page]:underline aria-[current=page]:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus pointer-coarse:h-control-md"
        >
          {m.name}
        </a>
      ))}
    </nav>
  );
}

export default function PlaygroundPage() {
  const { look } = useCustomize();
  const dark = useDark();
  const route = useRoute();
  const asked = route.split("/")[1];
  const material: Material = isWorld(asked) ? asked : look.material;

  /* #playground alone is the world your look is in, at its own address. */
  useLayoutEffect(() => {
    if (!isWorld(asked) && route.startsWith(meta.id)) history.replaceState(history.state, "", `#playground/${look.material}`);
  }, [asked, route, look.material]);

  return (
    <Page meta={meta}>
      <div className="grid min-w-0 gap-12">
        <PlayObject key={material} material={material} dark={dark} lead={<Worlds current={material} />} />
        <aside id="tune" aria-label="Tune" className="max-w-xl scroll-mt-24">
          <MotionPanel />
        </aside>
      </div>
    </Page>
  );
}
