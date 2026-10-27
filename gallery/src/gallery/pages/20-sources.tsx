import type { ReactNode } from "react";
import { CodeBlock } from "@/components/code-block";
import { Message, MessageActions, MessageText } from "@/components/message";
import { Citation, SourceList, Sources, citationId, unlinkCitations, type Source, type SourceListProps } from "@/components/sources";
import { ToolCall } from "@/components/tool-call";
import { DeviceProvider } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "sources",
  title: "Sources",
  lede: "Where an answer came from, in the text and under it.",
  order: 18.945,
  group: "Agents",
  verbs: ["hover", "open"],
  summary:
    "Where an answer came from: a quiet numbered chip in the running text that opens its source and previews it in a hover card, and the same sources as rows under the answer or inside the search call that found them. Rest on a mark and its row lights, and so does every other mark of that source; rest on a row and its marks light. Color only, nothing moves.",
  fun: "Rest on a row under the answer: its marks in the text pop in reading order.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["sources"],
  exports: ["Sources", "Citation", "SourceList", "citationId", "unlinkCitations"],
  usage: `import { Message, MessageActions, MessageText } from "@/components/message";
import { Citation, SourceList, Sources, citationId, unlinkCitations, type Source } from "@/components/sources";
import { ToolCall } from "@/components/tool-call";

// One shape for the card, the list and a search's results. A source's number is its place in this list.
const sources: Source[] = [
  { id: "fonts", title: "Font optimization", url: "https://nextjs.org/docs/app/getting-started/fonts", passage: "next/font self-hosts any font file, so web fonts load with zero layout shift.", readAt: "2 minutes ago" },
  { id: "geist", title: "geist", url: "https://www.npmjs.com/package/geist", site: "npm", readAt: "2 minutes ago" },
];

// The model writes "claim [2](#cite-geist)". Where your markdown renderer meets a link, citationId reads the id.
const components = {
  a: ({ href, children, ...rest }) => {
    const id = citationId(href);
    return id ? <Citation source={id} /> : <a href={href} {...rest}>{children}</a>;
  },
};

// Wrap the turn's parts in Sources. Copy gets the text with the links taken out, the numbers kept.
<Message actions={<MessageActions copyText={unlinkCitations(answer)} />}>
  <Sources sources={sources}>
    <ToolCall action="Searched" target='"geist next/font"' result="4 sources" details={<SourceList sources={found} hideLabel />} />
    <MessageText>
      <Markdown components={components}>{answer}</Markdown>
    </MessageText>
    <SourceList />
  </Sources>
</Message>`,
  use: [
    "An agent answered from the web or from files, and the person should see where each claim came from without leaving the text. A numbered chip after the claim and a row under the answer are the convention readers know.",
    "A search call found pages the answer then cited. Put a SourceList with the search's results in the call's details: the rows the answer uses wear their numbers, the rest show an icon and say Not cited.",
    "One page backs two claims. Give the second Citation a quote of its own, and the card quotes the right line.",
    "You render markdown. The model writes a #cite-<id> link, which survives every sanitizer; citationId reads it and unlinkCitations cleans the text for Copy, so the scheme lives in one file.",
  ],
  skip: [
    "The link leads somewhere in your own app, such as a project page. Use a plain link in MessageText, with a Hover card if it needs a preview.",
    "The reference is a footnote the reader should jump to on the page. A citation opens its source; the light and the shared number pair it with its row.",
    "You want the sources as a table with columns to sort. Use Table.",
    "The call's result is a log or a diff. Use Log view or Code block in the Tool call's details.",
  ],
  keyboard: [
    [["Tab"], "Moves through the marks in the text, then the rows of the list. Each is a link."],
    [["Enter"], "Opens the source in a new tab, from a mark or a row."],
    [["Escape"], "Closes the card a focused mark opened."],
  ],
  a11y: [
    "A mark is a link named \"Source 2: <title>\" and described by its site and \"opens in a new tab\". Keyboard focus opens its card at once and lights its row; the card is a preview, so nothing lives only in it.",
    "The list is an ordered list named by its label, kept for screen readers when hideLabel is on. A row reads its number, title, site, read words and \"Opens in a new tab\"; an uncited search result says \"Not cited\".",
    "The light is color only, on the instant tier, and the pairing never depends on it: the number in the text is the number in the list, readable with color and motion hidden. On a touch screen the card never opens.",
    "A mark's hit area is 44px tall and 24px wide on a coarse pointer, because two marks sit 4px apart in a line of text; rows are 44px tall.",
    "Only http and https urls become links. A source with another url shows its title as text and its mark as a plain chip, so a model cannot put a script link in the page.",
    "A citation whose id is not in the Sources draws nothing and warns once in development, so a mark that streams in before its source leaves no hole and no error.",
    "You still need to wrap the turn in Sources, keep the order of sources stable while the answer streams, and pass unlinkCitations(text) to Copy.",
  ],
};

