import type { ReactNode } from "react";
import { AgentChat } from "@/blocks/agent";
import { DeviceProvider } from "@/motion";
import { Page, Stage, useReplay, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "agent",
  title: "Agent",
  lede: "A chat with an agent, from the first word to the deploy.",
  order: 18.99,
  group: "Agents",
  verbs: ["watch", "type"],
  summary:
    "A chat with Litt, the studio's agent, fixing the failing Halo build, built from the agent parts: the conversation, the thinking, a plan, a run of tool calls, an approval, the answer with its code, and the composer. The run waits for you at the deploy. The one accent fill is Allow while the approval waits, and Send when there is something to send.",
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
        caption="Litt fixes the failing Halo build while you watch, and the run waits for you at the deploy. The chat opens with the first message sent and Litt thinking. While Litt works the composer shows Stop, and nothing in the view is accent filled. When the approval waits, Send is off and Allow is the one accent fill. Press Allow and the panel becomes a row while the deploy runs. Press Deny and Litt leaves the deploy to you. Send turns accent again only when you type a reply. The clock and the marks swap in place, and nothing shimmers or spins. The thinking and the group of calls fold themselves on the responsive tier, and Replay runs it again."
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
        caption="The same chat, finished, in a phone-wide frame. The column takes the whole width, the person's bubble takes 85% of it, and the code block scrolls sideways inside itself while the page stays still. The composer sits at the foot with Send off, so this view has no accent fill. Rows, buttons and the model picker grow to 44px for a finger, and the actions under the answer are always there."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
