import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Details, DetailsItem, DetailsLink } from "@/components/details";
import { Tag } from "@/components/tag";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "details",
  title: "Details",
  lede: "The facts about one thing, label by value.",
  order: 17.22, group: "Data",
  verbs: ["press"],
  summary:
    "An information card of labelled facts about one thing, such as a deployment or a client: in rows with the labels in one column, or in a grid with each label above its value. A value can be copied, a missing one says so, and a loading card keeps its height. Nothing moves; the copy icon swaps at once.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["details"],
  exports: ["Details", "DetailsItem", "DetailsLink"],
  usage: `import { Details, DetailsItem, DetailsLink } from "@/components/details";

// Rows: the labels share one column, so the values line up. copy adds a button that copies that exact text.
<Details title="Deployment" action={<Button size="sm">Visit</Button>}>
  <DetailsItem label="Status"><Tag status="success">Ready</Tag></DetailsItem>
  <DetailsItem label="Domain" copy="halo.studio">
    <DetailsLink href="https://halo.studio">halo.studio</DetailsLink>
  </DetailsItem>
  <DetailsItem label="Commit" mono copy="4c6d204">4c6d204</DetailsItem>
  <DetailsItem label="Region">fra1</DetailsItem>
</Details>

// Grid: each label above its value, up to four across once the card is wide.
<Details title="Marlow Labs" layout="grid" columns={4}>
  <DetailsItem label="Plan">Studio retainer</DetailsItem>
  <DetailsItem label="Sites">3</DetailsItem>
  <DetailsItem label="PO number" />                {/* says "Not set" */}
  <DetailsItem label="Notes" wide>Launches move to Tuesdays from November.</DetailsItem>
</Details>

// While the facts load, the card keeps its height.
<Details title="Invoice" loading>…</Details>`,
  use: [
    "One thing has a handful of facts people look up rather than compare: a deployment's domain and commit, an invoice's dates, a client's plan.",
    "Some values get pasted elsewhere, such as a commit, an ID or a domain. Give them `copy`, so nobody has to select text by hand.",
    "A side panel or a dialog shows the facts about the row someone opened. Use `bare` there, because the panel is already the surface.",
    "A few short facts sit under a page title, such as a case study's client, year and role. Use `layout=\"grid\"`.",
  ],
  skip: [
    "The same fields repeat for many things that people compare or sort. Use Table.",
    "One figure is the point, such as deploys this week. Use Stat, which sets the value large and can carry a delta.",
    "People edit the facts here. Use a form with fields, because a value here is text, not a control.",
    "The card should open somewhere as a whole. Use Card, which has the stretched link and the hover.",
  ],
  keyboard: [
    [["Tab"], "Moves to each link and copy button in order, row by row. The card itself is not a stop."],
    [["Enter", "Space"], "Presses a copy button. Enter follows a DetailsLink."],
  ],
  a11y: [
    "The facts are a description list: each label is a term and its value the description, so a screen reader reads \"Region, fra1\".",
    "The title is a real heading (h3 by default; pass headingLevel to fit the page's outline), so a screen reader can list the cards.",
    "A copy button is named by its row (\"Copy Commit\") and a polite live region says \"Commit copied\", or that the copy failed. Nothing else changes, so no toast is needed.",
    "Copy buttons grow to 44px on a coarse pointer and are always visible: nothing waits for a hover.",
    "A missing value says \"Not set\" in words, never a dash a screen reader would skip or read as \"dash\".",
    "While loading the card sets aria-busy and its bars are hidden from screen readers. Put the card in a Loading wrapper if you also want the wait announced.",
    "A status in a value is a Tag, so it is a word in the status color and color never carries it alone. Write the unit into the value or the label.",
  ],
};

/* A deploy the studio shipped this afternoon. */
const DEPLOY = { domain: "halo.studio", commit: "4c6d204", url: "https://halo.studio" };

function DeploymentDemo() {
  return (
    <Details
      title="Deployment"
      description="Production, shipped from main"
      action={<Button size="sm">Visit</Button>}
      className="w-full max-w-lg"
    >
      <DetailsItem label="Status">
        <Tag status="success">Ready</Tag>
      </DetailsItem>
      <DetailsItem label="Domain" copy={DEPLOY.domain}>
        <DetailsLink href={DEPLOY.url} target="_blank" rel="noreferrer">
          {DEPLOY.domain}
        </DetailsLink>
      </DetailsItem>
      <DetailsItem label="Commit" mono copy={DEPLOY.commit}>
        {DEPLOY.commit}
      </DetailsItem>
      <DetailsItem label="Region">
        fra1
      </DetailsItem>
      <DetailsItem label="Build time">41 s</DetailsItem>
      <DetailsItem label="Shipped by">
        <span className="inline-flex items-center gap-2">
          <Avatar name="Nick" size="sm" decorative />
          Nick, today at 14:32
        </span>
      </DetailsItem>
    </Details>
  );
}