/* ---------------------------------------------------------------- data

   Litt is fixing the Halo build: src/styles/fonts.css imports a Fontsource package that is not installed, and the fix is
   to load Geist through next/font instead. The sources are what Litt read on the way. */

const FONTS_CSS: Source = {
  id: "fonts-css",
  title: "src/styles/fonts.css",
  url: "https://github.com/litt-studio/halo-site/blob/main/src/styles/fonts.css",
  site: "halo-site",
  kind: "file",
  passage: '@import "@fontsource/geist-sans/400.css";\n@import "@fontsource/geist-mono/400.css";',
  readAt: "just now",
};
const NEXT_FONTS: Source = {
  id: "fonts",
  title: "Font optimization in Next.js",
  url: "https://nextjs.org/docs/app/getting-started/fonts",
  passage: "next/font includes built-in automatic self-hosting for any font file. This means you can optimally load web fonts with zero layout shift.",
  readAt: "2 minutes ago",
};
const GEIST_NPM: Source = {
  id: "geist",
  title: "geist on npm",
  url: "https://www.npmjs.com/package/geist",
  site: "npmjs.com",
  passage: "Geist Sans and Geist Mono are exported as next/font modules: import { GeistSans } from 'geist/font/sans' and import { GeistMono } from 'geist/font/mono'.",
  readAt: "2 minutes ago",
};
const VERCEL_GUIDE: Source = {
  id: "vercel",
  title: "Using Geist with the Next.js App Router",
  url: "https://vercel.com/guides/using-geist-font-with-nextjs",
  passage: "Add the font's variable class to the html element in app/layout.tsx, then reference the CSS variable in your global styles.",
  readAt: "a minute ago",
};
const FONTSOURCE: Source = {
  id: "fontsource",
  title: "@fontsource/geist-sans on npm",
  url: "https://www.npmjs.com/package/@fontsource/geist-sans",
  site: "npmjs.com",
  passage: "Self-host the Geist Sans font in a neatly bundled NPM package.",
  readAt: "a minute ago",
};
const GEIST_BLOG: Source = {
  id: "geist-blog",
  title: "Introducing Geist",
  url: "https://vercel.com/blog/introducing-geist",
  passage: "Geist is a new font family created by Vercel in collaboration with Basement Studio.",
  readAt: "a minute ago",
};

/** The turn's sources, numbered in this order. */
const SOURCES: Source[] = [FONTS_CSS, NEXT_FONTS, GEIST_NPM, VERCEL_GUIDE];
/** What the search call found. The answer cites two of them. */
const FOUND: Source[] = [NEXT_FONTS, GEIST_NPM, GEIST_BLOG, FONTSOURCE];
const CITED: Source[] = [NEXT_FONTS, GEIST_NPM];

/** The answer as the model wrote it: a #cite-<id> link after each claim, and one ordinary link. */
const MARKDOWN = `The Halo build fails on \`@fontsource/geist-mono\`, which \`src/styles/fonts.css\` imports and \`package.json\` does not list [1](#cite-fonts-css). The site does not need it: Next.js loads fonts through \`next/font\`, which self-hosts the files and removes the layout shift [2](#cite-fonts).

The \`geist\` package ships both faces as \`next/font\` modules [3](#cite-geist), so one import in \`src/app/layout.tsx\` replaces the two \`@fontsource\` lines [3](#cite-geist). Vercel's guide wires the variable class the same way for the App Router [4](#cite-vercel), and the [font docs](https://nextjs.org/docs/app/api-reference/components/font) list the rest of the options.`;

