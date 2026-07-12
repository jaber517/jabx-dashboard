"use client";

import type { ReactNode } from "react";
import { CreateDialog, DialogField } from "@/components/ui/create-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createProject, updateProject } from "@/lib/actions";
import { categoryLabels } from "@/lib/constants";
import { getPriorityLabel, getStatusLabel } from "@/lib/formatters";
import { PROJECT_CATEGORIES, PROJECT_STATUSES, TASK_PRIORITIES } from "@/types";
import type { ProjectRecord } from "@/types";

export function ProjectFormDialog({
  project,
  renderTrigger
}: {
  project?: ProjectRecord;
  renderTrigger?: (open: () => void) => ReactNode;
}) {
  const isEdit = Boolean(project);

  return (
    <CreateDialog
      triggerLabel="Add Project"
      renderTrigger={renderTrigger}
      title={isEdit ? "Edit Project" : "Add Project"}
      description={
        isEdit
          ? "Update the project details. Uploading a new photo replaces the old one."
          : "Create a new initiative with a description and an optional photo."
      }
      submitLabel={isEdit ? "Save changes" : "Create project"}
      action={isEdit ? updateProject : createProject}
    >
      {project ? <input type="hidden" name="id" value={project.id} /> : null}

      <DialogField label="Title">
        <Input name="title" placeholder="Project title" defaultValue={project?.title} required />
      </DialogField>

      <DialogField label="Description">
        <Textarea
          name="description"
          placeholder="What is this project about?"
          defaultValue={project?.description}
          required
        />
      </DialogField>

      <div className="grid gap-4 sm:grid-cols-2">
        <DialogField label="Category">
          <Select name="category" defaultValue={project?.category ?? "PERSONAL"}>
            {PROJECT_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {categoryLabels[item]}
              </option>
            ))}
          </Select>
        </DialogField>

        <DialogField label="Priority">
          <Select name="priority" defaultValue={project?.priority ?? "MEDIUM"}>
            {TASK_PRIORITIES.map((item) => (
              <option key={item} value={item}>
                {getPriorityLabel(item)}
              </option>
            ))}
          </Select>
        </DialogField>

        <DialogField label="Status">
          <Select name="status" defaultValue={project?.status ?? "PLANNED"}>
            {PROJECT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {getStatusLabel(item)}
              </option>
            ))}
          </Select>
        </DialogField>

        <DialogField label="Due date">
          <Input name="dueDate" type="date" defaultValue={project?.dueDate?.slice(0, 10)} />
        </DialogField>
      </div>

      <DialogField label={isEdit ? "Replace photo (optional)" : "Photo (optional)"}>
        <Input name="photo" type="file" accept="image/*" className="py-2" />
      </DialogField>
    </CreateDialog>
  );
}

export function CreateProjectDialog() {
  return <ProjectFormDialog />;
}
