/**
 * A block page's actions, in the header beside the tiers: copy the block's install command, and its source on GitHub.
 * The same row as a component page's Copy prompt and Source, without the docs data a component page loads.
 */
import { ArrowUpRightIcon } from "@/components/icons";
import { CopyButton, ghostSm } from "./copy";
import { installCommand, sourceUrl } from "./copy-prompt";

export default function BlockActions({ block }: { block: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <CopyButton text={installCommand(block)}>Copy install</CopyButton>
      <a href={sourceUrl(`gallery/src/blocks/${block}.tsx`)} target="_blank" rel="noopener noreferrer" aria-label="Block source on GitHub, opens in a new tab" className={ghostSm}>
        <span className="litt-trim">Source</span>
        <ArrowUpRightIcon />
      </a>
    </div>
  );
}
