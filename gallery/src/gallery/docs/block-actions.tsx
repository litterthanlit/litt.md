/**
 * A block page's actions, in the header beside the tiers: copy the block's install command, and its source on GitHub.
 * The same row as a component page's Copy prompt and Source, without the docs data a component page loads.
 */
import { Button } from "@/components/button";
import { ArrowUpRightIcon, CheckIcon, CopyIcon } from "@/components/icons";
import { CopyStatus, ghostSm, useCopy } from "./copy";
import { installCommand, sourceUrl } from "./copy-prompt";

export default function BlockActions({ block }: { block: string }) {
  const [state, copy] = useCopy();
  const copied = state === "copied";
  const command = installCommand(block);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm" variant="secondary" icon={copied ? <CheckIcon /> : <CopyIcon />} onClick={() => copy(command)}>
        {/* Both labels share one cell, so the button keeps its width while it says Copied. */}
        <span className="grid">
          <span className={"col-start-1 row-start-1 " + (copied ? "opacity-0" : "")}>Copy install</span>
          <span aria-hidden="true" className={"col-start-1 row-start-1 justify-self-start " + (copied ? "" : "opacity-0")}>Copied</span>
        </span>
      </Button>
      <a href={sourceUrl(`gallery/src/blocks/${block}.tsx`)} target="_blank" rel="noopener noreferrer" aria-label="Block source on GitHub, opens in a new tab" className={ghostSm}>
        <span className="litt-trim">Source</span>
        <ArrowUpRightIcon />
      </a>
      <CopyStatus state={state} />
    </div>
  );
}