function ClientDemo() {
  return (
    <Details title="Marlow Labs" description="Client since March 2024" layout="grid" columns={4} className="w-full max-w-3xl">
      <DetailsItem label="Plan">Studio retainer</DetailsItem>
      <DetailsItem label="Sites">3 on Framer</DetailsItem>
      <DetailsItem label="Billing">Monthly, on the 1st</DetailsItem>
      <DetailsItem label="Category">
        <Tag hue="violet">Fintech</Tag>
      </DetailsItem>
      <DetailsItem label="Contact">Ines Duarte</DetailsItem>
      <DetailsItem label="Email" copy="ines@marlowlabs.com">
        ines@marlowlabs.com
      </DetailsItem>
      <DetailsItem label="Account ID" mono copy="cus_8Jk2Lm4Qx">
        cus_8Jk2Lm4Qx
      </DetailsItem>
      <DetailsItem label="Time zone">Lisbon</DetailsItem>
      <DetailsItem label="Notes" wide>
        Launches move to Tuesdays from November, so the marketing team can review on Monday. Keep the old pricing page live until the
        new plans are signed off.
      </DetailsItem>
    </Details>
  );
}

function StatesDemo() {
  return (
    <div className="grid w-full max-w-3xl items-start gap-6 md:grid-cols-2">
      <Details title="Invoice 2026-031" loading>
        <DetailsItem label="Client" />
        <DetailsItem label="Amount" />
        <DetailsItem label="Sent" />
        <DetailsItem label="Due" />
      </Details>
      <Details title="Invoice 2026-030">
        <DetailsItem label="Client">Halden Gallery</DetailsItem>
        <DetailsItem label="Amount">4,800 EUR</DetailsItem>
        <DetailsItem label="Sent">2 Oct 2026</DetailsItem>
        <DetailsItem label="PO number" />
      </Details>
    </div>
  );
}

function NarrowDemo() {
  return (
    <div className="grid w-full max-w-3xl items-start gap-8 sm:grid-cols-[18rem_minmax(0,1fr)]">
      <div className="grid gap-2">
        <p className="text-caption font-normal text-fg-subtle">A card 18rem wide</p>
        <Details title="Build">
          <DetailsItem label="Status">
            <Tag status="danger">Failed</Tag>
          </DetailsItem>
          <DetailsItem label="Step">Install dependencies</DetailsItem>
          <DetailsItem label="Log" mono copy="bld_6tQw91Hc2zR">
            bld_6tQw91Hc2zR
          </DetailsItem>
        </Details>
      </div>
      <div className="grid gap-2">
        <p className="text-caption font-normal text-fg-subtle">Bare, on a panel that is already a surface</p>
        <div className="rounded-surface bg-surface-2 px-4 py-1 shadow-[inset_0_0_0_1px_var(--line)]">
          <Details bare>
            <DetailsItem label="Framework">Framer</DetailsItem>
            <DetailsItem label="Node">22.x</DetailsItem>
            <DetailsItem label="Output" mono>
              dist
            </DetailsItem>
          </Details>
        </div>
      </div>
    </div>
  );
}

export default function DetailsPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="A deployment"
        code="DeploymentDemo"
        caption="Rows of facts under a title, with one action at the end of the header. The labels share one column, so the values line up, and each label sits on its value's first line. The domain and the commit can be copied: the icon swaps for a check at once and a screen reader hears it. Nothing else moves, and the card has no hover because it links nowhere."
      >
        <DeploymentDemo />
      </Stage>

      <Stage
        title="A client at a glance"
        code="ClientDemo"
        caption="The grid puts each label above its value, in columns that measure the card: four across here, two in a narrow card, one under 20rem. The note takes the whole row. A long value wraps rather than truncating, so nothing is hidden."
      >
        <ClientDemo />
      </Stage>

      <Stage
        title="Loading and not set"
        code="StatesDemo"
        caption="While the facts load, each value is a still bar one line tall, so the card keeps its height when they arrive. Nothing pulses. A fact with no value says Not set in the subtle grey, never a dash."
      >
        <StatesDemo />
      </Stage>

      <Stage
        title="Narrow, and bare"
        align="start"
        code="NarrowDemo"
        caption="The card measures its own width. Under 20rem each label moves above its value, so a phone or a side column never squeezes the words. Bare drops the raised surface for a list that already sits on one, such as a dialog or a side panel."
      >
        <NarrowDemo />
      </Stage>

      <TryIt
        of="Details"
        component={Details}
        props={{
          title: "Deployment",
          description: "Production, shipped from main",
          className: "w-full max-w-lg",
          children: [
            <DetailsItem key="s" label="Status">
              <Tag status="success">Ready</Tag>
            </DetailsItem>,
            <DetailsItem key="d" label="Domain" copy="halo.studio">
              halo.studio
            </DetailsItem>,
            <DetailsItem key="r" label="Region">
              fra1
            </DetailsItem>,
            <DetailsItem key="b" label="Build time">
              41 s
            </DetailsItem>,
          ],
        }}
        controls={["title", "description", "layout", "loading", "bare"]}
      />
    </Page>
  );
}
