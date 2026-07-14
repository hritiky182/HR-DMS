import { CATEGORY_LABEL, CATEGORY_LIST } from "@/lib/hr/types";
import { CategoryIcon } from "@/components/hr/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmployeeAvatar } from "@/components/hr/EmployeeAvatar";
import { useQuery, useQueryClient } from "@/lib/query";
import {
  listEmployees,
  categoryVisibility,
  updateCategoryVisibility,
  alertThresholds,
  updateAlertThresholds,
  getEmployeeRole,
  setEmployeeRole,
} from "@/lib/hr/api";
import { ROLE_LABEL } from "@/lib/hr/utils";
import type { Role, DocumentCategory } from "@/lib/hr/types";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";

export function SettingsPage() {
  const qc = useQueryClient();
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: () => listEmployees() });

  // Category visibility local states
  const [visibilities, setVisibilities] = useState<Record<DocumentCategory, boolean>>({ ...categoryVisibility });

  // Threshold local states
  const [firstThresh, setFirstThresh] = useState(String(alertThresholds.first));
  const [secondThresh, setSecondThresh] = useState(String(alertThresholds.second));
  const [finalThresh, setFinalThresh] = useState(String(alertThresholds.final));

  const handleToggleCategory = async (c: DocumentCategory, checked: boolean) => {
    const nextVal = { ...visibilities, [c]: checked };
    setVisibilities(nextVal);
    await updateCategoryVisibility(c, checked);
    toast.success(`${CATEGORY_LABEL[c]} category visibility updated`);
    qc.invalidateQueries();
  };

  const handleSaveThresholds = async () => {
    const first = parseInt(firstThresh) || 90;
    const second = parseInt(secondThresh) || 60;
    const final = parseInt(finalThresh) || 30;

    await updateAlertThresholds({ first, second, final });
    toast.success("Alert rules saved");
    qc.invalidateQueries();
  };

  const handleChangeRole = async (empId: string, role: Role) => {
    await setEmployeeRole(empId, role);
    toast.success("User role updated successfully");
    qc.invalidateQueries();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure document categories, alert thresholds, users, and notifications.</p>
      </div>

      <Section title="Document categories" description="First-class taxonomy used across the app.">
        <div className="grid gap-2 sm:grid-cols-2">
          {CATEGORY_LIST.map((c) => (
            <div key={c} className="flex items-center gap-3 rounded-md border bg-card p-3">
              <CategoryIcon category={c} />
              <div className="flex-1">
                <div className="text-sm font-medium">{CATEGORY_LABEL[c]}</div>
                <div className="text-xs text-muted-foreground">
                  Required for onboarding: {c === "offer_letter" || c === "contract" || c === "compliance" ? "Yes" : "No"}
                </div>
              </div>
              <Switch
                checked={visibilities[c]}
                onCheckedChange={(checked) => handleToggleCategory(c, checked)}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Expiry alert rules" description="When to notify HR before a document expires.">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <ThresholdField label="First reminder" value={firstThresh} onChange={setFirstThresh} />
            <ThresholdField label="Second reminder" value={secondThresh} onChange={setSecondThresh} />
            <ThresholdField label="Final reminder" value={finalThresh} onChange={setFinalThresh} />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSaveThresholds}>Save alert rules</Button>
          </div>
        </div>
      </Section>

      <Section title="Users & roles" description="Manage HR team members and their permissions.">
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {employees.slice(0, 6).map((e) => {
                const role = getEmployeeRole(e.id);
                return (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <EmployeeAvatar employee={e} size={26} />
                        <span className="font-medium">{e.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{e.email}</td>
                    <td className="px-4 py-3">
                      <Select value={role} onValueChange={(val) => handleChangeRole(e.id, val as Role)}>
                        <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">HR Admin</SelectItem>
                          <SelectItem value="manager">HR Manager</SelectItem>
                          <SelectItem value="employee">Employee</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="outline">{ROLE_LABEL[role]}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Notification preferences" description="Where and how HR receives alerts.">
        <div className="space-y-3">
          <ToggleRow label="Email daily expiry digest" description="Sent every morning at 8:00 AM local time." defaultChecked />
          <ToggleRow label="Slack notification on new signature request" description="Post to #hr-ops when a signature is sent." defaultChecked={false} />
          <ToggleRow label="Alert when compliance training expires" description="Send both to employee and manager." defaultChecked />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => toast.success("Notification preferences saved")}>Save changes</Button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function ThresholdField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <Label className="text-xs">{label}</Label>
      <div className="mt-1.5 flex items-center gap-2">
        <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-20" />
        <span className="text-sm text-muted-foreground">days before</span>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, defaultChecked }: { label: string; description: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(!!defaultChecked);
  return (
    <div className="flex items-start justify-between rounded-md border bg-card p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={setChecked} />
    </div>
  );
}
