/**
 * Switch, Plain's body (taste v1.23, proposals/plain-studies.md): two words, the active one held in four gliding corner
 * brackets.
 *
 * - "On" and "Off" sit side by side at the small size. The side the switch is on is `--fg` inside four 4px corner marks;
 *   the other is `--fg-muted`, and comes to `--fg` under the hand. State is in the brackets and the ink together, never
 *   colour alone, and the control remains a single `role="switch"` button.
 * - Subtraction motion: the four 4px corner marks glide cleanly between the two words on the `200ms` zero-bounce
 *   responsive spring (`useTransition("responsive")`), snapping immediately under reduced motion.
 * - Disabled keeps the brackets in `--fg-disabled` so the state still reads.
 */
import { useId } from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { LayoutGroup, motion, type Transition } from "motion/react";
import { useTransition } from "@/motion";
import type { SwitchBodyProps } from "@/components/switch";

const root =
  "group/word peer relative z-1 inline-flex h-6.5 shrink-0 pt-1.5 cursor-pointer touch-pan-y items-center gap-5 self-start px-2 " +
  "text-small font-normal leading-none whitespace-nowrap select-none [-webkit-tap-highlight-color:transparent] " +
  "disabled:cursor-not-allowed " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const corner = "pointer-events-none absolute size-1 border-current";

const current = "relative text-fg transition-colors duration-(--dur-instant) ease-litt group-disabled/word:text-fg-disabled";
const other = "relative text-fg-muted transition-colors duration-(--dur-instant) ease-litt group-enabled/word:group-hover/word:text-fg group-disabled/word:text-fg-disabled";

function Word({ on, enter, children }: { on: boolean; enter: Transition; children: string }) {
  return (
    <span aria-hidden="true" className={on ? current : other}>
      {on && (
        <>
          <motion.span layoutId="sw-plain-tl" transition={enter} className={corner + " -top-1 -left-1.5 border-t border-l"} />
          <motion.span layoutId="sw-plain-tr" transition={enter} className={corner + " -top-1 -right-1.5 border-t border-r"} />
          <motion.span layoutId="sw-plain-bl" transition={enter} className={corner + " -bottom-1 -left-1.5 border-b border-l"} />
          <motion.span layoutId="sw-plain-br" transition={enter} className={corner + " -bottom-1 -right-1.5 border-b border-r"} />
        </>
      )}
      {children}
    </span>
  );
}

/** Plain, the words: the active side in the ink and four gliding corner marks, the other in grey. */
export function SwitchPlainBody({ shown, words, root: rootProps, className }: SwitchBodyProps) {
  const groupId = useId();
  const enter = useTransition("responsive");
  return (
    <LayoutGroup id={groupId}>
      <SwitchPrimitive.Root {...rootProps} data-body="plain" className={root + className}>
        <Word on={shown} enter={enter}>{words[1]}</Word>
        <Word on={!shown} enter={enter}>{words[0]}</Word>
      </SwitchPrimitive.Root>
    </LayoutGroup>
  );
}
