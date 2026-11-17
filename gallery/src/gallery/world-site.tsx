/**
 * A world, closed (plans/019): everything at #<world> and under it, and nothing from another world. No gallery header or
 * sidebar; the page wears the world (<html> carries its material, from the address), and the only way out is Home,
 * litt.design/systems/.
 *
 * - #device: the player alone (play-object/contract.tsx), its screen running the world's set. Its top row is Home, the
 *   world's name, Components and About, then Index, Details and Source.
 * - #device/components: the world's gallery view (world-gallery.tsx), every component in the world as a live tile.
 * - #device/<component>: that component's page, drawn in the world, with a row back to the player.
 * - #device/about: the world's system page (world.tsx): its scenes, foundations, Only here and Install.
 */
import { Suspense, useEffect, useRef, type ReactNode } from "react";
import { useDark } from "./customize-state";
import { materialOf, type Material } from "./look";
import { PlayObject } from "./play-object/contract";
import { inWorld, pages } from "./registry";
import { hasNavigated, useRoute } from "./route";
import { WorldContext } from "./kit";
import { World } from "./world";
import { WorldGallery } from "./world-gallery";

export const HOME = "https://www.litt.design/systems/";

const LINK =
  "litt-target inline-flex h-control-sm items-center rounded-control px-2 text-small font-title text-fg-muted hover:text-fg " +
  "aria-[current=page]:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus pointer-coarse:h-control-md";

type Here = "player" | "components" | "about" | "page";

/** Home, the world's name (which leads back to its player), its gallery view and its About page. */
function Lead({ material, here }: { material: Material; here: Here }) {
  const world = materialOf(material);
  return (
    <nav aria-label={world.name} className="-mx-2 flex items-center gap-1">
      <a href={HOME} className={LINK}>
        Home
      </a>
      <span aria-hidden="true" className="text-small text-fg-subtle">
        /
      </span>
      <a href={`#${material}`} aria-current={here === "player" ? "page" : undefined} className={LINK}>
        {world.name}
      </a>
      <a href={`#${material}/components`} aria-current={here === "components" ? "page" : undefined} className={LINK}>
        Components
      </a>
      <a href={`#${material}/about`} aria-current={here === "about" ? "page" : undefined} className={LINK}>
        About
      </a>
    </nav>
  );
}

/** Focus lands on the new page's h1 whenever the visit arrives at a page in the world, never on the first load. */
function useFocusOnArrival(route: string) {
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!hasNavigated()) return;
    window.scrollTo({ top: 0 });
    const h1 = main.current?.querySelector<HTMLElement>("h1");
    (h1 ?? main.current)?.focus({ preventScroll: true });
  }, [route]);
  return main;
}

export function WorldSite({ material }: { material: Material }) {
  const route = useRoute();
  const dark = useDark();
  const sub = route.split("/").slice(1).join("/");
  const page = sub && sub !== "about" && sub !== "components" ? pages.find((p) => p.id === sub && p.group && p.group !== "Worlds" && !p.world && inWorld(p, material)) : undefined;
  const here: Here = !sub ? "player" : sub === "about" ? "about" : sub === "components" ? "components" : "page";
  const main = useFocusOnArrival(route);
  const world = materialOf(material);

  let body: ReactNode;
  if (here === "player")
    body = (
      <>
        <h1 tabIndex={-1} className="sr-only">
          {world.name}, its set on its {world.object}
        </h1>
        <PlayObject material={material} dark={dark} lead={<Lead material={material} here="player" />} />
      </>
    );
  else if (here === "about") body = <World material={material} />;
  else if (here === "components") body = <WorldGallery material={material} />;
  else if (page)
    body = (
      <Suspense fallback={null}>
        <page.Component />
      </Suspense>
    );
  else
    body = (
      <section className="grid gap-4 py-24">
        <h1 tabIndex={-1} className="text-h3 text-fg outline-none">
          Not in {world.name}
        </h1>
        <p className="text-body text-fg-muted">
          There is no {sub} in {world.name}. <a href={`#${material}`} className="underline underline-offset-4">Open the {world.object}</a>.
        </p>
      </section>
    );

  return (
    <div data-world={material} className="min-h-dvh bg-canvas text-fg">
      <div className="mx-auto grid w-full max-w-wide gap-6 px-gutter py-6">
        {here !== "player" && (
          <header className="flex items-center justify-between gap-4">
            <Lead material={material} here={here} />
          </header>
        )}
        <main ref={main} id="main" tabIndex={-1} className="min-w-0 outline-none">
          <WorldContext.Provider value={material}>{body}</WorldContext.Provider>
        </main>
      </div>
    </div>
  );
}
