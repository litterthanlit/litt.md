/**
 * AppShell: the frame around an app's pages. A sidebar for moving between them and a main area for the page.
 * Compose it from AppShell, SidebarNav and SidebarLink.
 *
 * - Desktop (components.md, App shell): a 240px sidebar on surface-1 with a line hairline on its edge. The
 *   sidebar COLUMN is as tall as the page, so it reaches the bottom of a long page (a full-page screenshot, a
 *   tall table). Its content is sticky and as tall as the window (`--shell-height`, 100svh by default), so the
 *   wordmark and the links stay in view while the page scrolls. The page scrolls as one document: there is no
 *   fixed-height shell with an inner scroller, which would hide everything below the first screen.
 * - Wordmark: the first row of the sidebar, as tall as the header (--header-h), body size, fg.
 * - Links: 36px rows at the small size and the control radius, 12px side padding. The current page wears the
 *   selected segment (P12), one step raised from the sidebar: fg on surface-2 with the hairline and the top
 *   highlight, and aria-current="page"; the others are fg-muted, with an fg-6% fill and brighter text on hover
 *   (instant tier, color only). No dots, no accent, no weight change. On a coarse pointer a row is 44px and a pressed row
 *   fills like a hovered one. Focus is an inset 2px ring, as in a list.
 * - Main: its own landmark, with the page gutter at the sides and space-8 above and below.
 *
 * On compact screens (useDevice().compact, so <DeviceProvider mode="phone"> previews it) there is no sidebar. A
 * glass top bar, sticky at the safe-area inset like the Header, holds the wordmark and an icon-only menu button
 * (44px, aria-label "Open navigation", aria-expanded and aria-controls from Radix Dialog). It opens the same nav
 * in DialogSheet, the bottom sheet Dialog and Popover share: 44px rows, a heading, a close button, drag to close,
 * Esc, a tap on the scrim. Picking a link closes it. The sheet never uses up the view's expressive moment.
 * Before the page has hydrated a phone shows the top bar and no sidebar, by CSS (max-sm), so there is no flash.
 *
 * Motion: none of its own. The sheet's is the Dialog's.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ComponentProps, type CSSProperties, type ElementType, type MouseEvent, type ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { useDevice } from "@/motion";
import { Button } from "@/components/button";
import { DialogSheet } from "@/components/dialog";
import { MenuIcon, XIcon } from "@/components/icons";

/* Whether a link is drawn in the phone sheet, and how to close it. */
const ShellContext = createContext<{ sheet: boolean; close: () => void }>({ sheet: false, close: () => {} });

export type AppShellProps = {
  /** The brand: usually a link home around the studio's name or a logo (a logo needs an aria-label). It shows in the sidebar and in the phone's top bar, so do not give it an id. */
  wordmark: ReactNode;
  /** The navigation: one or more SidebarNav. It is the sidebar's body on a desktop and the sheet's body on a phone. */
  nav: ReactNode;
  /** Pinned under the nav, such as the signed-in person or a theme switch. It shows in the sidebar and under the nav in the sheet. */
  footer?: ReactNode;
  /** The menu button's accessible name on a phone. */
  menuLabel?: string;
  /** The sheet's heading on a phone. It also names the sheet for screen readers. */
  sheetTitle?: string;
  /** How tall the window is, for the sticky sidebar. 100svh is right for a page. Set a fixed height such as "34rem" when the shell sits in a scrolling frame. */
  viewportHeight?: string;
  /** Extra classes for the shell, such as a background. */
  className?: string;
  /** The page. It goes in the main landmark, which sets the gutter and the vertical space. */
  children: ReactNode;
};

