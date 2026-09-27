"use client";

import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { useDeleteWithUndo } from "@/components/providers/undo-provider";
import { deleteNote } from "@/lib/actions";
import { NoteFormDialog } from "@/features/notes/create-note-dialog";
import type { NoteRecord } from "@/types";

export function NoteCardActions({
  note,
  projects
}: {
  note: NoteRecord;
  projects?: { id: string; title: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const deleteWithUndo = useDeleteWithUndo("/notes");

  return (
    <div className="flex items-center gap-1.5">
      <NoteFormDialog
        note={note}
        projects={projects}
        renderTrigger={(open) => (
          <IconButton title="Edit note" aria-label="Edit note" onClick={open}>
            <Pencil className="h-4 w-4" />
          </IconButton>
        )}
      />
      <IconButton
        danger
        title="Delete note"
        aria-label="Delete note"
        disabled={pending}
        onClick={() => deleteWithUndo(note.id, note.title, () => deleteNote(note.id))}
      >
        <Trash2 className="h-4 w-4" />
      </IconButton>
    </div>
  );
}
