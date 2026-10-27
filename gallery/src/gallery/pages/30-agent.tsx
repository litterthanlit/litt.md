import type { ReactNode } from "react";
import { AgentChat } from "@/blocks/agent";
import { DeviceProvider } from "@/motion";
import { Page, Stage, useReplay, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "agent",
  title: "Agent",
  lede: "A chat with an agent, from the first word to the deploy.",
  order: 30.5, group: "Blocks",
  verbs: ["watch", "type"],
  summary:
    "A chat with Litt, the studio's agent, fixing the failing Halo build, built from the agent parts: the conversation, the thinking, a plan, a run of tool calls that open to what they found, an approval, the answer with its citations, a review of the files Litt changed, its sources, and the composer, with the studio's runs beside it. The run waits for you at the deploy. The one accent fill is Allow while the approval waits, and Send when there is something to send.",
  tiers: ["instant", "responsive"],
  block: "agent",
};

/** A window onto the app: the page's own canvas with a hairline, so the person's bubble reads as it does in an app. */
function Frame({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={"flex w-full min-w-0 flex-col overflow-hidden rounded-surface bg-canvas outline-1 -outline-offset-1 outline-line " + className}
    >
      {children}
    </div>
  );
}

function DesktopDemo({ onRestart }: { onRestart: () => void }) {
  return (
    <Frame label="Halo build chat" className="h-180">
      <AgentChat onRestart={onRestart} />
    </Frame>
  );
}

function PhoneDemo() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[24.375rem]">
      <DeviceProvider mode="phone">
        <Frame label="Halo build chat on a phone" className="h-176">
          <AgentChat finished label="Conversation with Litt on a phone" />
        </Frame>
      </DeviceProvider>
    </div>
  );
}

export default function AgentPage() {
  const [run, replayRun] = useReplay();
  return (
    <Page meta={meta}>
      <Stage
        title="The run, on a desktop"
        tier="responsive"
        size="lg"
        code="DesktopDemo"
        onReplay={replayRun}
        caption="Litt fixes the failing Halo build while you watch, and the run waits for you at the deploy. Each call says what it found after its target and opens to it. A build's log streams in while it runs, and the failed one stays open on its error. The web search lists four sources and numbers the two the answer cites. The edit opens to its file. In the answer each number is a link to its source, and resting on one lights its row. Under it you keep or undo each file Litt changed, or press Keep all, a raised block, because a review does not stop Litt. The edit call shares your decision. Beside the chat the studio's runs read the same moment, so the Halo run says Needs you while the approval waits and Done when Litt has answered. While Litt works the composer shows Stop and nothing is accent filled. When the approval waits, Send is off and Allow is the one accent fill. Marks swap in place, colors fade on the instant tier, and the thinking, the logs and the group of calls fold themselves on the responsive tier. Nothing shimmers or spins, and Replay runs it again."
      >
        <div className="w-full min-w-0">
          <DesktopDemo key={run} onRestart={replayRun} />
        </div>
      </Stage>

      <Stage
        title="On a phone"
        tier="instant"
        size="lg"
        code="PhoneDemo"
        caption="The same chat, finished, in a phone-wide frame, with every file kept. The runs stay off a phone. The rail shows only on a frame wide enough for it, and never on a phone, whatever the window. The column takes the whole width, the person's bubble takes 85% of it, and a diff scrolls sideways inside itself while the page stays still. The review reads its receipt and every file says Kept, with nothing left to press. The composer sits at the foot with Send off, so this view has no accent fill. Rows, buttons and the model picker grow to 44px for a finger, and the actions under the answer are always there."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
