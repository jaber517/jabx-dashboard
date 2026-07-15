import { Ban, CheckCircle2, Circle, Loader } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types";

const config: Record<TaskStatus, { Icon: typeof Circle; tone: string; label: string }> = {
  TODO: { Icon: Circle, tone: "text-muted-foreground", label: "To do" },
  IN_PROGRESS: { Icon: Loader, tone: "text-blue-600 dark:text-blue-300", label: "In progress" },
  BLOCKED: { Icon: Ban, tone: "text-danger", label: "Blocked" },
  DONE: { Icon: CheckCircle2, tone: "text-emerald-600 dark:text-emerald-300", label: "Done" }
};

export function TaskStatusIcon({
  status,
  className
}: {
  status: TaskStatus;
  className?: string;
}) {
  const { Icon, tone, label } = config[status] ?? config.TODO;
  return <Icon className={cn("h-4 w-4", tone, className)} aria-label={label} />;
}
