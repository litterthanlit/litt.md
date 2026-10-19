/**
 * The docs layer of a page: the header actions and the sections under the stages.
 * kit.tsx loads this module only for pages that pass `docs`, so the generated docs
 * data, the highlighter and the prompt builder stay out of every other page.
 */
import { Component, useMemo, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/button";
import { ArrowUpRightIcon, CheckIcon, CopyIcon } from "@/components/icons";
import type { PageDocs, PageMeta } from "../kit";
import { componentDoc } from "../docs-data";
import { CopyStatus, useCopy } from "./copy";
import { buildPrompt, markdownUrl, sourceUrl } from "./copy-prompt";
import { DocsSections as Sections } from "./sections";

/** A wrong stem in `docs.components` should say so on the page, not blank the whole gallery. */
class DocsBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <p role="alert" className="text-small text-danger">
        Docs failed to render: <span className="font-mono text-fg-muted">{this.state.error.message}</span>
      </p>
    );
  }
}

/* The same look as Button's ghost, sm: a link that leaves the site. Button renders a
   <button>, and a link needs an <a> to be a link (middle click, "open in new tab"). */
const ghostSm =
  "relative inline-flex h-control-sm shrink-0 items-center justify-center gap-control rounded-control px-control-pad-sm " +
  "whitespace-nowrap select-none text-small font-normal text-fg-muted " +
  "cursor-pointer transition-[background-color,color,transform] duration-(--dur-instant) ease-litt " +
  "hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg active:scale-(--press-scale) " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

function Actions({ meta, docs }: { meta: Pick<PageMeta, "id" | "title" | "summary">; docs: PageDocs }) {
  const components = useMemo(() => docs.components.map(componentDoc), [docs]);
  /* Built during render, so the click handler already holds the text. It must not await. */
  const prompt = useMemo(() => buildPrompt({ meta, docs, components }), [meta, docs, components]);
  const [state, copy] = useCopy();
  const copied = state === "copied";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm" variant="secondary" icon={copied ? <CheckIcon /> : <CopyIcon />} onClick={() => copy(prompt)}>
        {/* Both labels share one cell, so the button keeps its width while it says Copied. */}
        <span className="grid">
          <span className={"col-start-1 row-start-1 " + (copied ? "opacity-0" : "")}>Copy prompt</span>
          <span aria-hidden="true" className={"col-start-1 row-start-1 justify-self-start " + (copied ? "" : "opacity-0")}>Copied</span>
        </span>
      </Button>
      <a
        href={sourceUrl(components[0]!.file)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Source on GitHub, opens in a new tab"
        className={ghostSm}
      >
        <span className="litt-trim">Source</span>
        <ArrowUpRightIcon />
      </a>
      {/* The same page for agents (scripts/gen-llms.mjs). A path of its own, because the gallery routes by hash. */}
      <a href={markdownUrl(meta.id).replace(/^https:\/\/[^/]+/, "")} aria-label="This page as Markdown, for coding agents" className={ghostSm}>
        <span className="litt-trim">Markdown</span>
      </a>
      <CopyStatus state={state} />
    </div>
  );
}

export function DocsActions(props: { meta: Pick<PageMeta, "id" | "title" | "summary">; docs: PageDocs }) {
  return (
    <DocsBoundary>
      <Actions {...props} />
    </DocsBoundary>
  );
}

export function DocsSections({ docs }: { docs: PageDocs }) {
  return (
    <DocsBoundary>
      <Sections docs={docs} />
    </DocsBoundary>
  );
}
