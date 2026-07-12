"use server";

import { revalidatePath } from "next/cache";
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
  await db.project.delete({ where: { id } });
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

export async function setProjectCompleted(id: string, completed: boolean): Promise<void> {
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
    const title = requireText(formData, "title", "Title");
    const description = requireText(formData, "description", "Description");
    const imageUrl = await readImage(formData);

    await db.task.create({
      data: {
        title,
        description,
        status: optionalChoice(formData, "status", TASK_STATUSES, "TODO"),
        priority: optionalChoice(formData, "priority", TASK_PRIORITIES, "MEDIUM"),
        category: optionalChoice(formData, "category", PROJECT_CATEGORIES, "PERSONAL"),
        dueDate: optionalDate(formData, "dueDate"),
        imageUrl
      }
    });

    revalidatePath("/tasks");
    revalidatePath("/dashboard");
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
    const id = requireText(formData, "id", "Task id");
    const title = requireText(formData, "title", "Title");
    const description = requireText(formData, "description", "Description");
    const imageUrl = await readImage(formData);

    await db.task.update({
      where: { id },
      data: {
        title,
        description,
        priority: optionalChoice(formData, "priority", TASK_PRIORITIES, "MEDIUM"),
        category: optionalChoice(formData, "category", PROJECT_CATEGORIES, "PERSONAL"),
        dueDate: optionalDate(formData, "dueDate"),
        ...(imageUrl ? { imageUrl } : {})
      }
    });

    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function deleteTask(id: string): Promise<void> {
  await db.task.delete({ where: { id } });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function setTaskDone(id: string, done: boolean): Promise<void> {
  await db.task.update({
    where: { id },
    data: done
      ? { status: "DONE", blocked: false, completedAt: new Date() }
      : { status: "TODO", completedAt: null }
  });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function createNote(
  _prev: CreateResult,
  formData: FormData
): Promise<CreateResult> {
  try {
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
  await db.note.delete({ where: { id } });
  revalidatePath("/notes");
  revalidatePath("/dashboard");
}
