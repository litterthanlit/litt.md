import { useState } from "react";
import { Button } from "@/components/button";
import { CodeInput } from "@/components/code-input";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "code-input",
  title: "Code input",
  lede: "A short one-time code, one cell per character.",
  order: 2.2,
  group: "Controls",
  verbs: ["type"],
  summary:
    "A short one-time code, such as the six digits from a sign-in email, drawn as one cell per character, each cut into the page like an Input, but built as one real field, so paste, the browser's one-time-code autofill and screen readers all work as in any field. The next cell takes the focus edge and a still caret, and the last character runs onComplete once. The edges fade on the instant tier.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["code-input"],
  exports: ["CodeInput"],
  usage: `import { CodeInput } from "@/components/code-input";

<CodeInput
  label="Sign-in code"
  help="We sent six digits to ines@halo.studio. They last 10 minutes."
  error={wrong ? "That code is not right. Check it, or send a new one." : undefined}
  onComplete={(code) => verify(code)}
/>`,
  use: [
    "A one-time code someone copies from an email, a text message or an authenticator app: sign in, two-step verification, confirming an email address.",
    "A short code read off another screen, such as a pairing code on a TV (type=\"alphanumeric\").",
  ],
  skip: [
    "A password or anything longer than about eight characters. Use a TextField.",
    "A number someone chooses, such as a quantity or a PIN they set. Use a TextField, which says what it is in words.",
  ],
  keyboard: [
    [["Tab"], "Moves focus into the code. The cell the next character goes into lights up."],
    [["0-9"], "Fills the next cell. Letters and spaces are dropped from a numeric code."],
    [["Backspace"], "Clears the last character."],
    [["⌘V", "Ctrl+V"], "Pastes a whole code at once. Spaces and dashes in it are dropped."],
  ],
  a11y: [
    "One real input, named by the label, with autocomplete=\"one-time-code\", so the browser and password managers can fill it, and a screen reader hears one field, not six.",
    "The cells are drawn from its value and hidden from assistive tech.",
    "The hint or the error is linked with aria-describedby, and an error sets aria-invalid.",
    "Numeric codes bring up the number pad (inputMode numeric). The field's text is 16px, so iOS never zooms in on it.",
    "The caller checks the code in onComplete and says the result: an error under the cells, or the next screen.",
  ],
};

const RIGHT = "246810";

function VerifyDemo() {
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<"idle" | "checking" | "wrong" | "right">("idle");
  return (
    <div className="grid w-full max-w-sm gap-6">
      <CodeInput
        key={round}
        label="Sign-in code"
        help={`We sent six digits to ines@halo.studio. Try ${RIGHT}.`}
        error={result === "wrong" ? "That code is not right. Check it, or send a new one." : undefined}
        onValueChange={() => result === "wrong" && setResult("idle")}
        onComplete={(code) => {
          setResult("checking");
          window.setTimeout(() => setResult(code === RIGHT ? "right" : "wrong"), 500);
        }}
      />
      <div className="flex items-center justify-between gap-4">
        <p role="status" className="min-h-5 text-small text-fg-subtle">
          {result === "checking" ? "Checking the code…" : result === "right" ? "Signed in." : ""}
        </p>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setRound((r) => r + 1);
            setResult("idle");
          }}
        >
          Send a new code
        </Button>
      </div>
    </div>
  );
}

function StatesDemo() {
  return (
    <div className="grid w-full max-w-md gap-8">
      <CodeInput label="Pairing code" type="alphanumeric" length={4} size="lg" defaultValue="k7q" help="Shown on the TV. Letters land in capitals." />
      <CodeInput label="Sign-in code" defaultValue="135790" error="That code has expired. Send a new one." />
      <CodeInput label="Sign-in code" defaultValue="2468" disabled help="Wait 30 seconds to send another code." />
    </div>
  );
}

export default function CodeInputPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Sign in with a code"
        tier="instant"
        align="start"
        code="VerifyDemo"
        caption={`Type or paste six digits; "246 810" pastes as 246810, because spaces and dashes are dropped. The cell the next digit goes into has the focus edge and a still caret. The sixth digit runs onComplete, which checks the code: ${RIGHT} signs in, anything else shows the error under the cells, and typing again clears it.`}
      >
        <VerifyDemo />
      </Stage>

      <Stage
        title="Sizes and states"
        tier="instant"
        align="start"
        code="StatesDemo"
        caption="An alphanumeric code of four at lg, with letters in capitals; six cells split three and three, shorter codes do not. An error puts the danger edge on every cell. Disabled is flat and muted, as the Input."
      >
        <StatesDemo />
      </Stage>

      <TryIt of="CodeInput" component={CodeInput} props={{ label: "Sign-in code", help: "We sent six digits to ines@halo.studio.", error: "" }} controls={["label", "length", "type", "size", "help", "error", "disabled"]} />
    </Page>
  );
}
