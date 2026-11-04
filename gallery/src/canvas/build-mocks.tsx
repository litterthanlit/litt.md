/**
 * The Build page, rethought as a tool and not a docs page: three takes on "simple and easy to use", side by side, so
 * Nick can pick one before anything is wired (after graphicalui.com: a canvas, a floating panel, few controls).
 *
 * - A · Stage: one screen, large; a floating panel with the three look choices; the screens in a bottom pill.
 * - B · Board: every screen at once on a calm board; the same panel; click a screen to pick it.
 * - C · Steps: three steps in a row: pick a look, pick a screen, copy the prompt.
 *
 * Every control is live: the look pickers change the whole gallery (customize-state.tsx), and Copy prompt copies the
 * real prompt for the screen shown. The screens are the gallery's own blocks, drawn small (Miniature) and out of reach.
 * One action leaves each mock: Copy prompt, the one accent fill (R6). It carries the install and the look's setup.
 */
import { useState, type ReactNode } from "react";
import { CardPicker } from "@/components/card-picker";
import { Segmented } from "@/components/segmented";
import { SCREENS, type ScreenId } from "../gallery/build-screens";
import { useCustomize, useDark } from "../gallery/customize-state";
import { CopyButton } from "../gallery/docs/copy";
import { installCommand, SITE } from "../gallery/docs/copy-prompt";
import { ACCENTS, lookAttributes, lookWords, MATERIALS, screenPrompt, type Material } from "../gallery/look";
import { Miniature } from "../gallery/miniature";
import { pages } from "../gallery/registry";
import { AccentChip } from "../gallery/swatch";

export const MOCK = { width: 1280, height: 800 } as const;

const pageOf = (id: ScreenId) => pages.find((p) => p.id === id)!;
const screenName = (id: ScreenId) => SCREENS.find((s) => s.id === id)!.name;

function usePrompt(id: ScreenId) {
  const { look } = useCustomize();
  const s = SCREENS.find((x) => x.id === id)!;
  return screenPrompt({ name: s.name, exportName: s.exportName, install: installCommand(s.id), importPath: `@/components/litt-blocks/${s.id}` }, look, SITE);
}

/** The whole tool's window: a top bar with the one action, then the tool. */
function MockWindow({ screen, children }: { screen: ScreenId; children: ReactNode }) {
  const prompt = usePrompt(screen);
  return (
    <div className="flex flex-col overflow-hidden rounded-surface bg-canvas shadow-[inset_0_0_0_1px_var(--line)]" style={{ width: MOCK.width, height: MOCK.height }}>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-6">
        <p className="text-small">
          <span className="font-title text-fg">litt.md</span>
          <span className="text-fg-subtle"> · Build</span>
        </p>
        <CopyButton text={prompt} variant="primary">
          Copy prompt
        </CopyButton>
      </header>
      <div className="relative min-h-0 flex-1">{children}</div>
    </div>
  );
}

/** A screen as a picture: the block's own page, drawn small, inert and hidden from assistive tech. */
function ScreenPicture({ id, width, height }: { id: ScreenId; width: number; height: number }) {
  return (
    <div aria-hidden="true" inert className="relative overflow-hidden rounded-surface bg-canvas shadow-[inset_0_0_0_1px_var(--line)]" style={{ width, height }}>
      <Miniature page={pageOf(id)} width={width} height={height} inset={0} still />
    </div>
  );
}

/** Press or Flat as a picture: a block in its tray, drawn in that material. */
function MaterialSwatch({ material }: { material: Material }) {
  const { look } = useCustomize();
  const dark = useDark();
  return (
    <span {...lookAttributes({ accent: look.accent, material }, dark)} className="grid h-6 w-10 grid-cols-2 rounded-control bg-tray p-0.5 shadow-(--tray-shade)">
      <span className="rounded-[calc(var(--radius-control)-2px)] bg-block shadow-(--block-lift)" />
    </span>
  );
}

/** The three choices a look is, as pictures. Nothing else: type and shape stay litt's (builder.md, decision 1). */
function LookChoices() {
  const { look, setLook } = useCustomize();
  return (
    <div className="grid gap-6">
      <CardPicker
        size="sm"
        legend="Accent"
        value={look.accent}
        onValueChange={(accent) => setLook({ accent })}
        options={ACCENTS.map((a) => ({ value: a.id, label: a.short ?? a.name, picture: <AccentChip accent={a.id} /> }))}
      />
      <CardPicker
        size="sm"
        legend="Material"
        value={look.material}
        onValueChange={(material) => setLook({ material })}
        options={MATERIALS.map((m) => ({ value: m.id, label: m.name, picture: <MaterialSwatch material={m.id} /> }))}
      />
      <CardPicker
        size="sm"
        legend="Motion"
        value={look.fun ? "fun" : "calm"}
        onValueChange={(v) => setLook({ fun: v === "fun" })}
        options={[
          { value: "calm", label: "Calm" },
          { value: "fun", label: "Fun" },
        ]}
      />
    </div>
  );
}

