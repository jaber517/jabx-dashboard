"use client";

import type { ReactNode } from "react";
import { CreateDialog, DialogField } from "@/components/ui/create-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createResource, updateResource } from "@/lib/actions";
import { categoryLabels } from "@/lib/constants";
import { PROJECT_CATEGORIES } from "@/types";
import type { ResourceRecord } from "@/types";

const RESOURCE_TYPES = ["YouTube", "Website", "Article", "Documentation", "Repository", "Other"];

export function ResourceFormDialog({
  resource,
  projects = [],
  renderTrigger
}: {
  resource?: ResourceRecord;
  projects?: { id: string; title: string }[];
  renderTrigger?: (open: () => void) => ReactNode;
}) {
  const isEdit = Boolean(resource);

  return (
    <CreateDialog
      triggerLabel="Add Resource"
      renderTrigger={renderTrigger}
      title={isEdit ? "Edit Resource" : "Add Resource"}
      description={
        isEdit
          ? "Update this link's details."
          : "Save a YouTube video, article, or website link to your library."
      }
      submitLabel={isEdit ? "Save changes" : "Save resource"}
      action={isEdit ? updateResource : createResource}
    >
      {resource ? <input type="hidden" name="id" value={resource.id} /> : null}

      <DialogField label="Title">
        <Input name="title" placeholder="Resource title" defaultValue={resource?.title} required />
      </DialogField>

      <DialogField label="Link">
        <Input
          name="url"
          type="text"
          inputMode="url"
          placeholder="youtube.com/watch?v=... or any website link"
          defaultValue={resource?.url}
          required
        />
      </DialogField>

      <DialogField label="Description">
        <Textarea
          name="description"
          placeholder="What is this and why is it useful?"
          defaultValue={resource?.description}
          required
        />
      </DialogField>

      <div className="grid gap-4 sm:grid-cols-2">
        <DialogField label="Type">
          <Select name="type" defaultValue={resource?.type ?? "Website"}>
            {RESOURCE_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </DialogField>

        <DialogField label="Category">
          <Select name="category" defaultValue={resource?.category ?? "PERSONAL"}>
            {PROJECT_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {categoryLabels[item]}
              </option>
            ))}
          </Select>
        </DialogField>
      </div>

      <DialogField label="Project">
        <Select name="projectId" defaultValue={resource?.projectId ?? ""}>
          <option value="">Not linked to a project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </Select>
      </DialogField>
    </CreateDialog>
  );
}

export function CreateResourceDialog({
  projects
}: {
  projects?: { id: string; title: string }[];
}) {
  return <ResourceFormDialog projects={projects} />;
}
