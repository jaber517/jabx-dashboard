import { db } from "@/lib/db";
import type {
  ActivityRecord,
  MilestoneRecord,
  NoteRecord,
  ProjectRecord,
  ResourceRecord,
  TaskRecord
} from "@/types";

async function withFallback<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await operation();
  } catch {
    return fallback;
  }
}

function mapProjectLink(project: { id: string; title: string; slug: string } | null) {
  if (!project) {
    return null;
  }

  return {
    id: project.id,
    title: project.title,
    slug: project.slug
  };
}

function mapTask(task: {
  id: string;
  title: string;
  description: string;
  status: TaskRecord["status"];
  priority: TaskRecord["priority"];
  dueDate: Date | null;
  blocked: boolean;
  category: TaskRecord["category"];
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  imageUrl?: string | null;
  projectId: string | null;
  project?: { id: string; title: string; slug: string } | null;
}): TaskRecord {
  return {
    ...task,
    dueDate: task.dueDate?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    project: mapProjectLink(task.project ?? null)
  };
}

function mapNote(note: {
  id: string;
  title: string;
  content: string;
  tags: string;
  category: NoteRecord["category"];
  imageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  projectId: string | null;
  project?: { id: string; title: string; slug: string } | null;
}): NoteRecord {
  return {
    ...note,
    tags: note.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    project: mapProjectLink(note.project ?? null)
  };
}

function mapMilestone(milestone: {
  id: string;
  title: string;
  summary: string;
  status: MilestoneRecord["status"];
  date: Date;
  category: MilestoneRecord["category"];
  createdAt: Date;
  updatedAt: Date;
  projectId: string | null;
  project?: { id: string; title: string; slug: string } | null;
}): MilestoneRecord {
  return {
    ...milestone,
    date: milestone.date.toISOString(),
    createdAt: milestone.createdAt.toISOString(),
    updatedAt: milestone.updatedAt.toISOString(),
    project: mapProjectLink(milestone.project ?? null)
  };
}

function mapResource(resource: {
  id: string;
  title: string;
  description: string;
  url: string;
  type: string;
  category: ResourceRecord["category"];
  createdAt: Date;
  updatedAt: Date;
  projectId: string | null;
  project?: { id: string; title: string; slug: string } | null;
}): ResourceRecord {
  return {
    ...resource,
    createdAt: resource.createdAt.toISOString(),
    updatedAt: resource.updatedAt.toISOString(),
    project: mapProjectLink(resource.project ?? null)
  };
}

function mapActivity(activity: {
  id: string;
  action: string;
  description: string;
  entityType: string;
  category: ActivityRecord["category"];
  createdAt: Date;
  projectId: string | null;
  project?: { id: string; title: string; slug: string } | null;
}): ActivityRecord {
  return {
    ...activity,
    createdAt: activity.createdAt.toISOString(),
    project: mapProjectLink(activity.project ?? null)
  };
}

function mapProject(project: {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: ProjectRecord["category"];
  status: ProjectRecord["status"];
  priority: ProjectRecord["priority"];
  progress: number;
  owner: string | null;
  imageUrl?: string | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tasks?: Parameters<typeof mapTask>[0][];
  notes?: Parameters<typeof mapNote>[0][];
  milestones?: Parameters<typeof mapMilestone>[0][];
  resources?: Parameters<typeof mapResource>[0][];
  activities?: Parameters<typeof mapActivity>[0][];
}): ProjectRecord {
  return {
    ...project,
    dueDate: project.dueDate?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    progress: deriveProjectProgress(project.status, project.tasks, project.progress),
    tasks: project.tasks?.map(mapTask),
    notes: project.notes?.map(mapNote),
    milestones: project.milestones?.map(mapMilestone),
    resources: project.resources?.map(mapResource),
    activities: project.activities?.map(mapActivity)
  };
}

// A project's progress bar should reflect the work actually linked to it: once
// tasks are attached, their completion ratio drives the number instead of a
// number someone typed in once and forgot about. Marking a project completed
// always shows 100 regardless of task state, since that's an explicit override.
function deriveProjectProgress(
  status: ProjectRecord["status"],
  tasks: { status: TaskRecord["status"] }[] | undefined,
  storedProgress: number
): number {
  if (status === "COMPLETED") {
    return 100;
  }

  if (tasks && tasks.length > 0) {
    const done = tasks.filter((task) => task.status === "DONE").length;
    return Math.round((done / tasks.length) * 100);
  }

  return storedProgress;
}

