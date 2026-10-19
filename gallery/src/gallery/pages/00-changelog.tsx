import { Fragment, type ReactNode } from "react";
import { Tag } from "@/components/tag";
import { CodeBlock } from "../docs/code-block";
import { pages } from "../registry";
import type { PageMeta } from "../kit";
import changelog from "../../generated/changelog.json";

export const meta: PageMeta = {
  id: "changelog",
  title: "Changelog",
  order: 0.5,
  summary:
    "Every change to the registry, newest first. Each release is named by its date, and every file you install says which release it came from, so you can tell what changed since.",
  tiers: [],
};

type Entry = { kind: string; items: string[]; text: string; migrate?: string };
type Release = { version: string; date: string; title: string; intro: string[]; entries: Entry[] };

const KIND_LABEL: Record<string, string> = { added: "Added", changed: "Changed", fixed: "Fixed", breaking: "Breaking", removed: "Removed" };
const KIND_STATUS: Record<string, "danger" | "warning" | undefined> = { breaking: "danger", removed: "warning" };

const pageIds = new Set(pages.map((p) => p.id));

/** `code` spans in an entry's words, in mono. */
function Words({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code key={i} className="rounded-control bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] px-1 font-mono text-small text-fg">
            {part.slice(1, -1)}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/** An item name, linked to its page when it has one. */
function Item({ name }: { name: string }) {
  const body = <span className="font-mono text-small">{name}</span>;
  if (!pageIds.has(name)) return <span className="text-fg">{body}</span>;
  return (
    <a href={`#${name}`} className="rounded-control text-fg underline decoration-line-strong underline-offset-4 transition-colors duration-(--dur-instant) ease-litt hover:decoration-fg">
      {body}
    </a>
  );
}

function Items({ names }: { names: string[] }): ReactNode {
  return names.map((n, i) => (
    <Fragment key={n}>
      {i > 0 && ", "}
      <Item name={n} />
    </Fragment>
  ));
}

function ReleaseSection({ release }: { release: Release }) {
  const id = `release-${release.date}`;
  const when = new Date(release.date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return (
    <section aria-labelledby={id} className="grid content-start gap-6">
      <header className="grid gap-2">
        <h2 id={id} className="text-h3 text-fg text-balance">
          {release.title}
        </h2>
        <p className="font-mono text-caption text-fg-subtle">
          <time dateTime={release.date}>{when}</time> · {release.version}
        </p>
      </header>
      {release.intro.map((p) => (
        <p key={p} className="max-w-[65ch] text-body text-fg-muted">
          <Words text={p} />
        </p>
      ))}
      <ul aria-label={`${release.title}: changes`} className="max-w-[72ch] divide-y divide-line border-y border-line">
        {release.entries.map((e, i) => (
          <li key={i} className="grid gap-3 py-4 sm:grid-cols-[6rem_1fr] sm:gap-6">
            <span>
              <Tag status={KIND_STATUS[e.kind]}>{KIND_LABEL[e.kind] ?? e.kind}</Tag>
            </span>
            <div className="grid gap-2">
              <p className="text-body text-fg-muted">
                <Items names={e.items} />: <Words text={e.text} />
              </p>
              {e.migrate && (
                <p className="text-small text-fg-muted">
                  <span className="text-fg">Migrate:</span> <Words text={e.migrate} />
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ChangelogPage() {
  const releases = changelog.releases as Release[];
  const latest = releases[0];
  return (
    <article aria-labelledby="page-changelog" className="grid gap-24 pb-32">
      <header className="grid gap-4">
        <h1 id="page-changelog" className="text-h1 text-fg text-balance">
          Changelog
        </h1>
        <p className="max-w-[56ch] text-reading text-fg-muted">{meta.summary}</p>
      </header>

      <section aria-labelledby="update-title" className="grid content-start gap-6">
        <h2 id="update-title" className="text-h4 text-fg">
          Update an item
        </h2>
        <p className="max-w-[65ch] text-body text-fg-muted">
          The first lines of an installed file name its release, for example <Words text={`\`// @litt/button ${latest.version}\``} />. Read the entries since then, follow any Migrate step, and install the item again over your copy. Agents can read this page as Markdown.
        </p>
        <CodeBlock
          lang="shell"
          label="Update command"
          code={`npx shadcn@latest add https://littmd.vercel.app/r/button.json --overwrite\n\n# the same page as Markdown\nhttps://littmd.vercel.app/changelog.md`}
        />
      </section>

      {releases.map((r) => (
        <ReleaseSection key={r.version} release={r} />
      ))}
    </article>
  );
}
