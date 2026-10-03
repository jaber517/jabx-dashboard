"use client";

import { useEffect, useRef, useState, useTransition, type DragEvent, type KeyboardEvent } from "react";
import { GripVertical, ListChecks, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useUndo } from "@/components/providers/undo-provider";
import {
  addChecklistItems,
  deleteChecklistItem,
  renameChecklistItem,
  reorderChecklist,
  setChecklistItemDone,
  setTaskDone
} from "@/lib/actions";
import { cn } from "@/lib/utils";
import type { ChecklistItemRecord } from "@/types";

const DRAG_TYPE = "application/x-jabx-step";

// The steps inside a task: tick them off, add with Enter (or paste several
// lines at once), click a step to edit it, drag the handle (or Alt+↑/↓ on
// it) to reorder, delete with undo. Ticking the last step offers to mark the
// whole task done.
export function TaskChecklist({
  taskId,
  items: initialItems,
  taskDone
}: {
  taskId: string;
  items: ChecklistItemRecord[];
  taskDone: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { notify, scheduleDelete, isPendingDelete } = useUndo();
  const addInput = useRef<HTMLInputElement>(null);

  // Fresh server data replaces optimistic changes.
  useEffect(() => setItems(initialItems), [initialItems]);

  const visible = items.filter((item) => !isPendingDelete(item.id));
  const done = visible.filter((item) => item.done).length;

  function add(text: string) {
    if (!text.trim()) return;
    setError("");
    startTransition(async () => {
      const result = await addChecklistItems(taskId, text);
      if (result.ok) setDraft("");
      else setError(result.error ?? "Couldn't add that step.");
    });
  }

  function toggle(item: ChecklistItemRecord) {
    const next = !item.done;
    setItems((current) => current.map((step) => (step.id === item.id ? { ...step, done: next } : step)));
    startTransition(async () => {
      const { allDone } = await setChecklistItemDone(item.id, next);
      if (next && allDone && !taskDone) {
        notify("All steps done.", () => startTransition(() => setTaskDone(taskId, true)), "Mark task done");
      }
    });
  }

  function rename(item: ChecklistItemRecord, text: string) {
    setEditing(null);
    const value = text.trim();
    if (!value || value === item.text) return;
    setItems((current) => current.map((step) => (step.id === item.id ? { ...step, text: value } : step)));
    startTransition(() => renameChecklistItem(item.id, value));
  }

  function remove(item: ChecklistItemRecord) {
    scheduleDelete({ id: item.id, message: `Removed “${item.text}”`, run: () => deleteChecklistItem(item.id) });
  }

  function saveOrder(next: ChecklistItemRecord[]) {
    setItems(next);
    startTransition(() =>
      reorderChecklist(
        taskId,
        next.map((step) => step.id)
      )
    );
  }

  // Positions count only visible steps (not ones waiting out their undo).
  function move(id: string, to: number) {
    const from = visible.findIndex((step) => step.id === id);
    if (from < 0 || to < 0 || to >= visible.length || from === to) return;
    const next = [...visible];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    saveOrder([...next, ...items.filter((step) => isPendingDelete(step.id))]);
  }

  function onHandleKey(event: KeyboardEvent<HTMLButtonElement>, id: string, index: number) {
    if (!event.altKey || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
    event.preventDefault();
    move(id, event.key === "ArrowUp" ? index - 1 : index + 1);
    requestAnimationFrame(() => event.currentTarget?.focus());
  }

  function onDrop(event: DragEvent, index: number) {
    event.preventDefault();
    const id = event.dataTransfer.getData(DRAG_TYPE);
    setDragging(null);
    if (id) move(id, index);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-[18px] w-[18px] text-primary" aria-hidden="true" />
            Checklist
          </CardTitle>
          {visible.length > 0 ? (
            <span className="text-sm font-semibold tabular-nums text-muted-foreground">
              {done} of {visible.length}
            </span>
          ) : null}
        </div>
        {visible.length > 0 ? <ProgressBar value={(done / visible.length) * 100} className="mt-2" /> : null}
      </CardHeader>
      <CardContent className="mt-4 space-y-2">
        {visible.length > 0 ? (
          <ul aria-label="Steps" className="divide-y divide-border rounded-2xl border border-border">
            {visible.map((item, index) => (
              <li
                key={item.id}
                onDragOver={(event) => {
                  if (event.dataTransfer.types.includes(DRAG_TYPE)) event.preventDefault();
                }}
                onDrop={(event) => onDrop(event, index)}
                className={cn("group flex items-center gap-1 pr-2", dragging === item.id && "opacity-50")}
              >
                <button
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData(DRAG_TYPE, item.id);
                    event.dataTransfer.effectAllowed = "move";
                    setDragging(item.id);
                  }}
                  onDragEnd={() => setDragging(null)}
                  onKeyDown={(event) => onHandleKey(event, item.id, index)}
                  aria-label={`Reorder “${item.text}” (Alt + arrow keys)`}
                  className="flex h-11 w-8 shrink-0 cursor-grab items-center justify-center text-muted-foreground opacity-60 hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
                >
                  <GripVertical className="h-4 w-4" aria-hidden="true" />
                </button>
                <label className="flex h-11 w-9 shrink-0 cursor-pointer items-center justify-center">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggle(item)}
                    aria-label={`${item.done ? "Untick" : "Tick"} “${item.text}”`}
                    className="h-[18px] w-[18px] cursor-pointer accent-[hsl(var(--primary-strong))]"
                  />
                </label>
                {editing === item.id ? (
                  <Input
                    autoFocus
                    defaultValue={item.text}
                    aria-label="Edit step"
                    onBlur={(event) => rename(item, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") rename(item, event.currentTarget.value);
                      if (event.key === "Escape") setEditing(null);
                    }}
                    className="h-9 flex-1"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditing(item.id)}
                    className={cn(
                      "min-h-11 flex-1 py-2 text-left text-[15px] leading-6",
                      item.done && "text-muted-foreground line-through"
                    )}
                    aria-label={`Edit “${item.text}”`}
                  >
                    {item.text}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(item)}
                  aria-label={`Remove “${item.text}”`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-danger focus-visible:opacity-100 group-hover:opacity-100 max-lg:opacity-100"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            add(draft);
          }}
        >
          <Input
            ref={addInput}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onPaste={(event) => {
              const text = event.clipboardData.getData("text");
              if (text.includes("\n")) {
                event.preventDefault();
                add(text);
              }
            }}
            placeholder={visible.length ? "Add a step" : "Break this task into steps: type one and press Enter"}
            aria-label="Add a step"
            className="h-11"
          />
        </form>
        <p className="text-xs text-muted-foreground">Tip: paste a list to add several steps at once.</p>
        {error ? (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
