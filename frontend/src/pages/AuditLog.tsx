import { useQuery } from "@/lib/query";
import { listAudit, listEmployees } from "@/lib/hr/api";
import { formatDateTime } from "@/lib/hr/utils";
import { EmployeeAvatar } from "@/components/hr/EmployeeAvatar";
import { EmptyState, TableSkeleton } from "@/components/hr/EmptyState";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

const ACTION_LABEL: Record<string, string> = {
  upload: "Upload",
  view: "View",
  download: "Download",
  edit: "Edit",
  delete: "Delete",
  replace: "Replace",
  signature_sent: "Signature sent",
  signature_signed: "Signed",
  signature_declined: "Declined",
  reminder_sent: "Reminder sent",
};

export function AuditPage() {
  const { data: log, isLoading } = useQuery({ queryKey: ["audit"], queryFn: () => listAudit() });
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: () => listEmployees() });
  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));

  const [q, setQ] = useState("");
  const [action, setAction] = useState("all");
  const [actorRole, setActorRole] = useState("all");

  const filtered = useMemo(() => {
    return (log ?? []).filter((a) => {
      if (q && !`${a.actor} ${a.documentName ?? ""} ${empMap[a.employeeId ?? ""]?.name ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (action !== "all" && a.action !== action) return false;
      if (actorRole !== "all" && a.actorRole !== actorRole) return false;
      return true;
    });
  }, [log, q, action, actorRole, empMap]);

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground">Chronological record of every document action across the system.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search actor, document, employee…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 pl-8" />
        </div>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="h-9 w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {Object.entries(ACTION_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={actorRole} onValueChange={setActorRole}>
          <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actors</SelectItem>
            <SelectItem value="admin">HR Admin</SelectItem>
            <SelectItem value="manager">HR Manager</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={10} cols={5} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No audit entries match your filters" />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Time</th>
                <th className="px-4 py-2 font-medium">Actor</th>
                <th className="px-4 py-2 font-medium">Action</th>
                <th className="px-4 py-2 font-medium">Document</th>
                <th className="px-4 py-2 font-medium">Employee</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const emp = a.employeeId ? empMap[a.employeeId] : undefined;
                return (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDateTime(a.at)}</td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{a.actor}</div>
                        <Badge variant="outline" className="mt-0.5 text-[10px] uppercase">{a.actorRole}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{ACTION_LABEL[a.action] ?? a.action}</Badge>
                      {a.meta && <div className="mt-1 text-xs text-muted-foreground">{a.meta}</div>}
                    </td>
                    <td className="px-4 py-3">{a.documentName ?? "—"}</td>
                    <td className="px-4 py-3">
                      {emp ? (
                        <div className="flex items-center gap-2">
                          <EmployeeAvatar employee={emp} size={24} />
                          <span>{emp.name}</span>
                        </div>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
