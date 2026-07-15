"use client";

import type { ReactNode } from "react";
import { CreateDialog, DialogField } from "@/components/ui/create-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createNote, updateNote } from "@/lib/actions";
import { categoryLabels } from "@/lib/constants";
import { PROJECT_CATEGORIES } from "@/types";
import type { NoteRecord } from "@/types";

export function NoteFormDialog({
  note,
  projects = [],
  renderTrigger
}: {
  note?: NoteRecord;
  projects?: { id: string; title: string }[];
  renderTrigger?: (open: () => void) => ReactNode;
}) {
  const isEdit = Boolean(note);

  return (
    <CreateDialog
      triggerLabel="Add Note"
      renderTrigger={renderTrigger}
      title={isEdit ? "Edit Note" : "Add Note"}
      description={
        isEdit
          ? "Update the note. Uploading a new photo replaces the old one."
          : "Store an idea or reference with an optional photo."
      }
      submitLabel={isEdit ? "Save changes" : "Create note"}
      action={isEdit ? updateNote : createNote}
    >
      {note ? <input type="hidden" name="id" value={note.id} /> : null}

      <DialogField label="Title">
        <Input name="title" placeholder="Note title" defaultValue={note?.title} required />
      </DialogField>

      <DialogField label="Content">
        <Textarea
          name="content"
          placeholder="Write your note..."
          defaultValue={note?.content}
          required
        />
      </DialogField>

      <div className="grid gap-4 sm:grid-cols-2">
        <DialogField label="Category">
          <Select name="category" defaultValue={note?.category ?? "PERSONAL"}>
            {PROJECT_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {categoryLabels[item]}
              </option>
            ))}
          </Select>
        </DialogField>

        <DialogField label="Tags (comma separated)">
          <Input name="tags" placeholder="travel, ideas" defaultValue={note?.tags.join(", ")} />
        </DialogField>
      </div>

      <DialogField label="Project">
        <Select name="projectId" defaultValue={note?.projectId ?? ""}>
          <option value="">Not linked to a project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </Select>
      </DialogField>

      <DialogField label={isEdit ? "Replace photo (optional)" : "Photo (optional)"}>
        <Input name="photo" type="file" accept="image/*" className="py-2" />
      </DialogField>
    </CreateDialog>
  );
}

export function CreateNoteDialog({
  projects
}: {
  projects?: { id: string; title: string }[];
}) {
  return <NoteFormDialog projects={projects} />;
}
