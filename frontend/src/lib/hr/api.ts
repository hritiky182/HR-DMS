// Typed mock API. Every function returns a Promise so a real backend can be
// dropped in later without touching component code.

import { AUDIT_LOG, DOCUMENTS, EMPLOYEES, CURRENT_USER_BY_ROLE } from "./mock-data";
import type {
  AuditEntry,
  DocumentCategory,
  Employee,
  HRDocument,
  Role,
  SignatureState,
} from "./types";
import { CATEGORY_LIST, CATEGORY_LABEL } from "./types";
import { expiryStatus } from "./utils";

// Mutable in-memory stores (so uploads/replacements persist during a session)
const employees: Employee[] = [...EMPLOYEES];
const documents: HRDocument[] = [...DOCUMENTS];
const audit: AuditEntry[] = [...AUDIT_LOG];

function delay<T>(v: T, ms = 200): Promise<T> {
  return new Promise((r) => setTimeout(() => r(v), ms));
}

export async function listEmployees(): Promise<Employee[]> {
  return delay(employees);
}

export async function getEmployee(id: string): Promise<Employee | undefined> {
  return delay(employees.find((e) => e.id === id));
}

export async function listDocuments(filter?: {
  employeeId?: string;
  category?: DocumentCategory;
}): Promise<HRDocument[]> {
  let out = documents;
  if (filter?.employeeId) out = out.filter((d) => d.employeeId === filter.employeeId);
  if (filter?.category) out = out.filter((d) => d.category === filter.category);
  return delay(out);
}

export async function getDocument(id: string): Promise<HRDocument | undefined> {
  return delay(documents.find((d) => d.id === id));
}

export async function listAudit(filter?: { employeeId?: string; action?: string }): Promise<AuditEntry[]> {
  let out = audit;
  if (filter?.employeeId) out = out.filter((a) => a.employeeId === filter.employeeId);
  if (filter?.action && filter.action !== "all") out = out.filter((a) => a.action === filter.action);
  return delay([...out].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()));
}

// Computed helpers

export interface EmployeeStats {
  totalDocs: number;
  completeness: number; // 0..1
  missingCategories: DocumentCategory[];
  expiringCount: number;
  expiredCount: number;
  pendingSignatures: number;
}

const REQUIRED_FOR_COMPLETE: DocumentCategory[] = [
  "offer_letter",
  "contract",
  "compliance",
];

export function computeEmployeeStats(employeeId: string): EmployeeStats {
  const docs = documents.filter((d) => d.employeeId === employeeId);
  const present = new Set(docs.map((d) => d.category));
  const missing = REQUIRED_FOR_COMPLETE.filter((c) => !present.has(c));
  const totalRequired = REQUIRED_FOR_COMPLETE.length;
  const have = totalRequired - missing.length;
  return {
    totalDocs: docs.length,
    completeness: have / totalRequired,
    missingCategories: missing,
    expiringCount: docs.filter((d) => expiryStatus(d.expiresAt) === "expiring").length,
    expiredCount: docs.filter((d) => expiryStatus(d.expiresAt) === "expired").length,
    pendingSignatures: docs.filter((d) => d.signatureState === "sent" || d.signatureState === "viewed").length,
  };
}

export function computeGlobalStats() {
  const activeEmployees = employees.filter((e) => e.status === "active").length;
  const expiring = documents.filter((d) => expiryStatus(d.expiresAt) === "expiring").length;
  const expired = documents.filter((d) => expiryStatus(d.expiresAt) === "expired").length;
  const pendingSig = documents.filter(
    (d) => d.signatureState === "sent" || d.signatureState === "viewed"
  ).length;
  const missingCompliance = employees.filter((e) => e.status === "active" && computeEmployeeStats(e.id).missingCategories.length > 0).length;
  return { activeEmployees, expiring, expired, pendingSig, missingCompliance };
}

export interface UploadInput {
  employeeId: string;
  category: DocumentCategory;
  filename: string;
  expiresAt?: string;
  signatureRequired?: boolean;
  signer?: string;
  actor: string;
  actorRole: Role;
}

export async function uploadDocument(input: UploadInput): Promise<HRDocument> {
  const id = `d${Math.floor(Math.random() * 100000)}`;
  const now = new Date().toISOString();
  const doc: HRDocument = {
    id,
    employeeId: input.employeeId,
    category: input.category,
    filename: input.filename,
    sizeKb: 300,
    uploadedAt: now,
    uploadedBy: input.actor,
    expiresAt: input.expiresAt,
    signatureState: input.signatureRequired ? "sent" : "not_required",
    signer: input.signer,
    signatureSentAt: input.signatureRequired ? now : undefined,
    signatureEvents: input.signatureRequired
      ? [{ actor: input.actor, action: "sent", at: now }]
      : [],
    versions: [{ version: 1, uploadedAt: now, uploadedBy: input.actor, filename: input.filename, sizeKb: 300 }],
  };
  documents.unshift(doc);
  audit.unshift({
    id: `a${Math.floor(Math.random() * 100000)}`,
    at: now,
    actor: input.actor,
    actorRole: input.actorRole,
    action: "upload",
    employeeId: input.employeeId,
    documentId: id,
    documentName: input.filename,
  });
  return delay(doc, 400);
}

