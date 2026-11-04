/**
 * The Build page's screens: six of the gallery's blocks, each drawn as its own block page draws it, so the page shows
 * the screens people build most (forms, data, a store, sign-in, an agent, a list; proposals/builder.md, decision 5).
 * An app's screen sits in litt's own App shell, as a real app would put it; Sign in and a store page are not app
 * screens, so they stand alone. Every screen is wrapped in [data-screen], which test:build-page reads.
 */
import type { ReactNode } from "react";
import { AgentChat } from "@/blocks/agent";
import { Dashboard } from "@/blocks/dashboard";
import { ProductPage } from "@/blocks/product";
import { Projects } from "@/blocks/projects";
import { Settings } from "@/blocks/settings";
import { SignIn } from "@/blocks/sign-in";
import { AppShell, SidebarLink, SidebarNav } from "@/components/app-shell";
import { Toaster } from "@/components/toast";

export type ScreenId = "settings" | "dashboard" | "product" | "sign-in" | "agent" | "projects";
/**
 * How a screen sits in the frame: inside litt's App shell, in a shell of its own (the Dashboard brings one), padded
 * like a page, or edge to edge (a screen that brings its own room).
 */
type Seat = "shell" | "own-shell" | "padded" | "bare";
export type BuildScreen = { id: ScreenId; name: string; exportName: string; seat: Seat; render: () => ReactNode };

export const SCREENS: readonly BuildScreen[] = [
  { id: "settings", name: "Settings", exportName: "Settings", seat: "shell", render: () => <Toaster><Settings /></Toaster> },
  { id: "dashboard", name: "Dashboard", exportName: "Dashboard", seat: "own-shell", render: () => <Dashboard label="Studio" viewportHeight="44rem" /> },
  { id: "product", name: "Product", exportName: "ProductPage", seat: "padded", render: () => <Toaster><ProductPage /></Toaster> },
  { id: "sign-in", name: "Sign in", exportName: "SignIn", seat: "bare", render: () => <SignIn /> },
  { id: "agent", name: "Agent", exportName: "AgentChat", seat: "shell", render: () => <AgentChat finished /> },
  { id: "projects", name: "Projects", exportName: "Projects", seat: "shell", render: () => <Projects /> },
];

export const screenOf = (id: string): BuildScreen => SCREENS.find((s) => s.id === id) ?? SCREENS[0];

/** The app the shelled screens belong to. Its links go nowhere in the gallery (the frame keeps them put). */
const NAV: { id: ScreenId; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "projects", label: "Projects" },
  { id: "agent", label: "Agent" },
  { id: "settings", label: "Settings" },
];

function ScreenShell({ current, children }: { current: ScreenId; children: ReactNode }) {
  return (
    <AppShell
      viewportHeight="44rem"
      wordmark={<a href="/">Studio</a>}
      nav={
        <SidebarNav label="Studio navigation">
          {NAV.map((l) => (
            <SidebarLink key={l.id} href={`/${l.id}`} current={l.id === current}>
              {l.label}
            </SidebarLink>
          ))}
        </SidebarNav>
      }
    >
      {children}
    </AppShell>
  );
}

/** A screen as the frame shows it, in its seat. `phone` narrows the padding, as AppFrame does on a phone. */
export function screenView(screen: BuildScreen, phone: boolean): ReactNode {
  const block = screen.render();
  const gutter = phone ? "[--gutter:var(--space-4)]" : "[--gutter:var(--space-8)]";
  const seated =
    screen.seat === "shell" ? <ScreenShell current={screen.id}>{block}</ScreenShell>
    : screen.seat === "padded" ? <div className={phone ? "p-4" : "p-8"}>{block}</div>
    : block;
  return (
    <div data-screen={screen.id} className={gutter}>
      {seated}
    </div>
  );
}
