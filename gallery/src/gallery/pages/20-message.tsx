import { useEffect, useRef, useState, type ReactNode } from "react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Conversation, Message, MessageActions, MessageText } from "@/components/message";
import { Empty } from "@/components/states";
import { Switch } from "@/components/switch";
import { DeviceProvider } from "@/motion";
import { Page, Stage, useReplay, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "message",
  title: "Message",
  lede: "A conversation, read top to bottom.",
  order: 11.01,
  group: "Agents",
  summary:
    "A chat between a person and an agent, read top to bottom. The agent's words sit on the page with no bubble, and the person's turn is a bubble on the right. The conversation scrolls on its own, keeps the latest line in view while an answer streams, and offers Jump to latest when you scroll up. A new turn enters once on the responsive tier, and nothing moves while text streams.",
  tiers: ["responsive", "instant"],
};

export const docs: PageDocs = {
  components: ["message"],
  exports: ["Conversation", "Message", "MessageText", "MessageActions"],
  usage: `import { Conversation, Message, MessageText, MessageActions } from "@/components/message";

// The conversation scrolls inside its own height. Mark it busy while the agent answers.
<div className="flex h-dvh flex-col">
  <Conversation label="Conversation with Litt" busy={answering} className="flex-1">
    <Message from="user">Why did the Halo site build fail this morning?</Message>

    <Message
      streaming={answering}
      actions={<MessageActions copyText={answer} onRetry={retry} />}
    >
      {/* thinking, a plan and tool calls go here, above the answer */}
      <MessageText>{answer}</MessageText>
    </Message>
  </Conversation>
  {/* the Composer goes here, in a max-w-3xl column of its own */}
</div>

// MessageText styles the elements your markdown renderer produces. Hand it a string for one paragraph.
<MessageText>
  <p>Compress the loop, then run <code>npm run build</code> again.</p>
  <ul>
    <li>Halo: 38 seconds</li>
  </ul>
</MessageText>

// A turn that stopped says so, and its Retry button calls your handler.
<Message error="The answer stopped: the connection dropped." onRetry={retry}>
  <MessageText>I checked the deploy history for the Atlas portfolio.</MessageText>
</Message>

// A thread with more than one person or agent shows names, and an sm Avatar beside them.
<Message from="user" name="Ines Duarte" avatar={<Avatar name="Ines Duarte" size="sm" decorative />}>
  Can you check Northwind too?
</Message>`,
  use: [
    "A chat between a person and an agent, where the answers are long and the newest turn sits at the foot.",
    "The agent works for a while and shows parts of its turn: thinking, a plan, tool calls and then the answer. They are children of one Message, so the turn is one article.",
    "The answer streams in. The conversation follows the newest line until the reader scrolls up, and Jump to latest brings them back.",
    "You have a markdown renderer and want its output to look like litt. MessageText styles the elements and needs no library.",
    "A turn can fail. The error line says so and puts Retry beside the words.",
  ],
  skip: [
    "Comments between people on a page, each with a name and a time on every row. Use List.",
    "A single note from the product, such as a tip or a failed deploy. Use Callout.",
    "A short confirmation that goes away by itself. Use Toast.",
    "The field the person types into. Use the Composer.",
    "Rendering markdown itself. Bring your own renderer: MessageText only styles what it produces.",
  ],
  keyboard: [
    [["Tab"], "Moves into the conversation's scrolling region, then through the buttons inside it: an answer's actions, a Retry button, and Jump to latest."],
    [["↑", "↓", "Page Up", "Page Down", "Home", "End"], "Scroll the focused region. Scrolling up stops the following and shows Jump to latest. End, or reaching the foot, starts it again."],
    [["Enter", "Space"], "Presses the focused button: Copy, Retry, Jump to latest or one of yours. Jump to latest moves focus back to the region."],
  ],
  a11y: [
    "The conversation is a landmark region named by its label, and it takes focus so a keyboard can scroll it. It is aria-busy while busy is on.",
    "Each turn is an article named by its heading: \"You\", or the agent's name. The heading is visually hidden unless you pass a name, and then the name is the heading. Pass headingLevel to fit the page, and offset the headings your markdown renderer produces so they sit below it.",
    "A polite live region says \"Litt is answering\" when busy turns on and \"Litt answered\" when it turns off, or \"Litt stopped answering\" when a turn reports an error. The words never reach it, so a screen reader is not read to while the answer streams. Read the answer by moving to it.",
    "Copy is named \"Copy\" and swaps to a check, and a polite status says \"Copied\", or \"Could not copy\" when the browser refuses. Retry is named \"Retry\". Each has a tooltip, and the row is a group named by its label.",
    "The actions are hidden only until hover, and they show on focus-within, so a keyboard never lands on a control it cannot see. On a coarse pointer they always show and are 44px, as are Retry and Jump to latest.",
    "An error line is words with a 16px icon: the words say it stopped, and the icon's color is only a second signal. The icon is hidden from assistive tech.",
    "Links in MessageText are underlined as well as colored. Strong text steps to the title weight and fg, never bold, and emphasis steps the color only, because litt has no italic, so write words that carry the meaning without it.",
    "A pre in MessageText wraps its lines, so it never becomes a scroll area a keyboard cannot reach. Use CodeBlock for code that is long, or that the reader will copy.",
    "A turn that arrives fades in once and rises half of the travel token. Reduced motion removes the movement and the fade through the motion hooks.",
    "You still need to label each conversation, keep the label unique on the page, and write the answer so that it reads in order.",
  ],
};

