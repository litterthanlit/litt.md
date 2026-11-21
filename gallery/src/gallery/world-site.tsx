/**
 * A world, closed (plans/019): everything at #<world> and under it, and nothing from another world. No gallery header or
 * sidebar; the page wears the world (<html> carries its material, from the address), and the only way out is Home,
 * litt.design/systems/.
 *
 * - #device: the player alone (play-object/contract.tsx), its screen running the world's set. Its top row is Home, the
 *   world's name, Components and About, then Index, Details and Page.
 * - #device/components: the world's gallery view (world-gallery.tsx), every component in the world as a live tile.
 * - #device/<component>: that component's page, drawn in the world, with a row back to the player.
 * - #device/about: the world's system page (world.tsx): its scenes, foundations, Only here and Install.
 * - #device/sound: Device's four voices, to hear and tune by ear (sound-page.tsx, plans/021), a page of the gallery's own.
 * - Device's top row also holds the mute (mute.tsx, plans/021): a key, and M where M is no page's own. Device starts
 *   with sound on; the mute reaches every page under it through SoundProvider. The player's mute is the recorder's,
 *   later (its body draws its own keys).
 */
import { Suspense, useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/button";
import { MoonIcon, SunIcon } from "@/components/icons";
import { useCustomize, useDark } from "./customize-state";
import { materialOf, type Material } from "./look";
import { PlayObject } from "./play-object/contract";
import { inWorld, pages } from "./registry";
import { hasNavigated, isPlayerRoute, useRoute, worldTitle } from "./route";
import { WorldContext } from "./kit";
import { World } from "./world";
import { WorldGallery } from "./world-gallery";
import { SoundProvider } from "@/motion/sound";
import { MuteKey, useMuted, useMuteKey } from "./mute";
import { SoundPage } from "./sound-page";

export const HOME = "https://www.litt.design/systems/";
const LINK =
  "litt-target relative inline-flex h-control-sm items-center rounded-control px-2 text-small font-title text-fg-muted hover:text-fg " +
  "aria-[current=page]:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus pointer-coarse:h-control-md";

/** A world's pages of the gallery's own beside about and components: Device's voices (plans/021). No page id may be one. */
const OWN_PAGES: Partial<Record<Material, string[]>> = { device: ["sound"] };

type Here = "player" | "components" | "about" | "own" | "page";

/** Home, the world's name (which leads back to its player), its gallery view and its About page. */
function Lead({ material, here }: { material: Material; here: Here }) {
  const world = materialOf(material);
  return (
    <nav aria-label={world.name} className="-mx-2 flex flex-wrap items-center gap-1">
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
      {material === "device" && (
        <a href="#device/sound" aria-current={here === "own" ? "page" : undefined} className={LINK}>
          Sound
        </a>
      )}
    </nav>
  );
}

/** One ghost control to flip between light and dark inside a closed world without adding chrome or an accent fill. */
function ThemeToggle() {
  const dark = useDark();
  const { setTheme } = useCustomize();
  const label = dark ? "Switch to light theme" : "Switch to dark theme";
  return (
    <Button
      size="sm"
      variant="ghost"
      aria-label={label}
      title={label}
      icon={dark ? <SunIcon aria-hidden="true" /> : <MoonIcon aria-hidden="true" />}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? "Light" : "Dark"}
    </Button>
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
  const own = !!sub && !!OWN_PAGES[material]?.includes(sub);
  /* #<world>/take/<id> is the player on that take (route.ts, takeOfRoute): the player reads it from the address. */
  const player = isPlayerRoute(route, material);
  const page = sub && !player && sub !== "about" && sub !== "components" && !own ? pages.find((p) => p.id === sub && p.group && p.group !== "Worlds" && !p.world && inWorld(p, material)) : undefined;
  const here: Here = player ? "player" :sub === "about" ? "about" : sub === "components" ? "components" : own ? "own" : "page";
  const main = useFocusOnArrival(route);
  const world = materialOf(material);
  const [muted, setMuted] = useMuted();
  const sounds = material === "device";
  useMuteKey(muted, setMuted, sounds);

  /* Every address names itself in the tab. The player names itself after its take (contract.tsx), so it is left out. */
  const named = here === "about" ? "About" : here === "components" ? "Components" : here === "own" ? sub.charAt(0).toUpperCase() + sub.slice(1) : page ? page.title : `Not in ${world.name}`;
  useEffect(() => {
    if (here !== "player") document.title = worldTitle(named, world.name);
  }, [here, named, world.name]);

  let body: ReactNode;
  if (here === "player")
    body = (
      <>
        <h1 tabIndex={-1} className="sr-only">
          {world.name}, its set on its {world.object}
        </h1>
        <PlayObject material={material} dark={dark} lead={<Lead material={material} here="player" />} actions={<ThemeToggle />} />
      </>
    );
  else if (here === "about") body = <World material={material} />;
  else if (here === "components") body = <WorldGallery material={material} />;
  else if (here === "own") body = <SoundPage />;
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
          <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <Lead material={material} here={here} />
            <div className="flex flex-wrap items-center gap-1">
              {sounds && <MuteKey muted={muted} setMuted={setMuted} />}
              <ThemeToggle />
            </div>
          </header>
        )}
        <main ref={main} id="main" tabIndex={-1} className="min-w-0 outline-none">
          <WorldContext.Provider value={material}>
            <SoundProvider muted={muted}>{body}</SoundProvider>
          </WorldContext.Provider>
        </main>
      </div>
    </div>
  );
}
