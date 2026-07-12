"use client";

import { useTransition } from "react";
import { Check, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { deleteProject, setProjectCompleted } from "@/lib/actions";
import { ProjectFormDialog } from "@/features/projects/create-project-dialog";
import type { ProjectRecord } from "@/types";

export function ProjectCardActions({ project }: { project: ProjectRecord }) {
  const [pending, startTransition] = useTransition();
  const completed = project.status === "COMPLETED";

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
        onClick={() => startTransition(() => setProjectCompleted(project.id, !completed))}
      >
        {completed ? <RotateCcw className="h-4 w-4" /> : <Check className="h-4 w-4" />}
      </IconButton>
      <IconButton
        danger
        title="Delete project"
        aria-label="Delete project"
        disabled={pending}
        onClick={() => {
          if (window.confirm(`Delete "${project.title}"? This also removes its tasks' project link.`)) {
            startTransition(() => deleteProject(project.id));
          }
        }}
      >
        <Trash2 className="h-4 w-4" />
      </IconButton>
    </div>
  );
}
