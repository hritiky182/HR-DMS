import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  CalendarClock,
  PenLine,
  ScrollText,
  Settings,
  FileStack,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/lib/hr/role-context";
import type { Role } from "@/lib/hr/types";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

export const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "employee"] },
  { to: "/employees", label: "Employees", icon: Users, roles: ["admin", "manager"] },
  { to: "/documents", label: "Document Repository", icon: FolderOpen, roles: ["admin", "manager"] },
  { to: "/expiry", label: "Expiry & Compliance", icon: CalendarClock, roles: ["admin", "manager"] },
  { to: "/signatures", label: "E-Signatures", icon: PenLine, roles: ["admin", "manager", "employee"] },
  { to: "/audit", label: "Audit Log", icon: ScrollText, roles: ["admin"] },
  { to: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
];

export function AppSidebar() {
  const { role } = useRole();
  const { pathname } = useLocation();
  const items = NAV.filter((n) => n.roles.includes(role));

  return (
    <aside className="sticky top-0 h-screen hidden md:flex md:w-60 md:flex-col md:shrink-0 border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <FileStack className="size-4" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">HR-DMS</div>
          <div className="text-[11px] text-muted-foreground">Document Management</div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 p-2">
        {items.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3 text-xs text-muted-foreground">
        <div className="font-medium text-foreground">Acme Corp</div>
        <div>© 2026 · v1.0</div>
      </div>
    </aside>
  );
}
