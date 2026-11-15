/**
 * The object's screen (plans/018): a window in a world of its own. The world's data-material, accent and theme are on
 * its element and a MaterialProvider inside, so every component on it picks that world's body and motion. The element
 * is the OverlayRoot's container and a containing block for fixed boxes (contain: layout), so what a take opens (a
 * dialog, a menu, a tooltip, a toast) stays on the screen, in its world; a take scrolls in a child, never in the
 * screen, so an overlay is drawn over what you see.
 */
import { useState, type ReactNode } from "react";
import { Framed } from "@/components/framed";
import { Toaster } from "@/components/toast";
import { MaterialProvider, OverlayRoot } from "@/motion";
import { useCustomize } from "../customize-state";
import { lookAttributes, type Material } from "../look";

export function PlayScreen({ material, dark, shape, label, children }: {
  material: Material;
  dark: boolean;
  /** The screen's size, corners and edge, from the object's body. */
  shape: string;
  /** What the screen is called: the take showing, and where. */
  label: string;
  children: ReactNode;
}) {
  const { look } = useCustomize();
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  return (
    <div
      ref={setEl}
      {...lookAttributes({ accent: look.accent, material }, dark)}
      role="region"
      aria-label={label}
      tabIndex={0}
      data-play-frame="screen"
      className={
        "relative overflow-hidden bg-canvas text-fg contain-layout " +
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
        shape
      }
    >
      <MaterialProvider material={material}>
        <OverlayRoot container={el}>
          <Toaster>
            <Framed>{children}</Framed>
          </Toaster>
        </OverlayRoot>
      </MaterialProvider>
    </div>
  );
}
