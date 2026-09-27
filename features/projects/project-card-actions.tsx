"use client";

import { useTransition } from "react";
import { Check, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { useDeleteWithUndo, useUndo } from "@/components/providers/undo-provider";
import { deleteProject, setProjectCompleted } from "@/lib/actions";
import { ProjectFormDialog } from "@/features/projects/create-project-dialog";
import type { ProjectRecord } from "@/types";

export function ProjectCardActions({ project }: { project: ProjectRecord }) {
  const [pending, startTransition] = useTransition();
  const deleteWithUndo = useDeleteWithUndo("/projects");
  const { notify } = useUndo();
  const completed = project.status === "COMPLETED";

  function toggleCompleted() {
    startTransition(async () => {
      await setProjectCompleted(project.id, !completed);
      notify(completed ? `Reopened “${project.title}”` : `Completed “${project.title}”`, () =>
        startTransition(() => setProjectCompleted(project.id, completed))
      );
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <ProjectFormDialog
        project={project}
        renderTrigger={(open) => (
          <IconButton title="Edit project" aria-label="Edit project" onClick={open}>
            <Pencil className="h-4 w-4" />
          </IconButton>
        )}
      />
      <IconButton
        title={completed ? "Reopen project" : "Mark completed"}
        aria-label={completed ? "Reopen project" : "Mark completed"}
        disabled={pending}
        onClick={toggleCompleted}
      >
        {completed ? <RotateCcw className="h-4 w-4" /> : <Check className="h-4 w-4" />}
      </IconButton>
      <IconButton
        danger
        title="Delete project"
        aria-label="Delete project"
        disabled={pending}
        onClick={() => deleteWithUndo(project.id, project.title, () => deleteProject(project.id))}
      >
        <Trash2 className="h-4 w-4" />
      </IconButton>
    </div>
  );
}