/* ---------------------------------------------------------------- a tiny renderer

   Enough markdown for an answer: paragraphs, code spans and links. A real app brings its own renderer and gives it the
   same `a` rule: citationId reads the href, and a Citation stands in for the link. */

const INLINE = /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const [, code, label, href] = m;
    if (code !== undefined) out.push(<code key={at}>{code}</code>);
    else {
      const id = citationId(href);
      out.push(
        id ? (
          <Citation key={at} source={id} />
        ) : (
          <a key={at} href={href} target="_blank" rel="noreferrer">
            {label}
          </a>
        ),
      );
    }
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** The paragraphs of an answer, as a markdown renderer would hand them to MessageText. */
function Markdown({ children }: { children: string }) {
  return (
    <MessageText>
      {children.split(/\n{2,}/).map((p, i) => (
        <p key={i}>{inline(p.trim())}</p>
      ))}
    </MessageText>
  );
}

/* ---------------------------------------------------------------- demos */

function CitedDemo() {
  return (
    <div className="grid w-full min-w-0 max-w-xl gap-3">
      <p className="text-small text-fg-subtle">Litt is fixing the failing Halo build</p>
      <Sources sources={SOURCES}>
        <MessageText>
          <p>
            The Halo build fails on <code>@fontsource/geist-mono</code>, which <code>src/styles/fonts.css</code> imports and <code>package.json</code> does
            not list
            <Citation source="fonts-css" />. The site does not need it: Next.js loads fonts through <code>next/font</code>, which self-hosts the
            files and removes the layout shift
            <Citation source="fonts" />.
          </p>
          <p>
            The <code>geist</code> package ships both faces as <code>next/font</code> modules
            <Citation source="geist" />, so one import in <code>src/app/layout.tsx</code> replaces the two <code>@fontsource</code> lines
            <Citation source="geist" quote="import { GeistMono } from 'geist/font/mono'" />. Vercel's guide wires the variable class the same way
            for the App Router
            <Citation source="vercel" />.
          </p>
        </MessageText>
        <SourceList />
      </Sources>
    </div>
  );
}

function SearchDemo() {
  return (
    <div className="grid w-full min-w-0 max-w-xl gap-3">
      <p className="text-small text-fg-subtle">Litt is fixing the failing Halo build</p>
      <Sources sources={CITED}>
        <ToolCall
          action="Searched"
          target={'"geist next/font"'}
          result="4 sources"
          duration={1.2}
          defaultOpen
          details={<SourceList sources={FOUND} label="Search results" hideLabel />}
        />
        <MessageText>
          <p>
            Next.js loads fonts through <code>next/font</code>, which self-hosts the files and removes the layout shift
            <Citation source="fonts" />. The <code>geist</code> package ships Geist Sans and Geist Mono as <code>next/font</code> modules
            <Citation source="geist" />, so the Fontsource imports can go.
          </p>
        </MessageText>
        <SourceList />
      </Sources>
    </div>
  );
}

function MarkdownDemo() {
  return (
    <div className="grid w-full min-w-0 max-w-xl gap-6">
      <Message latest actions={<MessageActions copyText={unlinkCitations(MARKDOWN)} />}>
        <Sources sources={SOURCES}>
          <Markdown>{MARKDOWN}</Markdown>
          <SourceList />
        </Sources>
      </Message>
      <CodeBlock lang="text" filename="answer.md" code={MARKDOWN} wrap maxHeight="12rem" />
    </div>
  );
}

