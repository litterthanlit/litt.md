/**
 * Lightbox: one image of a set at the size of the screen, with the rest a key or a swipe away (components.md,
 * "Lightbox"). What a Media's onOpen opens: a carousel slide, a grid of details, a screenshot in a case study.
 *
 * - Radix Dialog is the accessibility layer (focus trap, Esc, focus return, the page held still behind it).
 *   Everything visual is ours.
 * - Layer: the whole screen. A canvas scrim at 97% that only fades (instant tier), so the image sits on the theme's
 *   own ground in light and dark and the page behind is a trace. No blur, no glass: the image is the surface.
 * - Image: as large as the screen allows less the bars, at its own shape, in a Media frame (the surface radius and the
 *   hairline, surface-2 while it loads, its words when it fails). Pass width and height so the frame has its shape
 *   before the image arrives; without them it takes the image's own once it loads.
 * - Bars: the label and "3 of 12" (the mono, caption size, --fg-subtle) at the top with a round Close at the end, and
 *   the caption under the image, at the small size in --fg-muted, never wider than the measure. Previous and Next are
 *   round secondary buttons beside the image on a wide screen and at the end of the caption row on a phone; 44px on a
 *   touch screen. At an end the button is disabled. Nothing loops.
 * - Motion: opening is the view's expressive moment, as a dialog's: the image rises by --travel and settles from 0.98,
 *   and leaves on the exit token. `tier="responsive"` when the view has spent it. Moving to the next image fades it in
 *   from --travel on the side it comes from and the last one out by half that, on the responsive tier.
 * - Touch: a finger swipes the image sideways one to one (useDismissDrag); past --dismiss-distance of its width, or
 *   faster than --dismiss-velocity, it carries on out from where the finger let go and the next one comes in. Pulled
 *   the way there is nothing it resists. The buttons stay: a swipe is never the only way.
 * - Keys: ← and → move one image, Home and End go to the first and the last, Esc closes, Tab moves between the
 *   buttons. Focus lands on the panel, so the arrows work at once, and goes back to what opened it, or wherever
 *   returnFocus says (the slide of the image it closed on).
 * - A tap or click on the ground around the image closes it, as a dialog's scrim does.
 * - Accessibility: a dialog named by the label; the image's alt is its name and the caption is under it. Moving says
 *   "Image 4 of 12" once in a polite status. Under reduced motion every change is a cut.
 */
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import { useDevice, useExit, useTransition, useTravel } from "@/motion";
import { useDismissDrag, type DismissInfo } from "@/motion/drag";
import { Button } from "@/components/button";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "@/components/icons";
import { Media } from "@/components/media";

export type LightboxItem = {
  /** The image at the size the lightbox shows it. */
  src: string;
  /** What the image shows. It names the image for screen readers. */
  alt: string;
  /** Other sizes of the image, for the browser to pick from. */
  srcSet?: string;
  /** The image's own width and height in pixels, so its frame has the right shape before it loads. */
  width?: number;
  height?: number;
  /** A line under the image. */
  caption?: ReactNode;
};

export type LightboxProps = {
  /** What the set is, shown at the top and naming the dialog: "Halo site". */
  label: string;
  /** The images, in order. */
  items: LightboxItem[];
  /** The image shown, or null when the lightbox is closed. Set it from a Media's onOpen. */
  index: number | null;
  /** Called with the next image when the person moves, and with null when they close it. */
  onIndexChange: (index: number | null) => void;
  /** The view's one expressive moment by default. Pass "responsive" when the view has already spent it. */
  tier?: "expressive" | "responsive";
  /** Where focus goes when it closes, given the image it closed on: the slide or thumbnail of that image. Default: the element that opened it. */
  returnFocus?: (index: number) => HTMLElement | null | undefined;
};

const SCRIM = "absolute inset-0 bg-[color-mix(in_oklab,var(--canvas)_97%,transparent)]";
const ROUND = "pointer-coarse:h-control-md pointer-coarse:w-control-md";

