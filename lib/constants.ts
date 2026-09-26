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

// Categories are told apart by a coloured dot next to their name, never by
// colour alone. Hues come from the tone tokens so they hold up in both themes.
export const categoryDot: Record<ProjectCategory, string> = {
  OCC: "bg-tone-blue",
  HSE: "bg-tone-green",
  TRAINING: "bg-tone-amber",
  AI_PROJECTS: "bg-tone-violet",
  PERSONAL: "bg-tone-pink"
};

// Status and priority badges: an outlined label whose text (and dot, via
// Badge) carries the hue; the label itself always names the state.
export const statusTone: Record<ProjectStatus, string> = {
  IDEA: "text-tone-slate",
  PLANNED: "text-tone-slate",
  ACTIVE: "text-tone-blue",
  WAITING: "text-tone-amber",
  ON_HOLD: "text-tone-amber",
  COMPLETED: "text-tone-green",
  ARCHIVED: "text-tone-slate"
};

export const priorityTone: Record<TaskPriority, string> = {
  CRITICAL: "text-tone-red",
  HIGH: "text-tone-amber",
  MEDIUM: "text-tone-blue",
  LOW: "text-tone-slate"
};

export const taskStatusTone: Record<TaskStatus, string> = {
  TODO: "text-tone-slate",
  IN_PROGRESS: "text-tone-blue",
  BLOCKED: "text-tone-red",
  DONE: "text-tone-green"
};

export const recordTypeTone: Record<string, string> = {
  Project: "text-tone-blue",
  Task: "text-tone-violet",
  Note: "text-tone-green",
  Resource: "text-tone-amber"
};

// Dashboard navigation, grouped as the sidebar shows it. The first four
// Workspace items are also the phone tab bar; everything else sits under More.
export const navigationGroups = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Home", icon: "home" },
      { href: "/projects", label: "Projects", icon: "projects" },
      { href: "/tasks", label: "Tasks", icon: "tasks" },
      { href: "/notes", label: "Notes", icon: "notes" },
      { href: "/calendar", label: "Calendar", icon: "calendar" }
    ]
  },
  {
    label: "Insight",
    items: [
      { href: "/analytics", label: "Analytics", icon: "analytics" },
      { href: "/activity", label: "Activity", icon: "activity" },
      { href: "/ai-news", label: "AI News", icon: "news" }
    ]
  },
  {
    label: "Library",
    items: [{ href: "/resources", label: "Resources", icon: "resources" }]
  }
] as const;

export const settingsNavItem = { href: "/settings", label: "Settings", icon: "settings" } as const;

export type NavIcon =
  | (typeof navigationGroups)[number]["items"][number]["icon"]
  | typeof settingsNavItem.icon;

export type NavItem = { href: string; label: string; icon: NavIcon };
