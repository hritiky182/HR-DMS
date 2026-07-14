import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { RoleProvider } from "@/lib/hr/role-context";
import { AppLayout } from "@/pages/AppLayout";
import { DashboardPage } from "@/pages/Dashboard";
import { EmployeesListPage } from "@/pages/Employees";
import { EmployeeDetailPage } from "@/pages/EmployeeDetail";
import { DocumentsRepoPage } from "@/pages/Documents";
import { ExpiryPage } from "@/pages/Expiry";
import { SignaturesPage } from "@/pages/Signatures";
import { AuditPage } from "@/pages/AuditLog";
import { SettingsPage } from "@/pages/Settings";
import { RoleGuard } from "@/pages/RoleGuard";
import { LoginPage } from "@/pages/Login";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "employees",
        element: (
          <RoleGuard allowedRoles={["admin", "manager"]}>
            <EmployeesListPage />
          </RoleGuard>
        ),
      },
      {
        path: "employees/:id",
        element: (
          <RoleGuard allowedRoles={["admin", "manager"]}>
            <EmployeeDetailPage />
          </RoleGuard>
        ),
      },
      {
        path: "documents",
        element: (
          <RoleGuard allowedRoles={["admin", "manager"]}>
            <DocumentsRepoPage />
          </RoleGuard>
        ),
      },
      {
        path: "expiry",
        element: (
          <RoleGuard allowedRoles={["admin", "manager"]}>
            <ExpiryPage />
          </RoleGuard>
        ),
      },
      {
        path: "signatures",
        element: <SignaturesPage />,
      },
      {
        path: "audit",
        element: (
          <RoleGuard allowedRoles={["admin"]}>
            <AuditPage />
          </RoleGuard>
        ),
      },
      {
        path: "settings",
        element: (
          <RoleGuard allowedRoles={["admin"]}>
            <SettingsPage />
          </RoleGuard>
        ),
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

import { Toaster } from "sonner";

export default function App() {
  return (
    <RoleProvider>
      <RouterProvider router={router} />
      <Toaster richColors closeButton position="top-right" />
    </RoleProvider>
  );
}
