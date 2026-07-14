import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useRole } from "@/lib/hr/role-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, User, Users, FileStack, Loader2, Sparkles } from "lucide-react";
import type { Role } from "@/lib/hr/types";

export function LoginPage() {
  const { isAuthenticated, login } = useRole();
  const [email, setEmail] = useState("hana@test.co");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState<Role | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulated authenticating latency
    setTimeout(() => {
      // Determine role from input (mock logic for demo)
      let resolvedRole: Role = "employee";
      const normalized = email.toLowerCase();
      if (normalized.includes("admin") || normalized === "hana@test.co") {
        resolvedRole = "admin";
      } else if (normalized.includes("manager") || normalized === "gabriel@test.co") {
        resolvedRole = "manager";
      }

      login(resolvedRole);
      setLoading(false);
    }, 1000);
  };

  const handleQuickLogin = (role: Role) => {
    setLoadingRole(role);
    setTimeout(() => {
      login(role);
      setLoadingRole(null);
    }, 1000);
  };

  return (
    <div className="flex min-h-screen w-full select-none flex-col md:flex-row bg-background">
      {/* Left Screen: Product Highlight Column */}
      <div className="relative hidden w-full flex-col justify-between bg-zinc-950 p-10 text-white md:flex md:w-1/2 overflow-hidden border-r border-zinc-800">
        {/* Custom CSS Grid Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />

        {/* Colorful Gradient Blur in bottom left */}
        <div className="absolute -bottom-40 -left-40 size-96 rounded-full bg-blue-500/10 blur-[128px]" />

        <div className="relative z-10 flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileStack className="size-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">HR-DMS</span>
        </div>

        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/5 px-3 py-1 text-xs font-medium text-blue-400">
            <Sparkles className="size-3.5" /> Compliance & E-Signature Hub
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl leading-none">
            Secure documents, frictionless signatures.
          </h1>
          <p className="text-zinc-400 leading-relaxed">
            The intelligent portal for managing employee lifecycle compliance, version-controlled records, and digital consents in one secure repository.
          </p>

          {/* Compliance Stats Cards Illustration */}
          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">COMPLIANCE STATE</p>
              <p className="mt-2 text-2xl font-bold text-emerald-400">98.4%</p>
              <p className="text-xs text-zinc-400 mt-1">Audit readiness score</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">SIGNATURE SPEED</p>
              <p className="mt-2 text-2xl font-bold text-blue-400">&lt; 4 Hours</p>
              <p className="text-xs text-zinc-400 mt-1">Average turnaround</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-zinc-500 font-medium">
          Acme Corporation Enterprise Portal · v1.0.0
        </div>
      </div>

      {/* Right Screen: Authentication Form */}
      <div className="flex w-full items-center justify-center p-6 md:w-1/2 md:p-12">
        <div className="w-full max-w-[400px] space-y-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground mx-auto md:mx-0 md:hidden mb-4">
              <FileStack className="size-5" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Sign in to manage employee records and compliance files.
            </p>
          </div>

          <form onSubmit={handleFormLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || !!loadingRole}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-xs font-semibold text-primary hover:underline">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || !!loadingRole}
                className="h-10"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10 font-semibold"
              disabled={loading || !!loadingRole}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Quick-Access Demo Roles Section */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-semibold tracking-wider">
                Or Sign In As
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <button
              onClick={() => handleQuickLogin("admin")}
              disabled={loading || !!loadingRole}
              className="flex items-center justify-between rounded-lg border bg-card p-3 text-left hover:bg-accent/60 transition-all duration-150 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
                  <ShieldCheck className="size-4.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold">Hana Ito</div>
                  <div className="text-[10px] text-muted-foreground">HR Admin (Full Permissions)</div>
                </div>
              </div>
              {loadingRole === "admin" ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : (
                <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">Admin</span>
              )}
            </button>

            <button
              onClick={() => handleQuickLogin("manager")}
              disabled={loading || !!loadingRole}
              className="flex items-center justify-between rounded-lg border bg-card p-3 text-left hover:bg-accent/60 transition-all duration-150 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-blue-500/10 text-blue-600">
                  <Users className="size-4.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold">Gabriel Silva</div>
                  <div className="text-[10px] text-muted-foreground">HR Manager (Employee Docs)</div>
                </div>
              </div>
              {loadingRole === "manager" ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : (
                <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">Manager</span>
              )}
            </button>

            <button
              onClick={() => handleQuickLogin("employee")}
              disabled={loading || !!loadingRole}
              className="flex items-center justify-between rounded-lg border bg-card p-3 text-left hover:bg-accent/60 transition-all duration-150 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
                  <User className="size-4.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold">Amara Okafor</div>
                  <div className="text-[10px] text-muted-foreground">Employee (View & E-Sign Only)</div>
                </div>
              </div>
              {loadingRole === "employee" ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : (
                <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">Employee</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