/** A set of images at the size of the screen, one at a time, opened from a Media and closed with Esc or Close. */
export function Lightbox({ label, items, index, onIndexChange, tier = "expressive", returnFocus }: LightboxProps) {
  const open = index !== null && items.length > 0;
  /* While it leaves, the lightbox keeps showing the image it closed on. */
  const [shown, setShown] = useState(0);
  const at = open ? Math.max(0, Math.min(items.length - 1, index)) : Math.min(shown, Math.max(0, items.length - 1));
  if (open && at !== shown) setShown(at);

  return (
    <RadixDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onIndexChange(null);
      }}
    >
      <RadixDialog.Portal forceMount>
        <AnimatePresence>
          {open && (
            <Layer
              key="layer"
              label={label}
              items={items}
              index={at}
              go={(to) => onIndexChange(to)}
              close={() => onIndexChange(null)}
              tier={tier}
              returnFocus={returnFocus}
            />
          )}
        </AnimatePresence>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

type LayerProps = {
  label: string;
  items: LightboxItem[];
  index: number;
  go: (index: number) => void;
  close: () => void;
  tier: "expressive" | "responsive";
  returnFocus?: (index: number) => HTMLElement | null | undefined;
};

function Layer({ label, items, index, go, close, tier, returnFocus }: LayerProps) {
  const { compact, coarse } = useDevice();
  const enter = useTransition(tier);
  const exit = useExit(tier);
  const fadeIn = useTransition("instant");
  const fadeOut = useExit("instant");
  const travel = useTravel();
  const panel = useRef<HTMLDivElement | null>(null);
  /* Which way the last move went: 1 forward, -1 back. The image coming in and the one going out both read it. */
  const [dir, setDir] = useState<1 | -1>(1);
  const [status, setStatus] = useState("");
  const total = items.length;
  const item = items[index]!;
  const canPrevious = index > 0;
  const canNext = index < total - 1;

  const move = (to: number) => {
    if (to < 0 || to >= total || to === index) return;
    setDir(to > index ? 1 : -1);
    setStatus(`Image ${to + 1} of ${total}`);
    go(to);
  };

  /* The images either side load while this one is looked at, so moving never waits. */
  useEffect(() => {
    for (const i of [index - 1, index + 1]) {
      const near = items[i];
      if (!near) continue;
      const img = new Image();
      if (near.srcSet) img.srcset = near.srcSet;
      img.src = near.src;
    }
  }, [index, items]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const to = e.key === "ArrowRight" ? index + 1 : e.key === "ArrowLeft" ? index - 1 : e.key === "Home" ? 0 : e.key === "End" ? total - 1 : null;
    if (to === null) return;
    e.preventDefault();
    move(to);
  };

  /* The ground around the image closes it, as a scrim does. The image and the buttons do not. */
  const onGround = (e: MouseEvent) => {
    if (!(e.target as Element).closest("[data-lightbox-image], button")) close();
  };

  const previousButton = (
    <Button iconOnly size="sm" aria-label="Previous image" disabled={!canPrevious} onClick={() => move(index - 1)} className={ROUND}>
      <ChevronLeftIcon />
    </Button>
  );
  const nextButton = (
    <Button iconOnly size="sm" aria-label="Next image" disabled={!canNext} onClick={() => move(index + 1)} className={ROUND}>
      <ChevronRightIcon />
    </Button>
  );

  return (
    <div className="fixed inset-0 z-50">
      <RadixDialog.Overlay forceMount asChild>
        <motion.div
          className={SCRIM}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: fadeIn }}
          exit={{ opacity: 0, transition: fadeOut }}
        />
      </RadixDialog.Overlay>

      <RadixDialog.Content
        forceMount
        asChild
        ref={panel}
        aria-describedby={undefined}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          panel.current?.focus({ preventScroll: true });
        }}
        onCloseAutoFocus={(e) => {
          const el = returnFocus?.(index);
          if (!el) return;
          e.preventDefault();
          el.focus();
        }}
        onKeyDown={onKeyDown}
      >
        <motion.div
          tabIndex={-1}
          className="absolute inset-0 grid grid-rows-[auto_minmax(0,1fr)_auto] gap-4 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))] outline-none sm:gap-6 sm:py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: fadeIn }}
          exit={{ opacity: 0, transition: exit }}
        >
          <div className="flex min-w-0 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex min-w-0 items-baseline gap-3">
              <RadixDialog.Title className="truncate text-small font-title text-fg">{label}</RadixDialog.Title>
              <p aria-hidden="true" className="shrink-0 font-mono text-caption font-normal tabular-nums text-fg-subtle">
                {index + 1} of {total}
              </p>
            </div>
            <RadixDialog.Close asChild>
              <Button iconOnly size="sm" aria-label="Close" className={ROUND}>
                <XIcon />
              </Button>
            </RadixDialog.Close>
          </div>

          <div
            onClick={onGround}
            className={"grid min-h-0 items-center gap-4 px-4 sm:px-6 " + (compact ? "grid-cols-[minmax(0,1fr)]" : "grid-cols-[auto_minmax(0,1fr)_auto]")}
          >
            {!compact && previousButton}
            <motion.div
              className="grid size-full min-h-0 min-w-0"
              initial={{ opacity: 0, y: travel, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: enter }}
              exit={{ opacity: 0, y: travel / 2, scale: 0.98, transition: exit }}
            >
              <AnimatePresence initial={false} custom={dir}>
                <Slide key={index} item={item} dir={dir} swipe={coarse} canPrevious={canPrevious} canNext={canNext} onSwipe={(by) => move(index + by)} />
              </AnimatePresence>
            </motion.div>
            {!compact && nextButton}
          </div>

          <div className="flex min-h-control-sm items-start justify-between gap-4 px-4 sm:px-6">
            <p className="max-w-[65ch] min-w-0 text-small text-fg-muted">{item.caption}</p>
            {compact && (
              <div className="flex shrink-0 items-center gap-2">
                {previousButton}
                {nextButton}
              </div>
            )}
          </div>

          <p role="status" className="sr-only">
            {status}
          </p>
        </motion.div>
      </RadixDialog.Content>
    </div>
  );
}

