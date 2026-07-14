import { Link } from "react-router-dom";
import { useQuery } from "@/lib/query";
import {
  computeGlobalStats,
  listAudit,
  listDocuments,
  listEmployees,
} from "@/lib/hr/api";
import { expiryStatus, daysUntil, formatDate, relativeTime } from "@/lib/hr/utils";
import { ExpiryBadge, CategoryIcon } from "@/components/hr/badges";
import { EmployeeAvatar } from "@/components/hr/EmployeeAvatar";
import { EmptyState, TableSkeleton } from "@/components/hr/EmptyState";
import { useRole } from "@/lib/hr/role-context";
import { Users, CalendarClock, PenLine, AlertTriangle, Upload, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { UploadDialog } from "@/components/hr/UploadDialog";

export function DashboardPage() {
  const { role, user } = useRole();
  const { data: docs = [], isLoading } = useQuery({ queryKey: ["documents"], queryFn: () => listDocuments() });
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: () => listEmployees() });
  const { data: audit = [] } = useQuery({ queryKey: ["audit"], queryFn: () => listAudit() });
  const [uploadOpen, setUploadOpen] = useState(false);

  const stats = computeGlobalStats();
  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));

  // For employee role: scope everything to their own docs
  const scopedDocs = role === "employee"
    ? docs.filter((d) => d.employeeId === user.employeeId)
    : docs;

  const expiringSoon = scopedDocs
    .filter((d) => expiryStatus(d.expiresAt) === "expiring" || expiryStatus(d.expiresAt) === "expired")
    .sort((a, b) => (daysUntil(a.expiresAt) ?? 0) - (daysUntil(b.expiresAt) ?? 0))
    .slice(0, 8);

  const recentActivity = audit
    .filter((a) => role !== "employee" || a.employeeId === user.employeeId)
    .slice(0, 8);

  const isEmployee = role === "employee";
  const isAdmin = role === "admin";

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEmployee ? "My Documents" : "Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEmployee
              ? `Welcome, ${user.name}. Review, download, and sign your documents.`
              : `Welcome back, ${user.name}. Here's the state of the document repository.`}
          </p>
        </div>
        {(isAdmin || role === "manager") && (
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="mr-1.5 size-4" /> Quick upload
          </Button>
        )}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Employees" value={isEmployee ? "—" : stats.activeEmployees} icon={Users} sub={isEmployee ? "N/A" : "Active headcount"} />
        <StatCard
          label="Expiring in 30 Days"
          value={isEmployee ? scopedDocs.filter((d) => expiryStatus(d.expiresAt) === "expiring").length : stats.expiring}
          icon={CalendarClock}
          tone="warning"
          sub={`${isEmployee ? scopedDocs.filter((d) => expiryStatus(d.expiresAt) === "expired").length : stats.expired} already expired`}
        />
        <StatCard
          label="Pending E-Signatures"
          value={isEmployee ? scopedDocs.filter((d) => d.signatureState === "sent" || d.signatureState === "viewed").length : stats.pendingSig}
          icon={PenLine}
          tone="info"
          sub="Awaiting signer"
        />
        <StatCard
          label={isEmployee ? "My Documents" : "Missing Compliance"}
          value={isEmployee ? scopedDocs.length : stats.missingCompliance}
          icon={AlertTriangle}
          tone={isEmployee ? "default" : "danger"}
          sub={isEmployee ? "Total on file" : "Employees with gaps"}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 overflow-hidden rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Expiring soon</h2>
              <p className="text-xs text-muted-foreground">Sorted by urgency · next 90 days</p>
            </div>
            <Link to="/expiry" className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
              Open expiry center <ArrowUpRight className="size-3" />
            </Link>
          </div>
          {isLoading ? (
            <div className="p-4"><TableSkeleton rows={5} cols={4} /></div>
          ) : expiringSoon.length === 0 ? (
            <EmptyState title="Nothing expiring soon" description="All tracked documents are valid past 30 days." className="m-4" />
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Document</th>
                  {!isEmployee && <th className="px-4 py-2 font-medium">Employee</th>}
                  <th className="px-4 py-2 font-medium">Expires</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {expiringSoon.map((d) => (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <CategoryIcon category={d.category} />
                        <div>
                          <div className="font-medium">{d.filename}</div>
                          <div className="text-xs text-muted-foreground">{d.category.replace("_", " ")}</div>
                        </div>
                      </div>
                    </td>
                    {!isEmployee && (
                      <td className="px-4 py-3">
                        {empMap[d.employeeId] && (
                          <Link to={`/employees/${d.employeeId}`} className="flex items-center gap-2 hover:underline">
                            <EmployeeAvatar employee={empMap[d.employeeId]} size={24} />
                            <span>{empMap[d.employeeId].name}</span>
                          </Link>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(d.expiresAt)}</td>
                    <td className="px-4 py-3"><ExpiryBadge status={expiryStatus(d.expiresAt)} expiresAt={d.expiresAt} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Recent activity</h2>
            <p className="text-xs text-muted-foreground">Audit trail · latest events</p>
          </div>
          <ul className="divide-y">
            {recentActivity.length === 0 ? (
              <li className="p-4"><EmptyState title="No activity yet" /></li>
            ) : recentActivity.map((a) => (
              <li key={a.id} className="flex gap-3 px-4 py-3 text-sm">
                <div className="mt-0.5 size-2 shrink-0 rounded-full bg-primary/60" />
                <div className="min-w-0 flex-1">
                  <div className="truncate">
                    <span className="font-medium">{a.actor}</span>{" "}
                    <span className="text-muted-foreground">{prettyAction(a.action)}</span>{" "}
                    <span className="font-medium">{a.documentName}</span>
                  </div>
                  {a.meta && <div className="text-xs text-muted-foreground">{a.meta}</div>}
                  <div className="text-xs text-muted-foreground">{relativeTime(a.at)}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} employees={employees} />
    </div>
  );
}

function prettyAction(a: string): string {
  return ({
    upload: "uploaded",
    download: "downloaded",
    view: "viewed",
    edit: "edited",
    delete: "deleted",
    replace: "replaced",
    signature_sent: "sent for signature",
    signature_signed: "signed",
    signature_declined: "declined to sign",
    reminder_sent: "sent reminder for",
  } as Record<string, string>)[a] ?? a;
}

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  tone = "default",
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  sub?: string;
  tone?: "default" | "warning" | "info" | "danger";
}) {
  const toneCls = {
    default: "bg-secondary text-primary",
    warning: "bg-warning-soft text-warning-foreground",
    info: "bg-info-soft text-info",
    danger: "bg-danger-soft text-danger",
  }[tone];
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={`flex size-9 items-center justify-center rounded-md ${toneCls}`}>
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}
