"use client";

import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { deleteResource } from "@/lib/actions";
import { ResourceFormDialog } from "@/features/resources/create-resource-dialog";
import type { ResourceRecord } from "@/types";

export function ResourceCardActions({
  resource,
  projects
}: {
  resource: ResourceRecord;
  projects?: { id: string; title: string }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1.5">
      <ResourceFormDialog
        resource={resource}
        projects={projects}
        renderTrigger={(open) => (
          <IconButton title="Edit resource" aria-label="Edit resource" onClick={open}>
            <Pencil className="h-4 w-4" />
          </IconButton>
        )}
      />
      <IconButton
        danger
        title="Delete resource"
        aria-label="Delete resource"
        disabled={pending}
        onClick={() => {
          if (window.confirm(`Delete "${resource.title}"?`)) {
            startTransition(() => deleteResource(resource.id));
          }
        }}
      >
        <Trash2 className="h-4 w-4" />
      </IconButton>
    </div>
  );
}
