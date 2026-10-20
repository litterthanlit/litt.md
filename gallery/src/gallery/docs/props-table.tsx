/**
 * Props for one export: Prop, Type, Default and Description.
 *
 * - From 640px up it is a real table with hairline rows (components.md, "Table and
 *   list rows"). The prop name is the row header, so a screen reader reads "variant,
 *   Type, ..." for each cell.
 * - Below 640px the same rows become a stacked list. A four-column table cannot fit
 *   a phone, and stacking beats a sideways scroll. Each layout is hidden with
 *   display: none when it is not in use, so a screen reader meets only one.
 * - Type and default are Geist Mono at caption size, at 400. The header row is the label weight (P9).
 */
import type { ExportDoc, PropDoc } from "../docs-data";

const WRAP = "[overflow-wrap:anywhere]"; // a long generic type must wrap, never push the page wide

function Default({ prop }: { prop: PropDoc }) {
  if (prop.default !== undefined) return <code className="font-mono text-caption font-normal text-fg-subtle">{prop.default}</code>;
  return <span className="text-caption text-fg-subtle">{prop.required ? "Required" : "None"}</span>;
}

export function PropsTable({ doc }: { doc: ExportDoc }) {
  const noun = doc.kind === "hook" ? "Parameter" : "Prop";
  const label = `${doc.name} ${noun.toLowerCase()}s`;

  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <h3 className="font-mono text-body font-normal text-fg">{doc.name}</h3>
        {doc.description && <p className="max-w-[65ch] text-small text-fg-subtle">{doc.description}</p>}
      </div>

      {doc.props.length === 0 ? (
        <p className="border-y border-line py-4 text-small text-fg-subtle">
          {doc.kind === "hook" ? "No parameters." : "No props of its own."}
        </p>
      ) : (
        <>
          <table className="hidden w-full border-collapse text-left sm:table">
            <caption className="sr-only">{label}</caption>
            <thead>
              <tr className="border-b border-line text-caption text-fg-subtle">
                <th scope="col" className="w-1/5 py-3 pr-6">{noun}</th>
                <th scope="col" className="w-[28%] py-3 pr-6">Type</th>
                <th scope="col" className="w-[14%] py-3 pr-6">Default</th>
                <th scope="col" className="py-3">Description</th>
              </tr>
            </thead>
            <tbody>
              {doc.props.map((p) => (
                <tr key={p.name} className="border-b border-line align-baseline">
                  <th scope="row" className={"py-4 pr-6 text-left font-mono text-small font-normal text-fg " + WRAP}>{p.name}</th>
                  <td className={"py-4 pr-6 font-mono text-caption font-normal text-fg-subtle " + WRAP}>{p.type}</td>
                  <td className={"py-4 pr-6 " + WRAP}><Default prop={p} /></td>
                  <td className="py-4 text-small text-fg-muted">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul aria-label={label} className="divide-y divide-line border-y border-line sm:hidden">
            {doc.props.map((p) => (
              <li key={p.name} className="grid gap-2 py-4">
                <p className={"font-mono text-small text-fg " + WRAP}>{p.name}</p>
                <p className={"font-mono text-caption font-normal text-fg-subtle " + WRAP}>{p.type}</p>
                <p className="flex flex-wrap items-baseline gap-x-2 text-caption text-fg-subtle">
                  Default <span className={WRAP}><Default prop={p} /></span>
                </p>
                {p.description && <p className="text-small text-fg-muted">{p.description}</p>}
              </li>
            ))}
          </ul>
        </>
      )}

      {doc.extends && <p className="text-small text-fg-subtle">Also accepts: {doc.extends}</p>}
    </div>
  );
}
