/**
 * A world: one material as a page you arrive on (proposals/worlds.md). The world pages (00-press, 00-flat,
 * 00-device, 00-rack) are this component with a different material, so the language is told once and every world is told the
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
import { lazy, Suspense, use, useEffect, useMemo, useSyncExternalStore, type ComponentType, type ReactNode } from "react";
import { Button } from "@/components/button";
import { Framed } from "@/components/framed";
import { DeviceProvider } from "@/motion";
import { AppFrame } from "./kit";
import { useCustomize } from "./customize-state";
import { lookSetup, materialOf, type Material } from "./look";
import { onlyIn } from "./registry";
import { CopyButton } from "./docs/copy";
import { ORIGIN, Start, toStart } from "./steps";
import { scenesOf, type Scene } from "./systems";

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

/** A system page's own anchors after its scenes, in the order the page runs them. */
const TAIL = [
  { id: "foundations", title: "foundations-title", label: "Foundations" },
  { id: "only-here", title: "only-here-title", label: "Only here" },
  { id: "start", title: "start-title", label: "Install" },
] as const;

type Anchor = { id: string; title: string; label: string };

const LINK =
  "flex min-h-7 items-center rounded-control px-3 py-1 text-small text-fg-muted select-none [-webkit-tap-highlight-color:transparent] " +
  "transition-colors duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg pointer-coarse:min-h-control-md " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/** Scroll to a section and put focus on its title, without writing the hash (the hash is the route). */
function goTo(a: Anchor) {
  document.getElementById(a.id)?.scrollIntoView({ block: "start" });
  document.getElementById(a.title)?.focus({ preventScroll: true });
}

/** What a coding agent is handed for this system: the plugin, then the look's own setup (look.ts). */
function promptFor(material: Material) {
  const world = materialOf(material);
  return [
    `Build this project in litt.md's ${world.name} system: ${world.tagline} ${world.audience}`,
    "Install the litt.md plugin for Claude Code, so you have the rules and the workflows:",
    "claude plugin marketplace add litterthanlit/litt.md",
    "claude plugin install litt-md@litt",
    "",
    lookSetup({ accent: "world", material, fun: false }, ORIGIN),
  ].join("\n");
}

const RAIL_HEAD = "text-small font-title text-fg";