export async function getHomePageData() {
  return withFallback(async () => {
    const [projects, tasks, notes, activities, milestones, resources] =
      await Promise.all([
        db.project.findMany({
          include: {
            tasks: true,
            milestones: true
          },
          orderBy: [{ updatedAt: "desc" }]
        }),
        db.task.findMany({
          include: {
            project: true
          },
          orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }]
        }),
        db.note.findMany({
          orderBy: [{ updatedAt: "desc" }]
        }),
        db.activity.findMany({
          include: {
            project: true
          },
          orderBy: [{ createdAt: "desc" }],
          take: 10
        }),
        db.milestone.findMany({
          include: {
            project: true
          },
          orderBy: [{ date: "asc" }]
        }),
        db.resourceLink.findMany({
          include: {
            project: true
          },
          orderBy: [{ createdAt: "desc" }]
        })
      ]);
      const typedProjects = projects.map((project) => ({
  ...project,
  category: project.category as ProjectRecord["category"],
  status: project.status as ProjectRecord["status"],
  priority: project.priority as ProjectRecord["priority"],
  tasks: (project.tasks ?? []).map((task) => ({
    ...task,
    status: task.status as TaskRecord["status"],
    priority: task.priority as TaskRecord["priority"],
  })),
}));
const typedTasks = tasks.map((task) => ({
  ...task,
  status: task.status as TaskRecord["status"],
  priority: task.priority as TaskRecord["priority"],
}));

return {
  projects: typedProjects.map((project) =>
    mapProject(project as Parameters<typeof mapProject>[0])
  ),
  tasks: typedTasks.map((task) =>
    mapTask(task as Parameters<typeof mapTask>[0])
  ),
  notes: notes.map((note) =>
    mapNote(note as Parameters<typeof mapNote>[0])
  ),
  activities: activities.map((activity) =>
    mapActivity(activity as Parameters<typeof mapActivity>[0])
  ),
  milestones: milestones.map((milestone) =>
    mapMilestone(milestone as Parameters<typeof mapMilestone>[0])
  ),
  resources: resources.map((resource) =>
    mapResource(resource as Parameters<typeof mapResource>[0])
  ),
};
  }, {
    projects: [],
    tasks: [],
    notes: [],
    activities: [],
    milestones: [],
    resources: [],
  });
}
export async function getProjectsData() {
  return withFallback(async () => {
    const projects = await db.project.findMany({
      include: {
        tasks: true,
        milestones: true,
        notes: {
          take: 3,
          orderBy: [{ updatedAt: "desc" }],
        },
      },
      orderBy: [{ updatedAt: "desc" }],
    });

    const typedProjects = projects.map((project) => ({
      ...project,
      category: project.category as ProjectRecord["category"],
      status: project.status as ProjectRecord["status"],
      priority: project.priority as ProjectRecord["priority"],
    }));

    return typedProjects.map(mapProject);
  }, [] as ProjectRecord[]);
}

export async function getProjectDetail(id: string) {
  return withFallback(async () => {
    const project = await db.project.findUnique({
      where: { id },
      include: {
        tasks: {
          orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }]
        },
        notes: {
          orderBy: [{ updatedAt: "desc" }]
        },
        milestones: {
          orderBy: [{ date: "asc" }]
        },
        resources: {
          orderBy: [{ createdAt: "desc" }]
        },
        activities: {
          orderBy: [{ createdAt: "desc" }]
        }
      }
    });

    return project ? mapProject(project) : null;
  }, null as ProjectRecord | null);
}

export async function getTasksData() {
  return withFallback(async () => {
    const tasks = await db.task.findMany({
      include: {
        project: true
      },
      orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }]
    });

    return tasks.map(mapTask);
  }, [] as TaskRecord[]);
}

export async function getTaskDetail(id: string) {
  return withFallback(async () => {
    const task = await db.task.findUnique({
      where: { id },
      include: { project: true }
    });

    return task ? mapTask(task as Parameters<typeof mapTask>[0]) : null;
  }, null as TaskRecord | null);
}

export async function getNotesData() {
  return withFallback(async () => {
    const notes = await db.note.findMany({
      include: {
        project: true
      },
      orderBy: [{ updatedAt: "desc" }]
    });

    return notes.map(mapNote);
  }, [] as NoteRecord[]);
}

export async function getNoteDetail(id: string) {
  return withFallback(async () => {
    const note = await db.note.findUnique({
      where: { id },
      include: { project: true }
    });

    return note ? mapNote(note as Parameters<typeof mapNote>[0]) : null;
  }, null as NoteRecord | null);
}

export type FeedItem = {
  id: string;
  type: "Project" | "Task" | "Note" | "Resource";
  title: string;
  description: string;
  category: ProjectRecord["category"];
  href: string;
  at: string;
  action: string;
};

