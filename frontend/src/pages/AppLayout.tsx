import { Outlet, Navigate } from "react-router-dom";
import { AppSidebar } from "@/components/hr/AppSidebar";
import { TopBar } from "@/components/hr/TopBar";
import { useRole } from "@/lib/hr/role-context";

export function AppLayout() {
  const { isAuthenticated } = useRole();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