/** The right rail: the page's anchors, then the system's install for an agent, then who made it. */
function Rail({ material, anchors }: { material: Material; anchors: Anchor[] }) {
  const prompt = useMemo(() => promptFor(material), [material]);
  return (
    <aside aria-label={`${materialOf(material).name}, on this page`} className="hidden xl:block">
      <div className="sticky top-24 grid gap-8">
        <nav aria-labelledby="rail-title" className="grid gap-2">
          <p id="rail-title" className={RAIL_HEAD}>
            On this page
          </p>
          <ul className="-mx-3 grid">
            {anchors.map((a) => (
              <li key={a.id}>
                <a
                  href={`#${material}`}
                  onClick={(e) => {
                    e.preventDefault();
                    goTo(a);
                  }}
                  className={LINK}
                >
                  {a.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="grid justify-items-start gap-2">
          <p className={RAIL_HEAD}>Install</p>
          <p className="text-small text-fg-muted">For your coding agent</p>
          <CopyButton text={prompt}>Copy prompt</CopyButton>
        </div>
        <div className="grid gap-1">
          <p className={RAIL_HEAD}>Made by</p>
          <a href="https://x.com/litterthanli7" target="_blank" rel="noopener noreferrer" className="w-fit text-small text-fg-muted underline decoration-line underline-offset-4 hover:text-fg">
            Nick
          </a>
        </div>
      </div>
    </aside>
  );
}

const FOUNDATIONS = [
  ["color", "Color"],
  ["type", "Type"],
  ["light", "Light"],
  ["shape", "Shape"],
  ["motion", "Motion"],
] as const;

/** What exists in this world alone: the abilities it brings, then the parts that are wrong anywhere else (meta.worlds). */
function OnlyHere({ material }: { material: Material }) {
  const world = materialOf(material);
  const parts = onlyIn(material);
  return (
    <section id="only-here" aria-labelledby="only-here-title" data-only-here className="grid scroll-mt-24 gap-4">
      <SectionHead id="only-here-title" title="Only here" line={parts.length ? `What exists in ${world.name} alone.` : `What exists in ${world.name} alone. No parts of its own yet.`} />
      <ul data-only-here-abilities className="grid max-w-[56ch] gap-2">
        {world.abilities.map((a) => (
          <li key={a} className="flex items-baseline gap-3 text-small text-fg-muted">
            <span aria-hidden="true" className="size-1 shrink-0 translate-y-[-0.2em] rounded-pill bg-fg-subtle forced-color-adjust-none" />
            <span>{a}</span>
          </li>
        ))}
      </ul>
      {parts.length > 0 && (
        <ul data-only-here-parts aria-label={`Parts of ${world.name}`} className="-mx-3 flex flex-wrap gap-1">
          {parts.map((p) => (
            <li key={p.id}>
              <a href={`#${p.id}`} className={LINK}>
                {p.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** A section's title and its one line. The title takes focus from the rail, so it carries a tabindex. */
function SectionHead({ id, title, line }: { id: string; title: string; line?: string }) {
  return (
    <div className="grid gap-1">
      <h2 id={id} tabIndex={-1} className="text-h2 text-fg outline-none">
        {title}
      </h2>
      {line && <p className="max-w-[56ch] text-small text-fg-muted">{line}</p>}
    </div>
  );
}

/**
 * One scene on its stage: the page's ground with a hairline, the scene centred in it at most 28rem wide. The stage is
 * a labelled group, so a screen reader hears which scene it is in.
 */
export function SceneStage({ world, scene }: { world: string; scene: Scene }) {
  const { Render } = scene;
  return (
    <div
      role="group"
      aria-label={`${world} in use: ${scene.title}`}
      className="grid min-w-0 justify-items-center rounded-surface bg-canvas px-4 py-10 outline-1 -outline-offset-1 outline-line sm:px-10 sm:py-14"
    >
      <div className="grid w-full max-w-md min-w-0">
        <Render />
      </div>
    </div>
  );
}

/** The scenes, one section each. The first is the page's hero (data-world-hero): the system at work before anything is said about it. */
function Scenes({ material, scenes }: { material: Material; scenes: Scene[] }) {
  const world = materialOf(material);
  return (
    <>
      {scenes.map((scene, i) => (
        <section key={scene.id} id={scene.id} aria-labelledby={`${scene.id}-title`} data-world-hero={i === 0 ? "" : undefined} className="grid scroll-mt-24 gap-4">
          <SectionHead id={`${scene.id}-title`} title={scene.title} line={scene.line} />
          <SceneStage world={world.name} scene={scene} />
        </section>
      ))}
    </>
  );
}

/** The page once its scenes have loaded: the anchors come from them, so the rail lists what is on the page. */
function SystemBody({ material, header }: { material: Material; header: ReactNode }) {
  const { scenes } = use(scenesOf(material));
  const anchors: Anchor[] = [...scenes.map((s) => ({ id: s.id, title: `${s.id}-title`, label: s.title })), ...TAIL];
  const world = materialOf(material);
  return (
    <>
      <div className="grid min-w-0 content-start gap-16">
        {header}
        <Scenes material={material} scenes={scenes} />

        <section id="foundations" aria-labelledby="foundations-title" className="grid scroll-mt-24 gap-4">
          <SectionHead id="foundations-title" title="Foundations" line={`What ${world.name} is made of, in five lines.`} />
          <ul className="grid">
            {FOUNDATIONS.map(([key, name]) => (
              <li key={key} className="grid min-w-0 gap-1 py-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-6">
                <h3 className="text-small font-title text-fg">{name}</h3>
                <p className="max-w-[60ch] text-small text-fg-muted">{world.foundations[key]}</p>
              </li>
            ))}
          </ul>
        </section>

        <OnlyHere material={material} />

        <div id="start" className="scroll-mt-24">
          <Start material={material} />
        </div>
      </div>
      <Rail material={material} anchors={anchors} />
    </>
  );
}

/**
 * A system: one world as its own page, after design.how's systems. The app's sidebar is the system's index (the
 * worlds, then every component in this one); the page opens on the name and its line, runs the system's scenes, then
 * its foundations, what only it has, and how to install it; the rail on the right is the page's anchors and the
 * prompt for a coding agent.
 */
export function World({ material }: { material: Material }) {
  const { look, setLook } = useCustomize();
  const world = materialOf(material);
  useEffect(() => {
    if (look.material !== material) setLook({ material });
    // Once per arrival: the page's material is the writer, so a later flip on the deck is left alone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material]);
  const header = (
    <header data-arrive="head" className="grid gap-6">
      <div className="grid gap-2">
        <h1 id={`page-${material}`} tabIndex={-1} className="text-[28px] leading-[32px] tracking-[-0.01em] text-fg outline-none" // litt-allow: a system's name is its page's hero, the same exception to the 18px cap as the overview's (proposals/worlds.md, 11)
        >
          {world.name}
        </h1>
        <p className="max-w-[48ch] text-body text-balance text-fg-muted">{world.tagline}</p>
        <p className="max-w-[56ch] text-small text-fg-subtle">{world.audience}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={toStart}>
          Install
        </Button>
        <a href="#systems" className={LINK + " h-control-md"}>
          All systems
        </a>
      </div>
    </header>
  );
  return (
    <article aria-labelledby={`page-${material}`} className="grid gap-12 pt-8 pb-24 xl:grid-cols-[minmax(0,1fr)_12rem] xl:gap-x-16">
      <Suspense
        fallback={
          <div className="grid min-w-0 content-start gap-16">
            {header}
            <div aria-hidden="true" className="min-h-176 rounded-surface bg-well" />
          </div>
        }
      >
        <SystemBody material={material} header={header} />
      </Suspense>
    </article>
  );
}
