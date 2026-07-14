import { useState, useRef, useEffect } from "react";
import { Search, Bell, Upload, X, FileText, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/lib/hr/role-context";
import { ROLE_LABEL, can, formatDate, daysUntil, expiryStatus } from "@/lib/hr/utils";
import type { Role, HRDocument, Employee } from "@/lib/hr/types";
import { EmployeeAvatar } from "./EmployeeAvatar";
import { UploadDialog } from "./UploadDialog";
import { DocumentDetailDialog } from "./DocumentDetailDialog";
import { useQuery } from "@/lib/query";
import { listDocuments, listEmployees } from "@/lib/hr/api";

export function TopBar() {
  const { role, setRole, user } = useRole();
  const navigate = useNavigate();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [activePreviewDoc, setActivePreviewDoc] = useState<HRDocument | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const { data: docs = [] } = useQuery({ queryKey: ["documents"], queryFn: () => listDocuments() });
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: () => listEmployees() });

  const alerts = docs
    .filter((d) => expiryStatus(d.expiresAt) === "expiring" || expiryStatus(d.expiresAt) === "expired")
    .slice(0, 6);

  // Filter lists based on search query
  const matchedEmployees = searchQuery
    ? employees.filter((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 4)
    : [];

  const matchedDocs = searchQuery
    ? docs.filter((d) => d.filename.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 4)
    : [];

  const hasResults = matchedEmployees.length > 0 || matchedDocs.length > 0;

  // Handle click outside to close search results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectEmployee = (empId: string) => {
    navigate(`/employees/${empId}`);
    setSearchQuery("");
    setShowResults(false);
  };

  const handleSelectDoc = (docItem: HRDocument) => {
    setActivePreviewDoc(docItem);
    setSearchQuery("");
    setShowResults(false);
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
      {/* Wired Stateful Global Search Bar */}
      <div ref={containerRef} className="relative w-full max-w-md">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search employees, documents…"
            className="h-9 pl-8 pr-8"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setShowResults(false);
              }}
              className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Floating results list */}
        {showResults && searchQuery && (
          <div className="absolute left-0 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg z-50 p-2 space-y-3 max-h-[360px] overflow-y-auto">
            {!hasResults ? (
              <p className="text-xs text-muted-foreground p-2 text-center">No results match "{searchQuery}"</p>
            ) : (
              <>
                {matchedEmployees.length > 0 && (
                  <div>
                    <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Employees</p>
                    <div className="space-y-0.5 mt-1">
                      {matchedEmployees.map((e) => (
                        <button
                          key={e.id}
                          onClick={() => handleSelectEmployee(e.id)}
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground"
                        >
                          <EmployeeAvatar employee={e} size={20} />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{e.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{e.title} · {e.department}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {matchedDocs.length > 0 && (
                  <div>
                    <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Documents</p>
                    <div className="space-y-0.5 mt-1">
                      {matchedDocs.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => handleSelectDoc(d)}
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground"
                        >
                          <FileText className="size-3.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{d.filename}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{d.category.replace("_", " ")}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {can(role, "upload") && (
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Upload className="mr-1.5 size-4" /> Upload
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Notifications" className="relative">
              <Bell className="size-4" />
              {alerts.length > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-danger-foreground">
                  {alerts.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Expiry alerts</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {alerts.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">All clear.</div>
            ) : (
              alerts.map((d) => {
                const emp = employees.find((e) => e.id === d.employeeId);
                const days = daysUntil(d.expiresAt);
                return (
                  <DropdownMenuItem key={d.id} className="flex flex-col items-start gap-0.5" onClick={() => handleSelectDoc(d)}>
                    <span className="truncate text-sm font-medium">{d.filename}</span>
                    <span className="text-xs text-muted-foreground">
                      {emp?.name} · {days !== null && days < 0 ? `Expired ${Math.abs(days)}d ago` : `Expires in ${days}d`}
                    </span>
                  </DropdownMenuItem>
                );
              })
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Select value={role} onValueChange={(v) => setRole(v as Role)}>
          <SelectTrigger className="h-9 w-[160px]" aria-label="Switch role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">HR Admin</SelectItem>
            <SelectItem value="manager">HR Manager</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md border px-2 py-1 hover:bg-muted">
              <EmployeeAvatar employee={{ name: user.name, avatarColor: "oklch(0.7 0.14 250)" }} size={26} />
              <div className="hidden text-left leading-tight md:block">
                <div className="text-xs font-medium">{user.name}</div>
                <div className="text-[10px] text-muted-foreground">{ROLE_LABEL[role]}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {user.name}
              <div className="text-xs font-normal text-muted-foreground">{ROLE_LABEL[role]} (demo)</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} employees={employees} />

      {activePreviewDoc && (
        <DocumentDetailDialog
          open={!!activePreviewDoc}
          onOpenChange={(v) => !v && setActivePreviewDoc(null)}
          doc={activePreviewDoc}
          employee={employees.find((e) => e.id === activePreviewDoc.employeeId)}
        />
      )}
    </header>
  );
}

// Suppress unused imports warnings for helpers used elsewhere via re-export.
void Badge; void formatDate;
