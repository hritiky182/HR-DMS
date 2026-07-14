export type Role = "admin" | "manager" | "employee";

export type DocumentCategory =
  | "offer_letter"
  | "contract"
  | "performance_review"
  | "compliance"
  | "payroll"
  | "leave";

export const CATEGORY_LABEL: Record<DocumentCategory, string> = {
  offer_letter: "Offer Letters",
  contract: "Contracts",
  performance_review: "Performance Reviews",
  compliance: "Compliance Documents",
  payroll: "Payroll Files",
  leave: "Leave Documents",
};

export const CATEGORY_LIST: DocumentCategory[] = [
  "offer_letter",
  "contract",
  "performance_review",
  "compliance",
  "payroll",
  "leave",
];

export type SignatureState =
  | "not_required"
  | "sent"
  | "viewed"
  | "signed"
  | "declined"
  | "expired";

export type ExpiryStatus = "valid" | "expiring" | "expired" | "none";

export type EmploymentStatus = "active" | "exited";

export interface Employee {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  employeeCode: string;
  joinDate: string;
  status: EmploymentStatus;
  avatarColor: string;
  assignedManagerId?: string;
}

export interface DocumentVersion {
  version: number;
  uploadedAt: string;
  uploadedBy: string;
  filename: string;
  sizeKb: number;
}

export interface SignatureEvent {
  actor: string;
  action: "sent" | "viewed" | "signed" | "declined";
  at: string;
  ip?: string;
  device?: string;
}

export interface HRDocument {
  id: string;
  employeeId: string;
  category: DocumentCategory;
  filename: string;
  sizeKb: number;
  uploadedAt: string;
  uploadedBy: string;
  expiresAt?: string;
  signatureState: SignatureState;
  signer?: string;
  signatureSentAt?: string;
  signatureEvents: SignatureEvent[];
  versions: DocumentVersion[];
}

export type AuditAction =
  | "upload"
  | "view"
  | "download"
  | "edit"
  | "delete"
  | "replace"
  | "signature_sent"
  | "signature_signed"
  | "signature_declined"
  | "reminder_sent";

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  actorRole: Role;
  action: AuditAction;
  employeeId?: string;
  documentId?: string;
  documentName?: string;
  meta?: string;
}
