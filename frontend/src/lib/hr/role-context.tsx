import { createContext, useContext, useState, type ReactNode } from "react";
import type { Role } from "./types";
import { CURRENT_USER_BY_ROLE } from "./mock-data";

interface RoleCtx {
  role: Role;
  setRole: (r: Role) => void;
  user: { name: string; employeeId: string };
}

const Ctx = createContext<RoleCtx | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("admin");
  const user = CURRENT_USER_BY_ROLE[role];
  return <Ctx.Provider value={{ role, setRole, user }}>{children}</Ctx.Provider>;
}

export function useRole(): RoleCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRole outside provider");
  return v;
}
