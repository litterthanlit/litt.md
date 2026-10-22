/**
 * Team: who is in the studio, what each person can do, and the invites still open. A block: a whole screen built from
 * the litt parts, to copy and make your own. Swap the sample members at the top for yours, and the handlers for your
 * requests; the table, the dialog and the words stay.
 *
 * A title with the head count, the seats as one meter, then a table: each person with their avatar, a role you can
 * change in place, an Invited tag on an open invite, when they were last active, and a menu of what else you can do.
 * Invite opens a dialog that takes several addresses at once. Removing someone is undone from the toast. Invite is the
 * one accent fill on the page, and Send invites the one in the dialog. Render it inside your app's shell (the dashboard
 * block's AppShell, for one), and mount the Toaster once near your root.
 */
import { useId, useState, type FormEvent } from "react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Meter } from "@/components/chart";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/dialog";
import { MoreIcon, PlusIcon } from "@/components/icons";
import { Menu, MenuItem, MenuSeparator } from "@/components/menu";
import { Segmented } from "@/components/segmented";
import { Select } from "@/components/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { Tag } from "@/components/tag";
import { toast } from "@/components/toast";
import { TokenInput } from "@/components/token-input";

/* ----------------------------------------------------------------- data */

type Role = "owner" | "admin" | "editor" | "viewer";
type Member = { id: string; name: string; email: string; role: Role; invited?: boolean; active: string };

/** The studio's people. Load yours. The owner's role is fixed, so it shows as words, not a picker. */
const MEMBERS: Member[] = [
  { id: "ines", name: "Ines Ortega", email: "ines@halo.studio", role: "owner", active: "Now" },
  { id: "rui", name: "Rui Santos", email: "rui@halo.studio", role: "admin", active: "2 h ago" },
  { id: "maya", name: "Maya Lind", email: "maya@halo.studio", role: "editor", active: "Yesterday" },
  { id: "tomas", name: "Tomás Vega", email: "tomas@northwind.co", role: "viewer", active: "6 days ago" },
  { id: "ada", name: "ada@marlowlabs.com", email: "ada@marlowlabs.com", role: "editor", invited: true, active: "Invited 2 days ago" },
];

const SEATS = 8;

const ROLES: { value: Exclude<Role, "owner">; label: string; can: string }[] = [
  { value: "admin", label: "Admin", can: "Admins manage people, billing and every project." },
  { value: "editor", label: "Editor", can: "Editors change pages and publish." },
  { value: "viewer", label: "Viewer", can: "Viewers open projects and leave comments." },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
/** "One person", "Four people": the number in words, and the noun that goes with it. */
const count = (n: number, one: string, many = `${one}s`) => `${WORDS[n] ?? n} ${n === 1 ? one : many}`;

/* ----------------------------------------------------------------- the invite dialog */

function InviteDialog({ seatsLeft, onInvite }: { seatsLeft: number; onInvite: (emails: string[], role: Role) => void }) {
  /* The footer's Send invites submits the form by its id, so the id is this dialog's own. */
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [role, setRole] = useState<Exclude<Role, "owner">>("editor");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!emails.length) return setError("Add at least one address.");
    if (emails.length > seatsLeft) return setError(`There ${seatsLeft === 1 ? "is one seat" : `are ${seatsLeft} seats`} left. Remove an address, or add seats first.`);
    onInvite(emails, role);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) {
          setEmails([]);
          setRole("editor");
          setError(null);
        }
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="primary" size="sm" icon={<PlusIcon />}>
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Invite people"
        description="Each one gets an email with a link that joins the studio."
        footer={
          <>
            <DialogClose asChild>
              <Button>Cancel</Button>
            </DialogClose>
            <Button variant="primary" type="submit" form={formId}>
              Send invites
            </Button>
          </>
        }
      >
        <form id={formId} noValidate onSubmit={submit} className="grid gap-6">
          <TokenInput
            label="Email addresses"
            hint="Press Enter or a comma after each address."
            placeholder="name@studio.com"
            value={emails}
            onValueChange={(next) => {
              setEmails(next);
              if (error) setError(null);
            }}
            validate={(v) => (EMAIL.test(v) ? true : `${v} is not a full address.`)}
            error={error}
          />
          <div className="grid gap-2">
            <Segmented legend="Role" showLegend block name={`${formId}-role`} value={role} onValueChange={setRole} options={ROLES} />
            <p className="text-small text-fg-subtle">{ROLES.find((r) => r.value === role)!.can}</p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------------------------------------------- the screen */

