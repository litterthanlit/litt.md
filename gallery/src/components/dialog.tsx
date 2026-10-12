/**
 * Dialog: the expressive moment. "Placed, not thrown."
 *
 * - Radix Dialog is the accessibility layer (focus trap, Esc, focus return,
 *   aria). Everything visual is ours.
 * - Controlled open state plus AnimatePresence plus forceMount, so exits
 *   animate before Radix unmounts anything.
 * - Panel enter (expressive tier): opacity 0 to 1, y from useTravel() to 0,
 *   scale 0.98 to 1. It may bounce slightly, as the tokens allow. The side sheet
 *   travels the same small distance on x, never its own width.
 * - Exit: useExit("expressive"), quicker and never bouncing.
 * - Overlay: a canvas tint that only fades (instant tier). No blur.
 * - Corners: the panel is rounded-surface; the sheet hugs the right edge, so
 *   only its left corners are rounded. .litt-glass carries the surface radius,
 *   so the right corners are reset to square.
 * - Slots: title, description, body (children), footer. Footer buttons are
 *   right-aligned, 12px apart, primary last.
 */
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import { useExit, useTransition, useTravel } from "@/motion";
import { Button } from "@/components/button";
import { XIcon } from "@/components/icons";

const OpenContext = createContext(false);

export type DialogProps = {
  /** Whether the dialog is open. Pair it with onOpenChange. Leave it out and the dialog keeps its own state. */
  open?: boolean;
  /** Start open when you do not control it. */
  defaultOpen?: boolean;
  /** Called with the next state when Esc, a click outside, Close, DialogClose or DialogTrigger asks to change it. Ignore a false to keep the dialog open, for example while a save runs. */
  onOpenChange?: (open: boolean) => void;
  /** The trigger and the content: a DialogTrigger and a DialogContent. */
  children: ReactNode;
};

