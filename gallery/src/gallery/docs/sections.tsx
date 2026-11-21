/**
 * The docs under a component's stages, in this order: Install, Use when and
 * Skip when, Usage, Props, Keyboard, Accessibility. Each is an h2 with an id, so it can be
 * linked. (The gallery routes by hash, so a bare #props would open a page called
 * "props". The ids are there for in-page use until the router learns sections.)
 *
 * Weight by role (R8): section titles at 500, small and muted (quiet, plans/024 phase 0), text at 400, table headers at the label weight.
 * Hierarchy comes from weight and ink, and spacing follows foundations.md (Text spacing):
 * sections 48px apart, blocks 16px apart, and a section's title 4px above its first content.
 */
import { useId, useState, type ReactNode } from "react";
import { ChevronDownIcon } from "@/components/icons";
import { Kbd } from "@/components/kbd";
import type { PageDocs } from "../kit";
import { useCustomize } from "../customize-state";
import { componentDoc } from "../docs-data";
import { lookNote, lookSetup, worldPageOf } from "../look";
import { CodeBlock } from "./code-block";
import { CopyButton } from "./copy";
import { documentedExports, installCommand, installCommands, REGISTRIES_ENTRY, SITE, usageSnippet, worldInstallWords } from "./copy-prompt";
import { PropsTable } from "./props-table";

/* A title takes focus after a jump from the row under the h1 (jump-row.tsx), so it has tabindex -1, as the h1 does. */
const HEADING = "-mb-3 scroll-mt-24 text-small font-title text-fg-muted text-balance outline-none";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid content-start gap-4">
      <h2 id={id} tabIndex={-1} className={HEADING}>
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * Props, which runs for thousands of pixels on a phone: below 640px it starts closed behind a button with
 * aria-expanded, and from 640px up it is open under a plain title (the button is hidden there, so no one meets a
 * control that does nothing). A jump to Props focuses its title, which opens it. Page checks open it in openVariants
 * (scripts/routes.mjs). The chevron turns on the responsive tier, as Variants' does; what it opens appears at once.
 */
function PropsSection({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panel = useId();
  return (
    <section aria-labelledby="props" className="grid content-start gap-4">
      <h2
        id="props"
        tabIndex={-1}
        onFocus={(e) => {
          if (e.target === e.currentTarget) setOpen(true);
        }}
        className={HEADING}
      >
        <button
          type="button"
          data-props=""
          aria-expanded={open}
          aria-controls={panel}
          onClick={() => setOpen((o) => !o)}
          className="group/props litt-target relative -mx-2 flex h-control-sm items-center gap-1 rounded-control px-2 select-none [-webkit-tap-highlight-color:transparent] transition-colors duration-(--dur-instant) ease-litt hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus pointer-coarse:h-control-md sm:hidden"
        >
          Props
          <ChevronDownIcon className="transition-[rotate] duration-(--dur-responsive) ease-responsive group-aria-expanded/props:rotate-180" />
        </button>
        <span className="max-sm:hidden">Props</span>
      </h2>
      <div id={panel} className={open ? "grid gap-12" : "grid gap-12 max-sm:hidden"}>
        {children}
      </div>
    </section>
  );
}

/** Hairline rows, like every other list in the gallery. */
function Rows({ items, label }: { items: string[]; label?: string }) {
  return (
    <ul aria-label={label} className="max-w-[65ch] divide-y divide-line border-y border-line">
      {items.map((item) => (
        <li key={item} className="py-3 text-small text-fg-muted">
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
          <th scope="col" className="w-2/5 py-3 pr-6">Keys</th>
          <th scope="col" className="py-3">What it does</th>
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

const mono = "font-mono text-fg-muted";

export function DocsSections({ docs, needs }: { docs: PageDocs; needs?: string }) {
  const components = docs.components.map(componentDoc);
  const exportDocs = documentedExports(docs, components);
  const { look } = useCustomize();
  /* A page in a world installs that world's own items, which draw what the page shows. */
  const world = worldPageOf(location.hash);
  const note = world ? null : lookNote(look);

  return (
    <div className="grid gap-12 border-t border-line pt-12">
      <Section id="install" title="Install">
        <CodeBlock code={installCommands(components, world?.id)} lang="shell" label="Install command" />
        {needs && <p className="max-w-[65ch] text-small text-fg-subtle">{needs}</p>}
        {world && <p className="max-w-[65ch] text-small text-fg-subtle [overflow-wrap:anywhere]">{worldInstallWords(world)}</p>}
        {/* The gallery can show a look the registry does not install, so the command alone would not give you this page. */}
        {note && (
          <div data-fun-cue="" className="flex max-w-[65ch] flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-small text-fg-subtle">{note}</p>
            <CopyButton text={lookSetup(look, SITE)} variant="ghost">
              Copy setup
            </CopyButton>
          </div>
        )}
        <p className="max-w-[65ch] text-small text-fg-subtle [overflow-wrap:anywhere]">
          {world ? (
            <>
              Every world's body in one install instead: <span className={mono}>{installCommand(components[0]!.stem)}</span>, or{" "}
              <span className={mono}>npx shadcn@latest add @litt/{components[0]!.stem}</span> with <span className={mono}>{REGISTRIES_ENTRY}</span> in
              components.json.
            </>
          ) : (
            <>
              Prefer short names? Put <span className={mono}>{REGISTRIES_ENTRY}</span> in components.json, then run{" "}
              <span className={mono}>npx shadcn@latest add @litt/{components[0]!.stem}</span>.
            </>
          )}{" "}
          Installed tokens carry a litt prefix, like <span className={mono}>--litt-accent</span> and{" "}
          <span className={mono}>bg-litt-surface-1</span>, so they never collide with yours.
        </p>
      </Section>

      <div className="grid gap-12 sm:grid-cols-2 sm:gap-x-12">
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

      <PropsSection>
        {exportDocs.map((e) => (
          <PropsTable key={e.name} doc={e} />
        ))}
      </PropsSection>

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
