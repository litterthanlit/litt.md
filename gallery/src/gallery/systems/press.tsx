/** Press's scenes (scene.ts): product UI, settings and dashboards, on plates, trays and cuts lit from above. */
import { useState, type ReactNode } from "react";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { CardPicker } from "@/components/card-picker";
import { Pagination } from "@/components/pagination";
import { Progress } from "@/components/progress";
import { Segmented } from "@/components/segmented";
import { Select } from "@/components/select";
import { Slider } from "@/components/slider";
import { Switch } from "@/components/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { Tag, type TagProps } from "@/components/tag";
import { TokenInput } from "@/components/token-input";
import type { Scene, SystemScenes } from "./scene";

/** A plate: the raised surface a scene sits on, padded for a stack of parts. */
function Plate({ children }: { children: ReactNode }) {
  return (
    <Card as="div">
      <div className="grid gap-6">{children}</div>
    </Card>
  );
}

/* ------------------------------------------------------------------ A deploy */

function Deploy() {
  const [state, setState] = useState<"building" | "cancelled">("building");
  const [logs, setLogs] = useState(false);
  const cancelled = state === "cancelled";
  return (
    <Plate>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <h3 className="text-body font-title text-fg">harbor-web</h3>
          <p className="text-small text-fg-subtle">main · 4f9c2e1 · Add pricing page</p>
        </div>
        {cancelled ? <Tag status="neutral">Cancelled</Tag> : <Tag hue="blue">Building</Tag>}
      </div>
      <Progress
        label="Build progress"
        value={cancelled ? 41 : 68}
        valueText={cancelled ? "41% when stopped" : "68%"}
        status={cancelled ? "failed" : "active"}
        message={cancelled ? "Stopped by Mara at 14:07." : "Optimising 212 of 312 files."}
      />
      <dl className="m-0 grid grid-cols-3 gap-2 rounded-control bg-tray p-3 shadow-(--tray-shade)">
        {[
          ["Duration", "1m 42s"],
          ["Files", "312"],
          ["Region", "fra1"],
        ].map(([k, v]) => (
          <div key={k} className="grid min-w-0 gap-1">
            <dt className="text-caption text-fg-subtle">{k}</dt>
            <dd className="m-0 text-body font-label tabular-nums text-fg">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" disabled={cancelled} onClick={() => setState("cancelled")}>
          Cancel
        </Button>
        <Button variant="secondary" aria-pressed={logs} onClick={() => setLogs((v) => !v)}>
          {logs ? "Hide logs" : "Logs"}
        </Button>
      </div>
      {logs ? (
        <pre className="overflow-x-auto rounded-control bg-tray p-3 text-caption text-fg shadow-(--tray-shade)">
          {cancelled
            ? "14:05:12  Compiled 212 files\n14:07:01  Cancelled by Mara"
            : "14:05:12  Compiled 212 files\n14:06:40  Optimising images\n14:06:54  Uploading to fra1"}
        </pre>
      ) : null}
    </Plate>
  );
}

/* ------------------------------------------------------------------ Notifications */

const WHEN = [
  { value: "now", label: "Instantly" },
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
];

function Notifications() {
  const [when, setWhen] = useState("hourly");
  return (
    <Plate>
      <div className="grid gap-1">
        <h3 className="text-body font-title text-fg">Notifications</h3>
        <p className="text-small text-fg-subtle">Choose what harbor-web tells you about.</p>
      </div>
      <div className="grid gap-4">
        <Switch label="Deploy finished" description="A note when a production deploy goes live." defaultChecked />
        <Switch label="Failed builds" description="An email the moment a build fails, with the log." defaultChecked />
        <Switch label="Weekly digest" description="Monday's summary of deploys, errors and bandwidth." />
      </div>
      <Segmented legend="How often" options={WHEN} value={when} onValueChange={setWhen} block />
    </Plate>
  );
}

/* ------------------------------------------------------------------ Plan */

const PLANS = [
  { value: "hobby", label: "Hobby", description: "1 project", price: 0, seat: 0 },
  { value: "pro", label: "Pro", description: "Unlimited projects", price: 20, seat: 12 },
  { value: "team", label: "Team", description: "SSO, audit log", price: 49, seat: 24 },
];

function Plan() {
  const [plan, setPlan] = useState("pro");
  const [seats, setSeats] = useState(5);
  const p = PLANS.find((x) => x.value === plan) ?? PLANS[1];
  const total = p.price + p.seat * seats;
  return (
    <Plate>
      <CardPicker
        legend="Plan"
        size="sm"
        value={plan}
        onValueChange={setPlan}
        options={PLANS.map(({ value, label, description, price }) => ({ value, label, description, detail: `$${price} / mo` }))}
      />
      <Slider
        label="Seats"
        min={1}
        max={25}
        value={seats}
        onValueChange={setSeats}
        disabled={plan === "hobby"}
        help={plan === "hobby" ? "Hobby is for one person." : `$${p.seat} a seat, per month.`}
      />
      <div className="flex items-baseline justify-between gap-3 rounded-control bg-tray px-4 py-3 shadow-(--tray-shade)">
        <span className="text-small text-fg-subtle">Monthly total</span>
        <span className="text-body font-title tabular-nums text-fg" aria-live="polite">
          ${plan === "hobby" ? 0 : total}
        </span>
      </div>
    </Plate>
  );
}

/* ------------------------------------------------------------------ Invite */

const ROLES = [
  { value: "viewer", label: "Viewer" },
  { value: "developer", label: "Developer" },
  { value: "admin", label: "Admin" },
];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FREE = 4;

function Invite() {
  const [people, setPeople] = useState(["ines@harbor.dev", "tomas@harbor.dev"]);
  const [role, setRole] = useState("developer");
  const [sent, setSent] = useState(false);
  const left = FREE - people.length;
  return (
    <Plate>
      <div className="grid gap-1">
        <h3 className="text-body font-title text-fg">Invite people</h3>
        <p className="text-small text-fg-subtle">They get an email with a link to join harbor.</p>
      </div>
      <TokenInput
        label="Emails"
        hint="Press Enter or a comma after each address."
        placeholder="name@company.com"
        value={people}
        onValueChange={(v) => {
          setPeople(v);
          setSent(false);
        }}
        max={FREE}
        validate={(v) => EMAIL.test(v) || `${v} is not a full address. Use name@company.com.`}
      />
      <div className="grid gap-2">
        <span id="invite-role" className="text-small font-label text-fg">
          Role
        </span>
        <Select aria-labelledby="invite-role" options={ROLES} value={role} onValueChange={setRole} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-fg-subtle" aria-live="polite">
          {sent ? "Invites sent." : left <= 0 ? "No seats left on Pro." : left === 1 ? "One seat left on Pro." : `${left} seats left on Pro.`}
        </p>
        <Button variant="secondary" disabled={people.length === 0} onClick={() => setSent(true)}>
          Send invites
        </Button>
      </div>
    </Plate>
  );
}

/* ------------------------------------------------------------------ Recent deploys */

type Row = { project: string; status: "Ready" | "Building" | "Failed" | "Queued"; time: string };
const DEPLOYS: Row[] = [
  { project: "harbor-web", status: "Building", time: "Just now" },
  { project: "harbor-api", status: "Ready", time: "12 min ago" },
  { project: "docs", status: "Ready", time: "41 min ago" },
  { project: "harbor-web", status: "Failed", time: "2 h ago" },
  { project: "status-page", status: "Ready", time: "3 h ago" },
  { project: "harbor-api", status: "Ready", time: "Yesterday" },
  { project: "docs", status: "Queued", time: "Yesterday" },
  { project: "marketing", status: "Ready", time: "Mon" },
  { project: "harbor-web", status: "Ready", time: "Mon" },
  { project: "status-page", status: "Failed", time: "Sun" },
];
const TAG: Record<Row["status"], Pick<TagProps, "status" | "hue">> = {
  Ready: { status: "success" },
  Building: { hue: "blue" },
  Failed: { status: "danger" },
  Queued: { status: "neutral" },
};

function Recent() {
  const [page, setPage] = useState(1);
  const rows = DEPLOYS.slice((page - 1) * 5, page * 5);
  return (
    <Plate>
      <h3 className="text-body font-title text-fg">Recent deploys</h3>
      <div className="grid gap-4">
        <Table label="Recent deploys">
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead numeric>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={`${page}-${i}`}>
                <TableCell primary>{r.project}</TableCell>
                <TableCell>
                  <Tag {...TAG[r.status]}>{r.status}</Tag>
                </TableCell>
                <TableCell numeric>{r.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination label="Recent deploys pages" page={page} pageSize={5} total={DEPLOYS.length} onPageChange={setPage} />
      </div>
    </Plate>
  );
}

const scenes: Scene[] = [
  { id: "a-deploy", title: "A deploy", line: "A build in flight on one plate: status, progress, figures and two quiet buttons.", Render: Deploy },
  { id: "notifications", title: "Notifications", line: "Switches that click in place, each with its one-line reason, over a segmented cut.", Render: Notifications },
  { id: "plan", title: "Plan", line: "Three blocks to pick from and a slider whose total follows it.", Render: Plan },
  { id: "invite", title: "Invite", line: "A tray of address tokens, a role to choose and the seats left said in words.", Render: Invite },
  { id: "recent-deploys", title: "Recent deploys", line: "A compact table of status tags, paged by a tray of numbered blocks.", Render: Recent },
];

export const press: SystemScenes = { scenes, cover: "a-deploy" };
