import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/hr/AppSidebar";
import { TopBar } from "@/components/hr/TopBar";

export function AppLayout() {
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
