/**
 * Build: pick a look, see it on whole screens, hand it to your agent (proposals/builder.md, piece 1).
 *
 * Gallery chrome, not a component: an ungrouped page beside Overview, so it has no wall tile and no registry item. The
 * look's controls are the deck's (look-controls.tsx), so the two never disagree. The frame (build-frame.tsx) shows one
 * of six screens (build-screens.tsx) at desktop or phone width, or light beside dark. Under it, the four ways out:
 * Copy install is the page's one accent fill (R6); the frame is its own view, so the screens keep their own primary
 * actions. The screen lives in the address (?screen=), so Copy link reopens what you see.
 */
import { useState } from "react";
import { LinkIcon } from "@/components/icons";
import { Segmented } from "@/components/segmented";
import { Switch } from "@/components/switch";
import { useUrlParam } from "@/components/table-filter";
import { BuildFrame } from "../build-frame";
import { SCREENS, screenOf, screenView } from "../build-screens";
import { useCustomize } from "../customize-state";
import { CopyButton } from "../docs/copy";
import { installCommand, SITE } from "../docs/copy-prompt";
import { PageTitle, type PageMeta } from "../kit";
import { lookSetup, lookWords, screenPrompt, withLook } from "../look";
import { AccentControl, FunControl, MaterialControl, ThemeControl } from "../look-controls";

export const meta: PageMeta = {
  id: "build",
  title: "Build",
  lede: "Pick a look and see it on whole screens, then hand it to your agent.",
  order: 0.2,
  summary: "Your look on six whole screens, with the commands that put it in your app.",
  tiers: ["responsive"],
};

const WIDTHS = [
  { value: "desktop", label: "Desktop" },
  { value: "phone", label: "Phone" },
] as const;

export default function BuildPage() {
  const { look } = useCustomize();
  const [screenParam, setScreen] = useUrlParam("screen");
  const screen = screenOf(screenParam);
  const [width, setWidth] = useState<"desktop" | "phone">("desktop");
  const [split, setSplit] = useState(false);
  const phone = width === "phone";
  const label = `${screen.name}, ${width}${split ? ", light beside dark" : ""}`;
  const prompt = screenPrompt(
    { name: screen.name, exportName: screen.exportName, install: installCommand(screen.id), importPath: `@/components/litt-blocks/${screen.id}` },
    look,
    SITE,
  );

  return (
    <article aria-labelledby="page-build" className="grid gap-12 pb-24">
      <PageTitle id="page-build" title={meta.title} lede={meta.lede} />

      <div className="grid gap-12 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-8">
        <section aria-label="Your look" className="grid content-start gap-6">
          <AccentControl />
          <MaterialControl />
          <FunControl />
          <ThemeControl />
          <p aria-live="polite" className="border-t border-line pt-4 text-small text-fg-muted">
            {lookWords(look)}
          </p>
        </section>

        <section aria-label="Preview" className="grid min-w-0 content-start gap-4">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <div className="max-w-full overflow-x-auto">
              <Segmented legend="Screen" value={screen.id} onValueChange={setScreen} options={SCREENS.map((s) => ({ value: s.id, label: s.name }))} />
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Segmented legend="Width" value={width} onValueChange={setWidth} options={[...WIDTHS]} />
              <Switch label="Light beside dark" checked={split} onCheckedChange={setSplit} />
            </div>
          </div>

          <BuildFrame label={label} phone={phone} split={split} swapKey={screen.id}>
            {() => screenView(screen, phone)}
          </BuildFrame>

          <div className="flex flex-wrap items-center gap-2">
            <CopyButton text={installCommand(screen.id)} variant="primary">
              Copy install
            </CopyButton>
            <CopyButton text={lookSetup(look, SITE)}>Copy setup</CopyButton>
            <CopyButton text={prompt}>Copy prompt</CopyButton>
            <CopyButton text={withLook(location.href, look)} variant="ghost" icon={<LinkIcon />}>
              Copy link
            </CopyButton>
          </div>
        </section>
      </div>
    </article>
  );
}