type SlideProps = {
  item: LightboxItem;
  dir: 1 | -1;
  swipe: boolean;
  canPrevious: boolean;
  canNext: boolean;
  onSwipe: (by: 1 | -1) => void;
};

/** One image, sized to the stage at its own shape. A finger swipes it away to the next one. */
function Slide({ item, dir, swipe, canPrevious, canNext, onSwipe }: SlideProps) {
  const travel = useTravel();
  const change = useTransition("responsive");
  const leave = useExit("responsive");
  const node = useRef<HTMLDivElement>(null);
  /* The way a swipe sent this image. A button or a key leaves it null. */
  const swiped = useRef<"left" | "right" | null>(null);
  /* The image's shape: its width and height when given, else its own once it loads, else 3:2 while it loads. */
  const [natural, setNatural] = useState<number | null>(null);
  const ratio = item.width && item.height ? item.width / item.height : (natural ?? 3 / 2);

  /* A swipe left goes to the next image and a swipe right to the one before; with only one of them, only that way. */
  const drag = useDismissDrag({
    direction: canPrevious && canNext ? "sideways" : canNext ? "left" : "right",
    enabled: swipe && (canPrevious || canNext),
    tier: "responsive",
    onDismiss: (info: DismissInfo) => {
      if (info.direction === "down") return;
      swiped.current = info.direction;
      onSwipe(info.direction === "left" ? 1 : -1);
    },
  });

  return (
    <motion.div
      ref={node}
      {...drag.panel}
      onPointerDown={drag.onPointerDown}
      custom={dir}
      className="grid size-full min-h-0 min-w-0 place-items-center [grid-area:1/1] [container-type:size]"
      variants={{
        from: (d: 1 | -1) => ({ opacity: 0, x: d * travel }),
        here: { opacity: 1, x: 0, transition: change },
        /* Read when it leaves: a swipe carries on one width more from where the finger let go; a button or a key
           fades it out by half the travel, away from the side the next one comes from. */
        gone: (d: 1 | -1) => {
          if (swiped.current) {
            const now = drag.offset.get() as unknown;
            const from = typeof now === "number" ? now : 0;
            const by = node.current?.offsetWidth ?? 0;
            return { opacity: 0, x: from + (swiped.current === "left" ? -by : by), transition: drag.exit };
          }
          return { opacity: 0, x: (-d * travel) / 2, transition: leave };
        },
      }}
      initial="from"
      animate="here"
      exit="gone"
    >
      <div data-lightbox-image="" style={{ width: `min(100cqw, calc(100cqh * ${ratio}))` }}>
        <Media
          src={item.src}
          srcSet={item.srcSet}
          sizes="100vw"
          alt={item.alt}
          ratio={ratio}
          priority
          onLoad={(img) => {
            if (img.naturalWidth && img.naturalHeight) setNatural(img.naturalWidth / img.naturalHeight);
          }}
        />
      </div>
    </motion.div>
  );
}
