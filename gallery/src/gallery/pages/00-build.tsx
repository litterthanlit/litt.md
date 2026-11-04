/**
 * Build: pick a look, see it on a whole screen, hand it to your agent (proposals/builder.md, piece 1; the Stage, from
 * the canvas mockups Nick picked: "go with A, with the see all screens view").
 *
 * A tool, not a docs page (meta.tool): the whole width, no sidebar. Three parts and one action:
 * - The stage: the screen, real and usable, in a frame (build-frame.tsx), on a quiet ground. Its own view for R6, so
 *   the screens keep their own primary actions.
 * - The look (look-panel.tsx): accent, material and motion as pictures, floating over the stage on a wide screen.
 * - A pill under the stage: the six screens by name, and All screens, which shows them side by side to pick from.
 * Copy prompt is the page's one accent fill: its prompt installs the screen and sets the look, so it is all an agent
 * needs. Copy link reopens what you see: the look and the screen (?screen=).
 */
import { useState } from "react";
import { Button } from "@/components/button";
import { LinkIcon } from "@/components/icons";
import { Segmented } from "@/components/segmented";
import { useUrlParam } from "@/components/table-filter";
import { SoftSwap } from "@/motion";
import { BuildFrame } from "../build-frame";
import { AllScreens, SCREENS, screenOf, screenView, type ScreenId } from "../build-screens";
import { useCustomize } from "../customize-state";
import { CopyButton } from "../docs/copy";
import { installCommand, SITE } from "../docs/copy-prompt";
import { PageTitle, type PageMeta } from "../kit";
import { LookPanel } from "../look-panel";
import { screenPrompt, withLook } from "../look";

export const meta: PageMeta = {
  id: "build",
  title: "Build",
  lede: "Pick a look, see it on a whole screen, hand it to your agent.",
  order: 0.2,
  summary: "Your look on six whole screens, and the prompt that puts one in your app.",
  tiers: ["responsive"],
  tool: true,
};

export default function BuildPage() {
  const { look } = useCustomize();
  const [screenParam, setScreen] = useUrlParam("screen");
  const screen = screenOf(screenParam);
  const [all, setAll] = useState(false);
  const pick = (id: ScreenId) => {
    setScreen(id);
    setAll(false);
  };
  /* The screen from state, not the address: useUrlParam writes the address a beat after it renders. */
  const link = () => {
    const url = new URL(location.href);
    url.searchParams.set("screen", screen.id);
    return withLook(url.href, look);
  };
  const prompt = screenPrompt(
    { name: screen.name, exportName: screen.exportName, install: installCommand(screen.id), importPath: `@/components/litt-blocks/${screen.id}` },
    look,
    SITE,
  );

  return (
    <article aria-labelledby="page-build" className="grid grid-cols-1 gap-8 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <PageTitle id="page-build" title={meta.title} lede={meta.lede} />
        <div className="flex items-center gap-2">
          <CopyButton text={link} variant="ghost" icon={<LinkIcon />}>
            Copy link
          </CopyButton>
          <CopyButton text={prompt} variant="primary">
            Copy prompt
          </CopyButton>
        </div>
      </div>

      <div data-build-stage="" className="grid min-w-0 grid-cols-1 gap-6 rounded-surface bg-surface-2 p-4 sm:p-6 lg:relative lg:block lg:min-h-224 lg:p-8 lg:pr-96 lg:pb-32">
        <div className="min-w-0">
          <SoftSwap swapKey={all ? "all" : "one"}>
            {all ? <AllScreens current={screen.id} onPick={pick} /> : <BuildFrame label={`${screen.name} screen`} swapKey={screen.id}>{screenView(screen)}</BuildFrame>}
          </SoftSwap>
        </div>

        {/* Under the stage: sticky on a phone, so the screens stay in reach; floating at the stage's foot from lg. */}
        <div className="sticky bottom-4 z-10 flex justify-center lg:absolute lg:inset-x-0 lg:bottom-8 lg:pr-96">
          <div className="litt-glass flex max-w-full items-center gap-2 p-2">
            <div className="min-w-0 overflow-x-auto">
              {/* Its own width, so on a phone the strip scrolls instead of crushing the names. */}
              <Segmented size="sm" legend="Screen" value={screen.id} onValueChange={pick} options={SCREENS.map((s) => ({ value: s.id, label: s.name }))} className="w-max" />
            </div>
            <Button size="sm" variant={all ? "secondary" : "ghost"} aria-pressed={all} onClick={() => setAll(!all)} className="shrink-0">
              All screens
            </Button>
          </div>
        </div>

        <LookPanel className="lg:absolute lg:top-8 lg:right-8 lg:w-80" />
      </div>
    </article>
  );
}
