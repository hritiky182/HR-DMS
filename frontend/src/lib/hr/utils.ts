import type { ExpiryStatus, Role } from "./types";

export function daysUntil(dateIso: string | undefined): number | null {
  if (!dateIso) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateIso);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

export function expiryStatus(dateIso: string | undefined, threshold = 30): ExpiryStatus {
  const d = daysUntil(dateIso);
  if (d === null) return "none";
  if (d < 0) return "expired";
  if (d <= threshold) return "expiring";
  return "valid";
}

export function formatDate(dateIso: string | undefined): string {
  if (!dateIso) return "—";
  return new Date(dateIso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateIso: string): string {
  return new Date(dateIso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(dateIso: string): string {
  const diff = Date.now() - new Date(dateIso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: "HR Admin",
  manager: "HR Manager",
  employee: "Employee",
};

export function can(role: Role, action: "upload" | "delete" | "configure" | "send_signature" | "view_audit" | "bulk"): boolean {
  if (role === "admin") return true;
  if (role === "manager") {
    return action === "upload" || action === "send_signature";
  }
  return false;
}
