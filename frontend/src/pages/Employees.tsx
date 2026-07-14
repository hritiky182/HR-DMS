import { Link } from "react-router-dom";
import { useQuery } from "@/lib/query";
import { useMemo, useState } from "react";
import { listDocuments, listEmployees, computeEmployeeStats } from "@/lib/hr/api";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmployeeAvatar } from "@/components/hr/EmployeeAvatar";
import { EmptyState, TableSkeleton } from "@/components/hr/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { formatDate } from "@/lib/hr/utils";
import { Progress } from "@/components/ui/progress";

export function EmployeesListPage() {
  const { data: employees = [], isLoading } = useQuery({ queryKey: ["employees"], queryFn: () => listEmployees() });
  useQuery({ queryKey: ["documents"], queryFn: () => listDocuments() }); // warm cache for stats
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");
  const [missing, setMissing] = useState("all");

  const departments = useMemo(() => Array.from(new Set(employees.map((e) => e.department))), [employees]);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (q && !`${e.name} ${e.employeeCode} ${e.email} ${e.title}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (dept !== "all" && e.department !== dept) return false;
      if (status !== "all" && e.status !== status) return false;
      const stats = computeEmployeeStats(e.id);
      if (missing === "missing" && stats.missingCategories.length === 0) return false;
      if (missing === "complete" && stats.missingCategories.length > 0) return false;
      return true;
    });
  }, [employees, q, dept, status, missing]);

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
        <p className="text-sm text-muted-foreground">
          {filtered.length} of {employees.length} employees
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name, code, email…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 pl-8" />
        </div>
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="h-9 w-[170px]"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="exited">Exited</SelectItem>
          </SelectContent>
        </Select>
        <Select value={missing} onValueChange={setMissing}>
          <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All completeness</SelectItem>
            <SelectItem value="missing">Missing docs</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No employees match your filters" description="Try clearing filters or adjusting your search." />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Department</th>
                <th className="px-4 py-2 font-medium">Employee ID</th>
                <th className="px-4 py-2 font-medium">Join date</th>
                <th className="px-4 py-2 font-medium">Documents</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const stats = computeEmployeeStats(e.id);
                const pct = Math.round(stats.completeness * 100);
                return (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link to={`/employees/${e.id}`} className="flex items-center gap-3 group">
                        <EmployeeAvatar employee={e} size={32} />
                        <div>
                          <div className="font-medium group-hover:underline">{e.name}</div>
                          <div className="text-xs text-muted-foreground">{e.title}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">{e.department}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.employeeCode}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(e.joinDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="h-1.5 w-20" />
                        <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
                        {stats.missingCategories.length > 0 && (
                          <Badge variant="outline" className="border-warning/40 text-warning-foreground bg-warning-soft">
                            {stats.missingCategories.length} missing
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {e.status === "active" ? (
                        <Badge variant="outline" className="border-success/30 bg-success-soft text-success-foreground">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="border-border bg-muted text-muted-foreground">Exited</Badge>
                      )}
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
