/**
 * Flat's viewer (plans/026, phase 2; the Flat studies' sheet): a tile on Flat's gallery view opens its component
 * large, alone on the grey ground, and Previous and Next step through every tile on the view without closing.
 *
 * - The bar: Close, a paper circle on the left; the component's name centred; Previous and Next, paper circles on the
 *   right. Under the component, its line (the lede, in Flat's words) and a link to its page.
 * - The component is the page's tile (PreviewContext "tile"), live and in the hand, at the size its page draws it.
 * - Open is the view's one expressive moment: the sheet grows out of the tile it came from, from 0.9 (R4, Flat: things
 *   come from where you touched them). Stepping swaps the component in place, and closing goes at once. Under reduced
 *   motion it appears at once.
 * - Esc and Close put it away, and focus goes back to what opened it. Radix Dialog is the accessibility layer.
 */
import { Suspense, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { Button } from "@/components/button";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from "@/components/icons";
import { lineIn, PreviewContext } from "./kit";
import { SelfRunProvider } from "./self-run";
import type { PageEntry } from "./registry";

type Opened = {
  /** Every component on the view, in its order. */
  pages: PageEntry[];
  /** The one it opens on. */
  at: number;
  /** Where its page lives: `#flat/<id>`. */
  hrefOf: (page: PageEntry) => string;
  /** The tile it grows out of. */
  tile: HTMLElement;
  /** Where focus goes when it closes. */
  returnTo: HTMLElement | null;
};

/* What is open lives outside the wall's tree, so opening and stepping re-render only the viewer. */
let opened: Opened | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => (listeners.add(l), () => void listeners.delete(l));

/** Opens the viewer on one tile. One at a time: a second open while it shows is ignored. */
export function openViewer(next: Opened) {
  if (opened) return;
  opened = next;
  emit();
}

/** Where the open viewer renders: put one beside the wall. */
export function ViewerHost() {
  const current = useSyncExternalStore(
    subscribe,
    () => opened,
    () => null,
  );
  if (!current) return null;
  return (
    <Viewer
      {...current}
      onClosed={() => {
        const back = current.returnTo;
        opened = null;
        emit();
        /* After the dialog has unmounted, so its focus trap has let go. */
        requestAnimationFrame(() => back?.focus({ preventScroll: true }));
      }}
    />
  );
}

const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function Viewer({ pages, at: first, hrefOf, tile, onClosed }: Opened & { onClosed: () => void }) {
  const [at, setAt] = useState(first);
  const page = pages[at]!;
  const sheet = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const step = (by: number) => setAt((i) => (i + by + pages.length) % pages.length);

  /* The sheet grows out of the tile, from 0.9, on the expressive spring. Reduced motion zeroes the duration. */
  useLayoutEffect(() => {
    const el = sheet.current;
    if (!el) return;
    const from = tile.getBoundingClientRect();
    const to = el.getBoundingClientRect();
    const origin = `${from.left + from.width / 2 - to.left}px ${from.top + from.height / 2 - to.top}px`;
    el.animate([{ transform: "scale(0.9)", opacity: 0, transformOrigin: origin }, { transform: "none", opacity: 1, transformOrigin: origin }], {
      duration: parseFloat(token("--dur-expressive")) || 0,
      easing: token("--ease-expressive") || "linear",
    });
  }, [tile]);

  const line = lineIn(page, "lede", "flat");
  return (
    <RadixDialog.Root open modal onOpenChange={(open) => !open && onClosed()}>
      <RadixDialog.Portal>
        <RadixDialog.Content
          ref={sheet}
          aria-describedby={undefined}
          data-flat-viewer=""
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            title.current?.focus({ preventScroll: true });
          }}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="fixed inset-0 z-50 grid grid-rows-[auto_minmax(0,1fr)_auto] overflow-y-auto overscroll-contain bg-canvas text-fg outline-none"
        >
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pt-[max(var(--space-4),env(safe-area-inset-top,0px))]">
            <RadixDialog.Close asChild>
              <Button iconOnly size="sm" variant="secondary" aria-label="Close" className="justify-self-start">
                <XIcon />
              </Button>
            </RadixDialog.Close>
            <RadixDialog.Title ref={title} tabIndex={-1} className="min-w-0 truncate text-center text-body font-title outline-none">
              {page.title}
            </RadixDialog.Title>
            <div className="flex justify-self-end gap-2">
              <Button iconOnly size="sm" variant="secondary" aria-label="Previous component" onClick={() => step(-1)}>
                <ChevronLeftIcon />
              </Button>
              <Button iconOnly size="sm" variant="secondary" aria-label="Next component" onClick={() => step(1)}>
                <ChevronRightIcon />
              </Button>
            </div>
          </div>
          <div className="grid min-h-0 place-items-center px-4 py-6 sm:px-8">
            <div key={page.id} className="grid w-full max-w-4xl min-w-0 place-items-center [&>*]:min-w-0">
              <PreviewContext.Provider value="tile">
                <SelfRunProvider on>
                  <Suspense fallback={null}>
                    <page.Component />
                  </Suspense>
                </SelfRunProvider>
              </PreviewContext.Provider>
            </div>
          </div>
          <div className="mx-auto grid max-w-xl justify-items-center gap-2 px-4 pb-[max(var(--space-8),env(safe-area-inset-bottom,0px))] text-center">
            {line && <p className="text-small text-fg-muted">{line}</p>}
            <a
              href={hrefOf(page)}
              onClick={() => {
                opened = null;
                emit();
              }}
              className={
                "litt-target relative flex h-control-sm items-center gap-2 rounded-control px-3 text-small font-title text-fg-muted select-none [-webkit-tap-highlight-color:transparent] " +
                "transition-colors duration-(--dur-instant) ease-litt hover:text-fg pointer-coarse:h-control-md " +
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              }
            >
              Open page
              <ArrowRightIcon />
            </a>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