/** The shell. It needs no router and no provider. */
export function AppShell({
  wordmark,
  nav,
  footer,
  menuLabel = "Open navigation",
  sheetTitle = "Navigation",
  viewportHeight = "100svh",
  className = "",
  children,
}: AppShellProps) {
  const { compact } = useDevice();
  const [open, setOpen] = useState(false);
  /* A window that grows past the compact width has no sheet to leave open. */
  useEffect(() => {
    if (!compact) setOpen(false);
  }, [compact]);
  const inSheet = useMemo(() => ({ sheet: true, close: () => setOpen(false) }), []);

  return (
    <RadixDialog.Root open={open} onOpenChange={setOpen}>
      <div
        className={"flex min-h-(--shell-height) w-full " + (compact ? "flex-col " : "max-sm:flex-col ") + className}
        style={{ "--shell-height": viewportHeight } as CSSProperties}
      >
        {!compact && (
          <div className="w-60 shrink-0 border-r border-line bg-surface-1 max-sm:hidden">
            <div className="sticky top-0 flex h-(--shell-height) flex-col">
              <div className={wordmarkRow + " px-6"}>{wordmark}</div>
              <div className="grid min-h-0 flex-1 content-start gap-6 overflow-y-auto px-3 pb-6">{nav}</div>
              {footer && <div className="shrink-0 border-t border-line p-3">{footer}</div>}
            </div>
          </div>
        )}

        {/* The top bar: shown on compact screens, and hidden from 640 up until the page knows which one it is. */}
        <div className={compact ? "" : "sm:hidden"}>
          <header className="litt-glass sticky top-[env(safe-area-inset-top,0px)] z-30 rounded-none">
            <div className="flex h-(--header-h) items-center justify-between gap-4 px-gutter">
              <div className={wordmarkRow}>{wordmark}</div>
              <RadixDialog.Trigger asChild>
                <Button iconOnly variant="ghost" aria-label={menuLabel}>
                  <MenuIcon />
                </Button>
              </RadixDialog.Trigger>
            </div>
          </header>
        </div>

        <main className="min-w-0 flex-1 px-gutter py-8">{children}</main>
      </div>

      {compact && (
        <DialogSheet open={open} onDismiss={() => setOpen(false)} described={false}>
          <div className="grid content-start pt-6 pr-4 pl-6" style={{ gridArea: "head" }}>
            <RadixDialog.Title className="text-h4 text-fg text-balance">{sheetTitle}</RadixDialog.Title>
          </div>
          <div className="self-start pt-6 pr-4" style={{ gridArea: "close" }}>
            <RadixDialog.Close asChild>
              <Button
                iconOnly
                size="sm"
                variant="ghost"
                aria-label="Close"
                className="-mt-1 pointer-coarse:-mt-2.5 pointer-coarse:h-control-md pointer-coarse:w-control-md"
              >
                <XIcon />
              </Button>
            </RadixDialog.Close>
          </div>
          <div className="min-h-0 overflow-y-auto overscroll-contain px-3 pt-6 pb-(--sheet-foot)" style={{ gridArea: "body" }}>
            <ShellContext value={inSheet}>
              <div className="grid content-start gap-6">{nav}</div>
              {footer && <div className="mt-6 border-t border-line pt-3">{footer}</div>}
            </ShellContext>
          </div>
        </DialogSheet>
      )}
    </RadixDialog.Root>
  );
}

const wordmarkRow =
  "flex h-(--header-h) shrink-0 items-center text-body font-title text-fg [&_a]:rounded-control [&_a:focus-visible]:outline-2 " +
  "[&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-focus pointer-coarse:[&_a]:inline-flex " +
  "pointer-coarse:[&_a]:h-control-md pointer-coarse:[&_a]:items-center";

/* -------------------------------------------------------------------------- */
/* SidebarNav, SidebarLink                                                    */
/* -------------------------------------------------------------------------- */

export type SidebarNavProps = {
  /** The landmark's name, such as "Main". Give each nav its own when there are several. */
  label: string;
  /** A small title over the group, such as "Workspace". Leave it out for the first group. */
  heading?: string;
  /** SidebarLinks. */
  children: ReactNode;
};

/** A group of links in a nav landmark. */
export function SidebarNav({ label, heading, children }: SidebarNavProps) {
  return (
    <nav aria-label={label}>
      {heading && <p className="px-3 pb-2 text-caption text-fg-subtle">{heading}</p>}
      <ul className="grid gap-1">{children}</ul>
    </nav>
  );
}

const row =
  "relative flex w-full items-center gap-3 rounded-control px-3 whitespace-nowrap select-none " +
  "[-webkit-tap-highlight-color:transparent] transition-[background-color,color] duration-(--dur-instant) ease-litt " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

export type SidebarLinkProps = Omit<ComponentProps<"a">, "ref"> & {
  /** Marks the page you are on: sets aria-current="page" and fills the row. Set it on at most one link. */
  current?: boolean;
  /** A 16px icon before the label. It is decorative, so the label must say everything. */
  icon?: ReactNode;
  /** The element to draw, for a router's link: `as={Link}`. It receives the same props as an anchor. */
  as?: ElementType;
  /** The label. Keep it to one or two short words. */
  children: ReactNode;
};

/** One link in the nav. In the phone sheet it is 44px tall, and picking it closes the sheet. */
export function SidebarLink({ current = false, icon, as: Tag = "a", className = "", children, onClick, ...rest }: SidebarLinkProps) {
  const { sheet, close } = useContext(ShellContext);
  return (
    <li>
      <Tag
        aria-current={current ? "page" : undefined}
        className={
          [
            row,
            sheet ? "h-control-md text-body" : "h-9 text-small pointer-coarse:h-control-md",
            current
              ? "bg-surface-2 text-fg shadow-[inset_0_0_0_1px_var(--line),var(--highlight)]"
              : "text-fg-muted hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg " +
                "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:text-fg",
            className,
          ].join(" ")
        }
        onClick={(e: MouseEvent<HTMLAnchorElement>) => {
          onClick?.(e);
          if (sheet) close();
        }}
        {...rest}
      >
        {icon && <span className="grid shrink-0 place-items-center text-fg-subtle [&>svg]:size-4">{icon}</span>}
        <span className="litt-trim">{children}</span>
      </Tag>
    </li>
  );
}
