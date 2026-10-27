import { useState } from "react";
import { RuleBuilder, isGroup, type RuleBuilderField, type RuleBuilderGroup, type RuleBuilderNode } from "@/components/rule-builder";
import { DeviceProvider } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "rule-builder",
  title: "Rule builder",
  lede: "When this, and that, or any of these: rules built from rows.",
  order: 4.5,
  group: "Controls",
  verbs: ["drag", "select", "type", "press"],
  summary:
    "A rule as rows of field, operator and value, joined by one And or Or per group, with a group inside the rule. Take a row by its handle and it rises into a raised block and follows your hand one to one, while the rows it passes make room on the responsive spring; let go and it settles into its place, and only then does the rule change, once. Space picks a row up for the arrow keys.",
  fun: "Pick a row up by its handle: the others trade places with a little spring, and it lands with a settle.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["rule-builder"],
  exports: ["RuleBuilder", "newCondition", "newGroup", "isGroup"],
  usage: `import { RuleBuilder, type RuleBuilderField, type RuleBuilderGroup } from "@/components/rule-builder";

const fields: RuleBuilderField[] = [
  { id: "status", label: "Expense status", type: "choice", options: [{ value: "submitted", label: "Submitted" }, { value: "paid", label: "Paid" }] },
  { id: "type", label: "Expense type", type: "choice", options: [{ value: "food", label: "Food & drink" }, { value: "travel", label: "Travel" }] },
  { id: "merchant", label: "Merchant", type: "text" },
  { id: "amount", label: "Amount", type: "number" },
];

const [rule, setRule] = useState<RuleBuilderGroup>({
  kind: "group", id: "policy", join: "and",
  children: [
    { kind: "condition", id: "trigger", field: "status", operator: "is", value: "submitted", locked: true },
    { kind: "group", id: "spend", join: "or", children: [
      { kind: "condition", id: "type", field: "type", operator: "any-of", value: ["food", "travel"] },
      { kind: "condition", id: "merchant", field: "merchant", operator: "is", value: "Uber" },
    ] },
  ],
});

<RuleBuilder label="Expense approval" fields={fields} value={rule} onValueChange={setRule} />`,
  use: [
    "A rule someone writes once and the product runs many times: who approves an expense, which deploys alert the studio, which leads go to sales.",
    "Conditions that read as a sentence, a field, an operator and a value, where And and Or matter and one level of grouping says the rest.",
    "A rule that has a trigger: lock the first condition, and every other row stays below it.",
    "A rule a form saves: pass name and it posts the whole rule as one JSON string.",
  ],
  skip: [
    "Narrowing one table column. Use the Table's filter.",
    "A search box with a few facets. Use a Combobox, or filter chips.",
    "Two or three fixed choices that always apply together. Use fields in a Form.",
  ],
  keyboard: [
    [["Tab"], "Moves through each group's join, then each row's handle, field, operator, value and remove, then Add condition and Add group."],
    [["Space", "Enter"], "On a handle: picks the row up, and drops it where it is."],
    [["↑", "↓"], "Moves a picked-up row one place within its group."],
    [["Esc"], "Puts a picked-up or dragged row back where it was."],
  ],
  a11y: [
    "The builder is a group named by label, and each row a group named by its place (\"Condition 2 of 3\"). Every control is named by its row: \"Field, condition 2\", \"Operator, condition 2\", \"Value, condition 2\".",
    "A handle is a button named by the row as a sentence (\"Move Seniority is Manager\"), with a hint, and aria-pressed while the row is picked up. A polite status says each step: picked up, its position, moved, put back, added and removed.",
    "A new row takes focus on its field; a removed row hands focus to the next handle, the previous one, or Add condition.",
    "An error is said in words under its row and linked to it, and the row's edge turns to the danger color. Write what to do: \"Enter how many minutes a build may take.\"",
    "The join is a Segmented control, two radios with a hidden legend, so And and Or are both words on screen. The rail beside the rows is drawing only.",
    "Under reduced motion the rows land at once; the order still changes only once a move is done.",
  ],
};

/* ----------------------------------------------------------------- an expense policy (moodboard #34) */

const EXPENSE_FIELDS: RuleBuilderField[] = [
  {
    id: "status",
    label: "Expense status",
    type: "choice",
    options: [
      { value: "submitted", label: "Submitted" },
      { value: "approved", label: "Approved" },
      { value: "rejected", label: "Rejected" },
      { value: "paid", label: "Paid" },
    ],
  },
  {
    id: "seniority",
    label: "Seniority",
    type: "choice",
    options: [
      { value: "intern", label: "Intern" },
      { value: "designer", label: "Designer" },
      { value: "senior", label: "Senior designer" },
      { value: "manager", label: "Manager" },
      { value: "director", label: "Director" },
    ],
  },
  {
    id: "type",
    label: "Expense type",
    type: "choice",
    options: [
      { value: "food", label: "Food & drink" },
      { value: "travel", label: "Travel" },
      { value: "lodging", label: "Lodging" },
      { value: "software", label: "Software" },
      { value: "hardware", label: "Hardware" },
    ],
  },
  { id: "merchant", label: "Merchant", type: "text" },
  {
    id: "currency",
    label: "Currency",
    type: "choice",
    options: [
      { value: "usd", label: "USD" },
      { value: "eur", label: "EUR" },
      { value: "gbp", label: "GBP" },
      { value: "dkk", label: "DKK" },
    ],
  },
  { id: "amount", label: "Amount", type: "number" },
];

