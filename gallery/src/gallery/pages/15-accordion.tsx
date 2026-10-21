import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/accordion";
import { Card, CardBody, CardDescription, CardTitle } from "@/components/card";
import { Switch } from "@/components/switch";
import { Tag } from "@/components/tag";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "accordion",
  title: "Accordion",
  lede: "Sections that open in place.",
  order: 15.25,
  group: "Layout",
  verbs: ["open"],
  summary:
    "Sections that open in place, split by hairlines. The height snaps and is never animated: the content fades in and drops a little, the chevron turns half a turn, and the rows below move to their new place by transform, so the page never jumps.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["accordion"],
  exports: ["Accordion", "AccordionItem", "AccordionTrigger", "AccordionContent"],
  usage: `import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/accordion";

// One section open at a time. Pressing the open one closes it again.
<Accordion defaultValue="start">
  <AccordionItem value="start">
    <AccordionTrigger>How does a project start?</AccordionTrigger>
    <AccordionContent>With a call about what the site has to do, then a one-page brief.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="timing">
    <AccordionTrigger>How long does a Framer site take?</AccordionTrigger>
    <AccordionContent>Most sites launch four to six weeks after the brief.</AccordionContent>
  </AccordionItem>
</Accordion>

// Several open at once, controlled: the value is a list.
const [open, setOpen] = useState<string[]>(["domain"]);
<Accordion type="multiple" value={open} onValueChange={setOpen}>
  …
</Accordion>

// Under a card's h3 title, the triggers sit in h4 headings. The size does not change.
<Accordion headingLevel={4}>…</Accordion>`,
  use: [
    "Questions and answers, where people scan the questions and open the one they have.",
    "Groups of settings most people never open, such as redirects or password protection for a site.",
    "A long spec or checklist split into named parts, where seeing every part's name matters more than reading it all.",
    "Sections inside a card that is one object. The accordion brings no card of its own, so put it in one.",
  ],
  skip: [
    "Content nearly everyone needs, or reads in order. Show it on the page, because each closed section costs a press.",
    "Switching between views of the same thing, such as Preview and Code. Use Tabs.",
    "Navigation. Links belong in the sidebar (App shell) or a Menu, not in sections that open.",
    "The steps of a run, with their status and time. Use Timeline.",
  ],
  keyboard: [
    [["Tab"], "Moves through the triggers and into open content, in page order."],
    [["Enter", "Space"], "Opens or closes the focused section."],
    [["ArrowDown"], "Moves to the next trigger, and from the last back to the first. Disabled ones are skipped."],
    [["ArrowUp"], "Moves to the previous trigger, and from the first to the last."],
    [["Home"], "Moves to the first trigger."],
    [["End"], "Moves to the last trigger."],
  ],
  a11y: [
    "Each trigger is a real <button> inside a heading, h3 unless you set headingLevel, so a screen reader can list the sections by heading. Pick the level that fits the page's outline.",
    "The button carries aria-expanded and aria-controls. The open content is a region named by its trigger.",
    "Closed content is not in the page, so Tab skips it and the browser's find does not reach it. Keep anything people search for out of a closed section.",
    "With type \"single\" and collapsible={false}, the open trigger is aria-disabled, because pressing it does nothing.",
    "Open and closed differ in the chevron's direction and in the content being there, never in color alone.",
    "Keyboard focus draws the 2px focus ring at a 2px offset around the trigger. Mouse and touch presses do not show it.",
    "Triggers are 56px tall at least. A coarse pointer has no hover, so a pressed trigger fills there instead.",
    "Under reduced motion nothing moves: the content appears, the chevron flips and the rows below take their place at once.",
    "A disabled section is greyed out, skipped by Tab and the arrow keys, and cannot open. Say why near the accordion if it is not obvious.",
  ],
};

/* ---------- (a) Studio questions: one open at a time ---------- */

const QUESTIONS = [
  {
    id: "start",
    q: "How does a project start?",
    a: "With a call about what the site has to do, then a one-page brief you sign off. The brief names the pages, the launch date and who writes the copy.",
  },
  {
    id: "timing",
    q: "How long does a Framer site take?",
    a: "Most sites launch four to six weeks after the brief. The launch page for Marlow Labs, one product and one page, took two.",
  },
  {
    id: "copy",
    q: "Do you write the copy?",
    a: "You bring the words and I shape them to the layout. If there are none yet, a copywriter I work with joins for the first two weeks.",
  },
  {
    id: "after",
    q: "What happens after launch?",
    a: "You get the Framer project, a short video on editing it and two weeks of fixes. After that, changes are billed by the hour or on a monthly retainer.",
  },
  {
    id: "edit",
    q: "Can my team edit the site?",
    a: "Yes. The posts and case studies live in Framer's CMS, and every page is built from components, so a new section keeps the system.",
  },
];