/* ---------------------------------------------------------------- sample answers */

/** One run of an answer: words, a code span or a link. A reveal never cuts a code span or a link in half. */
type Run = string | { code: string } | { link: string; href: string };
type Block = { p: Run[] } | { ul: Run[][] };

const ANSWER: Block[] = [
  { p: ["The Halo site build stopped in the image step at 06:12. The log shows an out of memory error on one file:"] },
  {
    ul: [
      [{ code: "public/work/hero-loop.mov" }, " is 148 MB, and the optimizer gives up above 128 MB."],
      ["The two other videos in that folder are fine, at 31 MB and 54 MB."],
    ],
  },
  { p: ["Compress the loop to under 100 MB, then run ", { code: "npm run build" }, " again. The full trace is in the ", { link: "build log", href: "#build-log" }, "."] },
];

const DONE: Block[] = [{ p: ["Done. ", { code: "hero-loop.mov" }, " is now 71 MB, and the Halo build finished in 38 seconds. The site is live again."] }];

/* Device's own (plans/024, phase 3): the same thread about a take that clips, not a site build. */
const TAKE_ANSWER: Block[] = [
  { p: ["take_04 clips at 00M 41S, when the car passes. The input peaks at +0.0 dB for 6 frames on both channels:"] },
  {
    ul: [
      [{ code: "take_04.wav" }, " was recorded at +32 dB of gain, and the limiter on input 1 was off."],
      ["The safety track at −12 dB holds the same moment clean, peaking at −11.8 dB."],
    ],
  },
  { p: ["Swap the safety track in from 00M 40S to 00M 43S, then run ", { code: "rec normalize take_04" }, ". The peaks are in the ", { link: "level log", href: "#level-log" }, "."] },
];

const TAKE_DONE: Block[] = [{ p: ["Done. ", { code: "take_04.wav" }, " now peaks at −1.0 dB, and the swap is marked at 00M 40S. Nothing clips."] }];

/** One token per word, and one per code span or link. */
function tokensOf(runs: Run[]): Run[] {
  return runs.flatMap((r): Run[] => (typeof r === "string" ? (r.match(/\s*\S+\s*/g) ?? []) : [r]));
}

function total(blocks: Block[]): number {
  return blocks.reduce((n, b) => n + ("p" in b ? tokensOf(b.p).length : b.ul.reduce((m, item) => m + tokensOf(item).length, 0)), 0);
}

/** The first `count` tokens of an answer, with the blocks they fall in. */
function reveal(blocks: Block[], count: number): Block[] {
  let left = count;
  const take = (runs: Run[]) => {
    const part = tokensOf(runs).slice(0, left);
    left -= part.length;
    return part;
  };
  const out: Block[] = [];
  for (const b of blocks) {
    if (left <= 0) break;
    if ("p" in b) {
      out.push({ p: take(b.p) });
    } else {
      const items: Run[][] = [];
      for (const item of b.ul) {
        if (left <= 0) break;
        items.push(take(item));
      }
      out.push({ ul: items });
    }
  }
  return out;
}

const textOf = (runs: Run[]) =>
  runs.map((r) => (typeof r === "string" ? r : "code" in r ? "`" + r.code + "`" : "[" + r.link + "](" + r.href + ")")).join("");

/** The answer as the markdown a Copy button would put on the clipboard. */
const markdownOf = (blocks: Block[]) =>
  blocks.map((b) => ("p" in b ? textOf(b.p) : b.ul.map((item) => "- " + textOf(item)).join("\n"))).join("\n\n");

function Runs({ runs }: { runs: Run[] }) {
  return (
    <>
      {runs.map((r, i) =>
        typeof r === "string" ? (
          r
        ) : "code" in r ? (
          <code key={i}>{r.code}</code>
        ) : (
          <a key={i} href={r.href} onClick={(e) => e.preventDefault()}>
            {r.link}
          </a>
        ),
      )}
    </>
  );
}

/** What a markdown renderer would hand to MessageText: paragraphs, and a list with inline code and a link. */
function Answer({ blocks }: { blocks: Block[] }) {
  return (
    <MessageText>
      {blocks.map((b, i) =>
        "p" in b ? (
          <p key={i}>
            <Runs runs={b.p} />
          </p>
        ) : (
          <ul key={i}>
            {b.ul.map((item, j) => (
              <li key={j}>
                <Runs runs={item} />
              </li>
            ))}
          </ul>
        ),
      )}
    </MessageText>
  );
}

/** A window onto the app: the page's own canvas with a hairline, so the person's bubble reads as it does in an app. */
function Frame({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={"flex w-full flex-col overflow-hidden rounded-surface bg-canvas outline-1 -outline-offset-1 outline-line in-[[data-material=flat]]:outline-0 " + className}>
      {children}
    </div>
  );
}

const noop = () => {};

/** How long a word takes to arrive in a demo, in ms. Only a stand-in for a model. */
const WORD_MS = 60;

/* ---------------------------------------------------------------- demos */

