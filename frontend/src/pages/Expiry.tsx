import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@/lib/query";
import { listDocuments, listEmployees, sendReminder } from "@/lib/hr/api";
import { expiryStatus, daysUntil, formatDate, can } from "@/lib/hr/utils";
import { ExpiryBadge, CategoryIcon } from "@/components/hr/badges";
import { EmployeeAvatar } from "@/components/hr/EmployeeAvatar";
import { EmptyState } from "@/components/hr/EmptyState";
import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/hr/role-context";
import { Send, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadDialog } from "@/components/hr/UploadDialog";

export function ExpiryPage() {
  const { role, user } = useRole();
  const qc = useQueryClient();
  const { data: docs = [] } = useQuery({ queryKey: ["documents"], queryFn: () => listDocuments() });
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: () => listEmployees() });
  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));
  const [threshold, setThreshold] = useState("30");
  const [renewDoc, setRenewDoc] = useState<any | null>(null);

  const grouped = useMemo(() => {
    const t = parseInt(threshold);
    const tracked = docs.filter((d) => d.expiresAt).sort((a, b) => (daysUntil(a.expiresAt) ?? 0) - (daysUntil(b.expiresAt) ?? 0));
    const expired = tracked.filter((d) => expiryStatus(d.expiresAt) === "expired");
    const soon = tracked.filter((d) => {
      const days = daysUntil(d.expiresAt);
      return days !== null && days >= 0 && days <= t;
    });
    const later = tracked.filter((d) => {
      const days = daysUntil(d.expiresAt);
      return days !== null && days > t;
    });
    return { expired, soon, later };
  }, [docs, threshold]);

  const remind = async (id: string) => {
    await sendReminder(id, user.name, role);
    toast.success("Reminder sent");
    qc.invalidateQueries();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expiry & Compliance Center</h1>
          <p className="text-sm text-muted-foreground">Track visas, contracts, certifications, and compliance documents by expiration.</p>
        </div>
        {can(role, "configure") && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Alert threshold:</label>
            <Select value={threshold} onValueChange={setThreshold}>
              <SelectTrigger className="h-9 w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <ExpirySection
        title="Expired"
        tone="danger"
        docs={grouped.expired}
        empMap={empMap}
        onRemind={remind}
        onRenew={(d) => setRenewDoc(d)}
        role={role}
        emptyText="No expired documents. Nice."
      />
      <ExpirySection
        title={`Expiring within ${threshold} days`}
        tone="warning"
        docs={grouped.soon}
        empMap={empMap}
        onRemind={remind}
        onRenew={(d) => setRenewDoc(d)}
        role={role}
        emptyText="Nothing expiring in this window."
      />
      <ExpirySection
        title="Upcoming (later)"
        tone="default"
        docs={grouped.later}
        empMap={empMap}
        onRemind={remind}
        onRenew={(d) => setRenewDoc(d)}
        role={role}
        emptyText="No further tracked expirations."
      />

      {renewDoc && (
        <UploadDialog
          open={!!renewDoc}
          onOpenChange={(v) => !v && setRenewDoc(null)}
          employees={employees}
          presetEmployeeId={renewDoc.employeeId}
          presetCategory={renewDoc.category}
          renewingDocId={renewDoc.id}
        />
      )}
    </div>
  );
}

function ExpirySection({
  title, tone, docs, empMap, onRemind, onRenew, role, emptyText,
}: {
  title: string;
  tone: "danger" | "warning" | "default";
  docs: any[];
  empMap: Record<string, any>;
  onRemind: (id: string) => void;
  onRenew: (doc: any) => void;
  role: any;
  emptyText: string;
}) {
  const badgeCls =
    tone === "danger" ? "bg-danger-soft text-danger border-danger/40"
    : tone === "warning" ? "bg-warning-soft text-warning-foreground border-warning/40"
    : "bg-muted text-muted-foreground border-border";
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">{title}</h2>
          <span className={`rounded-md border px-1.5 py-0.5 text-xs font-medium ${badgeCls}`}>{docs.length}</span>
        </div>
      </div>
      {docs.length === 0 ? (
        <div className="p-4"><EmptyState title={emptyText} /></div>
      ) : (
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Document</th>
              <th className="px-4 py-2 font-medium">Employee</th>
              <th className="px-4 py-2 font-medium">Expires</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => {
              const emp = empMap[d.employeeId];
              return (
                <tr key={d.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CategoryIcon category={d.category} />
                      <div>
                        <div className="font-medium">{d.filename}</div>
                        <div className="text-xs text-muted-foreground">{d.category.replace("_", " ")}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {emp && (
                      <Link to={`/employees/${emp.id}`} className="flex items-center gap-2 hover:underline">
                        <EmployeeAvatar employee={emp} size={24} />
                        <span>{emp.name}</span>
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(d.expiresAt)}</td>
                  <td className="px-4 py-3"><ExpiryBadge status={expiryStatus(d.expiresAt)} expiresAt={d.expiresAt} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      {can(role, "send_signature") && (
                        <Button size="sm" variant="outline" onClick={() => onRemind(d.id)}>
                          <Send className="mr-1.5 size-3.5" /> Remind
                        </Button>
                      )}
                      {can(role, "upload") && (
                        <Button size="sm" onClick={() => onRenew(d)}>
                          <RefreshCw className="mr-1.5 size-3.5" /> Mark renewed
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