// A live activity feed derived from the most recently touched records, so it
// always reflects real changes instead of a static seed table.
export async function getActivityData() {
  return withFallback(async () => {
    const [projects, tasks, notes, resources] = await Promise.all([
      db.project.findMany({ orderBy: [{ updatedAt: "desc" }], take: 15 }),
      db.task.findMany({ orderBy: [{ updatedAt: "desc" }], take: 15 }),
      db.note.findMany({ orderBy: [{ updatedAt: "desc" }], take: 15 }),
      db.resourceLink.findMany({ orderBy: [{ createdAt: "desc" }], take: 15 })
    ]);

    const wasCreated = (createdAt: Date, updatedAt: Date) =>
      Math.abs(updatedAt.getTime() - createdAt.getTime()) < 1000;

    const items: FeedItem[] = [
      ...projects.map((p) => ({
        id: `project-${p.id}`,
        type: "Project" as const,
        title: p.title,
        description: p.summary,
        category: p.category as ProjectRecord["category"],
        href: `/projects/${p.id}`,
        at: p.updatedAt.toISOString(),
        action: wasCreated(p.createdAt, p.updatedAt) ? "Project created" : "Project updated"
      })),
      ...tasks.map((t) => ({
        id: `task-${t.id}`,
        type: "Task" as const,
        title: t.title,
        description: t.description,
        category: t.category as ProjectRecord["category"],
        href: `/tasks/${t.id}`,
        at: t.updatedAt.toISOString(),
        action:
          t.status === "DONE"
            ? "Task completed"
            : wasCreated(t.createdAt, t.updatedAt)
              ? "Task created"
              : "Task updated"
      })),
      ...notes.map((n) => ({
        id: `note-${n.id}`,
        type: "Note" as const,
        title: n.title,
        description: n.content,
        category: n.category as ProjectRecord["category"],
        href: `/notes/${n.id}`,
        at: n.updatedAt.toISOString(),
        action: wasCreated(n.createdAt, n.updatedAt) ? "Note added" : "Note updated"
      })),
      ...resources.map((r) => ({
        id: `resource-${r.id}`,
        type: "Resource" as const,
        title: r.title,
        description: r.description,
        category: r.category as ProjectRecord["category"],
        href: r.url,
        at: r.createdAt.toISOString(),
        action: "Resource saved"
      }))
    ];

    return items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 25);
  }, [] as FeedItem[]);
}

export type CalendarItem = {
  id: string;
  type: "Project" | "Task";
  title: string;
  description: string;
  category: ProjectRecord["category"];
  status: string;
  href: string;
  dueDate: string;
};

// The calendar shows real work with a due date: projects and tasks.
export async function getCalendarData() {
  return withFallback(async () => {
    const [projects, tasks] = await Promise.all([
      db.project.findMany({ where: { dueDate: { not: null } }, orderBy: [{ dueDate: "asc" }] }),
      db.task.findMany({
        where: { dueDate: { not: null } },
        include: { project: true },
        orderBy: [{ dueDate: "asc" }]
      })
    ]);

    const items: CalendarItem[] = [
      ...projects.map((p) => ({
        id: `project-${p.id}`,
        type: "Project" as const,
        title: p.title,
        description: p.summary,
        category: p.category as ProjectRecord["category"],
        status: p.status,
        href: `/projects/${p.id}`,
        dueDate: (p.dueDate as Date).toISOString()
      })),
      ...tasks.map((t) => ({
        id: `task-${t.id}`,
        type: "Task" as const,
        title: t.title,
        description: t.description,
        category: t.category as ProjectRecord["category"],
        status: t.status,
        href: `/tasks/${t.id}`,
        dueDate: (t.dueDate as Date).toISOString()
      }))
    ];

    return items.sort((a, b) => Date.parse(a.dueDate) - Date.parse(b.dueDate));
  }, [] as CalendarItem[]);
}

export async function getResourcesData() {
  return withFallback(async () => {
    const resources = await db.resourceLink.findMany({
      include: {
        project: true
      },
      orderBy: [{ title: "asc" }]
    });

    return resources.map(mapResource);
  }, [] as ResourceRecord[]);
}

export async function getAnalyticsData() {
  return withFallback(async () => {
    const [projects, tasks] = await Promise.all([
      db.project.findMany({
        orderBy: [{ updatedAt: "desc" }]
      }),
      db.task.findMany({
        include: {
          project: true
        }
      })
    ]);

    return {
      projects: projects.map(mapProject),
      tasks: tasks.map(mapTask)
    };
  }, {
    projects: [] as ProjectRecord[],
    tasks: [] as TaskRecord[]
  });
}

export async function getSettingsStats() {
  return withFallback(
    async () => {
      const [projectCount, activeProjectCount, taskCount, doneTaskCount, noteCount, resourceCount] =
        await Promise.all([
          db.project.count(),
          db.project.count({ where: { status: { in: ["ACTIVE", "PLANNED", "WAITING"] } } }),
          db.task.count(),
          db.task.count({ where: { status: "DONE" } }),
          db.note.count(),
          db.resourceLink.count()
        ]);

      return { projectCount, activeProjectCount, taskCount, doneTaskCount, noteCount, resourceCount };
    },
    {
      projectCount: 0,
      activeProjectCount: 0,
      taskCount: 0,
      doneTaskCount: 0,
      noteCount: 0,
      resourceCount: 0
    }
  );
}