function ThreadDemo() {
  const [names, setNames] = useState(false);
  const person = (who: string) => (names ? { name: who, avatar: <Avatar name={who} size="sm" decorative /> } : {});
  const litt = names ? { name: "Litt", avatar: <Avatar name="Litt" size="sm" hue="neutral" decorative /> } : {};
  return (
    <div className="grid w-full gap-6">
      <Switch label="Show names" checked={names} onCheckedChange={setNames} />
      <Frame>
        <Conversation label="Halo build thread">
          <Message from="user" {...person("Ines Duarte")}>
            Why did the Halo site build fail this morning?
          </Message>
          <Message {...litt} actions={<MessageActions copyText={markdownOf(ANSWER)} onRetry={noop} />}>
            <Answer blocks={ANSWER} />
          </Message>
          <Message from="user" {...person("Nick")}>
            Compress the loop and run the build again.
          </Message>
          <Message {...litt} actions={<MessageActions copyText={markdownOf(DONE)} onRetry={noop} />}>
            <p className="text-small text-fg-subtle">The thinking and tool call rows sit here.</p>
            <Answer blocks={DONE} />
          </Message>
        </Conversation>
      </Frame>
    </div>
  );
}

/** `replayed`: the page loads with the turn already there, so nothing is mid-fade when it is read; a Replay brings it in after a beat. */
function TakeThreadDemo() {
  const [names, setNames] = useState(false);
  const person = (who: string) => (names ? { name: who, avatar: <Avatar name={who} size="sm" decorative /> } : {});
  const litt = names ? { name: "Litt", avatar: <Avatar name="Litt" size="sm" hue="neutral" decorative /> } : {};
  return (
    <div className="grid w-full gap-6">
      <Switch label="Show names" checked={names} onCheckedChange={setNames} />
      <Frame>
        <Conversation label="Thread about take_04">
          <Message from="user" {...person("Ines Duarte")}>
            Why does take_04 clip at 00M 41S?
          </Message>
          <Message {...litt} actions={<MessageActions copyText={markdownOf(TAKE_ANSWER)} onRetry={noop} />}>
            <Answer blocks={TAKE_ANSWER} />
          </Message>
          <Message from="user" {...person("Nick")}>
            Swap in the safety track and normalize it.
          </Message>
          <Message {...litt} actions={<MessageActions copyText={markdownOf(TAKE_DONE)} onRetry={noop} />}>
            <p className="text-small text-fg-subtle">The thinking and tool call rows sit here.</p>
            <Answer blocks={TAKE_DONE} />
          </Message>
        </Conversation>
      </Frame>
    </div>
  );
}

function StreamDemo({ replayed = false }: { replayed?: boolean }) {
  const count = total(ANSWER);
  const [started, setStarted] = useState(!replayed);
  const [shown, setShown] = useState(replayed ? 0 : 1);
  const streaming = started && shown < count;

  /* On a Replay the turn arrives after a beat, once. Then the words follow, one at a time. */
  useEffect(() => {
    if (started) return;
    const t = window.setTimeout(() => {
      setShown(1);
      setStarted(true);
    }, 700);
    return () => window.clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!started || shown >= count) return;
    const t = window.setTimeout(() => setShown(shown + 1), WORD_MS);
    return () => window.clearTimeout(t);
  }, [started, shown, count]);

  return (
    <div className="grid w-full gap-4">
      <Frame className="h-96">
        <Conversation label="Halo build, streaming reply" busy={streaming} className="flex-1">
          <Message from="user">Why did the Halo site build fail this morning?</Message>
          {started && (
            <Message streaming={streaming} actions={<MessageActions copyText={markdownOf(ANSWER)} onRetry={noop} />}>
              <Answer blocks={reveal(ANSWER, shown)} />
            </Message>
          )}
        </Conversation>
      </Frame>
      <p aria-hidden="true" className="font-mono text-caption font-normal text-fg-subtle">
        {started ? `aria-busy=${streaming ? "true" : "false"}, ${shown} of ${count} words` : "waiting for the turn"}
      </p>
    </div>
  );
}

const ATLAS: Block[] = [
  {
    p: ["Yes. The Atlas portfolio went live at 14:02 on Friday after a build of 41 seconds. Nothing has deployed since, and the production site answered a check a few minutes ago."],
  },
];
const ATLAS_CUT: Block[] = [{ p: ["I checked the deploy history for the Atlas portfolio. The last production deploy went"] }];

/** `replayed`: the page loads with the turn already streaming; a Replay or a Retry brings it in after a beat. */
function ErrorDemo({ replayed = false }: { replayed?: boolean }) {
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<"waiting" | "streaming" | "stopped" | "done">(replayed ? "waiting" : "streaming");
  const [shown, setShown] = useState(replayed ? 0 : 1);
  const blocks = attempt === 0 ? ATLAS_CUT : ATLAS;
  const count = total(blocks);
  const streaming = phase === "streaming";

  /* The first try streams a few words and then the connection drops. Retry streams the whole answer. */
  useEffect(() => {
    if (phase !== "waiting") return;
    const t = window.setTimeout(() => {
      setShown(1);
      setPhase("streaming");
    }, 700);
    return () => window.clearTimeout(t);
  }, [phase]);
  useEffect(() => {
    if (!streaming) return;
    if (shown >= count) {
      setPhase(attempt === 0 ? "stopped" : "done");
      return;
    }
    const t = window.setTimeout(() => setShown(shown + 1), WORD_MS);
    return () => window.clearTimeout(t);
  }, [streaming, shown, count, attempt]);

  const retry = () => {
    setAttempt(1);
    setShown(1);
    setPhase("streaming");
  };

  return (
    <Frame className="h-80">
      <Conversation label="Atlas deploy check" busy={streaming} className="flex-1">
        <Message from="user">Did the Atlas portfolio deploy go live?</Message>
        {phase !== "waiting" && (
          <Message
            streaming={streaming}
            error={phase === "stopped" ? "The answer stopped: the connection dropped." : undefined}
            onRetry={retry}
            actions={<MessageActions copyText={markdownOf(ATLAS)} onRetry={retry} />}
          >
            <Answer blocks={reveal(blocks, shown)} />
          </Message>
        )}
      </Conversation>
    </Frame>
  );
}

