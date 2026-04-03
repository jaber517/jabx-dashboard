export const PROJECT_CATEGORIES = [
  "OCC",
  "HSE",
  "TRAINING",
  "AI_PROJECTS",
  "PERSONAL"
] as const;

export const PROJECT_STATUSES = [
  "IDEA",
  "PLANNED",
  "ACTIVE",
  "WAITING",
  "ON_HOLD",
  "COMPLETED",
  "ARCHIVED"
] as const;

export const TASK_PRIORITIES = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW"
] as const;

export const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "DONE"
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];

export type ProjectLink = {
  id: string;
  title: string;
  slug: string;
};

export type TaskRecord = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  blocked: boolean;
  category: ProjectCategory;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  projectId: string | null;
  project: ProjectLink | null;
};

export type NoteRecord = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: ProjectCategory;
  createdAt: string;
  updatedAt: string;
  projectId: string | null;
  project: ProjectLink | null;
};

export type MilestoneRecord = {
  id: string;
  title: string;
  summary: string;
  status: ProjectStatus;
  date: string;
  category: ProjectCategory;
  createdAt: string;
  updatedAt: string;
  projectId: string | null;
  project: ProjectLink | null;
};

export type ResourceRecord = {
  id: string;
  title: string;
  description: string;
  url: string;
  type: string;
  category: ProjectCategory;
  createdAt: string;
  updatedAt: string;
  projectId: string | null;
  project: ProjectLink | null;
};

export type ActivityRecord = {
  id: string;
  action: string;
  description: string;
  entityType: string;
  category: ProjectCategory;
  createdAt: string;
  projectId: string | null;
  project: ProjectLink | null;
};

export type ProjectRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  priority: TaskPriority;
  progress: number;
  owner: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  tasks?: TaskRecord[];
  notes?: NoteRecord[];
  milestones?: MilestoneRecord[];
  resources?: ResourceRecord[];
  activities?: ActivityRecord[];
};