const POLICY: RuleBuilderGroup = {
  kind: "group",
  id: "policy",
  join: "and",
  children: [
    { kind: "condition", id: "trigger", field: "status", operator: "is", value: "submitted", locked: true },
    { kind: "condition", id: "seniority", field: "seniority", operator: "is", value: "manager" },
    {
      kind: "group",
      id: "spend",
      join: "or",
      children: [
        { kind: "condition", id: "type", field: "type", operator: "any-of", value: ["food", "travel"] },
        { kind: "condition", id: "merchant", field: "merchant", operator: "is", value: "Uber" },
        { kind: "condition", id: "currency", field: "currency", operator: "is", value: "usd" },
      ],
    },
  ],
};

/* The default operators' words, to read a rule back as a sentence. */
const OPERATOR_WORDS: Record<string, string> = {
  is: "is",
  "is-not": "is not",
  contains: "contains",
  "more-than": "is more than",
  "less-than": "is less than",
  "any-of": "is any of",
  "none-of": "is none of",
};

/** A rule as the sentence it says: "expense status is Submitted and seniority is Manager and (…)". */
function reads(node: RuleBuilderNode, fields: RuleBuilderField[], top = true): string {
  if (isGroup(node)) {
    const parts = node.children.map((child) => reads(child, fields, false)).filter(Boolean);
    const joined = parts.join(node.join === "and" ? " and " : ", or ");
    return top || parts.length < 2 ? joined : `(${joined})`;
  }
  const field = fields.find((f) => f.id === node.field);
  const name = (v: string) => (field?.type === "choice" ? (field.options.find((o) => o.value === v)?.label ?? v) : v);
  const v = node.value;
  const value = Array.isArray(v) ? v.map(name).join(" or ") : v === null ? "…" : name(String(v));
  return `${field?.label.toLowerCase() ?? node.field} ${OPERATOR_WORDS[node.operator] ?? node.operator} ${value}`;
}

function ExpensePolicyDemo() {
  const [rule, setRule] = useState(POLICY);
  return (
    <div className="grid w-full max-w-2xl gap-6">
      <RuleBuilder label="Expense approval" fields={EXPENSE_FIELDS} value={rule} onValueChange={setRule} />
      <p className="max-w-[60ch] text-small text-fg-subtle">Needs a manager's approval when {reads(rule, EXPENSE_FIELDS)}.</p>
    </div>
  );
}

/* ----------------------------------------------------------------- errors, flat, read only */

const DEPLOY_FIELDS: RuleBuilderField[] = [
  {
    id: "project",
    label: "Project",
    type: "choice",
    options: [
      { value: "halo", label: "Halo" },
      { value: "northwind", label: "Northwind" },
      { value: "atelier-nord", label: "Atelier Nord" },
      { value: "marlow", label: "Marlow Labs" },
    ],
  },
  { id: "branch", label: "Branch", type: "text" },
  {
    id: "status",
    label: "Build status",
    type: "choice",
    options: [
      { value: "ready", label: "Ready" },
      { value: "failed", label: "Failed" },
      { value: "canceled", label: "Canceled" },
    ],
  },
  { id: "minutes", label: "Build minutes", type: "number" },
];

const ALERT: RuleBuilderGroup = {
  kind: "group",
  id: "alert",
  join: "and",
  children: [
    { kind: "condition", id: "project", field: "project", operator: "any-of", value: ["halo", "northwind"] },
    { kind: "condition", id: "branch", field: "branch", operator: "is", value: "main" },
    { kind: "condition", id: "minutes", field: "minutes", operator: "more-than", value: null },
  ],
};

const ARCHIVED: RuleBuilderGroup = {
  kind: "group",
  id: "archived",
  join: "or",
  children: [
    { kind: "condition", id: "failed", field: "status", operator: "is", value: "failed" },
    { kind: "condition", id: "slow", field: "minutes", operator: "more-than", value: 12 },
  ],
};