function ProseDemo() {
  return (
    <Frame>
      <Conversation label="Halo build summary">
        <Message>
          <MessageText>
            <h4>What changed in the Halo build</h4>
            <p>
              The build now takes <strong>38 seconds</strong>, down from two minutes, and the site is <em>live</em> again. The details are in the{" "}
              <a href="#build-log" onClick={(e) => e.preventDefault()}>
                build log
              </a>
              .
            </p>
            <ol>
              <li>
                Compressed <code>hero-loop.mov</code> from 148 MB to 71 MB.
              </li>
              <li>Cleared the image cache for the work folder.</li>
              <li>
                Ran <code>npm run build</code> again.
              </li>
            </ol>
            <pre>
              <code>{"npm run build\n✓ 12 pages in 38 s\n✓ 3 videos kept as links"}</code>
            </pre>
            <blockquote>
              <p>The optimizer gives up above 128 MB, so keep every video in the work folder under that.</p>
            </blockquote>
            <table>
              <thead>
                <tr>
                  <th>Site</th>
                  <th>Build</th>
                  <th>Largest file</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Halo site</td>
                  <td>38 s</td>
                  <td>71 MB</td>
                </tr>
                <tr>
                  <td>Northwind</td>
                  <td>52 s</td>
                  <td>9 MB</td>
                </tr>
              </tbody>
            </table>
            <hr />
            <p>
              Next time, check the size of a new video before it goes into the folder: <code>du -h public/work</code> lists them.
            </p>
          </MessageText>
        </Message>
      </Conversation>
    </Frame>
  );
}

const SUGGESTIONS = ["Why did the Halo build fail?", "What deployed to Northwind this week?", "Which sites have a certificate that expires soon?"];

function EmptyDemo() {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="grid w-full gap-4">
      <Frame className="h-72">
        <Conversation label="A new conversation with Litt" className="flex-1">
          <Empty
            bare
            action={
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <Button key={s} size="sm" onClick={() => setPicked(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            }
          >
            Ask Litt about a build, a deploy or a client's site, and the answer shows up here.
          </Empty>
        </Conversation>
      </Frame>
      <p className="min-h-5 text-caption font-normal text-fg-subtle">
        {picked ? `The Composer's field now holds "${picked}", ready to edit.` : "In the Composer a suggestion fills the field. It never sends."}
      </p>
    </div>
  );
}

type Turn = { id: number; from: "user" | "agent"; text: string };

const HISTORY: [string, string][] = [
  ["What shipped to Northwind last week?", "Three deploys went to production: the new pricing page on Monday, a fix for the footer links on Wednesday and the redesigned contact form on Friday. All three built in under a minute."],
  ["Did any of them touch the checkout?", "No. The checkout lives in a separate Framer project, and none of the three changed it. Its last deploy was on 2 October."],
  ["How long do the Atlas portfolio builds take now?", "The median is 41 seconds over the last 14 builds, with a slow one at 71 seconds on Tuesday. That one rebuilt every image because the cache had expired."],
  ["Can you warm the cache before Friday's launch?", "Yes. I can run a build on the staging branch on Thursday evening, so the Friday deploy reuses the image cache. I will not publish anything."],
  ["Which sites have a certificate that expires soon?", "Two. gallery-identity.com expires in 5 days and founder-landing.com in 19. The first is managed by the client's registrar, so it needs a message to them."],
  ["Draft that message for Ines to send.", "Here is a short draft: Hi, the certificate for gallery-identity.com expires on 22 October. Could you renew it in the domain settings this week? It takes about two minutes, and I can check the site again afterwards."],
];

const FOLLOW_UPS: [string, string][] = [
  ["Which of those sites is slowest to build?", "The Halo site, at 52 seconds on average. Most of that is the image step, which handles 64 files from the work folder. Two of them are videos over 100 MB, so it is also the build most likely to run out of memory again. Moving the videos to a streaming host would take the image step down to about 20 seconds."],
  ["Can you move them this week?", "Yes, if the client agrees to a streaming host. I would upload the two videos, swap the file links on the work page, remove the originals from the repo and run a preview build, so you can check the page before it goes live. It is about an hour of work, and nothing publishes until you say so."],
  ["Start with the preview, then.", "Starting now. I will upload the videos first, because the preview needs their new addresses. When the preview build finishes I will send you its link and a list of the pages that changed."],
];

const start: Turn[] = HISTORY.flatMap(([q, a], i) => [
  { id: i * 2, from: "user" as const, text: q },
  { id: i * 2 + 1, from: "agent" as const, text: a },
]);

function LongDemo() {
  const [turns, setTurns] = useState<Turn[]>(start);
  const [busy, setBusy] = useState(false);
  const asked = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const open = timers.current;
    return () => open.forEach((t) => window.clearTimeout(t));
  }, []);

  /* A question from the person, then an answer that arrives a word at a time. */
  function ask() {
    const [question, answer] = FOLLOW_UPS[asked.current++ % FOLLOW_UPS.length]!;
    const id = start.length + asked.current * 2;
    const words = answer.split(" ");
    setBusy(true);
    setTurns((t) => [...t, { id, from: "user", text: question }]);
    timers.current.push(
      window.setTimeout(() => {
        setTurns((t) => [...t, { id: id + 1, from: "agent", text: words[0]! }]);
        const next = (n: number) => {
          setTurns((t) => t.map((x) => (x.id === id + 1 ? { ...x, text: words.slice(0, n).join(" ") } : x)));
          if (n < words.length) timers.current.push(window.setTimeout(() => next(n + 1), WORD_MS));
          else setBusy(false);
        };
        timers.current.push(window.setTimeout(() => next(2), WORD_MS));
      }, 500),
    );
  }

  const last = turns[turns.length - 1]!;
  return (
    <div className="grid w-full gap-4">
      <Frame className="h-112">
        <Conversation label="Studio week thread" busy={busy} className="flex-1">
          {turns.map((t) =>
            t.from === "user" ? (
              <Message key={t.id} from="user">
                {t.text}
              </Message>
            ) : (
              <Message key={t.id} streaming={busy && t.id === last.id} actions={<MessageActions copyText={t.text} onRetry={noop} />}>
                <MessageText>{t.text}</MessageText>
              </Message>
            ),
          )}
        </Conversation>
      </Frame>
      <div>
        <Button size="sm" variant="secondary" disabled={busy} onClick={ask}>
          Stream a reply
        </Button>
      </div>
    </div>
  );
}

