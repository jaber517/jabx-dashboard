"use client";

import { useEffect, useRef } from "react";
import { NoteFormDialog } from "@/features/notes/create-note-dialog";
import { ProjectFormDialog } from "@/features/projects/create-project-dialog";
import { ResourceFormDialog } from "@/features/resources/create-resource-dialog";
import { TaskFormDialog } from "@/features/tasks/create-task-dialog";

export type CreateKind = "task" | "project" | "note" | "resource";

const CREATE_EVENT = "jabx:create";

/** Open the "New …" dialog for a kind from anywhere (palette, buttons). */
export function openCreate(kind: CreateKind) {
  window.dispatchEvent(new CustomEvent<CreateKind>(CREATE_EVENT, { detail: kind }));
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return Boolean(el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)));
}

// One hidden set of create dialogs for the whole dashboard. They open from
// the ⌘K palette, the phone header's + button, or the N key (new task).
export function GlobalCreate({ projects }: { projects: { id: string; title: string }[] }) {
  const openers = useRef<Partial<Record<CreateKind, () => void>>>({});

  useEffect(() => {
    function onCreate(event: Event) {
      openers.current[(event as CustomEvent<CreateKind>).detail]?.();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "n" && event.key !== "N") return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat || isTyping(event.target)) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      event.preventDefault();
      openers.current.task?.();
    }
    window.addEventListener(CREATE_EVENT, onCreate);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(CREATE_EVENT, onCreate);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const capture = (kind: CreateKind) => (open: () => void) => {
    openers.current[kind] = open;
    return null;
  };

  return (
    <>
      <TaskFormDialog projects={projects} renderTrigger={capture("task")} />
      <ProjectFormDialog renderTrigger={capture("project")} />
      <NoteFormDialog projects={projects} renderTrigger={capture("note")} />
      <ResourceFormDialog projects={projects} renderTrigger={capture("resource")} />
    </>
  );
}
