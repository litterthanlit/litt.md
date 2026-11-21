/**
 * The study layer (proposals/worlds.md, unit 2): draws a page's PageStudy after its stages, as sections that match
 * About's. In order: Anatomy, How it moves (meta.mechanism, or the world's own in meta.movesByWorld), States, Replay, Source. (Under each material left with plans/019: a world shows only itself.) The contract
 * is the type in kit.tsx; the callouts are in study-anatomy.tsx. Nothing here moves on its own.
 */
import { Fragment, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/button";
import { CodeBlock } from "@/components/code-block";
import lock from "../../registry.lock.json";
import { lineIn, partsIn, STATES, WorldContext, type PageDocs, type PageMeta, type PageStudy } from "./kit";
import { Anatomy, FILL_WRAP, STAGE_BOX } from "./study-anatomy";

const sources = import.meta.glob<string>("../components/*.tsx", { query: "?raw", import: "default" });

function Section({ id, title, flush = false, children }: { id: string; title: string; flush?: boolean; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
      <h2 id={id} className={"text-h3 text-fg " + (flush ? "" : "-mb-3")}>{title}</h2>
      {children}
    </section>
  );
}

function States({ states }: { states: PageStudy["states"] }) {
  const present = STATES.filter((s) => states[s] !== undefined);
  if (!present.length) return null;
  return (
    <div className={STAGE_BOX + " min-h-48"}>
      {/* Each state gets a column that grows, so an object that takes its width (a slide to confirm) has a tray to draw. */}
      <div className="flex flex-wrap items-end justify-center gap-8">
        {present.map((s) => (
          <figure key={s} className="m-0 grid min-w-0 flex-1 basis-56 justify-items-center gap-3">
            <div className={FILL_WRAP}>{states[s]}</div>
            <figcaption className="text-caption text-fg-subtle">{s}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/* Nothing moves on its own (R4): until the first press the stage holds the object at rest, and each press mounts
   run(n) afresh, so an overlay's replay never opens on page load or takes focus from a reader who did not ask. */
function Replay({ object, replay }: { object: ReactNode; replay: NonNullable<PageStudy["replay"]> }) {
  const [n, setN] = useState(0);
  return (
    <div className="grid gap-6">
      <div className={STAGE_BOX + " min-h-80 place-items-center"}>
        <div className={FILL_WRAP}>{n === 0 ? object : <Fragment key={n}>{replay.run(n)}</Fragment>}</div>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-[60ch] text-small text-fg-subtle">{replay.caption}</p>
        <Button size="sm" variant="secondary" onClick={() => setN((v) => v + 1)}>
          {replay.label}
        </Button>
      </div>
    </div>
  );
}

/** The registry file as it installs, loaded when the section nears the screen or when asked. */
function Source({ stem, headingId }: { stem: string; headingId: string }) {
  const load = sources[`../components/${stem}.tsx`];
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [want, setWant] = useState(false);
  const panel = headingId + "-code";
  const version = (lock.items as Record<string, { version: string } | undefined>)[stem]?.version;

  useEffect(() => {
    const el = root.current;
    if (!el || want) return;
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && setWant(true), { rootMargin: "400px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [want]);

  useEffect(() => {
    if (!(want || open) || !load || code !== null || failed) return;
    let live = true;
    load().then((c) => live && setCode(c), () => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [want, open, load, code, failed]);

  if (!load) return null;
  return (
    <section ref={root} aria-labelledby={headingId} className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h2 id={headingId} className="text-h3 text-fg">Source</h2>
          <p className="font-mono text-caption font-normal text-fg-subtle">
            components/litt/{stem}.tsx{version ? <span className="tabular-nums"> · {version}</span> : null}
          </p>
        </div>
        <Button size="sm" variant="secondary" aria-expanded={open} aria-controls={panel} onClick={() => setOpen((o) => !o)}>
          {open ? "Hide source" : "Show source"}
        </Button>
      </div>
      <div id={panel} hidden={!open} className="min-w-0">
        {open && code !== null && <CodeBlock code={code} lang="tsx" label={`${stem} source`} maxHeight="36rem" />}
        {open && code === null && !failed && <div aria-hidden="true" className="min-h-40" />}
        {open && failed && <p role="alert" className="text-small text-danger">The source could not be loaded.</p>}
      </div>
    </section>
  );
}

export function StudySections({ meta, docs, study }: { meta: PageMeta; docs?: PageDocs; study: PageStudy }) {
  const id = (part: string) => `study-${part}-${meta.id}`;
  const stem = docs?.components[0];
  /* How it moves in this world's own words (meta.movesByWorld), or the shared mechanism. */
  const world = useContext(WorldContext);
  const moves = lineIn(meta, "moves", world);
  return (
    <>
      <Section id={id("anatomy")} title="Anatomy" flush>
        <Anatomy object={study.object} parts={partsIn(study, world)} />
      </Section>
      {moves && (
        <Section id={id("mechanism")} title="How it moves">
          <p className="max-w-(--measure) text-reading text-fg-muted">{moves}</p>
        </Section>
      )}
      {STATES.some((s) => study.states[s] !== undefined) && (
        <Section id={id("states")} title="States" flush>
          <States states={study.states} />
        </Section>
      )}
      {study.replay && (
        <Section id={id("replay")} title="Replay" flush>
          <Replay object={study.object} replay={study.replay} />
        </Section>
      )}
      {stem && <Source stem={stem} headingId={id("source")} />}
    </>
  );
}
