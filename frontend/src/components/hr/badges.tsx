import { cn } from "@/lib/utils";
import type { ExpiryStatus, SignatureState, DocumentCategory } from "@/lib/hr/types";
import { daysUntil } from "@/lib/hr/utils";
import {
  FileText,
  FileSignature,
  ClipboardCheck,
  ShieldCheck,
  Wallet,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";

// ---------- Expiry status ----------

export function ExpiryBadge({
  status,
  expiresAt,
  className,
}: {
  status: ExpiryStatus;
  expiresAt?: string;
  className?: string;
}) {
  const d = daysUntil(expiresAt);
  const label =
    status === "valid"
      ? d !== null
        ? `Valid · ${d}d left`
        : "Valid"
      : status === "expiring"
      ? `Expiring · ${d}d`
      : status === "expired"
      ? d !== null
        ? `Expired · ${Math.abs(d)}d ago`
        : "Expired"
      : "No expiry";
  const cls =
    status === "valid"
      ? "bg-success-soft text-success-foreground border-success/30"
      : status === "expiring"
      ? "bg-warning-soft text-warning-foreground border-warning/40"
      : status === "expired"
      ? "bg-danger-soft text-danger border-danger/40"
      : "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        cls,
        className
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "valid" && "bg-success",
          status === "expiring" && "bg-warning",
          status === "expired" && "bg-danger",
          status === "none" && "bg-muted-foreground/50"
        )}
      />
      {label}
    </span>
  );
}

// ---------- Signature state ----------

const SIG_META: Record<SignatureState, { label: string; cls: string }> = {
  not_required: { label: "Not required", cls: "bg-muted text-muted-foreground border-border" },
  sent: { label: "Sent", cls: "bg-info-soft text-info-foreground border-info/30" },
  viewed: { label: "Viewed", cls: "bg-info-soft text-info border-info/40" },
  signed: { label: "Signed", cls: "bg-success-soft text-success-foreground border-success/30" },
  declined: { label: "Declined", cls: "bg-danger-soft text-danger border-danger/40" },
  expired: { label: "Expired", cls: "bg-warning-soft text-warning-foreground border-warning/40" },
};

export function SignatureBadge({ state, className }: { state: SignatureState; className?: string }) {
  const m = SIG_META[state];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        m.cls,
        className
      )}
    >
      {m.label}
    </span>
  );
}

export function SignatureStepper({ state }: { state: SignatureState }) {
  if (state === "not_required") return <span className="text-xs text-muted-foreground">Not required</span>;
  const steps: SignatureState[] = ["sent", "viewed", "signed"];
  const isDeclined = state === "declined";
  const currentIdx = steps.indexOf(state);
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => {
        const reached = !isDeclined && (currentIdx >= i || state === "signed");
        return (
          <div key={s} className="flex items-center gap-1">
            <div
              className={cn(
                "size-2 rounded-full",
                reached ? (s === "signed" ? "bg-success" : "bg-info") : "bg-muted-foreground/25"
              )}
            />
            {i < steps.length - 1 && (
              <div className={cn("h-px w-4", reached ? "bg-info/50" : "bg-border")} />
            )}
          </div>
        );
      })}
      {isDeclined && <SignatureBadge state="declined" className="ml-2" />}
    </div>
  );
}

// ---------- Category icon ----------

const CATEGORY_META: Record<DocumentCategory, { icon: LucideIcon; tone: string; label: string }> = {
  offer_letter: { icon: FileText, tone: "text-info bg-info-soft", label: "Offer" },
  contract: { icon: FileSignature, tone: "text-primary bg-secondary", label: "Contract" },
  performance_review: { icon: ClipboardCheck, tone: "text-warning-foreground bg-warning-soft", label: "Review" },
  compliance: { icon: ShieldCheck, tone: "text-success-foreground bg-success-soft", label: "Compliance" },
  payroll: { icon: Wallet, tone: "text-danger bg-danger-soft", label: "Payroll" },
  leave: { icon: CalendarDays, tone: "text-info bg-info-soft", label: "Leave" },
};

export function CategoryIcon({ category, className }: { category: DocumentCategory; className?: string }) {
  const m = CATEGORY_META[category];
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md",
        m.tone,
        className
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

export function CategoryTag({ category }: { category: DocumentCategory }) {
  const m = CATEGORY_META[category];
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", m.tone)}>
      {m.label}
    </span>
  );
}
