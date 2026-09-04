"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFormState, useFormStatus } from "react-dom";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CreateResult } from "@/lib/actions";

const EXIT_DURATION = 160;

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
  // `mounted` keeps the dialog in the DOM long enough to play the exit
  // animation; `entered` is what actually drives the enter/exit CSS classes,
  // so closing is a reversible transition rather than an instant unmount.
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [state, formAction] = useFormState(action, { ok: false });
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  function openDialog() {
    window.clearTimeout(closeTimer.current);
    setMounted(true);
  }

  function closeDialog() {
    setEntered(false);
    closeTimer.current = setTimeout(() => setMounted(false), EXIT_DURATION);
  }

  useEffect(() => {
    if (!mounted) return;
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [mounted]);

  useEffect(() => {
    if (state.ok) {
      closeDialog();
      setFormKey((key) => key + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (!mounted) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeDialog();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  return (
    <>
      {renderTrigger ? (
        renderTrigger(openDialog)
      ) : (
        <Button size="lg" className="gap-2" onClick={openDialog}>
          <Plus className="h-4 w-4" />
          {triggerLabel}
        </Button>
      )}

      {mounted
        ? createPortal(
            <div
              className={cn(
                "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity ease-spring motion-reduce:transition-none",
                entered ? "opacity-100 duration-200" : "opacity-0 duration-150"
              )}
              onClick={closeDialog}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={cn(
                  "max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-surface-elevated p-6 shadow-glass transition ease-spring motion-reduce:transition-opacity",
                  entered
                    ? "translate-y-0 scale-100 opacity-100 duration-200"
                    : "translate-y-2 scale-95 opacity-0 duration-150"
                )}
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
                    onClick={closeDialog}
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
                    <Button type="button" variant="secondary" onClick={closeDialog}>
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