export function Team() {
  const [members, setMembers] = useState(MEMBERS);
  const people = members.filter((m) => !m.invited).length;
  const invites = members.length - people;

  const setRole = (id: string, role: Role) => setMembers((all) => all.map((m) => (m.id === id ? { ...m, role } : m)));

  const remove = (member: Member) => {
    const at = members.indexOf(member);
    setMembers((all) => all.filter((m) => m.id !== member.id));
    toast({
      title: member.invited ? `Invite to ${member.email} cancelled` : `${member.name} removed`,
      description: member.invited ? undefined : "They lose access to every project.",
      action: { label: "Undo", onClick: () => setMembers((all) => [...all.slice(0, at), member, ...all.slice(at)]) },
    });
  };

  const invite = (emails: string[], role: Role) => {
    const known = new Set(members.map((m) => m.email));
    const fresh = emails.filter((e) => !known.has(e));
    setMembers((all) => [...all, ...fresh.map((email) => ({ id: email, name: email, email, role, invited: true, active: "Invited just now" }))]);
    toast({ title: fresh.length === 1 ? `Invite sent to ${fresh[0]}` : `${count(fresh.length, "invite")} sent`, tone: "success" });
  };

  return (
    <div className="@container grid w-full grid-cols-1 gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-h1 text-fg">Team</h1>
          <p className="text-body text-fg-muted">
            {count(people, "person", "people")}
            {invites ? ` and ${count(invites, "open invite").toLowerCase()}` : ""}.
          </p>
        </div>
        <InviteDialog seatsLeft={SEATS - members.length} onInvite={invite} />
      </header>

      <Meter label="Seats" value={members.length} max={SEATS} valueText={`${members.length} of ${SEATS}`} steps={SEATS} className="max-w-sm" />

      <Table label="Team members">
        <TableHeader>
          <TableRow>
            <TableHead>Person</TableHead>
            <TableHead>Role</TableHead>
            <TableHead numeric>Last active</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => (
            <TableRow key={m.id}>
              <TableCell primary>
                <span className="flex items-center gap-3">
                  <Avatar name={m.name} size="sm" decorative />
                  <span className="grid min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate">{m.invited ? m.email : m.name}</span>
                      {m.invited && <Tag status="neutral">Invited</Tag>}
                    </span>
                    {!m.invited && <span className="truncate text-small text-fg-subtle">{m.email}</span>}
                  </span>
                </span>
              </TableCell>
              <TableCell>
                {m.role === "owner" ? (
                  <span className="text-small text-fg-muted">Owner</span>
                ) : (
                  <div className="w-32">
                    <Select size="sm" aria-label={`Role for ${m.name}`} value={m.role} onValueChange={(v) => setRole(m.id, v as Role)} options={ROLES} />
                  </div>
                )}
              </TableCell>
              <TableCell numeric>{m.active}</TableCell>
              <TableCell numeric>
                {m.role !== "owner" && (
                  <Menu
                    align="end"
                    label={`Actions for ${m.name}`}
                    trigger={
                      <Button iconOnly variant="ghost" size="sm" aria-label={`Actions for ${m.name}`}>
                        <MoreIcon />
                      </Button>
                    }
                  >
                    {m.invited && (
                      <>
                        <MenuItem onSelect={() => toast({ title: `Invite sent again to ${m.email}` })}>Resend invite</MenuItem>
                        <MenuSeparator />
                      </>
                    )}
                    <MenuItem destructive onSelect={() => remove(m)}>
                      {m.invited ? "Cancel invite" : "Remove from team"}
                    </MenuItem>
                  </Menu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
