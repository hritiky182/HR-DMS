import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FileQuestion } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-14 text-center",
        className
      )}
    >
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm">
        {icon ?? <FileQuestion className="size-5" />}
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-lg border">
      <div className="border-b bg-muted/40 px-4 py-2">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid gap-4 px-4 py-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${40 + ((r + c) * 13) % 40}%` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
