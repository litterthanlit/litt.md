import { AgentDispatch, type AgentChannel } from "@/components/agent-dispatch";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "agent-dispatch",
  title: "Agent dispatch",
  lede: "A four-channel hardware agent console with LCD glass, lamps and tactile keys.",
  order: 1.05,
  group: "Agents",
  verbs: ["select", "press", "watch"],
  worlds: ["device"],
  summary:
    "Four parallel agent channels monitored on a machined aluminium plate: a black bezel holds smoked LCD glass showing each channel's state in parentheses, monochrome token-burst meters, a hardware chip and frame timecode; recessed wells beneath hold 2px-skirt keys and recessed signal lamps where orange lights only for a channel waiting on your OK. It belongs to Device.",
  tiers: ["instant"],
  mechanism:
    "Channel selection is one roving radiogroup tab stop in a recessed well; arrow keys and Home or End step channels and highlight the chosen line on LCD glass in Device's selection blue. Keys sink on press and trigger synthesized clicks through useSound() while Device sound is unmuted. Approving, holding or retrying updates the channel's chip, lamp and meter in place with zero motion on load.",
};

export const docs: PageDocs = {
  components: ["agent-dispatch"],
  exports: ["AgentDispatch"],
  usage: `import { AgentDispatch } from "@/components/agent-dispatch";

// Needs data-material="device" on <html>.
<AgentDispatch
  label="Agent dispatch · 4 ch"
  defaultSelectedId="ch2"
/>`,
  use: [
    "Multi-agent terminals, coding workstations and hardware-styled operator consoles monitoring parallel workers under Device.",
    "Pairing a monochrome LCD readout with recessed signal lamps and clickable channel keys.",
  ],
  skip: [
    "Another world's page. AgentDispatch is built from Device's aluminium plate, smoked LCD glass, recessed lamps and synthesized key clicks, and needs data-material=\"device\" on <html>.",
    "A single phase animation inside one turn. Use AgentIndicator.",
    "A long vertical list of historical agent runs. Use RunList.",
  ],
  keyboard: [
    [["Tab"], "Moves into the channel selector well as one stop, then to the primary steering key and Hold or Reset key."],
    [["←", "→", "↑", "↓"], "Steps across channels 01 to 04 and highlights the active row on the LCD glass, wrapping at the ends."],
    [["Home", "End"], "Jumps to channel 01 or the final channel."],
    [["Enter", "Space"], "Activates Approve, Retry, Resume, Hold or Reset for the selected channel."],
  ],
  a11y: [
    "Channel keys form a native radiogroup with a roving tab index, so four channels take one tab stop.",
    "Every channel state is printed in words in parentheses on the LCD glass and inside the white hardware chip, never by lamp colour alone.",
    "Orange appears only in a recessed lamp for a channel waiting on your OK, and red appears only in a lamp for an active or faulted channel.",
    "Synthesized key clicks run only in answer to a trusted pointer or keyboard press and honour the mute control.",
  ],
};

function DispatchDemo() {
  return <AgentDispatch label="Agent dispatch · 4 ch" defaultSelectedId="ch2" />;
}

const ALL_RUNNING: AgentChannel[] = [
  { id: "c1", slot: "01", name: "Planner", status: "running", task: "Synthesize patch plan", level: 6, timecode: "01M 04S 12F" },
  { id: "c2", slot: "02", name: "Coder", status: "running", task: "Refactor token loader", level: 7, timecode: "00M 51S 03F" },
  { id: "c3", slot: "03", name: "Tester", status: "running", task: "Verify 18 unit specs", level: 5, timecode: "00M 29S 19F" },
  { id: "c4", slot: "04", name: "Auditor", status: "paused", task: "Queued for final diff", level: 1, timecode: "00M 00S 00F" },
];

function RunningMixDemo() {
  return <AgentDispatch label="Build slate · 4 ch" channels={ALL_RUNNING} defaultSelectedId="c2" />;
}

export default function AgentDispatchPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      tile={<AgentDispatch label="Agent dispatch · 4 ch" defaultSelectedId="ch2" />}
    >
      <Stage
        title="Multi-channel dispatch"
        tier="instant"
        caption="Channel 02 waits for your OK with its orange lamp lit; press Approve or step across channels with the hardware keys."
        code="DispatchDemo"
      >
        <DispatchDemo />
      </Stage>

      <Stage
        title="Active build slate"
        tier="instant"
        caption="Three parallel channels running with monochrome token-burst meters on LCD glass."
        code="RunningMixDemo"
      >
        <RunningMixDemo />
      </Stage>

      <TryIt
        of="AgentDispatch"
        component={AgentDispatch}
        props={{ label: "Agent dispatch · 4 ch", defaultSelectedId: "ch2" }}
        controls={[
          "label",
          { name: "selectedId", options: ["ch1", "ch2", "ch3", "ch4"], optional: true },
        ]}
      />
    </Page>
  );
}
