/**
 * Form patterns (components.md, "Forms"): how the fields, groups and buttons make a page.
 * One left-aligned column, never centered (R9).
 *
 * - FormSection is a settings-page section: a title and one line of description on the left
 *   third from 1024 up, the fields on the rest, and one column below that. Sections are
 *   separated by a --line hairline and --space-12 of air.
 * - Fieldset groups related controls under one legend. Its legend and note look like the ones
 *   in CheckboxGroup and RadioGroup, so a group made of fields matches a group made of boxes. With
 *   rows it holds a settings list of switches, flush, with hairlines between the rows.
 * - ErrorSummary names every problem above the form and links to each field. It follows the
 *   GOV.UK error summary: a focusable panel named by its heading, and one link per error. It
 *   takes focus when a submit fails, which is what reads it out. It is not a live region: it
 *   updates as fields are fixed, and an alert would re-announce it on every keystroke.
 * - FormActions is the action row of a page form: submit first, then Cancel, both md (R9).
 *   They stack full width below 640, submit on top. align="fields" lines the row up with the
 *   fields column of a FormSection from 1024 up.
 * - Spacing: fields sit --space-6 (24) apart and groups --space-12 (48) apart. A Fieldset adds
 *   24 above and below itself, so in a column of fields it sits 48 from its neighbours.
 * - Optional fields are marked, not required ones: "(optional)" in --fg-subtle after the label.
 *   There are no asterisks.
 * - Motion: none of its own. The summary appears at once, because it answers a submit and a
 *   layout value must not ease. Field edges and link colors fade on the instant tier.
 * - Nothing here validates. The form decides what is wrong and passes the messages in.
 */
import { useEffect, useId, useRef, type ReactNode } from "react";
import { AlertIcon } from "@/components/icons";

/* ------------------------------------------------------------------ focus helpers */

/* What can take focus. A disabled control cannot, so it is left out. */
const FOCUSABLE =
  "input:not([type=hidden]):not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), [tabindex]:not([tabindex='-1'])";

/* Keep the focused control clear of a sticky header and the screen's edge. Scrolls only when it has to. */
const EDGE = 96;

function focusElement(el: HTMLElement) {
  el.focus({ preventScroll: true });
  const { top, bottom } = el.getBoundingClientRect();
  if (top < EDGE || bottom > window.innerHeight - EDGE) el.scrollIntoView({ block: "center", behavior: "instant" });
}

/* Focus the element with this id, or its first focusable child when the id sits on a wrapper such as a fieldset. */
function focusById(id: string) {
  const el = document.getElementById(id);
  const target = el?.matches(FOCUSABLE) ? el : el?.querySelector<HTMLElement>(FOCUSABLE);
  if (target) focusElement(target);
}

/**
 * Moves focus to the first control marked aria-invalid inside a form, and scrolls it into view when it is
 * out of sight. Use it for a form of three fields or fewer, which skips the ErrorSummary. Call it after the
 * errors have rendered, such as in an effect, so a screen reader reads the field with its error.
 *
 * @param form The form, or any element that holds the fields. It does nothing for null or when no field is invalid.
 */
export function focusFirstInvalid(form: HTMLElement | null) {
  const el = form?.querySelector<HTMLElement>('[aria-invalid="true"]');
  if (el) focusElement(el);
}

/* ------------------------------------------------------------------ small helpers */

/**
 * The "(optional)" mark for a field label, in the subtle color. Put it right after the label text:
 * `label={<>Company<Optional /></>}`. Mark the optional fields, never the required ones, and use no asterisks.
 */
export function Optional() {
  return <span className="text-fg-subtle">{" (optional)"}</span>;
}

/* ------------------------------------------------------------------ section */

/* The two columns of a settings page from 1024 up: the left third, then the rest. FormSection and FormActions share them, so a row can line up with the fields. */
const COLUMNS = "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]";

export type FormSectionProps = {
  /** The section's name, at the body size in the foreground color. */
  title: ReactNode;
  /** One line under the title, in the subtle color, that says what the section holds. */
  description?: ReactNode;
  /**
   * The title's heading level. 2 for a form that is the page; 3 or 4 when the form sits under a heading of its own,
   * such as a card's or a dialog's, so the page's outline stays in order. It looks the same at every level.
   */
  headingLevel?: 2 | 3 | 4;
  /** The section's fields. They sit 24px apart in one column. */
  children: ReactNode;
  /** Extra classes for the section. */
  className?: string;
};

