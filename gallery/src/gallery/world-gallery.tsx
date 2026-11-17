/**
 * A world's gallery view (#<world>/components): every component in the world, live, as the overview's wall draws them
 * (wall-tile.tsx). The player runs the world's set; this holds the rest. The groups come in the gallery's order
 * (PAGE_GROUPS), each a section under its h2 with the wall's two columns of tiles, and a row of jump links leads to
 * them. A tile's name opens its page in the world (#<world>/<id>). Nothing here links out of the world (plans/019).
 * Quiet (plans/024, phase 0): no counts and no line of explanation; a tile is the object and its name.
 */
import { useId } from "react";
import { Toaster } from "@/components/toast";
import { materialOf, type Material } from "./look";
import { shelvesOf } from "./play-object/takes";
import { TALL, WallTile } from "./wall-tile";

const JUMP =
  "flex min-h-7 items-center gap-2 rounded-control px-3 py-1 text-small text-fg-muted select-none [-webkit-tap-highlight-color:transparent] " +
  "transition-colors duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg pointer-coarse:min-h-control-md " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function WorldGallery({ material }: { material: Material }) {
  const world = materialOf(material);
  const shelves = shelvesOf(material);
  const id = useId();
  const sectionId = (k: number) => `${id}-group-${k}`;
  const titleId = (k: number) => `${id}-group-${k}-title`;
  return (
    <article aria-labelledby={`${id}-title`} className="grid gap-12 pb-24">
      <header className="grid gap-6">
        <h1 id={`${id}-title`} tabIndex={-1} className="text-h1 text-balance text-fg outline-none">
          Every component in {world.name}
        </h1>
        <nav aria-label="Groups" className="-mx-3">
          <ul className="flex flex-wrap">
            {shelves.map((s, k) => (
              <li key={s.group}>
                <a
                  href={`#${material}/components`}
                  /* Scroll to the group and put focus on its title, without writing the hash (the hash is the route). */
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(sectionId(k))?.scrollIntoView({ block: "start" });
                    document.getElementById(titleId(k))?.focus({ preventScroll: true });
                  }}
                  className={JUMP}
                >
                  {s.group}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <Toaster>
        {shelves.map((s, k) => (
          <section key={s.group} id={sectionId(k)} aria-labelledby={titleId(k)} className="grid scroll-mt-6 gap-6">
            <h2 id={titleId(k)} tabIndex={-1} className="text-small font-title text-fg-muted outline-none">
              {s.group}
            </h2>
            <ul className="grid gap-4 md:grid-flow-row-dense md:grid-cols-2">
              {s.pages.map((p) => (
                <li key={p.id} className={"grid min-w-0 " + (TALL.has(p.id) ? "md:row-span-2" : "")}>
                  <WallTile page={p} href={`#${material}/${p.id}`} heading="h3" />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </Toaster>
    </article>
  );
}
