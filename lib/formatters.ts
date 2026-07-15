import { format, formatDistanceToNow } from "date-fns";
import { categoryLabels, priorityLabels, statusLabels, taskStatusLabels } from "@/lib/constants";
import type { ProjectCategory, ProjectStatus, TaskPriority, TaskStatus } from "@/types";

export function formatDate(value: string | Date, pattern = "MMM d, yyyy") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, pattern);
}

export function formatRelativeDate(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return formatDistanceToNow(date, { addSuffix: true });
}

export function getCategoryLabel(category: ProjectCategory) {
  return categoryLabels[category];
}

export function getStatusLabel(status: ProjectStatus) {
  return statusLabels[status];
}

export function getPriorityLabel(priority: TaskPriority) {
  return priorityLabels[priority];
}

export function getTaskStatusLabel(status: TaskStatus) {
  return taskStatusLabels[status];
}