function DeployAlertDemo() {
  const [rule, setRule] = useState(ALERT);
  /* A row with no value yet says so in words, and the edge clears as soon as there is one. */
  const errors: Record<string, string> = {};
  for (const c of rule.children) if (!isGroup(c) && (c.value === null || (Array.isArray(c.value) && !c.value.length))) errors[c.id] = "Enter a value, or remove the condition.";
  if ("minutes" in errors) errors.minutes = "Enter how many minutes a build may take.";
  return (
    <div className="grid w-full max-w-2xl gap-12">
      <RuleBuilder label="Deploy alert" lead="Alert the studio when" fields={DEPLOY_FIELDS} value={rule} onValueChange={setRule} maxDepth={0} errors={errors} />
      <RuleBuilder label="Archived deploy alert" lead="Archived, read only. It alerted the studio when" fields={DEPLOY_FIELDS} defaultValue={ARCHIVED} maxDepth={0} disabled />
    </div>
  );
}

/* ----------------------------------------------------------------- on a phone */

const LEAD_FIELDS: RuleBuilderField[] = [
  {
    id: "source",
    label: "Source",
    type: "choice",
    options: [
      { value: "framer", label: "Framer form" },
      { value: "referral", label: "Referral" },
      { value: "email", label: "Email" },
    ],
  },
  { id: "budget", label: "Budget", type: "number" },
  {
    id: "country",
    label: "Country",
    type: "choice",
    options: [
      { value: "dk", label: "Denmark" },
      { value: "se", label: "Sweden" },
      { value: "no", label: "Norway" },
      { value: "de", label: "Germany" },
    ],
  },
  { id: "company", label: "Company", type: "text" },
];

const LEADS: RuleBuilderGroup = {
  kind: "group",
  id: "leads",
  join: "and",
  children: [
    { kind: "condition", id: "source", field: "source", operator: "is", value: "framer" },
    { kind: "condition", id: "budget", field: "budget", operator: "more-than", value: 20000 },
    {
      kind: "group",
      id: "where",
      join: "or",
      children: [
        { kind: "condition", id: "country", field: "country", operator: "any-of", value: ["dk", "se"] },
        { kind: "condition", id: "company", field: "company", operator: "contains", value: "Studio" },
      ],
    },
  ],
};

/** The builder forced to the phone path, so a desktop can preview it. A real phone needs no wrapper. */
function PhoneDemo() {
  return (
    <DeviceProvider mode="phone">
      <div className="w-full max-w-sm">
        <RuleBuilder label="Northwind leads" fields={LEAD_FIELDS} defaultValue={LEADS} />
      </div>
    </DeviceProvider>
  );
}

/* ---------- the overview's tile ---------- */

const TILE_RULE: RuleBuilderGroup = {
  kind: "group",
  id: "tile",
  join: "and",
  children: [
    { kind: "condition", id: "seniority", field: "seniority", operator: "is", value: "manager" },
    {
      kind: "group",
      id: "spend",
      join: "or",
      children: [
        { kind: "condition", id: "merchant", field: "merchant", operator: "is", value: "Uber" },
        { kind: "condition", id: "currency", field: "currency", operator: "is", value: "usd" },
      ],
    },
  ],
};

function PolicyTile() {
  return (
    <div className="w-full max-w-md">
      <RuleBuilder label="Expense approval" fields={EXPENSE_FIELDS} defaultValue={TILE_RULE} />
    </div>
  );
}

export default function RuleBuilderPage() {
  return (
    <Page meta={meta} docs={docs} tile={<PolicyTile />}>
      <Stage
        title="An expense policy"
        tier="responsive"
        size="lg"
        align="start"
        code="ExpensePolicyDemo"
        caption="Take a row by its handle: it rises into a raised block at once and follows your hand one to one, and the rows it passes make room, each settling on the responsive spring. Let go and it settles into its place; only then does the rule change, once, so the sentence under it changes as the rows come to rest. The first row is the trigger: it is locked, never moves, and nothing passes above it. Rows stay in their own group. With the keys, Space picks a row up, the arrows move it and Space drops it."
      >
        <ExpensePolicyDemo />
      </Stage>

      <Stage
        title="Errors, a flat rule and read only"
        tier="instant"
        size="lg"
        align="start"
        code="DeployAlertDemo"
        caption="A problem is said in words under its row, and the row's edge turns to the danger color at once; type a number of minutes and both clear. A max depth of 0 makes a flat rule with no Add group. Read only lies flat: the handles stay still, remove is gone and nothing takes Tab."
      >
        <DeployAlertDemo />
      </Stage>

      <Stage
        title="On a phone"
        tier="responsive"
        size="lg"
        code="PhoneDemo"
        caption="Under a 480px row the value wraps under the field and the operator, so nothing scrolls sideways. A handle takes every direction of a touch, so a drag anywhere else scrolls the page, and on a finger every handle, remove and control is 44px."
      >
        <PhoneDemo />
      </Stage>

      <TryIt
        of="RuleBuilder"
        component={RuleBuilder}
        props={{ label: "Expense approval", fields: EXPENSE_FIELDS, defaultValue: POLICY, className: "w-full max-w-2xl" }}
        controls={["lead", { name: "maxDepth", type: "number", min: 0, max: 3 }, "disabled"]}
      />
    </Page>
  );
}