/**
 * One section of a settings page. From 1024 up the title and description take the left third and the fields the
 * rest. Below that they stack in one column. Every section after the first starts with a hairline and 48px of air,
 * so put sections one after another in the same parent.
 */
export function FormSection({ title, description, headingLevel = 2, children, className = "" }: FormSectionProps) {
  const titleId = useId();
  const Heading = `h${headingLevel}` as const;
  return (
    <section
      aria-labelledby={titleId}
      className={
        "grid gap-x-12 gap-y-6 " +
        COLUMNS +
        " " +
        "not-first:mt-12 not-first:border-t not-first:border-line not-first:pt-12 " +
        className
      }
    >
      <div className="grid content-start gap-1">
        <Heading id={titleId} className="text-body font-title text-fg">
          {title}
        </Heading>
        {description && <p className="text-pretty text-small text-fg-subtle">{description}</p>}
      </div>
      <div className="grid min-w-0 content-start gap-6">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ fieldset */

export type FieldsetProps = {
  /** The group's name, shown above the controls and read out with each one. Required. */
  legend: ReactNode;
  /** One line under the legend, in the subtle color, that says what the group is for. It is linked to the fieldset with aria-describedby. */
  description?: ReactNode;
  /** A hint under the group. An error replaces it. */
  help?: ReactNode;
  /** Shown in danger color under the group and linked to the fieldset. Say how to fix it. Each control still shows its own error. */
  error?: ReactNode;
  /** Disables every control in the group, through the fieldset. */
  disabled?: boolean;
  /** Set it when the children are rows that carry their own padding, such as Switches with align="end". They sit flush as one list, with a hairline between them and at both ends, instead of 24px apart. */
  rows?: boolean;
  /** The controls. They sit 24px apart in one column, or flush as a list of rows when rows is set. */
  children: ReactNode;
  /** Extra classes for the fieldset. */
  className?: string;
};

/**
 * Related controls under one legend, such as an invoice address. The legend is small text in the foreground color, like a
 * field's label. In a column of fields the group adds 24px above and below itself, so groups sit 48px apart while fields
 * sit 24px apart. For a group of checkboxes or radios use CheckboxGroup or RadioGroup, which are fieldsets already. For a settings
 * list of switches, set rows: the switches sit flush, with a hairline between them.
 */
export function Fieldset({ legend, description, help, error, disabled, rows = false, children, className = "" }: FieldsetProps) {
  const id = useId();
  const note = error ?? help;
  const describedBy = [description ? `${id}-description` : undefined, note ? `${id}-note` : undefined].filter(Boolean).join(" ");
  return (
    <fieldset
      disabled={disabled}
      aria-describedby={describedBy || undefined}
      className={"my-6 min-w-0 border-0 p-0 first:mt-0 last:mb-0 " + className}
    >
      <legend className={"p-0 text-small font-title " + (description ? "mb-1 " : "mb-4 ") + (disabled ? "text-fg-disabled" : "text-fg")}>{legend}</legend>
      {description && (
        <p id={`${id}-description`} className={"mb-4 text-small " + (disabled ? "text-fg-disabled" : "text-fg-subtle")}>
          {description}
        </p>
      )}
      <div className={rows ? "grid divide-y divide-line border-y border-line" : "grid gap-6"}>{children}</div>
      {note && (
        <p id={`${id}-note`} className={"mt-2 text-small " + (error ? "text-danger" : "text-fg-subtle")}>
          {note}
        </p>
      )}
    </fieldset>
  );
}

/* ------------------------------------------------------------------ error summary */

export type FormError = {
  /** The id of the control to focus: the input, textarea or button. An id on a wrapper such as a fieldset works too, and its first control gets focus. */
  id: string;
  /** What is wrong and how to fix it, the same words the field shows under itself. It is the link's text. */
  message: ReactNode;
};

export type ErrorSummaryProps = {
  /** One entry per invalid field, in page order. The summary renders nothing when this is empty. */
  errors: FormError[];
  /** The panel's heading. The default counts the fields: "Fix 1 field to save" or "Fix 3 fields to save". */
  title?: ReactNode;
  /** Change this when a submit fails and the summary takes focus. A submit counter works. It only takes focus while errors exist. */
  focusKey?: string | number;
  /** Extra classes for the panel, such as a width. */
  className?: string;
};

const link =
  "rounded-control text-fg-muted underline decoration-line-strong underline-offset-4 " +
  "transition-colors duration-(--dur-instant) ease-litt hover:text-fg " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/**
 * Names every problem at the top of a form. It is a raised panel with an inset danger edge, an alert icon, a heading and one
 * link per error. A link moves focus to its field and scrolls it into view, and it never changes the URL, so it is safe in an
 * app that routes by hash. Pass the same list the fields use, so a fixed field leaves the summary as it leaves the form.
 * Forms of three fields or fewer skip it; use focusFirstInvalid instead.
 */
export function ErrorSummary({ errors, title, focusKey, className = "" }: ErrorSummaryProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const seen = useRef<string | number | undefined>(undefined);
  const count = errors.length;

  /* Focus once per focusKey, and only when there is something to read. The effect runs after the commit, so the panel exists. */
  useEffect(() => {
    if (focusKey === undefined || focusKey === seen.current) return;
    seen.current = focusKey;
    if (count) panel.current?.focus();
  }, [focusKey, count]);

  if (!count) return null;
  const heading = title ?? `Fix ${count} ${count === 1 ? "field" : "fields"} to save`;

  return (
    /* The panel takes focus (tabindex -1), and focus reads it out by its heading. No role="alert": the list changes as fields are fixed. */
    <div
      ref={panel}
      tabIndex={-1}
      role="region"
      aria-labelledby={titleId}
      className={
        "litt-raised p-4 shadow-[inset_0_0_0_1px_var(--danger),var(--highlight)] forced-colors:border " +
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
        className
      }
    >
      <div className="grid gap-3">
        <div className="flex items-start gap-2">
          {/* The wrapper takes the heading's line height, so the 16px icon centres on its first line. */}
          <span className="grid h-lh shrink-0 place-items-center text-body text-danger">
            <AlertIcon />
          </span>
          <h2 id={titleId} className="text-body font-title text-fg">
            {heading}
          </h2>
        </div>
        <ul role="list" aria-labelledby={titleId} className="m-0 grid list-none gap-2 p-0 pl-6">
          {errors.map((e) => (
            <li key={e.id} className="text-small">
              {/* The href names the field for a screen reader's link list. The click moves focus by hand, because the hash belongs to the router. */}
              <a
                href={`#${e.id}`}
                className={link}
                onClick={(ev) => {
                  ev.preventDefault();
                  focusById(e.id);
                }}
              >
                {e.message}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ actions */

export type FormActionsProps = {
  /** The buttons, submit first. Make the submit a primary Button and Cancel a ghost Button, both md. */
  children: ReactNode;
  /** "start" begins the row at the start of its container. "fields" lines it up with the fields column of a FormSection from 1024 up, and below 1024 it is the same plain row. */
  align?: "start" | "fields";
  /** Extra classes for the row. */
  className?: string;
};

/**
 * The action row of a page form. The submit comes first, then Cancel, 12px apart. Below 640 they stack full width with the submit
 * on top. On a settings page with FormSections, set align="fields" so Save lines up with the fields, not the section titles. Use it for a
 * page form; a dialog keeps its own order, bottom right with the primary last.
 */
export function FormActions({ children, align = "start", className = "" }: FormActionsProps) {
  const row = "flex gap-(--control-group-gap) max-sm:flex-col";
  if (align === "start") return <div className={row + " " + className}>{children}</div>;
  /* The same two columns and gap as FormSection, with the buttons in the second one. Below 1024 the wrapper is a plain block. */
  return (
    <div className={"lg:grid lg:gap-x-12 " + COLUMNS + " " + className}>
      <div className={row + " lg:col-start-2"}>{children}</div>
    </div>
  );
}
