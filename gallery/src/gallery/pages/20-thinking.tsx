import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { Thinking } from "@/components/thinking";
import { DeviceProvider } from "@/motion";
import { Page, Stage, useReplay, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "thinking",
  title: "Thinking",
  lede: "The agent's reasoning, folded away.",
  order: 18.93,
  group: "Agents",
  summary:
    "The agent's reasoning as a quiet disclosure above its answer. It reads \"Thinking\" with a clock that counts whole seconds, then \"Thought for 12s\", and it folds itself away when the answer starts unless you opened it. No shimmer, no pulse, no spinner: the clock is the only live signal.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["thinking"],
  exports: ["Thinking"],
  usage: `import { Thinking } from "@/components/thinking";

// While the agent thinks. The clock counts from when active turned true, and the reasoning streams in as children.
<Thinking active={thinking}>
  <p>{reasoning}</p>
</Thinking>

// A thought loaded from history: not active, with the seconds it took. It starts closed.
<Thinking duration={12}>
  <p>The deploy log stops at the image step.</p>
  <p>Eleven of the images are over 6 MB.</p>
</Thinking>

// Your own words in place of "Thinking" and "Thought for", and your own control of the open state.
<Thinking label="Reasoning" active={thinking} open={open} onOpenChange={setOpen}>
  <p>{reasoning}</p>
</Thinking>`,
  use: [
    "An agent reasons before it answers and you want to show it without letting it crowd the answer. The reasoning is there to read, and out of the way once it has been read.",
    "The reasoning streams in. Open while the agent works, it lets the reader watch, and when the answer starts it folds away by itself.",
    "A saved conversation. Pass the seconds the thought took as duration and it reads \"Thought for 12s\", closed, ready to open.",
    "The reader should always win. A thought they opened stays open, and one they closed stays closed, whatever the agent does next.",
  ],
  skip: [
    "What the agent did, such as reading a file or running a command. Use Tool call.",
    "The steps of a task and where they stand. Use Plan.",
    "A thought with no words to show. Leave the row out: the composer's Stop and the message's busy state already say the agent is working.",
    "Folding other content, such as an FAQ or a section of settings. Thinking is built around a clock and a stream of reasoning. Use a plain details element.",
    "A loading signal for something that is not an agent. Use Skeleton or Loading.",
  ],
  keyboard: [
    [["Tab"], "Moves focus to the row. It is one stop, whether the thought is open or closed."],
    [["Enter", "Space"], "Opens or closes the reasoning."],
  ],
  a11y: [
    "The row is a native button with aria-expanded and aria-controls. The region it controls is always in the page, empty while closed, so the reference never points at nothing.",
    "While the agent thinks, the clock is hidden from assistive tech, so it is never read out once a second, and the button is named \"Thinking\". Once the thought is finished the clock is read in words: the page shows \"Thought for 12s\" and the button's name is \"Thought for 12 seconds\".",
    "A polite live region says \"Thinking\" once when the thought starts and \"Thought for 12 seconds\" when it ends, in words. It says nothing for a thought loaded from history, and it never reads the reasoning as it streams. With label, it says your label instead.",
    "Open or closed is not said by the chevron alone: aria-expanded carries it, and the words say whether the agent is still thinking.",
    "The row is 32px tall, and 44px on a coarse pointer. Hover and a press on a finger brighten the label, and focus-visible draws the 2px ring.",
    "Reduced motion removes the travel and the fade, and the chevron turns at once. The clock keeps counting, because it is a number and not an animation.",
    "What the reasoning says is the caller's. Show what your model gives you to show, and leave the row out when there is nothing to read.",
  ],
};

/* ---------------------------------------------------------------- the studio's thoughts */

const LIVE_REASONING = [
  "The deploy log stops at the image step. The build ran for 41 seconds and was then killed, which usually means it ran out of memory and the code is fine.",
  "The Atlas portfolio has 38 case study images, and 11 of them are over 6 MB. The resize step opens all of them at once.",
  "Two fixes would work: resize four images at a time, or export the originals smaller. The first changes the build config, and that is your call. The second is safe to suggest.",
  "I will list the biggest files first, so the answer can name them.",
];

const LIVE_ANSWER =
  "The build ran out of memory while it resized the case study images. Eleven of them are over 6 MB. Export those at 2400px wide and the deploy should pass.";

const LONG_REASONING = [
  "The Northwind site has two blog collections: Journal, with 64 posts, and Case studies, with 12. The request is to move both into one collection called Stories and keep every URL working.",
  "Moving them is easy. Keeping the URLs is the part that can go wrong. Journal posts live under /journal/ and case studies under /work/, so two collections that become one would break every inbound link unless each old path redirects.",
  "I checked the redirect list. It has 9 rules, all for the old logo pages, and none for the blog. The 76 new rules would take it to 85, past the plan's limit of 80, so that route is out.",
  "There is a cheaper route. Framer lets one collection serve two path prefixes if each item sets its own slug. That keeps the old URLs as they are, and the redirect list stays at 9 rules.",
  "The catch is the sitemap. It would list each post once, under the prefix of its slug, which is correct. The RSS feed is generated per collection, so the Journal feed would start including case studies. That needs a filter.",
  "The case studies have a Client field that the posts do not. Merging means a field that is empty on 64 items. The template hides empty fields, so the layout is safe, but the CMS table gets wider.",
  "Search is the last thing to check. The site search indexes by collection, and the weights are set per collection. After the merge, case studies would rank like posts. That is probably fine, but worth saying.",
  "I will recommend the second route, list the three things it touches (the feed filter, the Client field, the search weights) and offer to make the feed change first, since that one is visible to readers.",
];

