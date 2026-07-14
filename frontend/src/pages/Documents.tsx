import { useQuery, useQueryClient } from "@/lib/query";
import { listDocuments, listEmployees, CATEGORY_LABEL, CATEGORY_LIST, sendReminder } from "@/lib/hr/api";
import type { DocumentCategory, ExpiryStatus, SignatureState } from "@/lib/hr/types";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, LayoutGrid, List, Send, Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentRow } from "@/components/hr/DocumentRow";
import { CategoryIcon, ExpiryBadge, SignatureBadge } from "@/components/hr/badges";
import { EmptyState, TableSkeleton } from "@/components/hr/EmptyState";
import { Checkbox } from "@/components/ui/checkbox";
import { expiryStatus, formatDate, can } from "@/lib/hr/utils";
import { useRole } from "@/lib/hr/role-context";
import { toast } from "sonner";

export function DocumentsRepoPage() {
  const { role, user } = useRole();
  const qc = useQueryClient();
  const { data: docs = [], isLoading } = useQuery({ queryKey: ["documents"], queryFn: () => listDocuments() });
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: () => listEmployees() });
  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<DocumentCategory | "all">("all");
  const [emp, setEmp] = useState("all");
  const [dept, setDept] = useState("all");
  const [expFilter, setExpFilter] = useState<ExpiryStatus | "all">("all");
  const [sigFilter, setSigFilter] = useState<SignatureState | "all">("all");
  const [view, setView] = useState<"table" | "grid">("table");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const departments = useMemo(() => Array.from(new Set(employees.map((e) => e.department))), [employees]);

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      const empName = empMap[d.employeeId]?.name ?? "";
      if (q && !`${d.filename} ${empName}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (cat !== "all" && d.category !== cat) return false;
      if (emp !== "all" && d.employeeId !== emp) return false;
      if (dept !== "all" && empMap[d.employeeId]?.department !== dept) return false;
      if (expFilter !== "all" && expiryStatus(d.expiresAt) !== expFilter) return false;
      if (sigFilter !== "all" && d.signatureState !== sigFilter) return false;
      return true;
    });
  }, [docs, empMap, q, cat, emp, dept, expFilter, sigFilter]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleBulkDownload = () => {
    toast.success(`Downloading ${selected.size} files`);
    setSelected(new Set());
  };

  const handleBulkReminders = async () => {
    let sentCount = 0;
    for (const id of selected) {
      const doc = docs.find((d) => d.id === id);
      if (doc && (doc.signatureState === "sent" || doc.signatureState === "viewed")) {
        await sendReminder(id, user.name, role);
        sentCount++;
      }
    }
    if (sentCount > 0) {
      toast.success(`Sent ${sentCount} reminders`);
      qc.invalidateQueries();
    } else {
      toast.info("No pending signature requests selected.");
    }
    setSelected(new Set());
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Document Repository</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} documents · across {employees.length} employees
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-md border bg-card p-0.5">
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("table")}
            aria-label="Table view"
          >
            <List className="size-4" />
          </Button>
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search documents…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 pl-8" />
        </div>
        <Select value={cat} onValueChange={(v) => setCat(v as DocumentCategory | "all")}>
          <SelectTrigger className="h-9 w-[170px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORY_LIST.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={emp} onValueChange={setEmp}>
          <SelectTrigger className="h-9 w-[170px]"><SelectValue placeholder="Employee" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All employees</SelectItem>
            {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={expFilter} onValueChange={(v) => setExpFilter(v as ExpiryStatus | "all")}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Expiry" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any expiry</SelectItem>
            <SelectItem value="valid">Valid</SelectItem>
            <SelectItem value="expiring">Expiring</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="none">No expiry</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sigFilter} onValueChange={(v) => setSigFilter(v as SignatureState | "all")}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Signature" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any signature</SelectItem>
            <SelectItem value="not_required">Not required</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
            <SelectItem value="signed">Signed</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {can(role, "bulk") && selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border bg-primary/5 px-3 py-2 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={handleBulkDownload}>
              <Download className="mr-1.5 size-4" /> Bulk download
            </Button>
            <Button size="sm" onClick={handleBulkReminders}>
              <Send className="mr-1.5 size-4" /> Send reminders
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No documents match your filters" />
      ) : view === "table" ? (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {can(role, "bulk") && <th className="w-8 px-4 py-2"></th>}
                <th className="px-4 py-2 font-medium">Document</th>
                <th className="px-4 py-2 font-medium">Employee</th>
                <th className="px-4 py-2 font-medium">Uploaded</th>
                <th className="px-4 py-2 font-medium">Expiry</th>
                <th className="px-4 py-2 font-medium">Signature</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <DocumentRow
                  key={d.id}
                  doc={d}
                  employee={empMap[d.employeeId]}
                  showEmployee
                  checkbox={
                    can(role, "bulk") ? (
                      <Checkbox
                        checked={selected.has(d.id)}
                        onCheckedChange={() => toggle(d.id)}
                        aria-label="Select row"
                      />
                    ) : undefined
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => {
            const emp = empMap[d.employeeId];
            return (
              <div key={d.id} className="rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <CategoryIcon category={d.category} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.filename}</p>
                    <p className="text-xs text-muted-foreground">{emp?.name} · {emp?.department}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <ExpiryBadge status={expiryStatus(d.expiresAt)} expiresAt={d.expiresAt} />
                  <SignatureBadge state={d.signatureState} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Uploaded {formatDate(d.uploadedAt)} · by {d.uploadedBy}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
