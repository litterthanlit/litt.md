/** Who made litt.md and where its source lives, said once and used by the header, the footer and the overview. */
import type { ReactNode } from "react";

export const REPO_URL = "https://github.com/litterthanlit/litt.md";
export const AUTHOR_URL = "https://x.com/litterthanli7";

/* Links in running text: underlined, so color is never the only mark, and brighter on hover. */
const LINK =
  "text-fg-muted underline decoration-[color-mix(in_oklab,var(--fg)_30%,transparent)] underline-offset-4 " +
  "transition-colors duration-(--dur-instant) ease-litt hover:text-fg hover:decoration-fg";

export function CreditLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className={LINK}>
      {children}
    </a>
  );
}

/** "Made by Nick. The source is on GitHub." The size and tone come from the caller. */
export function Credits({ className = "" }: { className?: string }) {
  return (
    <p className={className}>
      Made by <CreditLink href={AUTHOR_URL}>Nick</CreditLink>. The source is on <CreditLink href={REPO_URL}>GitHub</CreditLink>.
    </p>
  );
}
