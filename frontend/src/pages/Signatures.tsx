import { useQuery } from "@/lib/query";
import { listDocuments, listEmployees } from "@/lib/hr/api";
import { SignatureBadge, SignatureStepper, CategoryIcon } from "@/components/hr/badges";
import { EmployeeAvatar } from "@/components/hr/EmployeeAvatar";
import { EmptyState } from "@/components/hr/EmptyState";
import { formatDate } from "@/lib/hr/utils";
import { useRole } from "@/lib/hr/role-context";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DocumentDetailDialog } from "@/components/hr/DocumentDetailDialog";
import type { HRDocument } from "@/lib/hr/types";

export function SignaturesPage() {
  const { role, user } = useRole();
  const { data: docs = [] } = useQuery({ queryKey: ["documents"], queryFn: () => listDocuments() });
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: () => listEmployees() });
  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));
  const [openDoc, setOpenDoc] = useState<HRDocument | null>(null);

  const scope = role === "employee" ? docs.filter((d) => d.employeeId === user.employeeId) : docs;
  const withSig = scope.filter((d) => d.signatureState !== "not_required");

  const groups: Record<string, HRDocument[]> = {
    pending: withSig.filter((d) => d.signatureState === "sent" || d.signatureState === "viewed"),
    signed: withSig.filter((d) => d.signatureState === "signed"),
    declined: withSig.filter((d) => d.signatureState === "declined" || d.signatureState === "expired"),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">E-Signatures</h1>
        <p className="text-sm text-muted-foreground">
          {role === "employee" ? "Documents awaiting your signature and your signing history." : "Track sent, viewed, signed, and declined signature requests."}
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({groups.pending.length})</TabsTrigger>
          <TabsTrigger value="signed">Signed ({groups.signed.length})</TabsTrigger>
          <TabsTrigger value="declined">Declined / Expired ({groups.declined.length})</TabsTrigger>
        </TabsList>

        {(["pending", "signed", "declined"] as const).map((k) => (
          <TabsContent key={k} value={k} className="mt-4">
            {groups[k].length === 0 ? (
              <EmptyState
                title={
                  k === "pending" ? "No documents awaiting signature"
                  : k === "signed" ? "No signed documents yet"
                  : "No declined or expired signatures"
                }
              />
            ) : (
              <div className="overflow-hidden rounded-lg border bg-card">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-medium">Document</th>
                      <th className="px-4 py-2 font-medium">Signer</th>
                      <th className="px-4 py-2 font-medium">Sent</th>
                      <th className="px-4 py-2 font-medium">State</th>
                      <th className="px-4 py-2 font-medium">Progress</th>
                      <th className="px-4 py-2 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups[k].map((d) => {
                      const emp = empMap[d.employeeId];
                      const isMe = role === "employee" && d.employeeId === user.employeeId;
                      return (
                        <tr key={d.id} className="border-b last:border-0 hover:bg-muted/40">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <CategoryIcon category={d.category} />
                              <div>
                                <button onClick={() => setOpenDoc(d)} className="font-medium hover:underline">{d.filename}</button>
                                <div className="text-xs text-muted-foreground">{emp?.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {emp ? (
                              <div className="flex items-center gap-2">
                                <EmployeeAvatar employee={emp} size={24} />
                                <span>{d.signer ?? emp.name}</span>
                              </div>
                            ) : d.signer}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{d.signatureSentAt ? formatDate(d.signatureSentAt) : "—"}</td>
                          <td className="px-4 py-3"><SignatureBadge state={d.signatureState} /></td>
                          <td className="px-4 py-3"><SignatureStepper state={d.signatureState} /></td>
                          <td className="px-4 py-3 text-right">
                            {k === "pending" && isMe ? (
                              <Button size="sm" onClick={() => setOpenDoc(d)}>Sign now</Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => setOpenDoc(d)}>View</Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {openDoc && (
        <DocumentDetailDialog
          open={!!openDoc}
          onOpenChange={(v) => !v && setOpenDoc(null)}
          doc={openDoc}
          employee={empMap[openDoc.employeeId]}
        />
      )}
    </div>
  );
}
