"use client";

import type { ReactNode } from "react";
import { CreateDialog, DialogField } from "@/components/ui/create-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createTask, updateTask } from "@/lib/actions";
import { categoryLabels } from "@/lib/constants";
import { getPriorityLabel } from "@/lib/formatters";
import { PROJECT_CATEGORIES, TASK_PRIORITIES } from "@/types";
import type { TaskRecord } from "@/types";

export function TaskFormDialog({
  task,
  projects = [],
  renderTrigger
}: {
  task?: TaskRecord;
  projects?: { id: string; title: string }[];
  renderTrigger?: (open: () => void) => ReactNode;
}) {
  const isEdit = Boolean(task);

  return (
    <CreateDialog
      triggerLabel="Add Task"
      renderTrigger={renderTrigger}
      title={isEdit ? "Edit Task" : "Add Task"}
      description={
        isEdit
          ? "Update the task details. Uploading a new photo replaces the old one."
          : "Capture new work with a description and an optional photo."
      }
      submitLabel={isEdit ? "Save changes" : "Create task"}
      action={isEdit ? updateTask : createTask}
    >
      {task ? <input type="hidden" name="id" value={task.id} /> : null}

      <DialogField label="Title">
        <Input name="title" placeholder="Task title" defaultValue={task?.title} required />
      </DialogField>

      <DialogField label="Description">
        <Textarea
          name="description"
          placeholder="What needs to be done?"
          defaultValue={task?.description}
          required
        />
      </DialogField>

      <div className="grid gap-4 sm:grid-cols-2">
        <DialogField label="Category">
          <Select name="category" defaultValue={task?.category ?? "PERSONAL"}>
            {PROJECT_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {categoryLabels[item]}
              </option>
            ))}
          </Select>
        </DialogField>

        <DialogField label="Priority">
          <Select name="priority" defaultValue={task?.priority ?? "MEDIUM"}>
            {TASK_PRIORITIES.map((item) => (
              <option key={item} value={item}>
                {getPriorityLabel(item)}
              </option>
            ))}
          </Select>
        </DialogField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DialogField label="Due date">
          <Input name="dueDate" type="date" defaultValue={task?.dueDate?.slice(0, 10)} />
        </DialogField>

        <DialogField label="Project">
          <Select name="projectId" defaultValue={task?.projectId ?? ""}>
            <option value="">Independent task (no project)</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </Select>
        </DialogField>
      </div>

      <DialogField label={isEdit ? "Replace photo (optional)" : "Photo (optional)"}>
        <Input name="photo" type="file" accept="image/*" className="py-2" />
      </DialogField>
    </CreateDialog>
  );
}

export function CreateTaskDialog({
  projects
}: {
  projects?: { id: string; title: string }[];
}) {
  return <TaskFormDialog projects={projects} />;
}
