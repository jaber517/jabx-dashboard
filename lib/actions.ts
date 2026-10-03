"use server";

import { revalidatePath } from "next/cache";
import { assertAuthed } from "@/lib/auth";
import { db } from "@/lib/db";
import { fileStorageEnabled, removePhoto, storePhoto } from "@/lib/files";
import { dayKey, todayKey } from "@/lib/dates";
import { asRepeat, nextDueDate } from "@/lib/repeat";
import {
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES
} from "@/types";

export type CreateResult = {
  ok: boolean;
  error?: string;
};

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

type PhotoFolder = "projects" | "tasks" | "notes";

// A photo from the form: saved to private file storage when it's configured
// (see lib/files.ts), otherwise kept inline as a data: URL.
async function readImage(formData: FormData, folder: PhotoFolder): Promise<string | null> {
  const file = formData.get("photo");

  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("The uploaded file must be an image.");
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Please use an image under 4MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (fileStorageEnabled()) return storePhoto(buffer, file.type, folder);
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}

function requireText(formData: FormData, field: string, label: string): string {
  const value = formData.get(field);

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }

  return value.trim();
}

function optionalText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

// Status plus the fields that follow from it: BLOCKED sets the blocked flag,
// DONE stamps completedAt. Returns nothing when the form has no status field.
function statusFields(formData: FormData) {
  const value = formData.get("status");
  if (typeof value !== "string" || !(TASK_STATUSES as readonly string[]).includes(value)) return {};
  const status = value as (typeof TASK_STATUSES)[number];
  return { status, blocked: status === "BLOCKED", completedAt: status === "DONE" ? new Date() : null };
}

function optionalChoice<T extends readonly string[]>(
  formData: FormData,
  field: string,
  allowed: T,
  fallback: T[number]
): T[number] {
  const value = formData.get(field);
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T[number])
    : fallback;
}

