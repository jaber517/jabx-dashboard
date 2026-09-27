"use client";

import { useTransition } from "react";
import { Check, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { useDeleteWithUndo, useUndo } from "@/components/providers/undo-provider";
import { deleteTask, setTaskDone, setTaskStatus } from "@/lib/actions";
import { TaskFormDialog } from "@/features/tasks/create-task-dialog";
import type { TaskRecord } from "@/types";

export function TaskCardActions({
  task,
  projects
}: {
  task: TaskRecord;
  projects?: { id: string; title: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const deleteWithUndo = useDeleteWithUndo("/tasks");
  const { notify } = useUndo();
  const done = task.status === "DONE";
  const previous = task.blocked && !done ? "BLOCKED" : task.status;

  function toggleDone() {
    startTransition(async () => {
      await setTaskDone(task.id, !done);
      notify(done ? `Reopened “${task.title}”` : `Completed “${task.title}”`, () =>
        startTransition(() => setTaskStatus(task.id, previous))
      );
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <TaskFormDialog
        task={task}
        projects={projects}
        renderTrigger={(open) => (
          <IconButton title="Edit task" aria-label="Edit task" onClick={open}>
            <Pencil className="h-4 w-4" />
          </IconButton>
        )}
      />
      <IconButton
        title={done ? "Reopen task" : "Mark done"}
        aria-label={done ? "Reopen task" : "Mark done"}
        disabled={pending}
        onClick={toggleDone}
      >
        {done ? <RotateCcw className="h-4 w-4" /> : <Check className="h-4 w-4" />}
      </IconButton>
      <IconButton
        danger
        title="Delete task"
        aria-label="Delete task"
        disabled={pending}
        onClick={() => deleteWithUndo(task.id, task.title, () => deleteTask(task.id))}
      >
        <Trash2 className="h-4 w-4" />
      </IconButton>
    </div>
  );
}