export async function replaceDocument(id: string, filename: string, actor: string, actorRole: Role, expiresAt?: string): Promise<HRDocument | undefined> {
  const doc = documents.find((d) => d.id === id);
  if (!doc) return delay(undefined);
  const nextVersion = doc.versions.length + 1;
  const now = new Date().toISOString();
  doc.versions = [...doc.versions, { version: nextVersion, uploadedAt: now, uploadedBy: actor, filename, sizeKb: doc.sizeKb }];
  doc.filename = filename;
  doc.uploadedAt = now;
  doc.uploadedBy = actor;
  if (expiresAt) {
    doc.expiresAt = expiresAt;
  }
  audit.unshift({
    id: `a${Math.floor(Math.random() * 100000)}`,
    at: now,
    actor,
    actorRole,
    action: "replace",
    employeeId: doc.employeeId,
    documentId: id,
    documentName: filename,
    meta: `v${nextVersion - 1} → v${nextVersion}`,
  });
  return delay(doc);
}

export async function deleteDocument(id: string, actor: string, actorRole: Role): Promise<boolean> {
  const idx = documents.findIndex((d) => d.id === id);
  if (idx === -1) return delay(false);
  const [doc] = documents.splice(idx, 1);
  audit.unshift({
    id: `a${Math.floor(Math.random() * 100000)}`,
    at: new Date().toISOString(),
    actor,
    actorRole,
    action: "delete",
    employeeId: doc.employeeId,
    documentName: doc.filename,
  });
  return delay(true);
}

export async function setSignatureState(
  id: string,
  state: SignatureState,
  actor: string,
  actorRole: Role
): Promise<HRDocument | undefined> {
  const doc = documents.find((d) => d.id === id);
  if (!doc) return delay(undefined);
  const now = new Date().toISOString();
  doc.signatureState = state;
  const evAction = state === "signed" ? "signed" : state === "declined" ? "declined" : state === "viewed" ? "viewed" : "sent";
  doc.signatureEvents = [
    ...doc.signatureEvents,
    { actor, action: evAction, at: now, ip: "10.0.4.22", device: "Chrome / macOS" },
  ];
  audit.unshift({
    id: `a${Math.floor(Math.random() * 100000)}`,
    at: now,
    actor,
    actorRole,
    action: state === "signed" ? "signature_signed" : state === "declined" ? "signature_declined" : "signature_sent",
    employeeId: doc.employeeId,
    documentId: id,
    documentName: doc.filename,
  });
  return delay(doc);
}

export async function sendReminder(documentId: string, actor: string, actorRole: Role): Promise<boolean> {
  const doc = documents.find((d) => d.id === documentId);
  if (!doc) return delay(false);
  audit.unshift({
    id: `a${Math.floor(Math.random() * 100000)}`,
    at: new Date().toISOString(),
    actor,
    actorRole,
    action: "reminder_sent",
    employeeId: doc.employeeId,
    documentId,
    documentName: doc.filename,
  });
  return delay(true);
}

// --- Settings Customization Mock DB ---
export let categoryVisibility: Record<DocumentCategory, boolean> = {
  offer_letter: true,
  contract: true,
  performance_review: true,
  compliance: true,
  payroll: true,
  leave: true,
};

export let alertThresholds = {
  first: 90,
  second: 60,
  final: 30
};

export const employeeRoles: Record<string, Role> = {};

export function getEmployeeRole(empId: string): Role {
  if (employeeRoles[empId]) return employeeRoles[empId];
  const idx = employees.findIndex((e) => e.id === empId);
  if (idx === 0) return "admin";
  if (idx > 0 && idx < 3) return "manager";
  return "employee";
}

export async function setEmployeeRole(empId: string, role: Role) {
  employeeRoles[empId] = role;
  const emp = employees.find((e) => e.id === empId);
  if (emp) {
    audit.unshift({
      id: `a${Math.floor(Math.random() * 100000)}`,
      at: new Date().toISOString(),
      actor: "System Settings",
      actorRole: "admin",
      action: "edit",
      employeeId: empId,
      meta: `Updated ${emp.name}'s role to ${role}`,
    });
  }
  return delay(true);
}

export async function getCategoryVisibility() {
  return delay(categoryVisibility);
}

export async function updateCategoryVisibility(category: DocumentCategory, visible: boolean) {
  categoryVisibility[category] = visible;
  return delay(categoryVisibility);
}

export async function getAlertThresholds() {
  return delay(alertThresholds);
}

export async function updateAlertThresholds(thresholds: { first: number; second: number; final: number }) {
  alertThresholds = { ...thresholds };
  return delay(alertThresholds);
}

export { CATEGORY_LIST, CATEGORY_LABEL, CURRENT_USER_BY_ROLE };
