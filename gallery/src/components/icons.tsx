/** Icons: 16px, 1.5px stroke, currentColor (litt.md components.md). Decorative unless labelled. */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 16, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      {children}
    </svg>
  );
}

export const SearchIcon = (p: IconProps) => <Icon {...p}><circle cx="7" cy="7" r="4.75" /><path d="m10.5 10.5 3 3" /></Icon>;
export const CheckIcon = (p: IconProps) => <Icon {...p}><path d="m3.5 8.5 3 3 6-7" /></Icon>;
export const ChevronRightIcon = (p: IconProps) => <Icon {...p}><path d="m6 3.5 4.5 4.5L6 12.5" /></Icon>;
export const ChevronDownIcon = (p: IconProps) => <Icon {...p}><path d="m3.5 6 4.5 4.5L12.5 6" /></Icon>;
export const ChevronLeftIcon = (p: IconProps) => <Icon {...p}><path d="M10 3.5 5.5 8l4.5 4.5" /></Icon>;
export const XIcon = (p: IconProps) => <Icon {...p}><path d="m4 4 8 8M12 4l-8 8" /></Icon>;
export const PlusIcon = (p: IconProps) => <Icon {...p}><path d="M8 3v10M3 8h10" /></Icon>;
export const MinusIcon = (p: IconProps) => <Icon {...p}><path d="M3 8h10" /></Icon>;
export const CopyIcon = (p: IconProps) => <Icon {...p}><rect x="5.25" y="5.25" width="7.5" height="7.5" /><path d="M3.25 10.25V3.25h7" /></Icon>;
export const ArrowUpRightIcon = (p: IconProps) => <Icon {...p}><path d="M5 11 11 5M6 5h5v5" /></Icon>;
export const MoreIcon = (p: IconProps) => <Icon {...p}><circle cx="3.5" cy="8" r=".75" /><circle cx="8" cy="8" r=".75" /><circle cx="12.5" cy="8" r=".75" /></Icon>;
export const SettingsIcon = (p: IconProps) => <Icon {...p}><circle cx="8" cy="8" r="2" /><path d="M8 1.75v2M8 12.25v2M1.75 8h2M12.25 8h2M3.6 3.6 5 5M11 11l1.4 1.4M3.6 12.4 5 11M11 5l1.4-1.4" /></Icon>;
export const UserIcon = (p: IconProps) => <Icon {...p}><circle cx="8" cy="5.5" r="2.75" /><path d="M2.75 13.75c.8-2.4 2.9-3.75 5.25-3.75s4.45 1.35 5.25 3.75" /></Icon>;
export const TrashIcon = (p: IconProps) => <Icon {...p}><path d="M2.75 4.25h10.5M6.25 4.25V2.75h3.5v1.5M4.25 4.25l.6 9h6.3l.6-9" /></Icon>;
export const ArchiveIcon = (p: IconProps) => <Icon {...p}><rect x="2.25" y="2.75" width="11.5" height="3" /><path d="M3.25 5.75v7.5h9.5v-7.5M6.5 8.5h3" /></Icon>;
export const ShareIcon = (p: IconProps) => <Icon {...p}><path d="M8 10V2.5M5 5.25 8 2.25l3 3M3.25 8.5v5h9.5v-5" /></Icon>;
export const FileIcon = (p: IconProps) => <Icon {...p}><path d="M4 1.75h5l3 3v9.5H4z" /><path d="M9 1.75v3h3" /></Icon>;
export const FolderIcon = (p: IconProps) => <Icon {...p}><path d="M1.75 3.25h4.5l1.5 1.5h6.5v8H1.75z" /></Icon>;
export const BellIcon = (p: IconProps) => <Icon {...p}><path d="M4 11.25V7a4 4 0 0 1 8 0v4.25l1 1H3zM6.5 13.75h3" /></Icon>;
export const InfoIcon = (p: IconProps) => <Icon {...p}><circle cx="8" cy="8" r="6.25" /><path d="M8 7.25v4M8 4.75v.01" /></Icon>;
export const SunIcon = (p: IconProps) => <Icon {...p}><circle cx="8" cy="8" r="2.75" /><path d="M8 1.75v1.5M8 12.75v1.5M1.75 8h1.5M12.75 8h1.5M3.6 3.6l1 1M11.4 11.4l1 1M3.6 12.4l1-1M11.4 4.6l1-1" /></Icon>;
export const MoonIcon = (p: IconProps) => <Icon {...p}><path d="M13.25 9.4A5.5 5.5 0 0 1 6.6 2.75 5.5 5.5 0 1 0 13.25 9.4z" /></Icon>;
export const MonitorIcon = (p: IconProps) => <Icon {...p}><rect x="1.75" y="2.75" width="12.5" height="8.5" /><path d="M8 11.25v2.5M5.5 13.75h5" /></Icon>;
export const SlidersIcon = (p: IconProps) => <Icon {...p}><path d="M2.5 4.5h7M12.5 4.5h1M2.5 11.5h1M6.5 11.5h7" /><circle cx="11" cy="4.5" r="1.5" /><circle cx="5" cy="11.5" r="1.5" /></Icon>;
export const AlertIcon = (p: IconProps) => <Icon {...p}><circle cx="8" cy="8" r="6.25" /><path d="M8 4.75v4M8 11.25v.01" /></Icon>;
export const MenuIcon = (p: IconProps) => <Icon {...p}><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" /></Icon>;
export const CalendarIcon = (p: IconProps) => <Icon {...p}><rect x="2.25" y="3.25" width="11.5" height="10.5" /><path d="M2.25 6.75h11.5M5.5 1.75v3M10.5 1.75v3" /></Icon>;
export const ArrowUpIcon = (p: IconProps) => <Icon {...p}><path d="M8 13V3M3.75 7.25 8 3l4.25 4.25" /></Icon>;
export const ArrowDownIcon = (p: IconProps) => <Icon {...p}><path d="M8 3v10M3.75 8.75 8 13l4.25-4.25" /></Icon>;
export const StopIcon = (p: IconProps) => <Icon {...p}><rect x="4.25" y="4.25" width="7.5" height="7.5" rx="1" fill="currentColor" /></Icon>;
export const PaperclipIcon = (p: IconProps) => <Icon {...p}><path d="m13 7.25-5.3 5.3a3.25 3.25 0 0 1-4.6-4.6l5.65-5.65a2.1 2.1 0 0 1 3 3L6.1 10.95a1 1 0 0 1-1.4-1.4l5.05-5.05" /></Icon>;
export const RetryIcon = (p: IconProps) => <Icon {...p}><path d="M13.25 8a5.25 5.25 0 1 1-1.55-3.7M13.25 2.75v3h-3" /></Icon>;
export const ImageIcon = (p: IconProps) => <Icon {...p}><rect x="2.25" y="2.75" width="11.5" height="10.5" /><circle cx="5.75" cy="6.25" r="1.25" /><path d="m2.25 11.75 3.5-3.5 2.75 2.75 1.75-1.75 3.5 3.5" /></Icon>;

/** Where a step, a tool call or a task stands. The Timeline draws the same five marks. */
export type StepStatus = "pending" | "running" | "done" | "failed" | "skipped";

/**
 * The status mark for steps and tool calls: an empty circle (pending), a half-filled circle (running,
 * never spinning or pulsing), a check in a circle (done), an x in a circle (failed) and a dashed circle
 * (skipped). It takes the text color, so the caller sets the tone (--fg for running, --fg-muted for done,
 * --danger for failed, --fg-subtle for pending and skipped). Decorative: say the status in words beside it.
 */
export function StatusIcon({ status, ...p }: IconProps & { status: StepStatus }) {
  const skipped = status === "skipped";
  return (
    <Icon {...p}>
      <circle cx="8" cy="8" r="6.25" strokeDasharray={skipped ? "2.45" : undefined} strokeLinecap={skipped ? "butt" : undefined} />
      {status === "done" && <path d="m5.25 8.25 2 2 3.5-4.25" />}
      {status === "running" && <path d="M8 1.75a6.25 6.25 0 0 1 0 12.5z" fill="currentColor" />}
      {status === "failed" && <path d="m6 6 4 4m0-4-4 4" />}
    </Icon>
  );
}
