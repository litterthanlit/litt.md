import { SignIn } from "@/blocks/sign-in";
import { AppFrame, Page, Stage, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "sign-in",
  title: "Sign in",
  lede: "The page before the app.",
  order: 30.95,
  group: "Blocks",
  verbs: ["type", "press"],
  summary:
    "The page someone meets before the app: the wordmark, one left-aligned column with the title in two inks, email and password, Sign in and a second way in, and from 1024 up a quiet column of what is new. An empty or wrong field says so under itself and takes focus, and a refusal from the server shows in a callout above the fields. Sign in is the one accent fill.",
  tiers: ["instant"],
  block: "sign-in",
};

function DesktopDemo() {
  return (
    <AppFrame label="Sign in, desktop" bare>
      <SignIn />
    </AppFrame>
  );
}

function PhoneDemo() {
  return (
    <AppFrame label="Sign in, phone" phone bare>
      <SignIn />
    </AppFrame>
  );
}

export default function SignInPage() {
  return (
    <Page meta={meta}>
      <Stage
        title="Desktop"
        tier="instant"
        size="lg"
        align="start"
        code="DesktopDemo"
        caption="Press Sign in with the fields empty: each one says what it needs, and focus goes to the first. A password under eight characters stands in for a wrong one, and the server's answer shows in a callout above the fields, read out as it arrives. Eight or more signs in. Sign in shows its loading state while it waits, and the second way in waits with it."
      >
        <DesktopDemo />
      </Stage>

      <Stage
        title="On a phone"
        tier="instant"
        size="lg"
        align="start"
        code="PhoneDemo"
        caption="The column takes the width and the what's-new column goes, so the form is all there is. The fields and both buttons are 44px tall, and the email field brings up the email keyboard."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
