import { cn } from "@/lib/utils";
import { initials } from "@/lib/hr/utils";
import type { Employee } from "@/lib/hr/types";

export function EmployeeAvatar({
  employee,
  size = 32,
  className,
}: {
  employee: Pick<Employee, "name" | "avatarColor">;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-full font-medium text-white", className)}
      style={{
        width: size,
        height: size,
        backgroundColor: employee.avatarColor,
        fontSize: size * 0.4,
      }}
      aria-hidden="true"
    >
      {initials(employee.name)}
    </span>
  );
}
