/**
 * The gallery's search menu (search.tsx opens it): litt's Command menu over every component in the sidebar's groups,
 * then the site's own pages and a few of the Customize choices as actions. It loads the first time someone searches.
 *
 * - A page's row is its title, so it matches what people call a component; picking it opens the page by its hash.
 * - The actions say what they will do from where you are ("Turn fun mode on", "Dark theme"), so the list only offers
 *   a change, never the current state.
 */
import { CommandMenu, type CommandGroup, type CommandItem } from "@/components/command-menu";
import { MonitorIcon, MoonIcon, SparkleIcon, SunIcon } from "@/components/icons";
import { PAGE_GROUPS } from "./kit";
import { pages } from "./registry";
import { useCustomize, type ThemeChoice } from "./customize-state";
import { ACCENTS } from "./look";

type Action = { id: string; label: string; icon?: CommandItem["icon"]; run: () => void };

export default function SearchMenu({ open, onOpenChange, openedBy }: { open: boolean; onOpenChange: (open: boolean) => void; openedBy: "keyboard" | "pointer" }) {
  const { theme, setTheme, fun, setFun, accent, setAccent, modified, reset } = useCustomize();

  const themes: [ThemeChoice, string, CommandItem["icon"]][] = [
    ["light", "Light theme", <SunIcon />],
    ["dark", "Dark theme", <MoonIcon />],
    ["system", "System theme", <MonitorIcon />],
  ];
  const actions: Action[] = [
    { id: "do:fun", label: fun ? "Turn fun mode off" : "Turn fun mode on", icon: <SparkleIcon />, run: () => setFun(!fun) },
    ...themes.filter(([t]) => t !== theme).map(([t, label, icon]) => ({ id: `do:theme-${t}`, label, icon, run: () => setTheme(t) })),
    ...ACCENTS.filter((a) => a.id !== accent).map((a) => ({ id: `do:accent-${a.id}`, label: `${a.name} accent`, run: () => setAccent(a.id) })),
    ...(modified ? [{ id: "do:reset", label: "Reset to defaults", run: reset }] : []),
  ];

  const toItem = (p: (typeof pages)[number]): CommandItem => ({ id: p.id, label: p.title });
  /* Components first, since they are what people come to find; the site's own pages and the actions after them. */
  const groups: CommandGroup[] = [
    ...PAGE_GROUPS.map((g) => ({ id: g, heading: g, items: pages.filter((p) => p.group === g).map(toItem) })),
    { id: "site", heading: "Pages", items: pages.filter((p) => !p.group).map(toItem) },
    { id: "actions", heading: "Customize", items: actions.map(({ id, label, icon }) => ({ id, label, icon })) },
  ];

  const select = (item: CommandItem) => {
    const action = actions.find((a) => a.id === item.id);
    if (action) action.run();
    else location.hash = item.id;
  };

  return <CommandMenu open={open} onOpenChange={onOpenChange} groups={groups} onSelect={select} openedBy={openedBy} />;
}
