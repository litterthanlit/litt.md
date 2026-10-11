import { pages } from "../registry";
import { TierChip, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "overview",
  title: "Overview",
  order: 0,
  summary:
    "litt.md is trying motion-led. This gallery is the instrument for finding the sweet spot: move the dial, then use each component. Light and material stay still; only objects move.",
  tiers: ["instant", "responsive", "expressive"],
};

export default function Overview() {
  const list = pages.filter((p) => p.id !== meta.id);
  return (
    <article aria-labelledby="page-overview" className="grid gap-16 pb-24">
      <header className="grid gap-4">
        <h1 id="page-overview" className="text-display text-fg text-balance">Eight components, one dial.</h1>
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
            <div key={t} className="litt-raised grid content-start gap-3 rounded-surface p-6">
              <TierChip tier={t as "instant"} />
              <p className="text-small text-fg-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6" aria-labelledby="components-title">
        <h2 id="components-title" className="text-h4 text-fg">Components</h2>
        {list.length === 0 ? (
          <p className="text-small text-fg-subtle">Components are being built.</p>
        ) : (
          <ul className="grid gap-px overflow-hidden rounded-surface bg-line shadow-[inset_0_0_0_1px_var(--line)] sm:grid-cols-2">
            {list.map((p) => (
              <li key={p.id} className="bg-surface-1">
                <a href={`#${p.id}`} className="grid h-full content-start gap-3 p-6 transition-colors duration-(--dur-instant) ease-litt hover:bg-surface-2">
                  <span className="text-body text-fg">{p.title}</span>
                  <span className="text-small text-fg-subtle">{p.summary}</span>
                  <span className="flex flex-wrap gap-2">{p.tiers.map((t) => <TierChip key={t} tier={t} />)}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