const HISTORY = [
  {
    duration: 12,
    reasoning: [
      "The Halo hero is a video of 18 MB that loads before the headline. On a phone that is most of the first load.",
      "A poster image with the video loading on interaction would keep the look and cut the first load to under 2 MB.",
    ],
    answer: "The Halo hero video is 18 MB and loads before the text. Show a poster first and load the video when someone taps it.",
  },
  {
    duration: 65,
    reasoning: [
      "Searching the site for the old wordmark gives 14 matches: 9 in page content, 3 in the footer component and 2 in the social card templates.",
      "The footer component is shared, so one fix covers all pages that use it. The 9 page matches need a look at each, because 3 of them are quoted in client testimonials and should stay.",
    ],
    answer: "Six Northwind pages still show the old wordmark, plus the footer and two social cards. Three more are client quotes that should stay as they are.",
  },
  {
    duration: 0.4,
    reasoning: ["A plain rename. The slug stays as it is, so no link breaks."],
    answer: "Renamed the project to Marlow Labs. The address did not change.",
  },
];

/** Reveals the paragraphs a word at a time, the way a model streams them. Returns what is shown so far and whether it is all out. */
function useStream(paragraphs: string[], step: number) {
  const words = paragraphs.map((p) => p.split(" "));
  const total = words.reduce((n, w) => n + w.length, 0);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (count >= total) return;
    const id = setTimeout(() => setCount((c) => c + 1), count === 0 ? 8 * step : step);
    return () => clearTimeout(id);
  }, [count, total, step]);
  let left = count;
  const shown = words
    .map((w) => {
      const n = Math.min(left, w.length);
      left -= n;
      return w.slice(0, n).join(" ");
    })
    .filter(Boolean);
  return { shown, done: count >= total };
}

/** A turn that thinks while the reasoning streams in, then stops and lets the answer begin. */
function LiveTurn() {
  const { shown, done } = useStream(LIVE_REASONING, 48);
  const [thinking, setThinking] = useState(true);
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setThinking(false), 500);
    return () => clearTimeout(id);
  }, [done]);
  return (
    <div className="grid w-full gap-3">
      <Thinking active={thinking}>
        {shown.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </Thinking>
      {!thinking && <p className="text-body text-fg-muted">{LIVE_ANSWER}</p>}
    </div>
  );
}

function LiveDemo() {
  return (
    <div className="w-full max-w-xl">
      <LiveTurn />
    </div>
  );
}

function HistoryDemo() {
  return (
    <div className="grid w-full max-w-xl gap-8">
      {HISTORY.map((turn) => (
        <div key={turn.answer} className="grid gap-3">
          <Thinking duration={turn.duration}>
            {turn.reasoning.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Thinking>
          <p className="text-body text-fg-muted">{turn.answer}</p>
        </div>
      ))}
    </div>
  );
}

function LongDemo() {
  const [open, setOpen] = useState(true);
  return (
    <div className="grid w-full max-w-xl gap-3">
      <Thinking duration={148} open={open} onOpenChange={setOpen}>
        {LONG_REASONING.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </Thinking>
      <p className="text-body text-fg-muted">
        Merge them into one Stories collection and keep each item's own slug. The old addresses keep working, and the redirect list stays short.
      </p>
      <div>
        <Button size="sm" variant="secondary" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide reasoning" : "Show reasoning"}
        </Button>
      </div>
    </div>
  );
}

/** The same turn inside a phone: the row is 44px tall and the reasoning wraps to the narrow column. */
function PhoneDemo() {
  return (
    <div className="mx-auto w-full max-w-sm">
      <div role="group" aria-label="Chat, phone" className="rounded-surface bg-canvas p-4 outline-1 -outline-offset-1 outline-line">
        <DeviceProvider mode="phone">
          <LiveTurn />
        </DeviceProvider>
      </div>
    </div>
  );
}

export default function ThinkingPage() {
  const [liveKey, replayLive] = useReplay();
  const [phoneKey, replayPhone] = useReplay();
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="A live thought"
        tier="responsive"
        align="start"
        size="lg"
        code="LiveDemo"
        onReplay={replayLive}
        caption="Litt thinks about a failed deploy. The row reads Thinking with a clock that counts whole seconds, and nothing else moves: no shimmer, no pulse. The reasoning streams in with no fade per word. When the thought ends the clock stops, the row reads Thought for, and the body closes by itself as the answer starts. The body fades in and travels a little on the responsive tier, and its height snaps."
      >
        <div key={liveKey} className="w-full">
          <LiveDemo />
        </div>
      </Stage>

      <Stage
        title="A finished thought"
        tier="responsive"
        align="start"
        size="lg"
        code="HistoryDemo"
        caption="A conversation loaded from history. Each thought is closed and says how long it took, from duration. Click a row, or press Enter or Space, to read it. The chevron turns a quarter on the instant tier and the body arrives on the responsive tier. A thought under a second reads Thought for a moment."
      >
        <HistoryDemo />
      </Stage>

      <Stage
        title="A long thought"
        tier="responsive"
        align="start"
        size="lg"
        code="LongDemo"
        caption="A long thought is not boxed or scrolled: it is paragraphs in fg-subtle that line up with the label, and the answer sits below. This one is controlled, so a button outside it can open and close it with the same state. The row says Thought for 2m 28s."
      >
        <LongDemo />
      </Stage>

      <Stage
        title="On a phone"
        tier="responsive"
        align="start"
        size="lg"
        code="PhoneDemo"
        onReplay={replayPhone}
        caption="In a phone the row is 44px tall, and a press on it brightens the label. The reasoning wraps to the narrow column and keeps its indent. The clock is the only live signal here too, and a screen reader hears Thinking once at the start and the finished time in words at the end."
      >
        <div key={phoneKey} className="w-full">
          <PhoneDemo />
        </div>
      </Stage>
    </Page>
  );
}
