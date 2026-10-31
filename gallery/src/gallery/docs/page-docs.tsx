/**
 * The docs layer of a page: the header actions and the sections under the stages.
 * kit.tsx loads this module only for pages that pass `docs`, so the generated docs
 * data, the highlighter and the prompt builder stay out of every other page.
 */
import { Component, useMemo, type ErrorInfo, type ReactNode } from "react";
import { ArrowUpRightIcon } from "@/components/icons";
import type { PageDocs, PageMeta } from "../kit";
import { useCustomize } from "../customize-state";
import { componentDoc } from "../docs-data";
import { lookStep } from "../look";
import { CopyButton, ghostSm } from "./copy";
import { buildPrompt, markdownUrl, SITE, sourceUrl } from "./copy-prompt";
import { DocsSections as Sections } from "./sections";

/** A wrong stem in `docs.components` should say so on the page, not blank the whole gallery. */
export class DocsBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
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


function Actions({ meta, docs }: { meta: Pick<PageMeta, "id" | "title" | "summary">; docs: PageDocs }) {
  const components = useMemo(() => docs.components.map(componentDoc), [docs]);
  const { look } = useCustomize();
  /* Built during render, so the click handler already holds the text. It must not await. */
  const prompt = useMemo(() => buildPrompt({ meta, docs, components, lookStep: lookStep(look, SITE) }), [meta, docs, components, look]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <CopyButton text={prompt}>Copy prompt</CopyButton>
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
