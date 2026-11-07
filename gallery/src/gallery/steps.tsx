import { Button } from "@/components/button";
import { CheckIcon, CopyIcon } from "@/components/icons";
import { CopyStatus, useCopy } from "./docs/copy";
import { materialOf, type Material } from "./look";

export const ORIGIN = "https://littmd.vercel.app";

/** The hash is the page's route, so the hero reaches the steps by focus, as "Skip to blocks" does, not by a link. */
export function toStart() {
  document.getElementById("start-title")?.focus();
}

/** A line to paste: the text in the mono, scrolling sideways if it must, and a copy button beside it, never over it. */
export function Paste({ text, label }: { text: string; label: string }) {
  const [state, copy] = useCopy();
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-surface bg-surface-2 py-2 pr-2 pl-4 shadow-[inset_0_0_0_1px_var(--line)]">
      <pre tabIndex={0} role="group" aria-label={label} className="min-w-0 flex-1 overflow-x-auto py-1 font-mono text-small text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
        <code>{text}</code>
      </pre>
      <Button iconOnly variant="ghost" size="sm" aria-label={`Copy: ${label}`} onClick={() => copy(text)}>
        {state === "copied" ? <CheckIcon /> : <CopyIcon />}
      </Button>
      <CopyStatus state={state} />
    </div>
  );
}

/** One step, as a row: what you do in a few words, then the one thing to paste. */
export function Step({ n, title, text, paste, label }: { n: number; title: string; text: string; paste: string; label: string }) {
  return (
    <li className="grid min-w-0 gap-4 py-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-12">
      <div className="grid content-start gap-1">
        <p className="text-caption text-fg-subtle tabular-nums">Step {n}</p>
        <h3 className="text-body font-title text-fg">{title}</h3>
        <p className="max-w-[48ch] text-small text-fg-muted">{text}</p>
      </div>
      <Paste text={paste} label={label} />
    </li>
  );
}

/**
 * The three things to do with litt, each with its paste: the language for Claude, a part for the app, and the score.
 * The AI tools page has the MCP setup for each tool.
 */
export function Start({ material }: { material?: Material }) {
  const attribute = material ? materialOf(material).attribute : null;
  const first = attribute ? 1 : 0;
  return (
    <section aria-labelledby="start-title" className="grid gap-6">
      {/* Focusable from code only, for the hero's Get started. */}
      <h2 id="start-title" tabIndex={-1} className="max-w-[64ch] scroll-mt-24 text-h2 text-balance outline-none">
        <span className="text-fg">Build with your agent.</span>{" "}
        <span className="font-normal text-fg-subtle">The taste comes with the parts: Claude reads the rules, installs the components and checks its own work.</span>
      </h2>
      <ol className="grid divide-y divide-line border-y border-line">
        {attribute && (
          <Step
            n={1}
            title="Set the material"
            text={`${materialOf(material!).name} is one attribute on <html>. Set it in the layout, not from an effect, so it reaches every portal and paints first.`}
            paste={`<html lang="en" data-material="${attribute}">`}
            label="Set the material"
          />
        )}
        <Step
          n={1 + first}
          title="Give Claude the language"
          text="The litt.md plugin: the rules, the specs and the workflows to build, critique and check."
          paste={"claude plugin marketplace add litterthanlit/litt.md\nclaude plugin install litt-md@litt"}
          label="Install the plugin"
        />
        <Step
          n={2 + first}
          title="Add any part"
          text="Every component installs with shadcn, on litt's own tokens, so your theme stays untouched."
          paste={`npx shadcn@latest add ${ORIGIN}/r/button.json`}
          label="Add a component"
        />
        <Step
          n={3 + first}
          title="Score your app"
          text="Ask Claude, and it measures your code against litt out of 100, with every fix."
          paste="how litt is this app?"
          label="Ask Claude"
        />
      </ol>
      <p className="text-small text-fg-subtle">
        Cursor, VS Code and Codex:{" "}
        <a
          href="#ai"
          className="rounded-control text-accent-text underline decoration-[color-mix(in_oklab,var(--accent-text)_40%,transparent)] underline-offset-2 transition-colors duration-(--dur-instant) ease-litt hover:decoration-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          AI tools
        </a>{" "}
        has the setup, through shadcn's MCP server.
      </p>
    </section>
  );
}

