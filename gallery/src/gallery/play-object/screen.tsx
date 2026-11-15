/**
 * The Playground's screen: the window every object holds (play-object/contract.tsx). It is the frame the Playground
 * had before it had objects, moved here unchanged in what it does.
 */
import { useState, type ReactNode } from "react";
import { Framed } from "@/components/framed";
import { Toaster } from "@/components/toast";
import { DeviceProvider, MaterialProvider, OverlayRoot } from "@/motion";
import { useCustomize } from "../customize-state";
import { lookAttributes, materialOf, type Material } from "../look";
import type { PlayFrameSize } from "../motion-panel";

/**
 * A window onto the app, in a world of its own: the world's data-material, accent and theme on its element and a
 * MaterialProvider inside, so the parts pick that world's bodies and motion. The element is the OverlayRoot's
 * container and a containing block for fixed boxes (contain: layout), so what the app opens stays in the frame, in
 * its world; the app scrolls in a child, never in the frame, so an overlay is drawn over what you see.
 */
export function PlayScreen({ size, material, dark, children }: { size: PlayFrameSize; material: Material; dark: boolean; children: ReactNode }) {
  const { look } = useCustomize();
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const world = materialOf(material).name;
  return (
    <div
      ref={setEl}
      {...lookAttributes({ accent: look.accent, material }, dark)}
      role="region"
      aria-label={size === "phone" ? `The studio app in ${world}, on a phone` : `The parts in ${world}, on a desktop`}
      tabIndex={0}
      data-play-frame={size}
      className={
        "relative overflow-hidden bg-canvas text-fg contain-layout outline-1 -outline-offset-1 outline-line " +
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
        (size === "phone"
          ? "mx-auto h-[min(52rem,max(40rem,calc(100dvh-var(--header-h)-2rem)))] w-full max-w-sm rounded-surface max-sm:-mx-gutter max-sm:h-[calc(100dvh-var(--header-h))] max-sm:w-auto max-sm:max-w-none max-sm:rounded-none max-sm:outline-0"
          : "h-176 w-full rounded-surface")
      }
    >
      <MaterialProvider material={material}>
        <DeviceProvider mode={size}>
          <OverlayRoot container={el}>
            <Toaster>
              <Framed>{children}</Framed>
            </Toaster>
          </OverlayRoot>
        </DeviceProvider>
      </MaterialProvider>
    </div>
  );
}