/** The root. It holds the open state and shares it with DialogTrigger and DialogContent, which go inside it. */
export function Dialog({ open: openProp, defaultOpen = false, onOpenChange, children }: DialogProps) {
  const [inner, setInner] = useState(defaultOpen);
  const open = openProp ?? inner;
  const change = useCallback(
    (next: boolean) => {
      setInner(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );
  return (
    <OpenContext value={open}>
      <RadixDialog.Root open={open} onOpenChange={change}>
        {children}
      </RadixDialog.Root>
    </OpenContext>
  );
}

/** Opens the dialog. Wrap your own Button with asChild, so it keeps its look and gets the open behavior. */
export const DialogTrigger = RadixDialog.Trigger;
/** Closes the dialog. Wrap a Cancel button with asChild. */
export const DialogClose = RadixDialog.Close;

export type DialogContentProps = {
  /** The heading. It also names the dialog for screen readers, so it is required. */
  title: ReactNode;
  /** One line under the title, also read as the dialog's description. Leave it out when the title says enough. */
  description?: ReactNode;
  /** Buttons, right-aligned and 12px apart. Primary goes last. */
  footer?: ReactNode;
  /** "center" is a modal; "right" is a settings sheet. */
  side?: "center" | "right";
  /** Hide the round close button in the corner. */
  hideClose?: boolean;
  /** Extra classes for the panel. */
  className?: string;
  /** The body. It scrolls when it is taller than the panel, and the title and footer stay put. Leave it out for a title and buttons only. */
  children?: ReactNode;
};

const FOCUSABLE = ":is(input,textarea,select,button,[href]):not(:disabled)";

/**
 * The panel: title, description, body and footer, with a dim overlay behind it. Render it inside a Dialog.
 * Focus lands on the control marked data-autofocus, else the first control in the body, else the first one in
 * the footer, and only then on the close button.
 */
export function DialogContent({
  title,
  description,
  footer,
  side = "center",
  hideClose = false,
  className = "",
  children,
}: DialogContentProps) {
  const open = useContext(OpenContext);
  const enter = useTransition("expressive");
  const exit = useExit("expressive");
  const fadeIn = useTransition("instant");
  const fadeOut = useExit("instant");
  const travel = useTravel();
  const ref = useRef<HTMLDivElement>(null);
  const sheet = side === "right";
  const hasBody = children != null && children !== false;

  /* Focus the field the person came to fill, or the marked button, else the
     first control in the footer. Never the close button. */
  const pickFocus = (e: Event) => {
    const root = ref.current;
    if (!root) return;
    const el =
      root.querySelector<HTMLElement>("[data-autofocus]") ??
      root.querySelector<HTMLElement>(`[data-dialog-body] ${FOCUSABLE}`) ??
      root.querySelector<HTMLElement>(`[data-dialog-footer] ${FOCUSABLE}`);
    if (el) {
      e.preventDefault();
      el.focus({ preventScroll: true });
    }
  };

  return (
    <RadixDialog.Portal forceMount>
      <AnimatePresence>
        {open && (
          <div
            key="layer"
            className={
              "fixed inset-0 z-50 grid " +
              (sheet ? "justify-items-end" : "place-items-center p-gutter")
            }
          >
            <RadixDialog.Overlay forceMount asChild>
              <motion.div
                className="absolute inset-0 bg-[color-mix(in_oklab,var(--canvas)_55%,transparent)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: fadeIn }}
                exit={{ opacity: 0, transition: fadeOut }}
              />
            </RadixDialog.Overlay>

            <RadixDialog.Content
              forceMount
              asChild
              ref={ref}
              onOpenAutoFocus={pickFocus}
              {...(description ? {} : { "aria-describedby": undefined })}
            >
              <motion.div
                className={
                  "litt-glass grid grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_minmax(0,1fr)_auto] [--glass-shadow:var(--shadow-modal)] " +
                  (sheet
                    ? "h-full w-[400px] max-w-[calc(100%-2rem)] rounded-l-surface rounded-r-none "
                    : "max-h-full w-full max-w-[480px] rounded-surface ") +
                  className
                }
                style={{ gridTemplateAreas: '"head close" "body body" "foot foot"' }}
                initial={sheet ? { opacity: 0, x: travel } : { opacity: 0, y: travel, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1, transition: enter }}
                exit={
                  sheet
                    ? { opacity: 0, x: travel / 2, transition: exit }
                    : { opacity: 0, y: travel / 2, scale: 0.98, transition: exit }
                }
              >
                <div className="grid content-start gap-2 pt-6 pr-4 pl-6 sm:pt-8 sm:pl-8" style={{ gridArea: "head" }}>
                  <RadixDialog.Title className="text-h4 text-fg text-balance">{title}</RadixDialog.Title>
                  {description && (
                    <RadixDialog.Description className="text-small text-fg-subtle">{description}</RadixDialog.Description>
                  )}
                </div>

                {hasBody && (
                  <div
                    data-dialog-body
                    className="min-h-0 overflow-y-auto px-6 py-6 sm:px-8"
                    style={{ gridArea: "body" }}
                  >
                    {children}
                  </div>
                )}

                {footer && (
                  <div
                    data-dialog-footer
                    className={
                      "flex flex-wrap justify-end gap-3 px-6 sm:px-8 " +
                      (sheet
                        ? "border-t border-line pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]"
                        : "pb-6 sm:pb-8 " + (hasBody ? "pt-2" : "pt-6"))
                    }
                    style={{ gridArea: "foot" }}
                  >
                    {footer}
                  </div>
                )}

                {!hideClose && (
                  <div className="self-start pt-6 pr-4 sm:pt-8 sm:pr-6" style={{ gridArea: "close" }}>
                    <RadixDialog.Close asChild>
                      <Button iconOnly size="sm" variant="ghost" aria-label="Close" className="-mt-1">
                        <XIcon />
                      </Button>
                    </RadixDialog.Close>
                  </div>
                )}
              </motion.div>
            </RadixDialog.Content>
          </div>
        )}
      </AnimatePresence>
    </RadixDialog.Portal>
  );
}
