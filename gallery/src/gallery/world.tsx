/**
 * A world: one material as a page you arrive on (proposals/worlds.md). The three world pages (00-press, 00-flat,
 * 00-device) are this component with a different material, so the language is told once and every world is told the
 * same way: its name and who it is for, itself in use (the block it opens on, live at real size), its five
 * foundations, where its components are, and how to install it.
 *
 * - Arriving writes your look (decision 1): the page's material becomes the gallery's, from an effect, once. The
 *   current world is look.material and there is no other state, so the deck's Material control and a world page can
 *   never disagree.
 * - The Install button is the page's one accent fill (R6). The hero block comes after the header with a screen of
 *   room, so its own fill (the Agent's Allow or Send) is never on screen with it.
 * - WorldHero is shared with the overview's home hero, which shows the current world's block under the same rules.
 * - The rail's links are anchors on the page's own route: the hash is the route here, so a click scrolls and focuses
 *   the section's title and never writes the hash.
 */
import { lazy, Suspense, useEffect, useSyncExternalStore, type ComponentType, type ReactNode } from "react";
import { Button } from "@/components/button";
import { Framed } from "@/components/framed";
import { DeviceProvider } from "@/motion";
import { AppFrame } from "./kit";
import { useCustomize } from "./customize-state";
import { materialOf, type Material } from "./look";
import { Start, toStart } from "./steps";

const Dashboard = lazy(() => import("@/blocks/dashboard").then((m) => ({ default: m.Dashboard })));
const CaseStudy = lazy(() => import("@/blocks/case-study").then((m) => ({ default: m.CaseStudy })));
const AgentChat = lazy(() => import("@/blocks/agent").then((m) => ({ default: m.AgentChat })));

/** A window onto the app, as the Agent page draws it: the page's canvas with a hairline. */
function AgentFrame({ label, className, children }: { label: string; className: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className={"flex w-full min-w-0 flex-col overflow-hidden rounded-surface bg-canvas outline-1 -outline-offset-1 outline-line " + className}>
      {children}
    </div>
  );
}

/** Each hero block as its own page draws its demo, desktop and the phone frame below the sm breakpoint, named for the world so the home hero and a wall block never share a landmark name. */
const HEROES: Record<string, ComponentType<{ phone: boolean; world: string }>> = {
  dashboard: ({ phone, world }) =>
    phone ? (
      <AppFrame label={`${world} in use: the studio dashboard, phone`} phone bare className="[--gutter:var(--space-4)]">
        <Dashboard label="Phone" viewportHeight="44rem" />
      </AppFrame>
    ) : (
      <AppFrame label={`${world} in use: the studio dashboard, desktop`} bare className="[--gutter:var(--space-8)]">
        <Dashboard label="Desktop" viewportHeight="44rem" />
      </AppFrame>
    ),
  "case-study": ({ phone, world }) => (
    <AppFrame label={`${world} in use: a case study, ${phone ? "phone" : "desktop"}`} phone={phone}>
      <CaseStudy />
    </AppFrame>
  ),
  agent: ({ phone, world }) =>
    phone ? (
      <div className="mx-auto w-full min-w-0 max-w-[24.375rem]">
        <DeviceProvider mode="phone">
          <AgentFrame label={`${world} in use: the Halo build chat, phone`} className="h-176">
            <AgentChat finished label="Conversation with Litt on a phone" />
          </AgentFrame>
        </DeviceProvider>
      </div>
    ) : (
      <AgentFrame label={`${world} in use: the Halo build chat`} className="h-180">
        <AgentChat />
      </AgentFrame>
    ),
};

const PHONE = "(max-width: 639px)";
function usePhone(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(PHONE);
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    () => window.matchMedia(PHONE).matches,
    () => false,
  );
}

/** The world's block, live at real size in its frame. The blocks load on demand, so the frame holds its room meanwhile. */
export function WorldHero({ material }: { material: Material }) {
  const Hero = HEROES[materialOf(material).hero];
  const phone = usePhone();
  if (!Hero) return null;
  return (
    <Framed>
      <Suspense fallback={<div aria-hidden="true" className="min-h-176 rounded-surface bg-well" />}>
        <Hero phone={phone} world={materialOf(material).name} />
      </Suspense>
    </Framed>
  );
}

