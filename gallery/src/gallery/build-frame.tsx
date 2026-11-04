/**
 * The Build page's frame: one window onto a screen, scrolling inside itself at AppFrame's height, with the screen's
 * links kept put (kit.tsx, stayPut). Light beside dark draws the screen twice in one grid cell: the light copy, and
 * a dark copy clipped to the right half. One scroll moves both. Split is a picture of both themes: both copies are
 * inert, so a hand on the right half never reaches the light copy under it and the halves never fall out of step;
 * the page says to turn it off to use the screen. The dark copy is also hidden from assistive tech, so its ids,
 * headings and focus stops never double the light one's. Each copy spreads the look (look.ts, lookAttributes), since a themed root redeclares
 * Blue 4 and Press.
 */
import type { ReactNode } from "react";
import { Framed } from "@/components/framed";
import { DeviceProvider, SoftSwap } from "@/motion";
import { useCustomize } from "./customize-state";
import { stayPut } from "./kit";
import { lookAttributes } from "./look";

/** `swapKey` names what the frame shows: a new one swaps it in soft focus (SoftSwap, R4). */
export function BuildFrame({
  label,
  phone,
  split,
  swapKey,
  children,
}: {
  label: string;
  phone: boolean;
  split: boolean;
  swapKey: string;
  children: () => ReactNode;
}) {
  const { look } = useCustomize();
  const copy = (dark: boolean | null) => {
    const framed = (
      <Framed>
        <SoftSwap swapKey={swapKey}>{children()}</SoftSwap>
      </Framed>
    );
    const sized = phone ? (
      <div className="mx-auto w-full max-w-sm">
        <DeviceProvider mode="phone">{framed}</DeviceProvider>
      </div>
    ) : (
      framed
    );
    if (dark === null) return <div data-build-copy="" className="[grid-area:1/1]">{sized}</div>;
    return (
      <div
        key={dark ? "dark" : "light"}
        data-build-copy=""
        {...lookAttributes(look, dark)}
        inert
        {...(dark ? { "aria-hidden": true } : {})}
        className={"[grid-area:1/1] bg-canvas text-fg " + (dark ? "[clip-path:inset(0_0_0_50%)]" : "")}
      >
        {sized}
      </div>
    );
  };
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      onClickCapture={stayPut}
      data-build-frame=""
      className={
        "h-176 w-full overflow-y-auto overscroll-contain rounded-surface bg-canvas outline-1 -outline-offset-1 outline-line " +
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
      }
    >
      <div className="grid">{split ? [copy(false), copy(true)] : copy(null)}</div>
    </div>
  );
}