function StudioQuestionsDemo() {
  return (
    <Accordion defaultValue="start" className="w-full max-w-xl">
      {QUESTIONS.map(({ id, q, a }) => (
        <AccordionItem key={id} value={id}>
          <AccordionTrigger>{q}</AccordionTrigger>
          <AccordionContent>{a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

/* ---------- (b) Site settings: several open ---------- */

const GROUPS: Record<string, string> = {
  domain: "Domain",
  password: "Password protection",
  analytics: "Analytics",
  redirects: "Redirects",
};

const REDIRECTS = [
  ["/fonts", "/typefaces"],
  ["/blog/*", "/journal/*"],
  ["/shop", "shop.grottatype.com"],
];

function SiteSettingsDemo() {
  const [open, setOpen] = useState<string[]>(["domain", "analytics"]);
  const names = Object.keys(GROUPS)
    .filter((key) => open.includes(key))
    .map((key) => GROUPS[key]);

  return (
    <div className="grid w-full max-w-xl gap-4">
      <p className="text-small font-title text-fg">Settings for grottatype.com</p>
      <Accordion type="multiple" value={open} onValueChange={setOpen}>
        <AccordionItem value="domain">
          <AccordionTrigger>Domain</AccordionTrigger>
          <AccordionContent className="grid gap-3">
            <p>grottatype.com points at Framer, and the www address redirects to it.</p>
            <div className="flex flex-wrap items-center gap-2">
              <Tag status="success">Connected</Tag>
              <Tag>SSL renews 2 Jan</Tag>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="password">
          <AccordionTrigger>Password protection</AccordionTrigger>
          <AccordionContent className="max-w-none">
            <Switch
              align="end"
              label="Ask for a password"
              description="Visitors see a password page until the type specimens launch."
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="analytics">
          <AccordionTrigger>Analytics</AccordionTrigger>
          <AccordionContent className="max-w-none">
            <Switch align="end" label="Count visits" description="No cookies, so there is no banner." defaultChecked />
            <Switch align="end" label="Share a public dashboard" />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="redirects">
          <AccordionTrigger>Redirects</AccordionTrigger>
          <AccordionContent>
            <ul className="grid gap-2 font-mono text-small">
              {REDIRECTS.map(([from, to]) => (
                <li key={from} className="flex flex-wrap gap-x-2">
                  <span className="text-fg">{from}</span>
                  <span className="text-fg-subtle">to</span>
                  <span>{to}</span>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <p role="status" className="min-h-5 text-small text-fg-subtle">
        {names.length ? `Open: ${names.join(", ")}` : "All closed"}
      </p>
    </div>
  );
}

/* ---------- (c) Inside a card ---------- */

const CHECKLIST = [
  {
    id: "content",
    title: "Content",
    items: ["Issue 112 written and edited", "Sponsor slot sold to Kassa", "Alt text on every image"],
  },
  {
    id: "design",
    title: "Design",
    items: ["New masthead in Grotta Sans", "Dark mode checked on the archive", "Social card for the launch post"],
  },
  {
    id: "build",
    title: "Build",
    items: ["Archive moved to the CMS", "Redirects from the old /issues pages", "Signup form sends to the newsletter list"],
  },
  {
    id: "launch",
    title: "Launch",
    items: ["Domain switched to sidebarweekly.com", "Launch post scheduled for 8:00", "Old site kept read-only for a month"],
  },
];

function CardDemo() {
  return (
    <Card className="w-full max-w-md">
      <CardBody>
        <CardTitle>Sidebar Weekly, launch checklist</CardTitle>
        <CardDescription>Goes live on 4 November.</CardDescription>
        <Accordion headingLevel={4} defaultValue="design" className="mt-6">
          {CHECKLIST.map(({ id, title, items }) => (
            <AccordionItem key={id} value={id}>
              <AccordionTrigger>{title}</AccordionTrigger>
              <AccordionContent className="text-small">
                <ul className="grid list-disc gap-2 pl-4">
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardBody>
    </Card>
  );
}

export default function AccordionPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Studio questions"
        tier="responsive"
        size="lg"
        align="start"
        code="StudioQuestionsDemo"
        caption="Press a question. Its answer snaps into place, then fades in and drops a little, while the questions below slide down by transform and the chevron turns half a turn, all on the responsive tier. Opening another closes this one: its answer fades on the exit token as the rows below rise. No height is animated, so no text stretches and the page never jumps."
      >
        <StudioQuestionsDemo />
      </Stage>

      <Stage
        title="Site settings"
        tier="responsive"
        size="lg"
        align="start"
        code="SiteSettingsDemo"
        caption="With type multiple, several sections stay open and the value is a list. Each one opens and closes with the same motion. The settings inside keep their own: a switch's thumb slides on the instant tier, and the rows around it stay still."
      >
        <SiteSettingsDemo />
      </Stage>

      <Stage
        title="Inside a card"
        tier="responsive"
        size="lg"
        align="start"
        code="CardDemo"
        caption="The accordion brings no card, so the page put one around it. Its triggers sit in h4 headings under the card's title. While a section closes, the accordion keeps its height until the content has faded, so the card's edge never cuts across the rows still rising. Then it snaps, as it snapped open."
      >
        <CardDemo />
      </Stage>
    </Page>
  );
}
