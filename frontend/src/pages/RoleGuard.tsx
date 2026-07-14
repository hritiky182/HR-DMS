import React from "react";
import { Navigate } from "react-router-dom";
import { useRole } from "@/lib/hr/role-context";
import type { Role } from "@/lib/hr/types";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { role } = useRole();

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
