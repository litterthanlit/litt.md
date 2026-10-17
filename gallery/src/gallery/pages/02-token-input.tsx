import { useState } from "react";
import { TextField } from "@/components/input";
import { Tag } from "@/components/tag";
import { TokenInput } from "@/components/token-input";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "token-input",
  title: "Token input",
  order: 2.3,
  group: "Controls",
  summary:
    "A field that turns typed or pasted values into removable tokens, such as the senders of a mail rule. It is the Input's field with the Tag's look inside: it grows as tokens wrap, a long list folds into a +N token until you focus it, and tokens fade in and out on the responsive tier while their neighbors slide.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["token-input"],
  exports: ["TokenInput"],
  usage: `import { TokenInput } from "@/components/token-input";

// Hold the list in state. A value is added on Enter, a comma or blur, and a paste is split into several.
const [senders, setSenders] = useState(["@stripe.com", "ramp.com", "brex.com"]);

<TokenInput
  label="Mail from"
  hint="Press Enter or a comma to add a sender."
  placeholder="Add a sender"
  value={senders}
  onValueChange={setSenders}
  collapseAfter={1}
/>

// validate rejects a value with a message: it stays in the input until the text changes.
<TokenInput
  label="Send the invoice to"
  validate={(v) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v) || \`\${v} is not a full address. Use name@studio.com.\`}
/>

// In a form, pass a name: one hidden input per value, so the form posts them all.
<TokenInput name="tags" label="Project tags" defaultValue={["landing"]} max={5} />`,
  use: [
    "A short list of short values the person types or pastes: sender domains, recipients, tags, allowed origins.",
    "The list can grow past a line. The field gets taller as the tokens wrap, and collapseAfter folds it into a +N token while nobody is editing it.",
    "Each value can be wrong in its own way. Pass validate, and a value that fails stays in the input with a message that says how to fix it.",
    "A form field. Pass name and every value is posted under it.",
    "A cap on the list. Pass max, and the field stops adding and says so under it.",
  ],
  skip: [
    "One value. Use TextField.",
    "A choice from a fixed list. Use Select, or Segmented for a few options.",
    "Long or free text, such as a brief. Use Textarea.",
    "Values that need a search, a picture or a second line each, such as people with avatars. Build a combobox for that.",
    "Tokens that only show state and are never edited. Use Tag, because it takes no focus and has no remove button.",
  ],
  keyboard: [
    [["Enter", ","], "Adds what you typed as a token. Enter in an empty field still submits its form."],
    [["Backspace"], "In an empty input, removes the last token. On a focused remove button, removes that token."],
    [["Delete"], "On a focused remove button, removes that token."],
    [["←"], "At the start of the input, moves focus to the last token's remove button. On a remove button, moves to the one before."],
    [["→"], "On a remove button, moves to the next one, and past the last returns to the input."],
    [["Tab"], "Moves between the input and one remove button, the one last used. The arrow keys reach the rest."],
  ],
  a11y: [
    "The label is a real <label for> on the text input, so clicking it focuses the field and a screen reader reads it. It is required.",
    "The tokens are a list named by the label. Each remove button is named for its value (\"Remove @stripe.com\"), and the +N token is named \"2 more\".",
    "A polite live region says \"Added stripe.com\" and \"Removed stripe.com\", and the message of a rejected value, so nothing happens silently.",
    "The hint, the rejection message and the limit are linked to the input with aria-describedby. An invalid field sets aria-invalid. The danger edge is never alone: the message says what is wrong.",
    "The 2px focus ring wraps the whole field while the text input has keyboard focus, and each remove button draws its own ring inside it.",
    "The remove buttons are one tab stop, not one per token, and the arrow keys walk them. Every token can also be removed from the input with Backspace.",
    "Remove buttons are 24px, and 44px targets on touch screens through an invisible area around them. Text is 16px on touch screens so iOS does not zoom.",
    "A disabled field is muted, skipped by Tab and left out of a form.",
  ],
};

function SendersDemo() {
  return (
    <div className="grid w-full max-w-xl gap-6">
      <TokenInput
        label="Mail from"
        defaultValue={["@stripe.com", "ramp.com", "brex.com"]}
        collapseAfter={1}
        placeholder="Add a sender"
        hint="Press Enter or a comma to add one. Click the field to see them all."
      />
      <TextField label="That says" defaultValue="invoice" />
      <p className="flex items-center gap-2 text-small text-fg-muted">
        Goes to <Tag hue="amber">Finance</Tag>
      </p>
    </div>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RecipientsDemo() {
  const [to, setTo] = useState(["nina@halo.studio", "accounts@marlow.co"]);
  return (
    <div className="grid w-full max-w-xl gap-4">
      <TokenInput
        label="Send the invoice to"
        value={to}
        onValueChange={setTo}
        placeholder="name@studio.com"
        hint="Paste a list from your contacts, or type and press Enter."
        validate={(v) => EMAIL.test(v) || `${v} is not a full address. Use the form name@studio.com.`}
      />
      <p role="status" className="text-small text-fg-subtle">
        {to.length === 0 ? "Add at least one recipient." : `The invoice goes to ${to.length} ${to.length === 1 ? "address" : "addresses"}.`}
      </p>
    </div>
  );
}

function TagsDemo() {
  return (
    <form className="grid w-full max-w-xl gap-4" aria-label="Project settings" onSubmit={(e) => e.preventDefault()}>
      <TokenInput
        name="tags"
        label="Project tags"
        defaultValue={["landing", "portfolio", "dark-mode", "cms"]}
        max={5}
        placeholder="Add a tag"
        hint="Lowercase letters, numbers and dashes. Up to 5."
        validate={(v) => /^[a-z0-9-]+$/.test(v) || "Use lowercase letters, numbers and dashes, like dark-mode."}
      />
    </form>
  );
}

export default function TokenInputPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Senders"
        tier="responsive"
        caption="A mail rule. The field shows the first sender and a +N token for the rest, and opens to all of them when you focus it. The tokens that appear fade in and slide, and they fold back when focus leaves."
        code="SendersDemo"
      >
        <SendersDemo />
      </Stage>

      <Stage
        title="Recipients"
        tier="responsive"
        caption="Type an address and press Enter or a comma, or paste a list. An address that is not whole stays in the input, the edge turns to danger and the message says how to fix it, until you change the text. A new token fades in, and a removed one fades out while its neighbors close the gap."
        code="RecipientsDemo"
      >
        <RecipientsDemo />
      </Stage>

      <Stage
        title="Project tags"
        tier="responsive"
        caption="Tags for a Framer project, in a form. Five is the limit: at the fifth the input stops adding and the hint says so, and removing one opens it again. Each tag posts under the same name."
        code="TagsDemo"
      >
        <TagsDemo />
      </Stage>
    </Page>
  );
}