function PhoneDemo() {
  return (
    <DeviceProvider mode="phone">
      <div className="mx-auto w-full max-w-sm">
        <Frame className="h-176">
          <Conversation label="Halo build thread on a phone" className="flex-1">
            <Message from="user">Why did the Halo site build fail this morning?</Message>
            <Message actions={<MessageActions copyText={markdownOf(ANSWER)} onRetry={noop} />}>
              <Answer blocks={ANSWER} />
            </Message>
            <Message from="user">Compress the loop and run the build again.</Message>
            <Message actions={<MessageActions copyText={markdownOf(DONE)} onRetry={noop} />}>
              <Answer blocks={DONE} />
            </Message>
          </Conversation>
        </Frame>
      </div>
    </DeviceProvider>
  );
}

/* ---------- Device's own (plans/024, phase 3): the Variants, about takes, cards and scenes ---------- */

function TakeStreamDemo({ replayed = false }: { replayed?: boolean }) {
  const count = total(TAKE_ANSWER);
  const [started, setStarted] = useState(!replayed);
  const [shown, setShown] = useState(replayed ? 0 : 1);
  const streaming = started && shown < count;

  /* On a Replay the turn arrives after a beat, once. Then the words follow, one at a time. */
  useEffect(() => {
    if (started) return;
    const t = window.setTimeout(() => {
      setShown(1);
      setStarted(true);
    }, 700);
    return () => window.clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!started || shown >= count) return;
    const t = window.setTimeout(() => setShown(shown + 1), WORD_MS);
    return () => window.clearTimeout(t);
  }, [started, shown, count]);

  return (
    <div className="grid w-full gap-4">
      <Frame className="h-96">
        <Conversation label="take_04, streaming reply" busy={streaming} className="flex-1">
          <Message from="user">Why does take_04 clip at 00M 41S?</Message>
          {started && (
            <Message streaming={streaming} actions={<MessageActions copyText={markdownOf(TAKE_ANSWER)} onRetry={noop} />}>
              <Answer blocks={reveal(TAKE_ANSWER, shown)} />
            </Message>
          )}
        </Conversation>
      </Frame>
      <p aria-hidden="true" className="font-mono text-caption font-normal text-fg-subtle">
        {started ? `aria-busy=${streaming ? "true" : "false"}, ${shown} of ${count} words` : "waiting for the turn"}
      </p>
    </div>
  );
}

const OFFLOAD: Block[] = [
  {
    p: ["Yes. Card A finished offloading at 14:02 on Friday: 24 takes in 2M 14S. The checksums match, and the library answered a check a few minutes ago."],
  },
];
const OFFLOAD_CUT: Block[] = [{ p: ["I checked the offload log for Card A. The last copy finished"] }];

