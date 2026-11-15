/**
 * Switch, Plain's body (proposals/plain.md, No UI): two words, and the one it is on is in the ink.
 *
 * - "On" and "Off" sit side by side at the small size. The side the switch is on is --fg; the other is link blue and
 *   underlined (--accent-text), the word you would press to change it. So the state is in the words and their color
 *   together, never color alone, and the control is still one button with role="switch": a press anywhere on it, or
 *   Space, flips it. aria-checked says the state to a screen reader; the words are aria-hidden.
 * - Under the hand the underline thickens to 2px. Disabled is both words in --fg-disabled with no underline.
 * - There is no knob, no tray and no fill, so nothing travels: a state changes the moment you ask (Plain is still).
 * - tone="accent" changes nothing here: no word is filled, so there is no accent to spend.
 */
import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { SwitchBodyProps } from "../switch";

const root =
  "group/word peer relative z-1 inline-flex h-6.5 shrink-0 pt-1.5 cursor-pointer touch-pan-y items-center gap-2 self-start " +
  "text-small font-normal leading-none whitespace-nowrap select-none [-webkit-tap-highlight-color:transparent] " +
  "disabled:cursor-not-allowed " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const current = "text-fg group-disabled/word:text-fg-disabled";
const other =
  "text-accent-text underline decoration-1 underline-offset-[0.2em] group-enabled/word:group-hover/word:decoration-2 " +
  "group-disabled/word:text-fg-disabled group-disabled/word:no-underline";

/** Plain, the words: the one it is on in the ink, the other underlined in link blue. */
export function SwitchPlainBody({ shown, words, root: rootProps, className }: SwitchBodyProps) {
  return (
    <SwitchPrimitive.Root {...rootProps} data-body="plain" className={root + className}>
      <span aria-hidden="true" className={shown ? current : other}>
        {words[1]}
      </span>
      <span aria-hidden="true" className={shown ? other : current}>
        {words[0]}
      </span>
    </SwitchPrimitive.Root>
  );
}
