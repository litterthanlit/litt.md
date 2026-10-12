/**
 * The docs under a component's stages, in this order: Use when and Skip when,
 * Usage, Props, Keyboard, Accessibility. Each is an h2 with an id, so it can be
 * linked. (The gallery routes by hash, so a bare #props would open a page called
 * "props". The ids are there for in-page use until the router learns sections.)
 *
 * Weight 400 throughout. Hierarchy comes from size (h3, body, small, caption) and
 * color (fg, fg-muted, fg-subtle).
 */
import type { ReactNode } from "react";
import { Kbd } from "@/components/kbd";
import type { PageDocs } from "../kit";
import { componentDoc } from "../docs-data";
import { CodeBlock } from "./code-block";
import { documentedExports, usageSnippet } from "./copy-prompt";
import { PropsTable } from "./props-table";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid content-start gap-6">
      <h2 id={id} className="scroll-mt-24 text-h3 text-fg text-balance">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Hairline rows, like every other list in the gallery. */
function Rows({ items, label }: { items: string[]; label?: string }) {
  return (
    <ul aria-label={label} className="max-w-[65ch] divide-y divide-line border-y border-line">
      {items.map((item) => (
        <li key={item} className="py-3 text-body text-fg-muted">
          {item}
        </li>
      ))}
    </ul>
  );
}

function Keyboard({ rows }: { rows: NonNullable<PageDocs["keyboard"]> }) {
  return (
    <table className="w-full max-w-[65ch] border-collapse text-left">
      <thead>
        <tr className="border-b border-line text-caption text-fg-subtle">
          <th scope="col" className="w-2/5 py-3 pr-6 font-normal">Keys</th>
          <th scope="col" className="py-3 font-normal">What it does</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([keys, does]) => (
          <tr key={keys.join("+") + does} className="border-b border-line align-top">
            <th scope="row" className="py-3 pr-6 text-left">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {keys.map((k, i) => (
                  <span key={k} className="inline-flex items-center gap-2">
                    {i > 0 && <span className="text-caption text-fg-subtle">or</span>}
                    <Kbd>{k}</Kbd>
                  </span>
                ))}
              </span>
            </th>
            <td className="py-3 text-small text-fg-muted">{does}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function DocsSections({ docs }: { docs: PageDocs }) {
  const components = docs.components.map(componentDoc);
  const exportDocs = documentedExports(docs, components);

  return (
    <div className="grid gap-16 border-t border-line pt-16">
      <div className="grid gap-16 sm:grid-cols-2 sm:gap-x-12">
        <Section id="use-when" title="Use when">
          <Rows items={docs.use} />
        </Section>
        <Section id="skip-when" title="Skip when">
          <Rows items={docs.skip} />
        </Section>
      </div>

      <Section id="usage" title="Usage">
        <CodeBlock code={usageSnippet(docs, components)} label="Usage code" />
      </Section>

      <Section id="props" title="Props">
        <div className="grid gap-12">
          {exportDocs.map((e) => (
            <PropsTable key={e.name} doc={e} />
          ))}
        </div>
      </Section>

      {docs.keyboard && docs.keyboard.length > 0 && (
        <Section id="keyboard" title="Keyboard">
          <Keyboard rows={docs.keyboard} />
        </Section>
      )}

      <Section id="accessibility" title="Accessibility">
        <Rows items={docs.a11y} />
      </Section>
    </div>
  );
}