/** The same turn forced to the phone path, so a desktop can preview it. A real phone needs no wrapper. */
function PhoneDemo() {
  return (
    <DeviceProvider mode="phone">
      <div className="w-full min-w-0 max-w-[22.375rem]">
        <div role="region" aria-label="Litt on a phone" className="grid gap-3 rounded-surface bg-canvas p-4 outline-1 -outline-offset-1 outline-line">
          <Sources sources={CITED}>
            <ToolCall
              action="Searched"
              target={'"geist next/font"'}
              result="4 sources"
              duration={1.2}
              details={<SourceList sources={FOUND} label="Search results" hideLabel />}
            />
            <MessageText>
              <p>
                Next.js loads fonts through <code>next/font</code>, which self-hosts the files and removes the layout shift
                <Citation source="fonts" />. The <code>geist</code> package ships both faces as <code>next/font</code> modules
                <Citation source="geist" />, so the Fontsource imports can go.
              </p>
            </MessageText>
            <SourceList />
          </Sources>
        </div>
      </div>
    </DeviceProvider>
  );
}

/** The list with a short cited answer above it, so Try it has marks to light. */
function TrySourceList(props: SourceListProps) {
  return (
    <div className="grid w-full max-w-xl gap-3">
      <Sources sources={CITED}>
        <MessageText>
          <p>
            Next.js loads fonts through <code>next/font</code>
            <Citation source="fonts" />, and the <code>geist</code> package ships both faces as <code>next/font</code> modules
            <Citation source="geist" />.
          </p>
        </MessageText>
        <SourceList {...props} />
      </Sources>
    </div>
  );
}

/* ---------- the overview's tile ---------- */

function SourcesTile() {
  return (
    <div className="grid w-full max-w-md gap-3">
      <Sources sources={CITED}>
        <MessageText>
          <p>
            Next.js loads fonts through <code>next/font</code>
            <Citation source="fonts" />, and <code>geist</code> ships both faces as <code>next/font</code> modules
            <Citation source="geist" />.
          </p>
        </MessageText>
        <SourceList />
      </Sources>
    </div>
  );
}

export default function SourcesPage() {
  return (
    <Page meta={meta} docs={docs} tile={<SourcesTile />}>
      <Stage
        title="An answer and its sources"
        tier="instant"
        size="lg"
        align="start"
        code="CitedDemo"
        caption="Each claim ends in a quiet numbered chip, and the same numbers lead the rows under the answer. Rest on a chip: its row lights, and so does the other chip that cites the same page. Run the pointer down the list and the chips in the text light in turn. The light is color only, on the instant tier, and nothing moves. Rest a little longer and the card grows from the chip on the responsive tier: the site, the title, the passage and when Litt read it. The second mark of the geist page quotes the line that claim leans on. The chip is a link to the source, as citations are everywhere, and so is the row."
      >
        <CitedDemo />
      </Stage>

      <Stage
        title="What a search found"
        tier="instant"
        size="lg"
        align="start"
        code="SearchDemo"
        caption="The search call says how many sources it found, and opens to them as a list in its details, with no well around it. The answer cites two of the four, so those two rows wear their numbers, and the others show the globe and say Not cited for a screen reader. One Sources wraps the call, the answer and the list, so the numbers agree everywhere. Rest on a result and the chip it feeds lights in the text below."
      >
        <SearchDemo />
      </Stage>

      <Stage
        title="From the model's markdown"
        tier="instant"
        size="lg"
        align="start"
        code="MarkdownDemo"
        caption="The model writes a fragment link after each claim, and the page's small renderer turns every link whose id citationId reads into a Citation. An ordinary link stays a link. Copy puts the text on the clipboard with the citation links taken out and the numbers kept, through unlinkCitations, so no fragment leaves the page."
      >
        <MarkdownDemo />
      </Stage>

      <Stage
        title="On a phone"
        tier="instant"
        align="start"
        code="PhoneDemo"
        caption="A finger never hovers, so the card never opens and the light never shows. The number pairs the chip with its row instead, and both are links to the source. A chip's hit area grows to 44px tall and 24px wide, the width two chips 4px apart allow, and the rows are 44px. A pressed row takes its hover fill at once."
      >
        <PhoneDemo />
      </Stage>

      <TryIt of="SourceList" component={TrySourceList} props={{ label: "Sources" }} controls={["label", "hideLabel"]} />
    </Page>
  );
}
