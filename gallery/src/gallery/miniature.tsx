/**
 * A page's first demo in miniature: the sidebar's hover preview and the overview's cards draw it.
 *
 * - The demo is the page itself in preview mode (PreviewContext in kit.tsx): its first stage's demo, without the
 *   title, captions or docs. No page writes anything for it.
 * - It is laid out on a stage as wide as a real one, then scaled down to the frame's width. A short demo sits in the
 *   middle; a tall one (a dashboard, a long list) shows its top and runs off the bottom edge, like a thumbnail, rather
 *   than shrinking out of reach.
 * - The caller makes it a picture: aria-hidden and inert, so nothing in it takes focus or a click.
 * - `still` holds its motion (StillMotion), for a grid where many demos mount at once.
 */
import { Suspense, useLayoutEffect, useRef, useState } from "react";
import { StillMotion } from "@/motion";
import { PreviewContext } from "./kit";
import type { PageEntry } from "./registry";

const STAGE = 640;

export function Miniature({ page, width, height, inset = 24, still = false }: { page: PageEntry; width: number; height: number; inset?: number; still?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 0, x: 0, y: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const scale = Math.min(1, (width - 2 * inset) / el.offsetWidth);
      const h = el.offsetHeight * scale;
      setFit({ scale, x: (width - el.offsetWidth * scale) / 2, y: h <= height ? (height - h) / 2 : 0 });
    };
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(el);
    return () => watch.disconnect();
  }, [width, height, inset]);

  const demo = (
    <PreviewContext.Provider value={true}>
      <Suspense fallback={null}>
        <page.Component />
      </Suspense>
    </PreviewContext.Provider>
  );

  return (
    <div
      ref={ref}
      className="absolute top-0 left-0 grid min-h-80 origin-top-left place-items-center p-8"
      style={{ width: STAGE, transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.scale})` }}
    >
      {still ? <StillMotion>{demo}</StillMotion> : demo}
    </div>
  );
}