function optionalDate(formData: FormData, field: string): Date | null {
  const value = formData.get(field);

  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function optionalProjectId(formData: FormData): string | null {
  const value = formData.get("projectId");
  return typeof value === "string" && value.length > 0 ? value : null;
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base || "project"}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createProject(
  _prev: CreateResult,
  formData: FormData
): Promise<CreateResult> {
  try {
    await assertAuthed();
    const title = requireText(formData, "title", "Title");
    const description = requireText(formData, "description", "Description");
    const imageUrl = await readImage(formData, "projects");

    await db.project.create({
      data: {
        slug: slugify(title),
        title,
        summary: description.length > 160 ? `${description.slice(0, 157)}...` : description,
        description,
        category: optionalChoice(formData, "category", PROJECT_CATEGORIES, "PERSONAL"),
        status: optionalChoice(formData, "status", PROJECT_STATUSES, "PLANNED"),
        priority: optionalChoice(formData, "priority", TASK_PRIORITIES, "MEDIUM"),
        dueDate: optionalDate(formData, "dueDate"),
        owner: "Jaber",
        imageUrl
      }
    });

    revalidatePath("/dash/projects");
    revalidatePath("/dash/dashboard");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function updateProject(
  _prev: CreateResult,
  formData: FormData
): Promise<CreateResult> {
  try {
    await assertAuthed();
    const id = requireText(formData, "id", "Project id");
    const title = requireText(formData, "title", "Title");
    const description = requireText(formData, "description", "Description");
    const imageUrl = await readImage(formData, "projects");
    const oldImage = imageUrl ? (await db.project.findUnique({ where: { id }, select: { imageUrl: true } }))?.imageUrl : null;

    await db.project.update({
      where: { id },
      data: {
        title,
        summary: description.length > 160 ? `${description.slice(0, 157)}...` : description,
        description,
        category: optionalChoice(formData, "category", PROJECT_CATEGORIES, "PERSONAL"),
        status: optionalChoice(formData, "status", PROJECT_STATUSES, "PLANNED"),
        priority: optionalChoice(formData, "priority", TASK_PRIORITIES, "MEDIUM"),
        dueDate: optionalDate(formData, "dueDate"),
        owner: "Jaber",
        ...(imageUrl ? { imageUrl } : {})
      }
    });

    if (imageUrl) await removePhoto(oldImage);
    revalidatePath("/dash/projects");
    revalidatePath("/dash/dashboard");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function deleteProject(id: string): Promise<void> {
  await assertAuthed();
  const project = await db.project.delete({ where: { id } });
  await removePhoto(project.imageUrl);
  revalidatePath("/dash/projects");
  revalidatePath("/dash/dashboard");
}

export async function setProjectCompleted(id: string, completed: boolean): Promise<void> {
  await assertAuthed();
  await db.project.update({
    where: { id },
    data: completed ? { status: "COMPLETED", progress: 100 } : { status: "ACTIVE" }
  });
  revalidatePath("/dash/projects");
  revalidatePath("/dash/dashboard");
}

export async function createTask(
  _prev: CreateResult,
  formData: FormData
): Promise<CreateResult> {
  try {
    await assertAuthed();
    const title = requireText(formData, "title", "Title");
    const description = optionalText(formData, "description");
    const imageUrl = await readImage(formData, "tasks");

    const projectId = optionalProjectId(formData);

    const created = await db.task.create({
      data: {
        title,
        description,
        status: "TODO",
        ...statusFields(formData),
        repeat: asRepeat(formData.get("repeat")),
        priority: optionalChoice(formData, "priority", TASK_PRIORITIES, "MEDIUM"),
        category: optionalChoice(formData, "category", PROJECT_CATEGORIES, "PERSONAL"),
        dueDate: optionalDate(formData, "dueDate"),
        projectId,
        imageUrl
      }
    });

    const steps = checklistLines(formData.get("checklist"));
    if (steps.length > 0) {
      await db.checklistItem.createMany({
        data: steps.map((text, position) => ({ taskId: created.id, text, position }))
      });
    }
    revalidatePath("/dash/tasks");
    revalidatePath("/dash/dashboard");
    revalidatePath("/dash/projects");
    if (projectId) revalidatePath(`/dash/projects/${projectId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function updateTask(
  _prev: CreateResult,
  formData: FormData
): Promise<CreateResult> {
  try {
    await assertAuthed();
    const id = requireText(formData, "id", "Task id");
    const title = requireText(formData, "title", "Title");
    const description = optionalText(formData, "description");
    const imageUrl = await readImage(formData, "tasks");
    const oldImage = imageUrl ? (await db.task.findUnique({ where: { id }, select: { imageUrl: true } }))?.imageUrl : null;
    const newProjectId = optionalProjectId(formData);

    const previous = await db.task.findUnique({
      where: { id },
      select: { projectId: true, status: true, completedAt: true }
    });
    const status = statusFields(formData);
    // Editing an already-done task keeps its original completion date.
    if (status.status === "DONE" && previous?.status === "DONE") status.completedAt = previous.completedAt;

    const updated = await db.task.update({
      where: { id },
      data: {
        title,
        description,
        priority: optionalChoice(formData, "priority", TASK_PRIORITIES, "MEDIUM"),
        category: optionalChoice(formData, "category", PROJECT_CATEGORIES, "PERSONAL"),
        dueDate: optionalDate(formData, "dueDate"),
        projectId: newProjectId,
        ...status,
        repeat: asRepeat(formData.get("repeat")),
        ...(imageUrl ? { imageUrl } : {})
      }
    });

    await followRepeat(updated, previous?.status);
    if (imageUrl) await removePhoto(oldImage);
    revalidatePath("/dash/tasks");
    revalidatePath("/dash/dashboard");
    revalidatePath("/dash/projects");
    if (previous?.projectId) revalidatePath(`/dash/projects/${previous.projectId}`);
    if (newProjectId && newProjectId !== previous?.projectId) revalidatePath(`/dash/projects/${newProjectId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function deleteTask(id: string): Promise<void> {
  await assertAuthed();
  await db.checklistItem.deleteMany({ where: { taskId: id } });
  const task = await db.task.delete({ where: { id } });
  await removePhoto(task.imageUrl);
  revalidatePath("/dash/tasks");
  revalidatePath("/dash/dashboard");
  revalidatePath("/dash/projects");
  if (task.projectId) revalidatePath(`/dash/projects/${task.projectId}`);
}

function revalidateTaskPaths(projectId: string | null) {
  revalidatePath("/dash/tasks");
  revalidatePath("/dash/dashboard");
  revalidatePath("/dash/projects");
  revalidatePath("/dash/review");
  if (projectId) revalidatePath(`/dash/projects/${projectId}`);
}

type RepeatingTask = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  dueDate: Date | null;
  projectId: string | null;
  repeat: string;
  nextTaskId: string | null;
};

// Repeating tasks: completing one creates its next occurrence (once), and
// reopening it takes that occurrence back if it hasn't been started.
async function followRepeat(task: RepeatingTask, previousStatus: string | undefined) {
  const repeat = asRepeat(task.repeat);
  if (task.status === "DONE" && previousStatus !== "DONE" && repeat && !task.nextTaskId) {
    const due = nextDueDate(repeat, task.dueDate ? dayKey(task.dueDate) : null, todayKey());
    const next = await db.task.create({
      data: {
        title: task.title,
        description: task.description,
        priority: task.priority,
        category: task.category,
        projectId: task.projectId,
        repeat,
        status: "TODO",
        dueDate: due ? new Date(`${due}T00:00:00.000Z`) : null
      }
    });
    const steps = await db.checklistItem.findMany({ where: { taskId: task.id }, orderBy: { position: "asc" } });
    if (steps.length > 0) {
      await db.checklistItem.createMany({
        data: steps.map((step, position) => ({ taskId: next.id, text: step.text, position }))
      });
    }
    await db.task.update({ where: { id: task.id }, data: { nextTaskId: next.id } });
  } else if (previousStatus === "DONE" && task.status !== "DONE" && task.nextTaskId) {
    const untouched = await db.task.findFirst({ where: { id: task.nextTaskId, status: "TODO" }, select: { id: true } });
    if (untouched) {
      await db.checklistItem.deleteMany({ where: { taskId: untouched.id } });
      await db.task.delete({ where: { id: untouched.id } });
    }
    await db.task.update({ where: { id: task.id }, data: { nextTaskId: null } });
  }
}

// Moves a task between board columns. BLOCKED also sets the blocked flag;
// leaving BLOCKED clears it; DONE stamps completedAt.
export async function setTaskStatus(id: string, status: string): Promise<void> {
  await assertAuthed();
  if (!(TASK_STATUSES as readonly string[]).includes(status)) throw new Error("Unknown status.");
  const next = status as (typeof TASK_STATUSES)[number];
  const before = await db.task.findUnique({ where: { id }, select: { status: true } });
  const task = await db.task.update({
    where: { id },
    data: {
      status: next,
      blocked: next === "BLOCKED",
      completedAt: next === "DONE" ? new Date() : null
    }
  });
  await followRepeat(task, before?.status);
  revalidateTaskPaths(task.projectId);
}

// Reschedules a task; `day` is "YYYY-MM-DD" (stored as midnight UTC, like the
// date field in the task form), or null to clear the due date.
export async function setTaskDueDate(id: string, day: string | null): Promise<void> {
  await assertAuthed();
  if (day !== null && !/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error("Invalid date.");
  const task = await db.task.update({
    where: { id },
    data: { dueDate: day ? new Date(`${day}T00:00:00.000Z`) : null }
  });
  revalidateTaskPaths(task.projectId);
}

export async function setTaskDone(id: string, done: boolean): Promise<void> {
  await assertAuthed();
  const before = await db.task.findUnique({ where: { id }, select: { status: true } });
  const task = await db.task.update({
    where: { id },
    data: done
      ? { status: "DONE", blocked: false, completedAt: new Date() }
      : { status: "TODO", completedAt: null }
  });
  await followRepeat(task, before?.status);
  revalidateTaskPaths(task.projectId);
}

export async function createNote(
  _prev: CreateResult,
  formData: FormData
): Promise<CreateResult> {
  try {
    await assertAuthed();
    const title = requireText(formData, "title", "Title");
    const content = requireText(formData, "content", "Content");
    const imageUrl = await readImage(formData, "notes");
    const tags = formData.get("tags");

    const projectId = optionalProjectId(formData);

    await db.note.create({
      data: {
        title,
        content,
        tags: typeof tags === "string" ? tags.trim() : "",
        category: optionalChoice(formData, "category", PROJECT_CATEGORIES, "PERSONAL"),
        projectId,
        imageUrl
      }
    });

    revalidatePath("/dash/notes");
    revalidatePath("/dash/dashboard");
    if (projectId) revalidatePath(`/dash/projects/${projectId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function updateNote(
  _prev: CreateResult,
  formData: FormData
): Promise<CreateResult> {
  try {
    await assertAuthed();
    const id = requireText(formData, "id", "Note id");
    const title = requireText(formData, "title", "Title");
    const content = requireText(formData, "content", "Content");
    const imageUrl = await readImage(formData, "notes");
    const oldImage = imageUrl ? (await db.note.findUnique({ where: { id }, select: { imageUrl: true } }))?.imageUrl : null;
    const tags = formData.get("tags");
    const newProjectId = optionalProjectId(formData);

    const previous = await db.note.findUnique({ where: { id }, select: { projectId: true } });

    await db.note.update({
      where: { id },
      data: {
        title,
        content,
        tags: typeof tags === "string" ? tags.trim() : "",
        category: optionalChoice(formData, "category", PROJECT_CATEGORIES, "PERSONAL"),
        projectId: newProjectId,
        ...(imageUrl ? { imageUrl } : {})
      }
    });

    if (imageUrl) await removePhoto(oldImage);
    revalidatePath("/dash/notes");
    revalidatePath("/dash/dashboard");
    if (previous?.projectId) revalidatePath(`/dash/projects/${previous.projectId}`);
    if (newProjectId && newProjectId !== previous?.projectId) revalidatePath(`/dash/projects/${newProjectId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function deleteNote(id: string): Promise<void> {
  await assertAuthed();
  const note = await db.note.delete({ where: { id } });
  await removePhoto(note.imageUrl);
  revalidatePath("/dash/notes");
  revalidatePath("/dash/dashboard");
}

function requireUrl(formData: FormData): string {
  const value = formData.get("url");

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("A link is required.");
  }

  const trimmed = value.trim();
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(withScheme).toString();
  } catch {
    throw new Error("That doesn't look like a valid link.");
  }
}

export async function createResource(
  _prev: CreateResult,
  formData: FormData
): Promise<CreateResult> {
  try {
    await assertAuthed();
    const title = requireText(formData, "title", "Title");
    const description = requireText(formData, "description", "Description");
    const url = requireUrl(formData);
    const type = requireText(formData, "type", "Type");
    const projectId = optionalProjectId(formData);

    await db.resourceLink.create({
      data: {
        title,
        description,
        url,
        type,
        category: optionalChoice(formData, "category", PROJECT_CATEGORIES, "PERSONAL"),
        projectId
      }
    });

    revalidatePath("/dash/resources");
    revalidatePath("/dash/dashboard");
    if (projectId) revalidatePath(`/dash/projects/${projectId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function updateResource(
  _prev: CreateResult,
  formData: FormData
): Promise<CreateResult> {
  try {
    await assertAuthed();
    const id = requireText(formData, "id", "Resource id");
    const title = requireText(formData, "title", "Title");
    const description = requireText(formData, "description", "Description");
    const url = requireUrl(formData);
    const type = requireText(formData, "type", "Type");
    const newProjectId = optionalProjectId(formData);

    const previous = await db.resourceLink.findUnique({ where: { id }, select: { projectId: true } });

    await db.resourceLink.update({
      where: { id },
      data: {
        title,
        description,
        url,
        type,
        category: optionalChoice(formData, "category", PROJECT_CATEGORIES, "PERSONAL"),
        projectId: newProjectId
      }
    });

    revalidatePath("/dash/resources");
    revalidatePath("/dash/dashboard");
    if (previous?.projectId) revalidatePath(`/dash/projects/${previous.projectId}`);
    if (newProjectId && newProjectId !== previous?.projectId) revalidatePath(`/dash/projects/${newProjectId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function deleteResource(id: string): Promise<void> {
  await assertAuthed();
  const resource = await db.resourceLink.delete({ where: { id } });
  revalidatePath("/dash/resources");
  revalidatePath("/dash/dashboard");
  if (resource.projectId) revalidatePath(`/dash/projects/${resource.projectId}`);
}

// ------------------------------------------------------------ checklists

const MAX_STEP_LENGTH = 300;
const MAX_STEPS = 100;

/** Non-empty lines of a pasted or typed list, without bullet marks. */
function checklistLines(value: FormDataEntryValue | string | null): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\[[ xX]?\]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
    .map((line) => line.slice(0, MAX_STEP_LENGTH))
    .slice(0, MAX_STEPS);
}

async function revalidateChecklist(taskId: string) {
  const task = await db.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
  revalidateTaskPaths(task?.projectId ?? null);
  revalidatePath(`/dash/tasks/${taskId}`);
}

/** Adds one step, or several when `text` has several lines. */
export async function addChecklistItems(taskId: string, text: string): Promise<{ ok: boolean; error?: string }> {
  await assertAuthed();
  const steps = checklistLines(text);
  if (steps.length === 0) return { ok: false, error: "Type a step first." };
  const existing = await db.checklistItem.count({ where: { taskId } });
  if (existing + steps.length > MAX_STEPS) return { ok: false, error: `A checklist can have up to ${MAX_STEPS} steps.` };
  const last = await db.checklistItem.findFirst({ where: { taskId }, orderBy: { position: "desc" }, select: { position: true } });
  const start = (last?.position ?? -1) + 1;
  await db.checklistItem.createMany({
    data: steps.map((step, index) => ({ taskId, text: step, position: start + index }))
  });
  await revalidateChecklist(taskId);
  return { ok: true };
}

/** Ticks or unticks a step; reports whether every step is now done. */
export async function setChecklistItemDone(id: string, done: boolean): Promise<{ allDone: boolean }> {
  await assertAuthed();
  const item = await db.checklistItem.update({ where: { id }, data: { done } });
  const remaining = await db.checklistItem.count({ where: { taskId: item.taskId, done: false } });
  await revalidateChecklist(item.taskId);
  return { allDone: remaining === 0 };
}

export async function renameChecklistItem(id: string, text: string): Promise<void> {
  await assertAuthed();
  const value = text.trim().slice(0, MAX_STEP_LENGTH);
  if (!value) return;
  const item = await db.checklistItem.update({ where: { id }, data: { text: value } });
  await revalidateChecklist(item.taskId);
}

export async function deleteChecklistItem(id: string): Promise<void> {
  await assertAuthed();
  const item = await db.checklistItem.findUnique({ where: { id }, select: { taskId: true } });
  if (!item) return;
  await db.checklistItem.delete({ where: { id } });
  await revalidateChecklist(item.taskId);
}

/** Saves a new order: `ids` is the task's steps, top to bottom. */
export async function reorderChecklist(taskId: string, ids: string[]): Promise<void> {
  await assertAuthed();
  const owned = await db.checklistItem.findMany({ where: { taskId }, select: { id: true } });
  const ownedIds = new Set(owned.map((item) => item.id));
  const order = ids.filter((id) => ownedIds.has(id));
  await db.$transaction(order.map((id, position) => db.checklistItem.update({ where: { id }, data: { position } })));
  await revalidateChecklist(taskId);
}
