import { Button } from "@/components/button";
import { Card, CardBody, CardCover, CardDescription, CardLink, CardTitle } from "@/components/card";
import { ArrowUpRightIcon } from "@/components/icons";
import { ProjectCover, type CoverName } from "@/components/list-cover";
import { Tag } from "@/components/tag";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "card",
  title: "Card",
  order: 15, group: "Layout",
  summary:
    "A raised surface for one independent object that links somewhere. A linked card is one real link stretched over the card; hover moves its fill one step, and nothing lifts, grows or scales.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["card"],
  exports: ["Card", "CardCover", "CardBody", "CardTitle", "CardDescription", "CardLink"],
  usage: `import { Card, CardBody, CardCover, CardDescription, CardLink, CardTitle } from "@/components/card";

// A linked card with a cover inset by 4px. The link wraps the title and stretches over the whole card.
<Card cover="inset">
  <CardCover>
    <img src="/halden.png" alt="The Halden wordmark on a grid" className="size-full object-cover" />
  </CardCover>
  <CardBody>
    <CardTitle>
      <CardLink href="/work/halden-gallery">Halden Gallery</CardLink>
    </CardTitle>
    <CardDescription>Wordmark, grid and color for the new wing.</CardDescription>
  </CardBody>
</Card>

// No cover: the card pads 24px itself. Leave out CardLink and the card is not a link, and has no hover.
<Card>
  <CardBody>
    <CardTitle>Next invoice</CardTitle>
    <CardDescription>Sends on 1 Nov.</CardDescription>
  </CardBody>
</Card>

// Anything else you can press inside a linked card needs relative, or the link covers it.
<a href="https://halden.example" className="relative">Visit site</a>`,
  use: [
    "The items are independent objects that each open somewhere: client sites, builds, invoices, products. A card says \"this is one thing\".",
    "Each one has a picture, a name and a line or two of context. Use a cover for the picture.",
    "You want a grid people scan and open. Put the cards in a ul and give each one as=\"li\".",
    "A summary with its own action, such as a plan with a Manage button. Leave out CardLink and the card is just a surface.",
  ],
  skip: [
    "The items are rows of the same few fields that people compare or sort. Use Table, because a card hides the columns.",
    "A feature list, or three equal cards with an icon and two lines. Use text with hairline dividers, because cards are not the default layout.",
    "A floating panel over content, such as a menu or a popover. Those are glass; a card never is.",
    "A long list of projects with a status and a date. Use List and cards, which has the rows.",
    "You want a card to lift or grow on hover. It will not: a card only changes its fill.",
  ],
  keyboard: [
    [["Tab"], "Moves to the card's link. A card is one tab stop, however big it is. Other controls inside the card come after it."],
    [["Enter"], "Follows the link, or presses the button when the card has no href."],
    [["Space"], "Presses the button when the card has no href. A link ignores Space, like any link."],
  ],
  a11y: [
    "A linked card holds one real <a>, or a <button> when you give no href, inside a heading. The title is the accessible name, the card is one tab stop, and screen readers can list the cards by heading.",
    "The link is stretched over the card by its ::after, so the whole card is the target. No block content sits inside an <a>.",
    "Keyboard focus draws the 2px focus ring at a 2px offset around the whole card, not around the title text. Mouse and touch show no ring.",
    "Hover moves the fill and the cover by one step and reveals nothing, so touch loses nothing. Text still passes 4.5:1 on surface-2.",
    "Give any second control inside a linked card `relative`. Without it the stretched link sits on top and the control cannot be pressed.",
    "The stretched link covers the card, so text inside it cannot be selected by dragging. Keep text people copy, such as an invoice number, in a control with `relative`, or outside the card.",
    "A cover image needs alt text that says what it shows. Decorative art should be aria-hidden, as the drawn covers here are.",
    "CardTitle renders an h3 by default. Pass as=\"h2\" or \"h4\" to match the page's outline; the size does not change.",
    "Under reduced motion the fill still changes, with no fade, because the duration token is zero.",
  ],
};

/** A status as a Tag: the word in the status color. Color never carries the status alone. */
function Status({ tone, children }: { tone: "success" | "warning" | "neutral"; children: string }) {
  return <Tag status={tone}>{children}</Tag>;
}

type Site = {
  id: string;
  name: string;
  note: string;
  cover: CoverName;
  status: string;
  tone: "success" | "warning" | "neutral";
  url: string;
};

const SITES: Site[] = [
  {
    id: "halden",
    name: "Halden Gallery",
    note: "Wordmark, grid and color for the new wing.",
    cover: "identity",
    status: "In review",
    tone: "warning",
    url: "https://halden.example",
  },
  {
    id: "marlow",
    name: "Marlow Labs",
    note: "A launch page for a dev tool, built in Framer.",
    cover: "landing",
    status: "Live",
    tone: "success",
    url: "https://marlow.example",
  },
  {
    id: "kassa",
    name: "Kassa",
    note: "Cash, invoices and runway on one screen.",
    cover: "dashboard",
    status: "Draft",
    tone: "neutral",
    url: "https://kassa.example",
  },
];

