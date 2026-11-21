/**
 * A part's page on a phone runs fifteen screens (plans/audits/heat.md, finding 9), so a row under the h1 jumps to the
 * docs it has: Install, Usage, Props, Keyboard (when the page names keys) and Accessibility. One quiet line, in its own
 * sideways scroller when it is wider than the page, never sticky. The hash is the route (#heat/slider), so a link keeps
 * the page's own address and its click scrolls to the section and puts focus on its title (tabindex -1), as the About
 * page's On this page does (world.tsx). The scroll is instant, so nothing moves under reduced motion. Focus on Props'
 * title opens Props, which starts closed on a phone (docs/sections.tsx).
 */
import type { MouseEvent } from "react";
import type { PageDocs } from "./kit";

/** The section ids docs/sections.tsx gives its h2s. */
export function jumpsOf(docs: PageDocs): { id: string; label: string }[] {
  return [
    { id: "install", label: "Install" },
    { id: "usage", label: "Usage" },
    { id: "props", label: "Props" },
    ...(docs.keyboard?.length ? [{ id: "keyboard", label: "Keyboard" }] : []),
    { id: "accessibility", label: "Accessibility" },
  ];
}

/** Scroll the section's title to the top and focus it. The docs load lazily, so wait a few frames for a title not yet drawn. */
function jump(id: string, frames = 120) {
  const heading = document.getElementById(id);
  if (!heading) {
    if (frames > 0) requestAnimationFrame(() => jump(id, frames - 1));
    return;
  }
  /* Focus first: on Props it opens what the title holds, so the page is long enough for the title to reach the top. */
  heading.focus({ preventScroll: true });
  requestAnimationFrame(() => heading.scrollIntoView({ block: "start" }));
}

const LINK =
  "litt-target relative flex min-h-7 shrink-0 items-center rounded-control px-2 text-small whitespace-nowrap text-fg-muted select-none [-webkit-tap-highlight-color:transparent] " +
  "transition-colors duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg pointer-coarse:min-h-control-md " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

export function JumpRow({ docs }: { docs: PageDocs }) {
  /* The page's own address, so the link names where it is; the click never writes it. */
  const here = location.hash || "#";
  return (
    <nav aria-label="On this page" data-jump="" className="-mt-6 min-w-0">
      <ul className="-ml-2 flex overflow-x-auto overscroll-x-contain">
        {jumpsOf(docs).map((j) => (
          <li key={j.id} className="flex">
            <a
              href={here}
              onClick={(e: MouseEvent) => {
                e.preventDefault();
                jump(j.id);
              }}
              className={LINK}
            >
              {j.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
