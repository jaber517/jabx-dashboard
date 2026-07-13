"use server";

import { revalidatePath } from "next/cache";
import { assertAuthed } from "@/lib/auth";
import { db } from "@/lib/db";
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

async function readImage(formData: FormData): Promise<string | null> {
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
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}

function requireText(formData: FormData, field: string, label: string): string {
  const value = formData.get(field);

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }

  return value.trim();
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
    const imageUrl = await readImage(formData);

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

    revalidatePath("/projects");
    revalidatePath("/dashboard");
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
    const imageUrl = await readImage(formData);

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

    revalidatePath("/projects");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function deleteProject(id: string): Promise<void> {
  await assertAuthed();
  await db.project.delete({ where: { id } });
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

export async function setProjectCompleted(id: string, completed: boolean): Promise<void> {
  await assertAuthed();
  await db.project.update({
    where: { id },
    data: completed ? { status: "COMPLETED", progress: 100 } : { status: "ACTIVE" }
  });
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

export async function createTask(
  _prev: CreateResult,
  formData: FormData
): Promise<CreateResult> {
  try {
    await assertAuthed();
    const title = requireText(formData, "title", "Title");
    const description = requireText(formData, "description", "Description");
    const imageUrl = await readImage(formData);

    const projectId = optionalProjectId(formData);

    await db.task.create({
      data: {
        title,
        description,
        status: optionalChoice(formData, "status", TASK_STATUSES, "TODO"),
        priority: optionalChoice(formData, "priority", TASK_PRIORITIES, "MEDIUM"),
        category: optionalChoice(formData, "category", PROJECT_CATEGORIES, "PERSONAL"),
        dueDate: optionalDate(formData, "dueDate"),
        projectId,
        imageUrl
      }
    });

    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    revalidatePath("/projects");
    if (projectId) revalidatePath(`/projects/${projectId}`);
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
    const description = requireText(formData, "description", "Description");
    const imageUrl = await readImage(formData);
    const newProjectId = optionalProjectId(formData);

    const previous = await db.task.findUnique({ where: { id }, select: { projectId: true } });

    await db.task.update({
      where: { id },
      data: {
        title,
        description,
        priority: optionalChoice(formData, "priority", TASK_PRIORITIES, "MEDIUM"),
        category: optionalChoice(formData, "category", PROJECT_CATEGORIES, "PERSONAL"),
        dueDate: optionalDate(formData, "dueDate"),
        projectId: newProjectId,
        ...(imageUrl ? { imageUrl } : {})
      }
    });

    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    revalidatePath("/projects");
    if (previous?.projectId) revalidatePath(`/projects/${previous.projectId}`);
    if (newProjectId && newProjectId !== previous?.projectId) revalidatePath(`/projects/${newProjectId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function deleteTask(id: string): Promise<void> {
  await assertAuthed();
  const task = await db.task.delete({ where: { id } });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  if (task.projectId) revalidatePath(`/projects/${task.projectId}`);
}

export async function setTaskDone(id: string, done: boolean): Promise<void> {
  await assertAuthed();
  const task = await db.task.update({
    where: { id },
    data: done
      ? { status: "DONE", blocked: false, completedAt: new Date() }
      : { status: "TODO", completedAt: null }
  });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  if (task.projectId) revalidatePath(`/projects/${task.projectId}`);
}

export async function createNote(
  _prev: CreateResult,
  formData: FormData
): Promise<CreateResult> {
  try {
    await assertAuthed();
    const title = requireText(formData, "title", "Title");
    const content = requireText(formData, "content", "Content");
    const imageUrl = await readImage(formData);
    const tags = formData.get("tags");

    await db.note.create({
      data: {
        title,
        content,
        tags: typeof tags === "string" ? tags.trim() : "",
        category: optionalChoice(formData, "category", PROJECT_CATEGORIES, "PERSONAL"),
        imageUrl
      }
    });

    revalidatePath("/notes");
    revalidatePath("/dashboard");
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
    const imageUrl = await readImage(formData);
    const tags = formData.get("tags");

    await db.note.update({
      where: { id },
      data: {
        title,
        content,
        tags: typeof tags === "string" ? tags.trim() : "",
        category: optionalChoice(formData, "category", PROJECT_CATEGORIES, "PERSONAL"),
        ...(imageUrl ? { imageUrl } : {})
      }
    });

    revalidatePath("/notes");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function deleteNote(id: string): Promise<void> {
  await assertAuthed();
  await db.note.delete({ where: { id } });
  revalidatePath("/notes");
  revalidatePath("/dashboard");
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

    revalidatePath("/resources");
    revalidatePath("/dashboard");
    if (projectId) revalidatePath(`/projects/${projectId}`);
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

    revalidatePath("/resources");
    revalidatePath("/dashboard");
    if (previous?.projectId) revalidatePath(`/projects/${previous.projectId}`);
    if (newProjectId && newProjectId !== previous?.projectId) revalidatePath(`/projects/${newProjectId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function deleteResource(id: string): Promise<void> {
  await assertAuthed();
  const resource = await db.resourceLink.delete({ where: { id } });
  revalidatePath("/resources");
  revalidatePath("/dashboard");
  if (resource.projectId) revalidatePath(`/projects/${resource.projectId}`);
}