/* ---------- (a) Linked cards ---------- */

function ClientCardsDemo() {
  return (
    <ul className="grid w-full grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
      {SITES.map((site) => (
        <Card key={site.id} as="li" cover="inset">
          <CardCover>
            <ProjectCover name={site.cover} />
          </CardCover>
          <CardBody>
            <CardTitle>
              <CardLink href="#card">{site.name}</CardLink>
            </CardTitle>
            <CardDescription>{site.note}</CardDescription>
            <div className="mt-auto flex items-center justify-between pt-4">
              <Status tone={site.tone}>{site.status}</Status>
              {/* A second control inside a linked card sits above the stretched link with relative. */}
              <a
                href={site.url}
                className="relative inline-flex h-control-sm items-center gap-1 text-caption text-fg-subtle transition-colors duration-(--dur-instant) ease-litt hover:text-fg pointer-coarse:h-control-md"
              >
                Visit site
                <ArrowUpRightIcon />
              </a>
            </div>
          </CardBody>
        </Card>
      ))}
    </ul>
  );
}

/* ---------- (b) Cover styles ---------- */

function CoverStylesDemo() {
  return (
    <ul className="grid w-full grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
      <Card as="li" cover="inset">
        <CardCover>
          <ProjectCover name="landing" />
        </CardCover>
        <CardBody>
          <CardTitle>
            <CardLink href="#card">Inset cover</CardLink>
          </CardTitle>
          <CardDescription>Padded by 4px. The cover takes the control radius, so the corners nest.</CardDescription>
        </CardBody>
      </Card>

      <Card as="li" cover="bleed">
        <CardCover>
          <ProjectCover name="system" />
        </CardCover>
        <CardBody>
          <CardTitle>
            <CardLink href="#card">Full-bleed cover</CardLink>
          </CardTitle>
          <CardDescription>Runs to the edges and takes the card's own radius at the top.</CardDescription>
        </CardBody>
      </Card>

      <Card as="li">
        <CardBody>
          <CardTitle>
            <CardLink href="#card">INV-0412</CardLink>
          </CardTitle>
          <CardDescription>Halden Gallery, due 24 Oct</CardDescription>
          <p className="mt-6 font-mono text-h4 font-normal tabular-nums text-fg">€4,800.00</p>
          <div className="mt-auto pt-4">
            <Status tone="warning">Sent</Status>
          </div>
        </CardBody>
      </Card>
    </ul>
  );
}

/* ---------- (c) Light, and a card that is not a link ---------- */

function LightDemo() {
  return (
    <ul className="grid w-full grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
      <Card as="li" lit>
        <CardBody>
          <CardTitle>Next invoice</CardTitle>
          <CardDescription>Marlow Labs, sends on 1 Nov.</CardDescription>
          <p className="mt-6 font-mono text-h4 font-normal tabular-nums text-fg">€1,200.00</p>
          {/* No CardLink, so this card is a surface: it has no hover, and the button inside is its own target. */}
          <div className="pt-6">
            <Button size="sm">Edit invoice</Button>
          </div>
        </CardBody>
      </Card>

      <Card as="li" cover="inset">
        <CardCover lit />
        <CardBody>
          <CardTitle>
            <CardLink href="#card">Motion study: light</CardLink>
          </CardTitle>
          <CardDescription>The cover carries the light. It falls from the top and never moves.</CardDescription>
        </CardBody>
      </Card>
    </ul>
  );
}

export default function CardPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Linked cards"
        tier="instant"
        size="lg"
        align="start"
        code="ClientCardsDemo"
        caption="Hover a card and its fill moves one step, to surface-2, with the cover stepping to surface-3 so it keeps its edge. Both are color fades on the instant tier. Nothing lifts, grows or scales. Press Tab: each card is one stop, and the focus ring wraps the whole card. Visit site is a second control, so it sits above the stretched link."
      >
        <ClientCardsDemo />
      </Stage>

      <Stage
        title="Cover styles"
        tier="instant"
        size="lg"
        align="start"
        code="CoverStylesDemo"
        caption="A plain card pads 24px. An inset cover pads the card by 4px and gives the cover the control radius, then the text pads 16px above and at the sides and 12px below. A full-bleed cover takes the card's radius at the top and the text pads 24px. Same hover on all three."
      >
        <CoverStylesDemo />
      </Stage>

      <Stage
        title="Light, and no link"
        tier="instant"
        size="lg"
        align="start"
        code="LightDemo"
        caption="A card can carry its own light and grain from the top, on the card or on its cover. It is static, and this gallery's page already has one light, so it is the exception, not the rule. A card with no CardLink is just a surface: no hover, and the button inside is the only target."
      >
        <LightDemo />
      </Stage>
    </Page>
  );
}
