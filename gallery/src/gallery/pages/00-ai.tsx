/**
 * AI tools: litt in Claude Code, Cursor, VS Code and Codex through shadcn's own MCP server, for free.
 *
 * Nothing here is litt's own server. shadcn's MCP reads any registry named in a project's components.json, and litt's
 * registry already serves what it needs: the index (/r/registry.json), one item per component, and a <name>-demo
 * example per component page (gen-registry.mjs, EXAMPLES). So the setup is two pastes, and the page says what an agent
 * can then do, with prompts that work.
 */
import { Tabs, TabsList, TabsPanel, TabsPanels, TabsTrigger } from "@/components/tabs";
import { CodeBlock } from "../docs/code-block";
import { PageTitle, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "ai",
  title: "AI tools",
  lede: "litt in Claude Code, Cursor and Codex, free.",
  order: 0.7,
  summary:
    "Add the @litt registry to components.json and shadcn's MCP server to your AI tool. The agent can then search litt, read each component's docs and a working example, and install it with its dependencies.",
  tiers: [],
};

const ORIGIN = "https://littmd.vercel.app";

const REGISTRY = `{
  "registries": {
    "@litt": "${ORIGIN}/r/{name}.json"
  }
}`;

const SERVER = `{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}`;

/** One setup per tool, as shadcn's MCP docs give it. */
const CLIENTS = [
  {
    id: "claude",
    name: "Claude Code",
    lang: "shell" as const,
    code: `npx shadcn@latest mcp init --client claude\n\n# or put this in .mcp.json\n${SERVER}`,
    then: "Restart Claude Code and run /mcp: shadcn should say Connected.",
  },
  { id: "cursor", name: "Cursor", lang: "tsx" as const, code: `// .cursor/mcp.json\n${SERVER}`, then: "Turn the shadcn server on in Cursor Settings, under MCP." },
  {
    id: "vscode",
    name: "VS Code",
    lang: "tsx" as const,
    code: `// .vscode/mcp.json: the key is servers, not mcpServers\n{\n  "servers": {\n    "shadcn": {\n      "command": "npx",\n      "args": ["shadcn@latest", "mcp"]\n    }\n  }\n}`,
    then: "Open the file and press Start beside the shadcn server.",
  },
  {
    id: "codex",
    name: "Codex",
    lang: "shell" as const,
    code: `# ~/.codex/config.toml\n[mcp_servers.shadcn]\ncommand = "npx"\nargs = ["shadcn@latest", "mcp"]`,
    then: "Restart Codex.",
  },
];

/** Prompts that work against the live registry, each with what the agent does with it. */
const PROMPTS: [prompt: string, does: string][] = [
  ["Show me the components in the @litt registry.", "Lists every item with its one-line description."],
  ["Find a date picker in @litt.", "Searches the names and descriptions, and gives the add command."],
  ["Show me the @litt button example.", "Reads button-demo, the first demo on the Button page, as working code."],
  ["Add @litt/combobox and use it for the client field.", "Installs it with litt's tokens and the components it needs, then writes the field."],
  ["Build a settings page from @litt components.", "Searches @litt for the parts, reads their examples, installs them and composes the page."],
];

/** What the agent can lean on, beyond the MCP. */
const MORE: [title: string, text: string][] = [
  ["Every page as Markdown", `${ORIGIN}/docs/button.md and the rest: install, usage, props, keyboard and accessibility, written for agents.`],
  ["llms.txt", `${ORIGIN}/llms.txt indexes them, and /llms-full.txt is everything in one file.`],
  ["Copy prompt", "On every component page, one button copies the install line, the usage and the rules for that component."],
  ["The Claude Code plugin", "The whole design language, taste included, with build and critique workflows: claude plugin install litt-md@litt."],
];

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`ai-step-${n}`} className="grid content-start gap-4">
      <div className="grid gap-1">
        <p className="tabular-nums text-caption font-normal text-fg-subtle">Step {n}</p>
        <h2 id={`ai-step-${n}`} className="text-h4 text-fg">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export default function AiToolsPage() {
  return (
    <article aria-labelledby="page-ai" className="grid gap-12 pb-24">
      <PageTitle id="page-ai" title={meta.title} lede={meta.lede} />

      <p className="max-w-[60ch] text-reading text-fg-muted">
        shadcn's MCP server lets an AI tool browse a registry, read its items and install them. litt is a shadcn registry, so two pastes and your agent
        knows every component, with a working example for each. No account and no key.
      </p>

      <Step n={1} title="Add the registry to components.json">
        <p className="max-w-[60ch] text-body text-fg-muted">
          In a shadcn project with Tailwind CSS v4, merge this into components.json. It also makes <code className="font-mono text-small text-fg">npx shadcn@latest add @litt/button</code> work by hand.
        </p>
        <CodeBlock code={REGISTRY} label="components.json registries" />
      </Step>

      <Step n={2} title="Connect shadcn's MCP server">
        <Tabs defaultValue="claude" variant="segmented" size="sm" className="grid gap-4">
          <TabsList aria-label="AI tool" className="justify-self-start">
            {CLIENTS.map((c) => (
              <TabsTrigger key={c.id} value={c.id}>
                {c.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsPanels>
            {CLIENTS.map((c) => (
              <TabsPanel key={c.id} value={c.id} tabIndex={-1} className="grid gap-4">
                <CodeBlock code={c.code} lang={c.lang} label={`${c.name} setup`} />
                <p className="text-small text-fg-subtle">{c.then}</p>
              </TabsPanel>
            ))}
          </TabsPanels>
        </Tabs>
      </Step>

      <Step n={3} title="Ask for litt by name">
        <ul aria-label="Prompts" className="grid max-w-[75ch] divide-y divide-line border-y border-line">
          {PROMPTS.map(([prompt, does]) => (
            <li key={prompt} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-6">
              <span className="text-body text-fg">{prompt}</span>
              <span className="text-small text-fg-muted">{does}</span>
            </li>
          ))}
        </ul>
        <p className="max-w-[60ch] text-small text-fg-subtle">
          Name the registry (@litt) in the prompt, or the agent may reach for shadcn's own components first.
        </p>
      </Step>

      <section aria-labelledby="ai-more" className="grid content-start gap-4">
        <h2 id="ai-more" className="text-h4 text-fg">
          Without the MCP
        </h2>
        <ul className="grid max-w-[75ch] divide-y divide-line border-y border-line">
          {MORE.map(([title, text]) => (
            <li key={title} className="grid gap-1 py-3">
              <span className="text-body text-fg">{title}</span>
              <span className="text-small text-fg-muted">{text}</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