/** `replayed`: the page loads with the turn already streaming; a Replay or a Retry brings it in after a beat. */
function OffloadErrorDemo({ replayed = false }: { replayed?: boolean }) {
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<"waiting" | "streaming" | "stopped" | "done">(replayed ? "waiting" : "streaming");
  const [shown, setShown] = useState(replayed ? 0 : 1);
  const blocks = attempt === 0 ? OFFLOAD_CUT : OFFLOAD;
  const count = total(blocks);
  const streaming = phase === "streaming";

  /* The first try streams a few words and then the connection drops. Retry streams the whole answer. */
  useEffect(() => {
    if (phase !== "waiting") return;
    const t = window.setTimeout(() => {
      setShown(1);
      setPhase("streaming");
    }, 700);
    return () => window.clearTimeout(t);
  }, [phase]);
  useEffect(() => {
    if (!streaming) return;
    if (shown >= count) {
      setPhase(attempt === 0 ? "stopped" : "done");
      return;
    }
    const t = window.setTimeout(() => setShown(shown + 1), WORD_MS);
    return () => window.clearTimeout(t);
  }, [streaming, shown, count, attempt]);

  const retry = () => {
    setAttempt(1);
    setShown(1);
    setPhase("streaming");
  };

  return (
    <Frame className="h-80">
      <Conversation label="Card A offload check" busy={streaming} className="flex-1">
        <Message from="user">Did Card A finish offloading?</Message>
        {phase !== "waiting" && (
          <Message
            streaming={streaming}
            error={phase === "stopped" ? "The answer stopped: the connection dropped." : undefined}
            onRetry={retry}
            actions={<MessageActions copyText={markdownOf(OFFLOAD)} onRetry={retry} />}
          >
            <Answer blocks={reveal(blocks, shown)} />
          </Message>
        )}
      </Conversation>
    </Frame>
  );
}

function TakeProseDemo() {
  return (
    <Frame>
      <Conversation label="take_04 summary">
        <Message>
          <MessageText>
            <h4>What changed in take_04</h4>
            <p>
              The take now peaks at <strong>−1.0 dB</strong>, down from +0.0 dB, and nothing <em>clips</em>. The details are in the{" "}
              <a href="#level-log" onClick={(e) => e.preventDefault()}>
                level log
              </a>
              .
            </p>
            <ol>
              <li>
                Swapped in the safety track from <code>00M 40S</code> to <code>00M 43S</code>.
              </li>
              <li>Marked the swap on the slate.</li>
              <li>
                Ran <code>rec normalize take_04</code>.
              </li>
            </ol>
            <pre>
              <code>{"rec normalize take_04\n✓ peak −1.0 dB\n✓ 6 frames from the safety track"}</code>
            </pre>
            <blockquote>
              <p>A car passing can push a take to 0 dB, so keep the limiter on for every input outdoors.</p>
            </blockquote>
            <table>
              <thead>
                <tr>
                  <th>Take</th>
                  <th>Peak</th>
                  <th>Length</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>take_04</td>
                  <td>−1.0 dB</td>
                  <td>02M 14S 06F</td>
                </tr>
                <tr>
                  <td>take_06</td>
                  <td>−3.2 dB</td>
                  <td>01M 49S 02F</td>
                </tr>
              </tbody>
            </table>
            <hr />
            <p>
              Next time, check the peaks before a card leaves the set: <code>rec peaks --card A</code> lists them.
            </p>
          </MessageText>
        </Message>
      </Conversation>
    </Frame>
  );
}

const TAKE_SUGGESTIONS = ["Why does take_04 clip?", "What did we record for Scene 12 today?", "Which cards are nearly full?"];

