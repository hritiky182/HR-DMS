import { createContext, useContext, useState, type ReactNode } from "react";
import type { Role } from "./types";
import { CURRENT_USER_BY_ROLE } from "./mock-data";

interface RoleCtx {
  role: Role;
  setRole: (r: Role) => void;
  user: { name: string; employeeId: string };
  isAuthenticated: boolean;
  login: (role: Role) => void;
  logout: () => void;
}

const Ctx = createContext<RoleCtx | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("hr_dms_auth") === "true";
  });
  const [role, setRoleState] = useState<Role>(() => {
    return (localStorage.getItem("hr_dms_role") as Role) || "admin";
  });

  const setRole = (r: Role) => {
    setRoleState(r);
    localStorage.setItem("hr_dms_role", r);
  };

  const login = (selectedRole: Role) => {
    setRoleState(selectedRole);
    setIsAuthenticated(true);
    localStorage.setItem("hr_dms_auth", "true");
    localStorage.setItem("hr_dms_role", selectedRole);
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("hr_dms_auth");
    localStorage.removeItem("hr_dms_role");
  };

  const user = CURRENT_USER_BY_ROLE[role];

  return (
    <Ctx.Provider value={{ role, setRole, user, isAuthenticated, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRole(): RoleCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRole outside provider");
  return v;
}
