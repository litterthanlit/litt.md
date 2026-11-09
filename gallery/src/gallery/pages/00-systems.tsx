/**
 * Systems: the three worlds as three design systems, after design.how's systems. Each card is the system at work (its
 * cover scene, live in its own world but out of reach), its name and its one line; the card opens the system's page.
 * The page runs the whole width with no sidebar (meta.wall), one column like the index it is.
 */
import { Suspense, use } from "react";
import { MaterialProvider } from "@/motion";
import { PageTitle, type PageMeta } from "../kit";
import { useCustomize, useDark } from "../customize-state";
import { lookAttributes, MATERIALS, type MaterialInfo } from "../look";
import { scenesOf } from "../systems";

export const meta: PageMeta = {
  id: "systems",
  title: "Systems",
  lede: "Three worlds, one set of parts.",
  order: 0.05,
  wall: true,
  summary:
    "Press, Flat and Device, each a design system of its own: its material, its type, its light and its motion, over the same components. Open one to see it at work and install it.",
  tiers: [],
};

/** A system's cover scene in its own world, centred on its stage. It is a picture of the system here: inert, hidden from a screen reader, which hears the card's name and line. */
function Cover({ world }: { world: MaterialInfo }) {
  const { scenes, cover } = use(scenesOf(world.id));
  const { look } = useCustomize();
  const dark = useDark();
  const scene = scenes.find((s) => s.id === cover) ?? scenes[0];
  if (!scene) return null;
  const { Render } = scene;
  return (
    <div
      {...lookAttributes({ accent: look.accent, material: world.id }, dark)}
      aria-hidden="true"
      inert
      className="grid h-88 min-w-0 place-items-center overflow-hidden rounded-surface bg-canvas px-4 text-fg outline-1 -outline-offset-1 outline-line sm:px-10"
    >
      <MaterialProvider material={world.id}>
        <div className="grid w-full max-w-md min-w-0">
          <Render />
        </div>
      </MaterialProvider>
    </div>
  );
}

function Card({ world }: { world: MaterialInfo }) {
  return (
    <li>
      <a
        href={`#${world.id}`}
        className="group grid gap-3 rounded-surface select-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
      >
        <Suspense fallback={<div aria-hidden="true" className="h-88 rounded-surface bg-well" />}>
          <Cover world={world} />
        </Suspense>
        <span className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <span className="text-small font-title text-fg underline decoration-transparent underline-offset-4 transition-colors duration-(--dur-instant) ease-litt group-hover:decoration-line">
            {world.name}
          </span>
          <span className="text-small text-fg-muted">{world.line}</span>
        </span>
      </a>
    </li>
  );
}

export default function SystemsPage() {
  return (
    <article aria-labelledby="page-systems" className="mx-auto grid w-full max-w-184 gap-10 pt-8 pb-24">
      <PageTitle id="page-systems" title={meta.title} lede={meta.lede} />
      <ul aria-label="Systems" className="grid gap-14">
        {MATERIALS.map((m) => (
          <Card key={m.id} world={m} />
        ))}
      </ul>
    </article>
  );
}