function TakeEmptyDemo() {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="grid w-full gap-4">
      <Frame className="h-72">
        <Conversation label="A new conversation with Litt" className="flex-1">
          <Empty
            bare
            action={
              <div className="flex flex-wrap gap-2">
                {TAKE_SUGGESTIONS.map((s) => (
                  <Button key={s} size="sm" onClick={() => setPicked(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            }
          >
            Ask Litt about a take, a card or a scene, and the answer shows up here.
          </Empty>
        </Conversation>
      </Frame>
      <p className="min-h-5 text-caption font-normal text-fg-subtle">
        {picked ? `The Composer's field now holds "${picked}", ready to edit.` : "In the Composer a suggestion fills the field. It never sends."}
      </p>
    </div>
  );
}

const SHOOT_HISTORY: [string, string][] = [
  ["What did we record for Scene 12 last week?", "Three days of it: 24 takes on Monday, the pickups on Wednesday and the room tone on Friday. Every take was 48 kHz · 24 bit, and all three cards are in the library."],
  ["Did any of them clip?", "One. take_04 peaks at +0.0 dB for 6 frames at 00M 41S, when a car passes. The safety track holds the same moment clean at −11.8 dB."],
  ["How long are the Scene 9 takes now?", "The median is 41 seconds over the last 14 takes, with a long one at 71 seconds on Tuesday. That one ran on because the slate was missed."],
  ["Can you check the cards before Friday's shoot?", "Yes. I can read every card on Thursday evening and list any with less than 2 hours left at 48 kHz · 24 bit. I will not format anything."],
  ["Which cards are nearly full?", "Two. Card B has 0.4 GB free and Card C has 3.1 GB. Card B's takes are all in the library, so it is safe to format; Card C still holds 6 takes that are not."],
  ["Draft a note for Ines about Card C.", "Here is a short draft: Hi, Card C still holds 6 takes from Wednesday that are not in the library. Could you offload it before Friday? It takes about two minutes, and I can check the library afterwards."],
];

const SHOOT_FOLLOW_UPS: [string, string][] = [
  ["Which of those takes is longest?", "take_11 from Scene 12, at 04M 06S 18F. Most of it is the walk to the car, which the edit will likely cut. It is also the take most likely to clip again, since the car passes twice. Moving the boom a metre back would take the peak down by about 4 dB."],
  ["Can you mark the walk for the edit?", "Yes. I would drop a marker at the start and the end of the walk, add a note to the sound report and send the edit a list of the markers, so they can check the cut before it is made. It takes a minute, and nothing on the card changes."],
  ["Start with the markers, then.", "Starting now. I will mark take_11 first, because the edit asked for it. When the markers are in I will send you the list and the times."],
];

const shootStart: Turn[] = SHOOT_HISTORY.flatMap(([q, a], i) => [
  { id: i * 2, from: "user" as const, text: q },
  { id: i * 2 + 1, from: "agent" as const, text: a },
]);

function ShootLongDemo() {
  const [turns, setTurns] = useState<Turn[]>(shootStart);
  const [busy, setBusy] = useState(false);
  const asked = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const open = timers.current;
    return () => open.forEach((t) => window.clearTimeout(t));
  }, []);

  /* A question from the person, then an answer that arrives a word at a time. */
  function ask() {
    const [question, answer] = SHOOT_FOLLOW_UPS[asked.current++ % SHOOT_FOLLOW_UPS.length]!;
    const id = shootStart.length + asked.current * 2;
    const words = answer.split(" ");
    setBusy(true);
    setTurns((t) => [...t, { id, from: "user", text: question }]);
    timers.current.push(
      window.setTimeout(() => {
        setTurns((t) => [...t, { id: id + 1, from: "agent", text: words[0]! }]);
        const next = (n: number) => {
          setTurns((t) => t.map((x) => (x.id === id + 1 ? { ...x, text: words.slice(0, n).join(" ") } : x)));
          if (n < words.length) timers.current.push(window.setTimeout(() => next(n + 1), WORD_MS));
          else setBusy(false);
        };
        timers.current.push(window.setTimeout(() => next(2), WORD_MS));
      }, 500),
    );
  }

  const last = turns[turns.length - 1]!;
  return (
    <div className="grid w-full gap-4">
      <Frame className="h-112">
        <Conversation label="Shoot week thread" busy={busy} className="flex-1">
          {turns.map((t) =>
            t.from === "user" ? (
              <Message key={t.id} from="user">
                {t.text}
              </Message>
            ) : (
              <Message key={t.id} streaming={busy && t.id === last.id} actions={<MessageActions copyText={t.text} onRetry={noop} />}>
                <MessageText>{t.text}</MessageText>
              </Message>
            ),
          )}
        </Conversation>
      </Frame>
      <div>
        <Button size="sm" variant="secondary" disabled={busy} onClick={ask}>
          Stream a reply
        </Button>
      </div>
    </div>
  );
}

function TakePhoneDemo() {
  return (
    <DeviceProvider mode="phone">
      <div className="mx-auto w-full max-w-sm">
        <Frame className="h-176">
          <Conversation label="take_04 thread on a phone" className="flex-1">
            <Message from="user">Why does take_04 clip at 00M 41S?</Message>
            <Message actions={<MessageActions copyText={markdownOf(TAKE_ANSWER)} onRetry={noop} />}>
              <Answer blocks={TAKE_ANSWER} />
            </Message>
            <Message from="user">Swap in the safety track and normalize it.</Message>
            <Message actions={<MessageActions copyText={markdownOf(TAKE_DONE)} onRetry={noop} />}>
              <Answer blocks={TAKE_DONE} />
            </Message>
          </Conversation>
        </Frame>
      </div>
    </DeviceProvider>
  );
}

/* ---------- Flat's own (plans/024, phase 3): the same thread about the letter, not a site build ---------- */

const BOUNCE_ANSWER: Block[] = [
  { p: ["Issue 13 reached 409 of 412 readers on Friday. Three addresses sent it back:"] },
  {
    ul: [
      ["Two mailboxes were full, so the letter will try them again on Monday."],
      [{ code: "t.berg@oldmail.example" }, " no longer exists. Tomas wrote from a new address in October."],
    ],
  },
  { p: ["Swap Tomas to his new address, and the full mailboxes need nothing from you. Every send is in the ", { link: "letter log", href: "#letter-log" }, "."] },
];

const BOUNCE_DONE: Block[] = [{ p: ["Done. Tomas gets issue 13 now, and issue 14 on Friday with everyone else."] }];

function LetterThreadDemo() {
  const [names, setNames] = useState(false);
  const person = (who: string) => (names ? { name: who, avatar: <Avatar name={who} size="sm" decorative /> } : {});
  const litt = names ? { name: "Litt", avatar: <Avatar name="Litt" size="sm" hue="neutral" decorative /> } : {};
  return (
    <div className="grid w-full gap-6">
      <Switch label="Show names" checked={names} onCheckedChange={setNames} />
      <Frame>
        <Conversation label="Issue 13 thread">
          <Message from="user" {...person("Nick")}>
            Why did three readers not get issue 13?
          </Message>
          <Message {...litt} actions={<MessageActions copyText={markdownOf(BOUNCE_ANSWER)} onRetry={noop} />}>
            <Answer blocks={BOUNCE_ANSWER} />
          </Message>
          <Message from="user" {...person("Nick")}>
            Move Tomas to his new address and send it to him again.
          </Message>
          <Message {...litt} actions={<MessageActions copyText={markdownOf(BOUNCE_DONE)} onRetry={noop} />}>
            <p className="text-small text-fg-subtle">The thinking and tool call rows sit here.</p>
            <Answer blocks={BOUNCE_DONE} />
          </Message>
        </Conversation>
      </Frame>
    </div>
  );
}

export default function MessagePage() {
  const [streamKey, replayStream] = useReplay();
  const [errorKey, resetError] = useReplay();
  const [emptyKey, resetEmpty] = useReplay();
  const [longKey, resetLong] = useReplay();
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="A short thread"
        tier="instant"
        size="lg"
        code="ThreadDemo"
        byWorld={{ flat: { demo: <LetterThreadDemo />, title: "A thread about the letter", code: "LetterThreadDemo" }, device: { demo: <TakeThreadDemo />, title: "A thread about a take", code: "TakeThreadDemo" } }}
        caption="Litt's words sit on the page in fg-muted with no bubble, and the person's turn is a raised bubble on the right. The actions under the latest answer are always there. Hover the older answer, or tab into it, to see its actions. Turn on names to see the optional heading and sm avatar. Nothing moves when the thread loads."
      >
        <ThreadDemo />
      </Stage>

      <Stage
        title="Streaming an answer"
        tier="responsive"
        size="lg"
        code="StreamDemo"
        onReplay={replayStream}
        byWorld={{
          device: {
            demo: (
              <div key={streamKey} className="w-full">
                <TakeStreamDemo replayed={streamKey > 0} />
              </div>
            ),
            code: "TakeStreamDemo",
          },
        }}
        caption="Replay it. Litt's turn arrives once, fading in and rising by half of the travel token on the responsive tier. Then the words appear as they come, with no caret, no fade per word and no shimmer, and nothing moves. The region is busy while it streams, and a polite status says the turn started and ended, never the words. The actions appear when the answer ends."
      >
        <div key={streamKey} className="w-full">
          <StreamDemo replayed={streamKey > 0} />
        </div>
      </Stage>

      <Stage
        title="Inside an answer"
        tier="instant"
        size="lg"
        code="ProseDemo"
        byWorld={{
          device: {
            demo: <TakeProseDemo />,
            code: "TakeProseDemo",
            caption:
              "MessageText styles what a markdown renderer produces, with no library. Headings stay at the body size and step to the title weight and fg. Strong text is fg at the title weight, and links are the ink with an underline, since orange is never text under Device. Inline code takes an fg 6% fill at the control radius, a pre is a quiet mono block on surface-2, and a quote has no rail. Nothing is bold.",
          },
        }}
        caption="MessageText styles what a markdown renderer produces, with no library. Headings stay at the body size and step to the title weight and fg. Strong text is fg at the title weight, and links are accent text with an underline. Inline code takes an fg 6% fill at the control radius, a pre is a quiet mono block on surface-2, and a quote has no rail. Nothing is bold."
      >
        <ProseDemo />
      </Stage>

      <Stage
        title="A turn that stopped"
        tier="responsive"
        code="ErrorDemo"
        onReplay={resetError}
        byWorld={{
          device: {
            demo: (
              <div key={errorKey} className="w-full">
                <OffloadErrorDemo replayed={errorKey > 0} />
              </div>
            ),
            code: "OffloadErrorDemo",
            caption:
              "Replay it. The answer streams a few words and then the connection drops. The line under the text says so: the alert icon in red, the colour Device keeps for a fault, the words in fg-muted and a Retry button. Only the icon takes the colour, and a polite status says Litt stopped answering. A stopped turn has no actions. Retry streams the answer again, and the actions come back when it ends.",
          },
        }}
        caption="Replay it. The answer streams a few words and then the connection drops. The line under the text says so: the alert icon in danger, the words in fg-muted and a Retry button. Only the icon takes the status color, and a polite status says Litt stopped answering. A stopped turn has no actions. Retry streams the answer again, and the actions come back when it ends."
      >
        <div key={errorKey} className="w-full">
          <ErrorDemo replayed={errorKey > 0} />
        </div>
      </Stage>

      <Stage
        title="Before the first turn"
        tier="instant"
        code="EmptyDemo"
        onReplay={resetEmpty}
        byWorld={{
          device: {
            demo: (
              <div key={emptyKey} className="w-full">
                <TakeEmptyDemo />
              </div>
            ),
            code: "TakeEmptyDemo",
          },
        }}
        caption="One sentence on what Litt can do, then suggestions as secondary sm buttons, left-aligned in the column like the Empty state. In the app the Composer owns the suggestions, and a click puts the prompt in its field so it can be edited before it is sent."
      >
        <div key={emptyKey} className="w-full">
          <EmptyDemo />
        </div>
      </Stage>

      <Stage
        title="A long thread"
        tier="responsive"
        size="lg"
        code="LongDemo"
        onReplay={resetLong}
        byWorld={{
          device: {
            demo: (
              <div key={longKey} className="w-full">
                <ShootLongDemo />
              </div>
            ),
            code: "ShootLongDemo",
          },
        }}
        caption="The region scrolls on its own and starts at the newest line. Press Stream a reply to add a turn: the person's turn scrolls to the foot, and the answer is followed while it grows. Scroll up while it streams and the following stops. Jump to latest fades in above the foot, jumps at once with no smooth scroll, and the following starts again."
      >
        <div key={longKey} className="w-full">
          <LongDemo />
        </div>
      </Stage>

      <Stage
        title="On a phone"
        tier="instant"
        size="lg"
        code="PhoneDemo"
        byWorld={{ device: { demo: <TakePhoneDemo />, code: "TakePhoneDemo" } }}
        caption="The column takes the full width and the bubble is 85% of it. A finger cannot hover, so the actions always show under every answer, and they are 44px. Press and hold an icon to read its label. Jump to latest and Retry are 44px too."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
