import type {
  ProjectCategory,
  ProjectStatus,
  TaskPriority,
  TaskStatus
} from "@/types";

export const categoryLabels: Record<ProjectCategory, string> = {
  OCC: "OCC",
  HSE: "HSE",
  TRAINING: "Training",
  AI_PROJECTS: "AI Projects",
  PERSONAL: "Personal"
};

export const categoryDescriptions: Record<ProjectCategory, string> = {
  OCC: "Operational control, site coordination, and execution tracking.",
  HSE: "Health, safety, environment, and compliance workstreams.",
  TRAINING: "Capability development, certifications, and learning plans.",
  AI_PROJECTS: "Automation, AI workflows, tooling, and prototypes.",
  PERSONAL: "Life admin, personal goals, and non-work projects."
};

export const statusLabels: Record<ProjectStatus, string> = {
  IDEA: "Idea",
  PLANNED: "Planned",
  ACTIVE: "Active",
  WAITING: "Waiting",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived"
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  DONE: "Done"
};

export const priorityLabels: Record<TaskPriority, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low"
};

export const categoryAccent: Record<ProjectCategory, string> = {
  OCC: "from-blue-500/20 via-blue-500/5 to-transparent",
  HSE: "from-emerald-500/20 via-emerald-500/5 to-transparent",
  TRAINING: "from-amber-500/20 via-amber-500/5 to-transparent",
  AI_PROJECTS: "from-cyan-500/20 via-cyan-500/5 to-transparent",
  PERSONAL: "from-rose-500/20 via-rose-500/5 to-transparent"
};

export const categoryDot: Record<ProjectCategory, string> = {
  OCC: "bg-blue-500",
  HSE: "bg-emerald-500",
  TRAINING: "bg-amber-500",
  AI_PROJECTS: "bg-cyan-500",
  PERSONAL: "bg-rose-500"
};

export const statusTone: Record<ProjectStatus, string> = {
  IDEA: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  PLANNED: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  ACTIVE: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  WAITING: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  ON_HOLD: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  COMPLETED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  ARCHIVED: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300"
};

export const priorityTone: Record<TaskPriority, string> = {
  CRITICAL: "bg-red-500/10 text-red-700 dark:text-red-300",
  HIGH: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  MEDIUM: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  LOW: "bg-slate-500/10 text-slate-700 dark:text-slate-300"
};

export const taskStatusTone: Record<TaskStatus, string> = {
  TODO: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  IN_PROGRESS: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  BLOCKED: "bg-red-500/10 text-red-700 dark:text-red-300",
  DONE: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
};

export const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/tasks", label: "Tasks" },
  { href: "/notes", label: "Notes" },
  { href: "/analytics", label: "Analytics" },
  { href: "/activity", label: "Activity" },
  { href: "/calendar", label: "Calendar" },
  { href: "/resources", label: "Resources" },
  { href: "/settings", label: "Settings" }
] as const;

export const quickActions = [
  {
    title: "Add Project",
    description: "Create a new initiative and assign ownership, category, and target dates.",
    href: "/projects"
  },
  {
    title: "Add Task",
    description: "Capture priority work with due dates, blockers, and project context.",
    href: "/tasks"
  },
  {
    title: "Add Note",
    description: "Store ideas, meeting outcomes, and references in the vault.",
    href: "/notes"
  },
  {
    title: "View This Week",
    description: "Focus on near-term deadlines, milestones, and execution windows.",
    href: "/calendar"
  },
  {
    title: "View Blocked Items",
    description: "See tasks and projects waiting on approvals, dependencies, or inputs.",
    href: "/tasks?status=BLOCKED"
  },
  {
    title: "Search Everything",
    description: "Jump quickly across projects, tasks, notes, and linked resources.",
    href: "/notes"
  }
] as const;
