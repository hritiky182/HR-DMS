import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CategoryIcon, ExpiryBadge, SignatureBadge, SignatureStepper } from "./badges";
import type { HRDocument, Employee } from "@/lib/hr/types";
import { expiryStatus, formatDate, formatDateTime } from "@/lib/hr/utils";
import { CATEGORY_LABEL } from "@/lib/hr/types";
import { useRole } from "@/lib/hr/role-context";
import { setSignatureState } from "@/lib/hr/api";
import { useQueryClient } from "@/lib/query";
import { toast } from "sonner";
import { Download, PenLine, X, History } from "lucide-react";

export function DocumentDetailDialog({
  open,
  onOpenChange,
  doc,
  employee,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  doc: HRDocument;
  employee?: Employee;
}) {
  const { role, user } = useRole();
  const qc = useQueryClient();
  const [signing, setSigning] = useState(false);
  const [signatureText, setSignatureText] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const isEmployeeSigner = role === "employee" && doc.signer && employee?.name === user.name;
  const canSign = isEmployeeSigner && (doc.signatureState === "sent" || doc.signatureState === "viewed");

  useEffect(() => {
    if (signing && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#1e40af"; // Deep blue ink
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [signing]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault(); // Prevent scrolling on touch devices
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault();
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const submitSign = async (state: "signed" | "declined") => {
    if (state === "signed" && !signatureText.trim()) {
      toast.error("Please type your legal name to sign.");
      return;
    }
    await setSignatureState(doc.id, state, user.name, role);
    toast.success(state === "signed" ? "Document signed successfully" : "Signature declined");
    qc.invalidateQueries();
    setSigning(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <CategoryIcon category={doc.category} />
            <span className="truncate">{doc.filename}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[1fr_260px]">
          {/* Mock document preview */}
          <div className="rounded-lg border bg-muted/30 p-6">
            <div className="mx-auto max-w-md rounded-md border bg-background p-8 shadow-sm">
              <div className="mb-4 text-xs uppercase tracking-wide text-muted-foreground">
                {CATEGORY_LABEL[doc.category]}
              </div>
              <div className="mb-6 text-lg font-semibold">{doc.filename}</div>
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-2 rounded bg-muted"
                    style={{ width: `${60 + ((i * 37) % 40)}%` }}
                  />
                ))}
              </div>
              {doc.signatureState !== "not_required" && (
                <div className="mt-8 border-t pt-4">
                  <p className="text-xs text-muted-foreground">Signer</p>
                  <p className="text-sm font-medium">{doc.signer}</p>
                  {doc.signatureState === "signed" ? (
                    <div className="mt-2">
                      <p className="font-serif italic text-primary text-base">{doc.signer}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">Digitally signed via HR-DMS Consent E-File</p>
                    </div>
                  ) : (
                    <div className="mt-2 h-8 border-b border-dashed border-muted-foreground/50" />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Employee</p>
              <p className="font-medium">{employee?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Uploaded</p>
              <p className="font-medium">{formatDate(doc.uploadedAt)}</p>
              <p className="text-xs text-muted-foreground">by {doc.uploadedBy}</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Expiry</p>
              <ExpiryBadge status={expiryStatus(doc.expiresAt)} expiresAt={doc.expiresAt} />
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Signature</p>
              <SignatureBadge state={doc.signatureState} />
              <div className="mt-2">
                <SignatureStepper state={doc.signatureState} />
              </div>
            </div>

            {doc.versions.length > 1 && (
              <div>
                <p className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <History className="size-3" /> Version history
                </p>
                <ul className="space-y-1.5 rounded-md border p-2">
                  {[...doc.versions].reverse().map((v) => (
                    <li key={v.version} className="flex items-center justify-between text-xs">
                      <span className="font-medium">v{v.version}</span>
                      <span className="text-muted-foreground">{formatDate(v.uploadedAt)} · {v.uploadedBy}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {role === "admin" && doc.signatureEvents.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs text-muted-foreground">Signature audit</p>
                <ul className="space-y-1 rounded-md border p-2 text-xs">
                  {doc.signatureEvents.map((e, i) => (
                    <li key={i}>
                      <span className="font-medium capitalize">{e.action}</span> by {e.actor} · {formatDateTime(e.at)}
                      {e.ip && <div className="text-muted-foreground">{e.ip} · {e.device}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="outline" onClick={() => toast.success("Download started")}>
            <Download className="mr-2 size-4" /> Download
          </Button>
          <div className="flex gap-2">
            {canSign && !signing && (
              <Button onClick={() => setSigning(true)}>
                <PenLine className="mr-2 size-4" /> Sign here
              </Button>
            )}
          </div>
        </div>

        {signing && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div>
              <p className="mb-1.5 text-sm font-medium">1. Draw your signature</p>
              <canvas
                ref={canvasRef}
                width={480}
                height={120}
                className="h-[120px] w-full rounded border bg-background cursor-crosshair border-border touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <div className="mt-1 flex justify-end">
                <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={clearCanvas}>
                  Clear Canvas
                </Button>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium">2. Type your full name to adopt signature</p>
              <input
                autoFocus
                className="w-full rounded-md border bg-background px-3 py-2 font-serif italic text-lg outline-none focus:ring-2 focus:ring-primary border-border"
                placeholder="Your legal name"
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
              />
            </div>

            <div className="pt-2 flex gap-2">
              <Button onClick={() => submitSign("signed")}>Adopt and Sign</Button>
              <Button variant="outline" onClick={() => submitSign("declined")}>Decline</Button>
              <Button variant="ghost" onClick={() => { setSigning(false); clearCanvas(); }}>
                <X className="mr-2 size-4" /> Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
