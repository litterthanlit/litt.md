import { Team } from "@/blocks/team";
import { Toaster } from "@/components/toast";
import { AppFrame, Page, Stage, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "team",
  title: "Team",
  lede: "Who is in the studio, and what each can do.",
  order: 30.8,
  group: "Blocks",
  verbs: ["select", "open", "type", "press"],
  summary:
    "A studio's people as one screen: the head count, the seats as one meter, and a table with each person's avatar, a role you change in place, an Invited tag on an open invite, when they were last active and a menu of actions. Invite opens a dialog that takes several addresses at once, and a removal is undone from its toast. Invite is the one accent fill.",
  tiers: ["instant", "responsive", "expressive"],
  block: "team",
};

function DesktopDemo() {
  return (
    <AppFrame label="Team, desktop">
      <Team />
    </AppFrame>
  );
}

function PhoneDemo() {
  return (
    <AppFrame label="Team, phone" phone>
      <Team />
    </AppFrame>
  );
}

export default function TeamPage() {
  return (
    <Page meta={meta}>
      <Toaster>
        <Stage
          title="Desktop"
          tier="expressive"
          size="lg"
          align="start"
          code="DesktopDemo"
          caption="Change a role from its row; the owner's is fixed, so it is words, not a picker. The menu at the end of a row removes someone or cancels an invite, and the toast's Undo puts them back in the same place. Invite opens the dialog, the view's expressive moment: type addresses and press Enter after each, and an address that is not one is refused in the field. More addresses than seats left is an error, said in words. The meter counts invites as seats, because an accepted invite takes one."
        >
          <DesktopDemo />
        </Stage>

        <Stage
          title="On a phone"
          tier="instant"
          size="lg"
          align="start"
          code="PhoneDemo"
          caption="The table scrolls sideways inside its own box, with the person held at the start. The role pickers and the row menus grow to 44px for a finger, and the invite dialog becomes the bottom sheet that drags down to close."
        >
          <PhoneDemo />
        </Stage>
      </Toaster>
    </Page>
  );
}
