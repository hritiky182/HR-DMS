import { useState, useCallback, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { CATEGORY_LABEL, CATEGORY_LIST } from "@/lib/hr/types";
import type { DocumentCategory, Employee } from "@/lib/hr/types";
import { UploadCloud, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/lib/hr/role-context";
import { uploadDocument, replaceDocument, categoryVisibility } from "@/lib/hr/api";
import { useQueryClient } from "@/lib/query";
import { cn } from "@/lib/utils";

const MAX_MB = 25;
const ACCEPTED = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"];

export function UploadDialog({
  open,
  onOpenChange,
  employees,
  presetEmployeeId,
  presetCategory,
  renewingDocId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employees: Employee[];
  presetEmployeeId?: string;
  presetCategory?: DocumentCategory;
  renewingDocId?: string;
}) {
  const { role, user } = useRole();
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [filename, setFilename] = useState("");
  const [employeeId, setEmployeeId] = useState(presetEmployeeId ?? "");
  const [category, setCategory] = useState<DocumentCategory>(presetCategory ?? "contract");
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [sigRequired, setSigRequired] = useState(false);
  const [signer, setSigner] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setEmployeeId(presetEmployeeId ?? "");
      setCategory(presetCategory ?? "contract");
    }
  }, [open, presetEmployeeId, presetCategory]);

  const reset = () => {
    setFile(null);
    setFilename("");
    setHasExpiry(false);
    setExpiresAt("");
    setSigRequired(false);
    setSigner("");
    setProgress(0);
    setError(null);
  };

  const acceptFile = useCallback((f: File) => {
    setError(null);
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!ext || !ACCEPTED.includes("." + ext)) {
      setError(`Unsupported file type. Accepted: ${ACCEPTED.join(", ")}`);
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File exceeds ${MAX_MB}MB limit.`);
      return;
    }
    setFile(f);
    setFilename(f.name);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }
    if (!employeeId) {
      setError("Please select an employee.");
      return;
    }
    if (sigRequired && !signer) {
      setError("Please assign a signer.");
      return;
    }
    setUploading(true);
    // Simulate upload progress
    for (let p = 0; p <= 90; p += 15) {
      setProgress(p);
      await new Promise((r) => setTimeout(r, 60));
    }
    try {
      const expirationDate = hasExpiry && expiresAt ? new Date(expiresAt).toISOString() : undefined;
      if (renewingDocId) {
        await replaceDocument(
          renewingDocId,
          filename,
          user.name,
          role,
          expirationDate
        );
        setProgress(100);
        toast.success("Document renewed", { description: filename });
      } else {
        await uploadDocument({
          employeeId,
          category,
          filename,
          expiresAt: expirationDate,
          signatureRequired: sigRequired,
          signer,
          actor: user.name,
          actorRole: role,
        });
        setProgress(100);
        toast.success("Document uploaded", { description: filename });
      }
      qc.invalidateQueries();
      onOpenChange(false);
      setTimeout(reset, 200);
    } catch {
      toast.error(renewingDocId ? "Renewal failed" : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const employee = employees.find((e) => e.id === employeeId);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{renewingDocId ? "Renew document" : "Upload document"}</DialogTitle>
          <DialogDescription>
            PDF, Word or image. Max {MAX_MB}MB. All uploads are logged to the audit trail.
          </DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30"
          )}
        >
          {file ? (
            <div className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-2">
              <div className="flex items-center gap-2 truncate">
                <FileText className="size-4 text-muted-foreground" />
                <span className="truncate text-sm">{file.name}</span>
                <span className="text-xs text-muted-foreground">{Math.round(file.size / 1024)} KB</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setFile(null)} aria-label="Remove file">
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <>
              <UploadCloud className="mb-2 size-6 text-muted-foreground" />
              <p className="text-sm font-medium">Drop file here or click to browse</p>
              <p className="mt-1 text-xs text-muted-foreground">{ACCEPTED.join(", ")}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => inputRef.current?.click()}
              >
                Choose file
              </Button>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={ACCEPTED.join(",")}
                onChange={(e) => e.target.files?.[0] && acceptFile(e.target.files[0])}
              />
            </>
          )}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1.5 block text-xs">Employee</Label>
            <Select value={employeeId} onValueChange={setEmployeeId} disabled={!!presetEmployeeId || !!renewingDocId}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name} — {e.employeeCode}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)} disabled={!!renewingDocId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORY_LIST.filter((c) => categoryVisibility[c]).map((c) => (
                  <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="exp-switch" className="text-sm font-medium">Set expiry date</Label>
              <p className="text-xs text-muted-foreground">Alerts fire 30 days before.</p>
            </div>
            <Switch id="exp-switch" checked={hasExpiry} onCheckedChange={setHasExpiry} />
          </div>
          {hasExpiry && (
            <Input
              type="date"
              className="mt-3"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          )}
        </div>

        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sig-switch" className="text-sm font-medium">Requires e-signature</Label>
              <p className="text-xs text-muted-foreground">Signer will receive a request.</p>
            </div>
            <Switch id="sig-switch" checked={sigRequired} onCheckedChange={setSigRequired} />
          </div>
          {sigRequired && (
            <Select value={signer} onValueChange={setSigner}>
              <SelectTrigger className="mt-3"><SelectValue placeholder="Assign signer" /></SelectTrigger>
              <SelectContent>
                {employee && <SelectItem value={employee.name}>{employee.name} (employee)</SelectItem>}
                {employees.filter((e) => e.id !== employeeId).slice(0, 8).map((e) => (
                  <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {uploading && <Progress value={progress} className="h-1" />}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={uploading}>
            {uploading ? "Uploading…" : "Upload document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