/** The look, floating over the tool: glass, since it floats over content (R3). */
function LookPanel({ className = "" }: { className?: string }) {
  const { look } = useCustomize();
  return (
    <section aria-label="Your look" className={"litt-glass grid gap-6 p-6 " + className}>
      <LookChoices />
      <p className="border-t border-line pt-4 text-caption font-normal text-fg-subtle">{lookWords(look)}</p>
    </section>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useCustomize();
  const dark = useDark();
  return (
    <Segmented
      size="sm"
      legend="Theme"
      value={theme === "system" ? (dark ? "dark" : "light") : theme}
      onValueChange={(t) => setTheme(t)}
      options={[
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ]}
    />
  );
}

/* ---------------------------------------------------------------- A · Stage */

export function BuildStage() {
  const [screen, setScreen] = useState<ScreenId>("settings");
  return (
    <MockWindow screen={screen}>
      <div className="absolute inset-0 bg-surface-2" />
      <div className="absolute inset-y-0 left-0 right-80 grid place-items-center pb-20">
        <ScreenPicture id={screen} width={820} height={540} />
      </div>
      <LookPanel className="absolute right-6 top-6 w-68" />
      <div className="absolute inset-x-0 bottom-6 flex justify-center pr-80">
        <div className="litt-glass flex items-center gap-3 p-2">
          <Segmented size="sm" legend="Screen" value={screen} onValueChange={setScreen} options={SCREENS.map((s) => ({ value: s.id, label: s.name }))} />
          <ThemeToggle />
        </div>
      </div>
    </MockWindow>
  );
}

/* ---------------------------------------------------------------- B · Board */

export function BuildBoard() {
  const [screen, setScreen] = useState<ScreenId>("dashboard");
  return (
    <MockWindow screen={screen}>
      <div className="absolute inset-0 bg-surface-2" />
      <div className="absolute inset-y-0 left-0 right-80 grid grid-cols-3 content-center gap-x-6 gap-y-8 px-10 pb-16">
        {SCREENS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={screen === s.id}
            onClick={() => setScreen(s.id)}
            className="group grid justify-items-start gap-2 rounded-surface p-1 text-left outline-offset-2"
          >
            <span className={"rounded-surface p-1 transition-colors duration-(--dur-instant) ease-litt " + (screen === s.id ? "bg-block shadow-(--block-lift)" : "group-hover:bg-(--block-hover)")}>
              <ScreenPicture id={s.id} width={260} height={170} />
            </span>
            <span className={"px-1 text-small " + (screen === s.id ? "font-title text-fg" : "text-fg-muted")}>{s.name}</span>
          </button>
        ))}
      </div>
      <LookPanel className="absolute right-6 top-6 w-68" />
      <div className="absolute inset-x-0 bottom-6 flex justify-center pr-80">
        <div className="litt-glass flex items-center gap-3 p-2 pl-4">
          <span className="text-small text-fg-muted">{screenName(screen)} goes in the prompt</span>
          <ThemeToggle />
        </div>
      </div>
    </MockWindow>
  );
}

/* ---------------------------------------------------------------- C · Steps */

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section aria-label={`Step ${n}: ${title}`} className="grid content-start gap-6">
      <p className="text-small">
        <span className="text-fg-subtle">{n} </span>
        <span className="font-title text-fg">{title}</span>
      </p>
      {children}
    </section>
  );
}

export function BuildSteps() {
  const [screen, setScreen] = useState<ScreenId>("product");
  const prompt = usePrompt(screen);
  return (
    <MockWindow screen={screen}>
      <div className="grid h-full grid-cols-[18rem_minmax(0,1fr)_22rem] gap-10 p-10">
        <Step n={1} title="Pick a look">
          <LookChoices />
          <ThemeToggle />
        </Step>
        <Step n={2} title="Pick a screen">
          <div className="grid grid-cols-2 gap-4">
            {SCREENS.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={screen === s.id}
                onClick={() => setScreen(s.id)}
                className={"grid gap-2 rounded-surface p-1 text-left transition-colors duration-(--dur-instant) ease-litt " + (screen === s.id ? "bg-block shadow-(--block-lift)" : "hover:bg-(--block-hover)")}
              >
                <ScreenPicture id={s.id} width={248} height={150} />
                <span className={"px-1 pb-1 text-small " + (screen === s.id ? "font-title text-fg" : "text-fg-muted")}>{s.name}</span>
              </button>
            ))}
          </div>
        </Step>
        <Step n={3} title="Hand it to your agent">
          <pre tabIndex={0} aria-label="The prompt" className="max-h-96 overflow-auto rounded-control bg-surface-2 p-4 font-mono text-caption font-normal whitespace-pre-wrap text-fg-muted shadow-[inset_0_0_0_1px_var(--line)]">
            {prompt}
          </pre>
          <p className="text-small text-fg-muted">Paste it into Claude Code, Cursor or Codex. It installs the screen and sets your look.</p>
        </Step>
      </div>
    </MockWindow>
  );
}