const SECTIONS = [
  { id: "hero", title: "hero-title", label: "In use" },
  { id: "foundations", title: "foundations-title", label: "Foundations" },
  { id: "components", title: "components-title", label: "Components" },
  { id: "start", title: "start-title", label: "Install" },
] as const;

const LINK =
  "flex h-control-sm items-center rounded-control px-3 text-small text-fg-muted select-none [-webkit-tap-highlight-color:transparent] " +
  "transition-colors duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg pointer-coarse:h-control-md " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/** Scroll to a section and put focus on its title, without writing the hash (the hash is the route). */
function goTo(section: (typeof SECTIONS)[number]) {
  document.getElementById(section.id)?.scrollIntoView({ block: "start" });
  document.getElementById(section.title)?.focus({ preventScroll: true });
}

function Rail({ material }: { material: Material }) {
  return (
    <nav aria-label="On this page" className="hidden lg:block">
      <ul className="sticky top-24 -mx-3 grid">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              href={`#${material}`}
              onClick={(e) => {
                e.preventDefault();
                goTo(s);
              }}
              className={LINK}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const FOUNDATIONS = [
  ["color", "Color"],
  ["type", "Type"],
  ["light", "Light"],
  ["shape", "Shape"],
  ["motion", "Motion"],
] as const;

export function World({ material }: { material: Material }) {
  const { look, setLook } = useCustomize();
  const world = materialOf(material);
  useEffect(() => {
    if (look.material !== material) setLook({ material });
    // Once per arrival: the page's material is the writer, so a later flip on the deck is left alone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material]);
  return (
    <article aria-labelledby={`page-${material}`} className="grid gap-12 pb-24 lg:grid-cols-[minmax(0,1fr)_10rem] lg:gap-x-16">
      <div className="grid min-w-0 content-start gap-24">
        <header data-arrive="head" className="grid gap-8 pt-8">
          <div className="grid gap-4">
            <h1
              id={`page-${material}`}
              tabIndex={-1}
              className="max-w-[16ch] outline-none text-[36px] leading-[40px] tracking-[-0.02em] text-balance text-fg sm:text-[56px] sm:leading-[60px]" // litt-allow: a world's name is the gallery's hero, the same exception to the 18px cap as the overview's (proposals/worlds.md, 11)
            >
              {world.name}
            </h1>
            <p className="max-w-[44ch] text-h1 font-normal text-balance text-fg-subtle">{world.tagline}</p>
            <p className="max-w-[56ch] text-small text-fg-muted">{world.audience}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="lg" onClick={toStart}>
              Install
            </Button>
            <a
              href="#overview"
              className="inline-flex h-control-lg items-center rounded-control px-button-pad-lg font-title text-(length:--control-text-lg) text-fg-muted select-none transition-colors duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Every component
            </a>
          </div>
        </header>

        <section id="hero" aria-labelledby="hero-title" data-world-hero className="grid scroll-mt-24 gap-6">
          <h2 id="hero-title" tabIndex={-1} className="text-h2 text-fg outline-none">
            {world.name}, in use
          </h2>
          <WorldHero material={material} />
        </section>

        <section id="foundations" aria-labelledby="foundations-title" className="grid scroll-mt-24 gap-6">
          <h2 id="foundations-title" tabIndex={-1} className="text-h2 text-fg outline-none">
            Foundations
          </h2>
          <ul className="grid gap-4 md:grid-cols-2">
            {FOUNDATIONS.map(([key, name]) => (
              <li key={key} className="litt-raised grid min-w-0 content-start gap-2 p-6">
                <h3 className="text-caption text-fg-subtle">{name}</h3>
                <p className="text-small text-fg-muted">{world.foundations[key]}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="components" aria-labelledby="components-title" className="grid scroll-mt-24 gap-4">
          <h2 id="components-title" tabIndex={-1} className="text-h2 text-fg outline-none">
            Every component, in {world.name}
          </h2>
          <p className="max-w-[56ch] text-small text-fg-muted">The same components wear every world. The overview shows each one live, in the material you chose.</p>
          <div className="-mx-3 flex flex-wrap gap-1">
            <a href="#overview" className={LINK}>
              Every component
            </a>
          </div>
        </section>

        <div id="start" className="scroll-mt-24">
          <Start material={material} />
        </div>
      </div>
      <Rail material={material} />
    </article>
  );
}
