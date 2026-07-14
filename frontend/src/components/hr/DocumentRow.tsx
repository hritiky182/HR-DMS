import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Download, RefreshCw, Trash2, History, Send } from "lucide-react";
import { CategoryIcon, CategoryTag, ExpiryBadge, SignatureBadge } from "./badges";
import type { HRDocument, Employee } from "@/lib/hr/types";
import { expiryStatus, formatDate, can } from "@/lib/hr/utils";
import { useRole } from "@/lib/hr/role-context";
import { toast } from "sonner";
import { useQueryClient } from "@/lib/query";
import { deleteDocument, replaceDocument, sendReminder } from "@/lib/hr/api";
import { DocumentDetailDialog } from "./DocumentDetailDialog";

export function DocumentRow({
  doc,
  employee,
  showEmployee = false,
  onOpen,
  checkbox,
}: {
  doc: HRDocument;
  employee?: Employee;
  showEmployee?: boolean;
  onOpen?: () => void;
  checkbox?: React.ReactNode;
}) {
  const { role, user } = useRole();
  const qc = useQueryClient();
  const [detailOpen, setDetailOpen] = useState(false);
  const status = expiryStatus(doc.expiresAt);

  const handleReplace = async () => {
    const newName = doc.filename.replace(/(_v\d+)?\.(pdf|docx?)$/i, (m, v, ext) => {
      const n = v ? parseInt(v.slice(2)) + 1 : 2;
      return `_v${n}.${ext}`;
    });
    await replaceDocument(doc.id, newName, user.name, role);
    toast.success("Document replaced", { description: `New version saved.` });
    qc.invalidateQueries();
  };
  const handleDelete = async () => {
    if (!confirm(`Delete "${doc.filename}"? This is logged in the audit trail.`)) return;
    await deleteDocument(doc.id, user.name, role);
    toast.success("Document deleted");
    qc.invalidateQueries();
  };
  const handleReminder = async () => {
    await sendReminder(doc.id, user.name, role);
    toast.success("Reminder sent");
    qc.invalidateQueries();
  };

  return (
    <>
      <tr className="border-b last:border-0 hover:bg-muted/40 transition-colors">
        {checkbox && <td className="px-4 py-3 align-middle">{checkbox}</td>}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <CategoryIcon category={doc.category} />
            <div className="min-w-0">
              <button
                className="block truncate text-left text-sm font-medium text-foreground hover:underline"
                onClick={() => (onOpen ? onOpen() : setDetailOpen(true))}
              >
                {doc.filename}
              </button>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <CategoryTag category={doc.category} />
                {doc.versions.length > 1 && (
                  <span className="inline-flex items-center gap-1">
                    <History className="size-3" /> v{doc.versions.length}
                  </span>
                )}
                <span>{Math.round(doc.sizeKb)} KB</span>
              </div>
            </div>
          </div>
        </td>
        {showEmployee && (
          <td className="px-4 py-3 text-sm">
            {employee ? (
              <div>
                <div className="font-medium">{employee.name}</div>
                <div className="text-xs text-muted-foreground">{employee.department}</div>
              </div>
            ) : "—"}
          </td>
        )}
        <td className="px-4 py-3 text-sm text-muted-foreground">
          <div>{formatDate(doc.uploadedAt)}</div>
          <div className="text-xs">by {doc.uploadedBy}</div>
        </td>
        <td className="px-4 py-3">
          <ExpiryBadge status={status} expiresAt={doc.expiresAt} />
        </td>
        <td className="px-4 py-3">
          <SignatureBadge state={doc.signatureState} />
        </td>
        <td className="px-4 py-3 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Row actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => (onOpen ? onOpen() : setDetailOpen(true))}>
                <Eye className="mr-2 size-4" /> View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success("Download started")}>
                <Download className="mr-2 size-4" /> Download
              </DropdownMenuItem>
              {can(role, "upload") && (
                <DropdownMenuItem onClick={handleReplace}>
                  <RefreshCw className="mr-2 size-4" /> Replace (new version)
                </DropdownMenuItem>
              )}
              {(doc.signatureState === "sent" || doc.signatureState === "viewed") && can(role, "send_signature") && (
                <DropdownMenuItem onClick={handleReminder}>
                  <Send className="mr-2 size-4" /> Send reminder
                </DropdownMenuItem>
              )}
              {can(role, "delete") && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-danger focus:text-danger">
                    <Trash2 className="mr-2 size-4" /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
      <DocumentDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        doc={doc}
        employee={employee}
      />
    </>
  );
}

export function DocumentTable({
  docs,
  employees,
  showEmployee = false,
}: {
  docs: HRDocument[];
  employees?: Record<string, Employee>;
  showEmployee?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <table className="w-full">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Document</th>
            {showEmployee && <th className="px-4 py-2 font-medium">Employee</th>}
            <th className="px-4 py-2 font-medium">Uploaded</th>
            <th className="px-4 py-2 font-medium">Expiry</th>
            <th className="px-4 py-2 font-medium">Signature</th>
            <th className="px-4 py-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <DocumentRow
              key={d.id}
              doc={d}
              employee={employees?.[d.employeeId]}
              showEmployee={showEmployee}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
