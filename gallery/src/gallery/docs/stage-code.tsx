/**
 * The Code side of a Stage. It is a lazy chunk: the highlighter and the page's raw
 * text load when a reader first opens a Code tab, and not before.
 *
 * It suspends while the source loads (the Stage supplies the fallback), and shows the
 * extraction error in place of the code when a name is wrong, so an author sees it.
 */
import { use } from "react";
import { CodeBlock } from "./code-block";
import { demoSource } from "./source";

export default function StageCode({ pageId, name, title }: { pageId: string; name: string; title: string }) {
  const result = use(demoSource(pageId, name));
  if ("error" in result) {
    return (
      <div role="alert" className="grid gap-2 p-2 text-small">
        <p className="text-danger">The code view for {title} could not be built.</p>
        <p className="font-mono text-caption font-normal text-fg-muted">{result.error}</p>
      </div>
    );
  }
  return <CodeBlock tone="flush" code={result.code} label={`${title} code`} />;
}
