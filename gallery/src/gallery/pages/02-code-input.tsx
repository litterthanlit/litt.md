import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/button";
import { CodeInput } from "@/components/code-input";
import { MaterialProvider, useMotionDial } from "@/motion";
import { useCustomize, useDark } from "../customize-state";
import { lookAttributes, MATERIALS } from "../look";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

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
  mechanism:
    "One real input lies over the cells, invisible, so typing, paste and one-time-code autofill work as in any field; the cells are only drawn from its value. The cell the next character goes into takes the focus edge and a still caret, and nothing blinks. Each digit fills a cell and the edge moves to the next, fading on the instant tier, 100ms. The last digit runs onComplete once. An error puts the danger edge on every cell. Under Press each cell is cut into the page like an Input. Under Flat it is a grey pill with no outline. Under Device each cell is a pane of LCD glass showing the dim ghost of a seven-segment eight until its digit is typed, then the digit lit in segments, switching in three steps on the instant tier. Reduced motion has nothing to remove: the edges change at once.",
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

/* The study draws its objects unfocused, so the current cell and its caret would never show. A focusin on the field
   is what React's onFocus listens to, so it lights them without moving the real focus off the page. */
function Lit({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.querySelector("input")?.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
  }, []);
  return <div ref={box}>{children}</div>;
}

/** Types 135790 into the field one digit at a time, so the Replay shows the edge move cell by cell. */
function TypeIn() {
  const { reduced } = useMotionDial();
  const [code, setCode] = useState(reduced ? "135790" : "");
  useEffect(() => {
    if (reduced) return;
    let n = 0;
    const timer = window.setInterval(() => {
      n += 1;
      setCode("135790".slice(0, n));
      if (n >= 6) window.clearInterval(timer);
    }, 220);
    return () => window.clearInterval(timer);
  }, [reduced]);
  return (
    <Lit>
      <CodeInput label="Sign-in code" value={code} help="We sent six digits to ines@halo.studio." />
    </Lit>
  );
}

export const study: PageStudy = {
  object: (
    <Lit>
      <CodeInput label="Sign-in code" defaultValue="135" />
    </Lit>
  ),
  parts: [
    { name: "The glass", selector: "[aria-hidden=true]" },
    { name: "A digit cell", selector: "[aria-hidden=true] > span:nth-child(1)" },
    { name: "The current cell", selector: "[aria-hidden=true] > span:nth-child(4)" },
    { name: "The caret", selector: "[aria-hidden=true] > span:nth-child(4) > span" },
  ],
  states: {
    default: (
      <Lit>
        <CodeInput label="Sign-in code" defaultValue="135" />
      </Lit>
    ),
    disabled: <CodeInput label="Sign-in code" defaultValue="135790" disabled />,
    error: <CodeInput label="Sign-in code" defaultValue="135790" error="That code is not right." />,
    empty: (
      <Lit>
        <CodeInput label="Sign-in code" />
      </Lit>
    ),
  },
  replay: {
    label: "Type the code",
    caption: "Watch the focus edge and the caret move on one cell at a time as each digit lands.",
    run: () => <TypeIn />,
  },
};

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

function ThreeBodiesDemo() {
  const { look } = useCustomize();
  const dark = useDark();
  return (
    <div className="grid w-full gap-6 md:grid-cols-3">
      {MATERIALS.map((m) => (
        <figure key={m.id} className="m-0 grid min-w-0 content-start gap-3">
          <div
            {...lookAttributes({ accent: look.accent, material: m.id }, dark)}
            className="grid min-h-56 min-w-0 content-center justify-items-start gap-6 rounded-surface bg-canvas p-8 text-fg outline-1 -outline-offset-1 outline-line"
          >
            <MaterialProvider material={m.id}>
              <CodeInput label="Sign-in code" defaultValue="135" />
              <CodeInput label="Sign-in code" defaultValue="135790" error="That code is not right." />
            </MaterialProvider>
          </div>
          <figcaption className="text-caption text-fg-muted">{m.name}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export default function CodeInputPage() {
  return (
    <Page meta={meta} docs={docs} study={study}>
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

      <Stage
        title="Three bodies"
        tier="instant"
        caption="One code field, one contract, three bodies. Press is a cut cell per character. Flat is a grey pill with no outline. Device is a pane of LCD glass per character, an unlit seven-segment eight until its digit is typed. Each is drawn here whatever look the page is in; the one real input, the keyboard, paste and what a screen reader hears are the same in all three."
        code="ThreeBodiesDemo"
      >
        <ThreeBodiesDemo />
      </Stage>

      <TryIt of="CodeInput" component={CodeInput} props={{ label: "Sign-in code", help: "We sent six digits to ines@halo.studio.", error: "" }} controls={["label", "length", "type", "size", "help", "error", "disabled"]} />
    </Page>
  );
}
