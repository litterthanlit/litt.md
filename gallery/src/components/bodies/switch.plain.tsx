/**
 * Switch, Plain's body (proposals/plain.md, Quiet): two words, the one it is on held in four corner brackets.
 *
 * - "On" and "Off" sit side by side at the small size. The side the switch is on is --fg inside four 4px corner marks;
 *   the other is --fg-muted, and comes to --fg under the hand. So the state is in the brackets and the ink together,
 *   never color alone, and the control is still one button with role="switch": a press anywhere on it, or Space,
 *   flips it. aria-checked says the state to a screen reader; the words are aria-hidden.
 * - Disabled is both words in --fg-disabled, the brackets kept so the state still reads.
 * - There is no knob, no tray and no fill, so nothing travels: a state changes the moment you ask (Plain is still).
 * - tone="accent" changes nothing here: nothing is filled, so there is no accent to spend.
 */
import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { SwitchBodyProps } from "../switch";

/* pt-1.5 sets the words on the row label's baseline. gap-4 leaves room for the brackets between the two words. */
const root =
  "group/word peer relative z-1 inline-flex h-6.5 shrink-0 pt-1.5 cursor-pointer touch-pan-y items-center gap-4 self-start px-1.5 " +
  "text-small font-normal leading-none whitespace-nowrap select-none [-webkit-tap-highlight-color:transparent] " +
  "disabled:cursor-not-allowed " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/* Four corner marks, each two 1px bars 4px long, in the word's color. */
const brackets =
  "pointer-events-none absolute -inset-x-1.5 -inset-y-1 bg-no-repeat " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:4px_1px,1px_4px,4px_1px,1px_4px,4px_1px,1px_4px,4px_1px,1px_4px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

const current = "relative text-fg group-disabled/word:text-fg-disabled";
const other = "relative text-fg-muted group-enabled/word:group-hover/word:text-fg group-disabled/word:text-fg-disabled";

function Word({ on, children }: { on: boolean; children: string }) {
  return (
    <span aria-hidden="true" className={on ? current : other}>
      {on && <span className={brackets} />}
      {children}
    </span>
  );
}

/** Plain, the words: the one it is on in the ink and the brackets, the other in grey. */
export function SwitchPlainBody({ shown, words, root: rootProps, className }: SwitchBodyProps) {
  return (
    <SwitchPrimitive.Root {...rootProps} data-body="plain" className={root + className}>
      <Word on={shown}>{words[1]}</Word>
      <Word on={!shown}>{words[0]}</Word>
    </SwitchPrimitive.Root>
  );
}
