import { Settings } from "@/blocks/settings";
import { Toaster } from "@/components/toast";
import { AppFrame, Page, Stage, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "settings",
  title: "Settings",
  lede: "An account's settings, as one page.",
  order: 30.7,
  group: "Blocks",
  verbs: ["type", "select", "drag", "press"],
  summary:
    "An account's settings as one screen: the profile, what we email you about and how the app looks, then Save and Cancel, and deleting the studio apart behind a slide to confirm. A failed save puts a summary on top that takes focus, and a good one ends in a toast, the view's one expressive moment. Save is the one accent fill.",
  tiers: ["instant", "expressive"],
  block: "settings",
};

function DesktopDemo() {
  return (
    <AppFrame label="Settings, desktop">
      <Settings />
    </AppFrame>
  );
}

function PhoneDemo() {
  return (
    <AppFrame label="Settings, phone" phone>
      <Settings />
    </AppFrame>
  );
}

export default function SettingsPage() {
  return (
    <Page meta={meta}>
      <Toaster>
        <Stage
          title="Desktop"
          tier="expressive"
          size="lg"
          align="start"
          code="DesktopDemo"
          caption="From 1024 up each section's title takes the left third and its fields the rest; in this frame they stack. Clear the name and press Save: the summary on top takes focus, its links move to the fields, and each error clears as you fix it. A good save shows the button's loading state, then the toast. Cancel puts back every saved value. Deleting the studio is apart from the form and is never saved with it: slide the thumb to the end, or press it and confirm with the keys."
        >
          <DesktopDemo />
        </Stage>

        <Stage
          title="On a phone"
          tier="instant"
          size="lg"
          align="start"
          code="PhoneDemo"
          caption="One column. The fields and the controls grow to 44px for a finger, Save and Cancel go full width with Save on top, and the slide to confirm spans the column."
        >
          <PhoneDemo />
        </Stage>
      </Toaster>
    </Page>
  );
}
