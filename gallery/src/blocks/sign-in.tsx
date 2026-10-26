/**
 * Sign in: the page someone meets before the app. A block: a whole screen built from the litt parts, to copy and make
 * your own. Swap `signIn` for your auth call and the links for your routes; the layout and the words stay.
 *
 * The wordmark at the top, then one left-aligned column: a title in two inks, email and password, Sign in, and a
 * second way in under a hairline. From 1024 up a quiet column beside it says what is new. Every state is designed: an
 * empty or wrong field says so under itself and takes focus, an answer from the server shows in a callout above the
 * fields, and Sign in shows its loading state while it waits. Sign in is the one accent fill.
 */
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/button";
import { Callout } from "@/components/callout";
import { focusFirstInvalid } from "@/components/form";
import { TextField } from "@/components/input";

/* ----------------------------------------------------------------- data */

const PRODUCT = "litt.design";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The links on the page. Point them at your own routes. */
const LINKS = { home: "/", forgot: "/forgot-password", request: "/request-access", terms: "/terms", privacy: "/privacy" };

/** What is new, beside the form on a wide screen. Three short lines, newest first. */
const NEWS = [
  { version: "v3.2", text: "Preview links for every branch, shared with one click." },
  { version: "v3.1", text: "Build times by site, on the usage page." },
  { version: "v3.0", text: "A studio dashboard, rebuilt from the ground up." },
];

type Fields = { email: string; password: string };
type Errors = Partial<Record<keyof Fields, string>>;

function check(v: Fields): Errors {
  return {
    email: !v.email.trim() ? "Enter your email." : EMAIL.test(v.email.trim()) ? undefined : "Use a full address, like ines@halo.studio.",
    password: v.password ? undefined : "Enter your password.",
  };
}

/**
 * Stands in for your auth call: it waits a moment, then answers. Here a password under eight characters is the wrong
 * one, so the page can show what a refusal looks like. Return your server's message the same way.
 */
function signIn(fields: Fields): Promise<{ ok: true } | { ok: false; message: string }> {
  return new Promise((resolve) =>
    window.setTimeout(
      () => resolve(fields.password.length >= 8 ? { ok: true } : { ok: false, message: "That email and password do not match. Try again, or reset your password." }),
      1000,
    ),
  );
}

/* ----------------------------------------------------------------- the screen */

const link =
  "rounded-control text-small text-accent-text underline-offset-4 transition-colors duration-(--dur-instant) ease-litt hover:underline " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
/* A link inside a sentence is underlined, so it never depends on color alone to read as a link. */
const inlineLink =
  "rounded-control text-fg underline decoration-line-strong underline-offset-4 transition-colors duration-(--dur-instant) ease-litt hover:decoration-fg " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
const quietLink =
  "rounded-control text-small text-fg-subtle transition-colors duration-(--dur-instant) ease-litt hover:text-fg " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function SignIn() {
  const form = useRef<HTMLFormElement>(null);
  const newsId = useId();
  const [fields, setFields] = useState<Fields>({ email: "", password: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [failed, setFailed] = useState(0);
  const [refused, setRefused] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const alive = useRef(true);

  useEffect(() => () => void (alive.current = false), []);
  /* Two fields are too few for a summary. Once the errors have rendered, focus the first invalid field. */
  useEffect(() => {
    if (failed) focusFirstInvalid(form.current);
  }, [failed]);

  const change = (key: keyof Fields, value: string) => {
    const next = { ...fields, [key]: value };
    setFields(next);
    if (errors[key]) setErrors({ ...errors, [key]: check(next)[key] });
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setRefused(null);
    const found = check(fields);
    setErrors(found);
    if (found.email || found.password) return setFailed((n) => n + 1);
    setBusy(true);
    const answer = await signIn(fields);
    if (!alive.current) return;
    setBusy(false);
    if (answer.ok) setSignedIn(true);
    else setRefused(answer.message);
  };

  return (
    <div className="grid min-h-full w-full grid-rows-[auto_1fr_auto] gap-12 px-6 py-8 @container sm:px-12">
      <header>
        <a href={LINKS.home} className="rounded-control text-body font-title text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
          {PRODUCT}
        </a>
      </header>

      <main className="grid w-full max-w-5xl content-center gap-16 @min-[56rem]:grid-cols-[minmax(0,25rem)_minmax(0,1fr)] @min-[56rem]:gap-24">
        <div className="grid w-full max-w-100 content-start gap-8">
          {/* The title and its line as one sentence in two inks; the h1 stays the name alone. */}
          <div className="flex flex-wrap items-baseline gap-x-2 text-h1 text-balance">
            <h1 className="text-fg">Sign in</h1>
            <p className="font-normal text-fg-muted">to the studio, and pick up where you left off.</p>
          </div>

          {signedIn ? (
            <Callout live tone="success" title="Signed in" description="A real page would open the dashboard now." />
          ) : (
            <form ref={form} noValidate aria-label="Sign in" onSubmit={submit} className="grid gap-6">
              {refused && <Callout live tone="danger" title="Could not sign in" description={refused} />}
              <TextField
                label="Email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={fields.email}
                error={errors.email}
                onChange={(e) => change("email", e.target.value)}
              />
              <div className="grid gap-2">
                <TextField
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  value={fields.password}
                  error={errors.password}
                  onChange={(e) => change("password", e.target.value)}
                />
                <a href={LINKS.forgot} className={"justify-self-start " + link}>
                  Forgot your password?
                </a>
              </div>
              <Button type="submit" variant="primary" block loading={busy}>
                Sign in
              </Button>
              <div className="flex items-center gap-4" aria-hidden="true">
                <span className="h-px flex-1 bg-line" />
                <span className="text-caption text-fg-subtle">or</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <Button variant="secondary" block disabled={busy}>
                Continue with GitHub
              </Button>
              <p className="text-small text-fg-subtle">
                New to {PRODUCT}?{" "}
                <a href={LINKS.request} className={inlineLink}>
                  Request access
                </a>
              </p>
            </form>
          )}
        </div>

        {/* What is new: quiet, beside the form from 1024 up and gone below, so a phone sees only the form. */}
        <section aria-labelledby={newsId} className="hidden content-start gap-6 border-l border-line pl-12 @min-[56rem]:grid">
          <h2 id={newsId} className="text-body font-title text-fg">
            What is new
          </h2>
          <ul className="grid gap-4">
            {NEWS.map((n) => (
              <li key={n.version} className="flex items-baseline gap-3">
                <span className="w-10 shrink-0 text-caption tabular-nums font-normal text-fg-subtle">{n.version}</span>
                <span className="text-small text-fg-muted">{n.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="flex flex-wrap gap-x-6 gap-y-2">
        <a href={LINKS.terms} className={quietLink}>
          Terms
        </a>
        <a href={LINKS.privacy} className={quietLink}>
          Privacy
        </a>
      </footer>
    </div>
  );
}
