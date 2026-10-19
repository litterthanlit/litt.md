import { pageRuns, pages } from "../registry";
import { TierChip, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "overview",
  title: "Overview",
  order: 0,
  summary:
    "Every page here runs the motion and shape locked in litt.md's tokens. Use each component and feel the sweet spot. Light and material stay still; only objects move. The Playground is the one place to try other values.",
  tiers: ["instant", "responsive", "expressive"],
};

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Twenty-${n.toLowerCase()}`), "Thirty"];

export default function Overview() {
  const list = pages.filter((p) => p.group); // the components and patterns; Overview, Changelog and the Playground have no group
  const count = WORDS[list.length] ?? String(list.length);
  const playground = pages.find((p) => p.tune);
  return (
    <article aria-labelledby="page-overview" className="grid gap-24 pb-32">
      <header className="grid gap-4">
        <h1 id="page-overview" className="text-display text-fg text-balance">{count} components on locked tokens.</h1>
        <p className="max-w-[56ch] text-reading text-fg-muted">{meta.summary}</p>
      </header>

      <section className="grid gap-6" aria-labelledby="tiers-title">
        <h2 id="tiers-title" className="text-h4 text-fg">Three tiers</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["instant", "Hover, press, toggles. A short ease-out tween you should never notice."],
            ["responsive", "Menus, tabs, tooltips and the gliding highlight. A spring, normally without bounce."],
            ["expressive", "One signature moment per view: a dialog, a toast, the list entrance. Bounce and stagger live here."],
          ].map(([t, d]) => (
            <div key={t} className="litt-raised grid content-start justify-items-start gap-3 rounded-surface p-6">
              <TierChip tier={t as "instant"} />
              <p className="text-small text-fg-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-12" aria-labelledby="components-title">
        <h2 id="components-title" className="text-h4 text-fg">Components</h2>
        {list.length === 0 ? (
          <p className="text-small text-fg-subtle">Components are being built.</p>
        ) : (
          pageRuns(list).map((run) => (
            <div key={run.group ?? "other"} className="grid gap-4">
              {run.group && <h3 className="border-b border-line pb-3 text-small text-fg-subtle">{run.group}</h3>}
              <ul className="grid gap-px overflow-hidden rounded-surface bg-line shadow-[inset_0_0_0_1px_var(--line)] sm:grid-cols-2">
                {run.pages.map((p) => (
                  <li key={p.id} className="bg-surface-1">
                    <a href={`#${p.id}`} className="grid h-full content-start gap-3 p-6 transition-colors duration-(--dur-instant) ease-litt hover:bg-surface-2">
                      <span className="text-body text-fg">{p.title}</span>
                      <span className="text-small text-fg-subtle">{p.summary}</span>
                      <span className="flex flex-wrap gap-2">{p.tiers.map((t) => <TierChip key={t} tier={t} />)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      {playground && (
        <section className="grid gap-6" aria-labelledby="playground-title">
          <h2 id="playground-title" className="text-h4 text-fg">Try other values</h2>
          <a
            href={`#${playground.id}`}
            className="litt-raised grid content-start justify-items-start gap-3 rounded-surface p-6 transition-colors duration-(--dur-instant) ease-litt hover:bg-surface-2"
          >
            <span className="text-body text-fg">{playground.title}</span>
            <span className="max-w-[56ch] text-small text-fg-subtle">{playground.summary}</span>
            <span className="flex flex-wrap gap-2">{playground.tiers.map((t) => <TierChip key={t} tier={t} />)}</span>
          </a>
        </section>
      )}
    </article>
  );
}
