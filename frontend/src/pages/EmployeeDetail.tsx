import { Link, useParams } from "react-router-dom";
import { useQuery } from "@/lib/query";
import { getEmployee, listDocuments, listEmployees, computeEmployeeStats } from "@/lib/hr/api";
import { CATEGORY_LABEL, CATEGORY_LIST } from "@/lib/hr/types";
import type { DocumentCategory } from "@/lib/hr/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmployeeAvatar } from "@/components/hr/EmployeeAvatar";
import { DocumentTable } from "@/components/hr/DocumentRow";
import { EmptyState } from "@/components/hr/EmptyState";
import { UploadDialog } from "@/components/hr/UploadDialog";
import { useRole } from "@/lib/hr/role-context";
import { can, formatDate } from "@/lib/hr/utils";
import { ArrowLeft, Upload, Mail, Building2, Calendar } from "lucide-react";
import { useState } from "react";

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { role } = useRole();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [presetCat, setPresetCat] = useState<DocumentCategory | undefined>();

  const { data: employee, isLoading } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => getEmployee(id ?? ""),
  });
  const { data: docs = [] } = useQuery({
    queryKey: ["documents", "emp", id],
    queryFn: () => listDocuments({ employeeId: id }),
  });
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => listEmployees(),
  });

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (!employee || !id) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg font-medium">Employee not found</p>
        <Link to="/employees" className="text-sm text-primary hover:underline">Back to employees</Link>
      </div>
    );
  }

  const stats = computeEmployeeStats(id);
  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));

  const openUpload = (cat?: DocumentCategory) => {
    setPresetCat(cat);
    setUploadOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Link to="/employees" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> All employees
      </Link>

      <div className="flex flex-col gap-4 rounded-lg border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <EmployeeAvatar employee={employee} size={64} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{employee.name}</h1>
              {employee.status === "active" ? (
                <Badge variant="outline" className="border-success/30 bg-success-soft text-success-foreground">Active</Badge>
              ) : (
                <Badge variant="outline">Exited</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{employee.title}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Building2 className="size-3" /> {employee.department}</span>
              <span className="inline-flex items-center gap-1"><Mail className="size-3" /> {employee.email}</span>
              <span className="inline-flex items-center gap-1"><Calendar className="size-3" /> Joined {formatDate(employee.joinDate)}</span>
              <span className="font-mono">{employee.employeeCode}</span>
            </div>
          </div>
        </div>
        {can(role, "upload") && (
          <Button onClick={() => openUpload()}>
            <Upload className="mr-1.5 size-4" /> Upload document
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <MiniStat label="Documents" value={stats.totalDocs} />
        <MiniStat label="Completeness" value={`${Math.round(stats.completeness * 100)}%`} />
        <MiniStat label="Expiring / Expired" value={`${stats.expiringCount} / ${stats.expiredCount}`} tone={stats.expiredCount ? "danger" : stats.expiringCount ? "warning" : "default"} />
        <MiniStat label="Pending signatures" value={stats.pendingSignatures} tone={stats.pendingSignatures ? "info" : "default"} />
      </div>

      {stats.missingCategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-warning/40 bg-warning-soft/40 px-4 py-3 text-sm">
          <span className="font-medium text-warning-foreground">Missing required documents:</span>
          {stats.missingCategories.map((c) => (
            <Badge key={c} variant="outline" className="border-warning/40 bg-background">{CATEGORY_LABEL[c]}</Badge>
          ))}
        </div>
      )}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({docs.length})</TabsTrigger>
          {CATEGORY_LIST.map((c) => (
            <TabsTrigger key={c} value={c}>
              {CATEGORY_LABEL[c]} ({docs.filter((d) => d.category === c).length})
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {docs.length === 0 ? (
            <EmptyState
              title="No documents on file"
              description="Upload the first document to get started."
              action={can(role, "upload") && <Button onClick={() => openUpload()}><Upload className="mr-1.5 size-4" /> Upload</Button>}
            />
          ) : (
            <DocumentTable docs={docs} employees={empMap} />
          )}
        </TabsContent>
        {CATEGORY_LIST.map((c) => {
          const filtered = docs.filter((d) => d.category === c);
          return (
            <TabsContent key={c} value={c} className="mt-4">
              {filtered.length === 0 ? (
                <EmptyState
                  title={`No ${CATEGORY_LABEL[c].toLowerCase()} uploaded yet`}
                  description={`This employee has no ${CATEGORY_LABEL[c].toLowerCase()} on file.`}
                  action={can(role, "upload") && <Button onClick={() => openUpload(c)}><Upload className="mr-1.5 size-4" /> Upload {CATEGORY_LABEL[c]}</Button>}
                />
              ) : (
                <DocumentTable docs={filtered} employees={empMap} />
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        employees={employees}
        presetEmployeeId={id}
        presetCategory={presetCat}
      />
    </div>
  );
}

function MiniStat({ label, value, tone = "default" }: { label: string; value: React.ReactNode; tone?: "default" | "warning" | "info" | "danger" }) {
  const toneCls = {
    default: "text-foreground",
    warning: "text-warning-foreground",
    info: "text-info",
    danger: "text-danger",
  }[tone];
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1.5 text-xl font-semibold tabular-nums ${toneCls}`}>{value}</p>
    </div>
  );
}
