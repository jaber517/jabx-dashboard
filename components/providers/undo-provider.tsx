"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";

const UNDO_WINDOW = 6000;

type Toast = { key: number; message: string; undo?: () => void };

type UndoApi = {
  /** Hide an item now and delete it after the undo window unless undone. */
  scheduleDelete: (options: { id: string; message: string; run: () => Promise<unknown> }) => void;
  /** Show a short confirmation, optionally with an Undo button. */
  notify: (message: string, undo?: () => void) => void;
  isPendingDelete: (id: string) => boolean;
};

const UndoContext = createContext<UndoApi | null>(null);

export function useUndo(): UndoApi {
  const api = useContext(UndoContext);
  if (!api) throw new Error("useUndo must be used inside <UndoProvider>.");
  return api;
}

/**
 * Delete with an undo window. On the item's own detail page it first goes
 * back to the list, since the page is about to stop existing.
 */
export function useDeleteWithUndo(listHref: string) {
  const { scheduleDelete } = useUndo();
  const router = useRouter();
  const pathname = usePathname();
  return (id: string, title: string, run: () => Promise<unknown>) => {
    if (pathname === `${listHref}/${id}`) router.push(listHref);
    scheduleDelete({ id, message: `Deleted “${title}”`, run });
  };
}

/** Renders its children unless the item is waiting to be deleted. */
export function HideWhileDeleting({ id, children }: { id: string; children: ReactNode }) {
  const { isPendingDelete } = useUndo();
  return isPendingDelete(id) ? null : <>{children}</>;
}

// Deletes wait out a short undo window instead of asking "Are you sure?"
// first: the item disappears at once, a toast offers Undo, and the real
// delete runs when the window closes (or straight away if the page is left).
export function UndoProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextKey = useRef(0);
  const deletes = useRef(new Map<string, { run: () => Promise<unknown>; timer: ReturnType<typeof setTimeout> }>());

  const dismiss = useCallback((key: number) => {
    setToasts((current) => current.filter((toast) => toast.key !== key));
  }, []);

  const show = useCallback(
    (message: string, undo?: () => void) => {
      const key = ++nextKey.current;
      setToasts((current) => [...current.slice(-2), { key, message, undo }]);
      setTimeout(() => dismiss(key), UNDO_WINDOW);
      return key;
    },
    [dismiss]
  );

  const unhide = useCallback((id: string) => {
    setPending((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }, []);

  const commit = useCallback(
    async (id: string) => {
      const entry = deletes.current.get(id);
      if (!entry) return;
      deletes.current.delete(id);
      clearTimeout(entry.timer);
      try {
        await entry.run();
      } catch {
        show("Couldn't delete that. It has been restored.");
      } finally {
        unhide(id);
      }
    },
    [show, unhide]
  );

  const scheduleDelete = useCallback<UndoApi["scheduleDelete"]>(
    ({ id, message, run }) => {
      setPending((current) => new Set(current).add(id));
      const timer = setTimeout(() => commit(id), UNDO_WINDOW);
      deletes.current.set(id, { run, timer });
      show(message, () => {
        const entry = deletes.current.get(id);
        if (entry) clearTimeout(entry.timer);
        deletes.current.delete(id);
        unhide(id);
      });
    },
    [commit, show, unhide]
  );

  // Leaving or closing the page commits anything still waiting.
  useEffect(() => {
    const flush = () => deletes.current.forEach((_, id) => void commit(id));
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [commit]);

  const api: UndoApi = {
    scheduleDelete,
    notify: (message, undo) => void show(message, undo),
    isPendingDelete: (id) => pending.has(id)
  };

  return (
    <UndoContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:left-[248px]"
      >
        {toasts.map((toast) => (
          <div
            key={toast.key}
            role="status"
            className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-border bg-surface py-2 pl-4 pr-2 text-sm font-medium text-foreground animate-drop-in"
          >
            <span className="flex-1">{toast.message}</span>
            {toast.undo ? (
              <button
                type="button"
                onClick={() => {
                  toast.undo?.();
                  dismiss(toast.key);
                }}
                className="h-9 rounded-xl px-3 font-semibold text-primary hover:bg-muted"
              >
                Undo
              </button>
            ) : null}
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(toast.key)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </UndoContext.Provider>
  );
}
