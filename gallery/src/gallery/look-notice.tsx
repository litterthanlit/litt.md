/**
 * The notice under the header while the address names a look that differs from your own (customize-state.tsx), on
 * every page: which look the page shows, that it came from a link, and the two ways out. Keep this look saves it as
 * yours; Back to mine takes it out of the address. Neither is the view's primary action, so neither takes the accent
 * (R6). No motion: it is there on the first paint and gone after either button.
 *
 * The button that had focus goes with the notice, so focus moves to the header's Customize, where the look now lives,
 * and a polite status says what happened. A fun cue (data-fun-cue): it names the motion, so a Calm and Fun comparison
 * hides it.
 */
import { useState } from "react";
import { Button } from "@/components/button";
import { Callout } from "@/components/callout";
import { LinkIcon } from "@/components/icons";
import { useCustomize } from "./customize-state";
import { lookWords } from "./look";

export function LookNotice({ inert }: { inert: boolean }) {
  const { link } = useCustomize();
  const [said, setSaid] = useState("");
  const leave = (go: () => void, words: string) => {
    document.getElementById("customize-trigger")?.focus();
    go();
    setSaid(words);
  };
  return (
    <div inert={inert}>
      <p role="status" aria-live="polite" className="sr-only">
        {said}
      </p>
      {link && (
        <div className="mx-auto max-w-wide px-gutter pt-4">
          <Callout
            role="region"
            aria-label="Look from a link"
            data-fun-cue=""
            icon={<LinkIcon />}
            title={`From a link: ${lookWords(link.look)}.`}
            description="Your own look is saved."
            action={
              <span className="flex gap-2">
                <Button size="sm" onClick={() => leave(link.keep, `Kept ${lookWords(link.look)}.`)}>
                  Keep this look
                </Button>
                <Button size="sm" variant="ghost" onClick={() => leave(link.drop, "Back to your look.")}>
                  Back to mine
                </Button>
              </span>
            }
          />
        </div>
      )}
    </div>
  );
}
