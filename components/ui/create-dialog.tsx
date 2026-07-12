"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFormState, useFormStatus } from "react-dom";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CreateResult } from "@/lib/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

export function DialogField({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export function CreateDialog({
  triggerLabel,
  renderTrigger,
  title,
  description,
  submitLabel,
  action,
  children
}: {
  triggerLabel?: string;
  renderTrigger?: (open: () => void) => ReactNode;
  title: string;
  description: string;
  submitLabel: string;
  action: (prev: CreateResult, formData: FormData) => Promise<CreateResult>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [state, formAction] = useFormState(action, { ok: false });

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      setFormKey((key) => key + 1);
    }
  }, [state]);

  return (
    <>
      {renderTrigger ? (
        renderTrigger(() => setOpen(true))
      ) : (
        <Button size="lg" className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          {triggerLabel}
        </Button>
      )}

      {open
        ? createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-surface-elevated p-6 shadow-glass"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form key={formKey} action={formAction} className="mt-5 grid gap-4">
              {children}

              {!state.ok && state.error ? (
                <p className="text-sm font-medium text-danger">{state.error}</p>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <SubmitButton label={submitLabel} />
              </div>
            </form>
          </div>
        </div>,
        document.body
          )
        : null}
    </>
  );
}
