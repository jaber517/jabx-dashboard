"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, GripVertical, RectangleHorizontal, Settings2, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Width = "full" | "half";
export type HomeSection = { id: string; title: string; defaultWidth: Width; node: ReactNode };
type LayoutItem = { id: string; width: Width };

const STORAGE_KEY = "home-layout-v1";

export function CustomizableGrid({ sections }: { sections: HomeSection[] }) {
  const defaults: LayoutItem[] = sections.map((s) => ({ id: s.id, width: s.defaultWidth }));
  const [layout, setLayout] = useState<LayoutItem[]>(defaults);
  const [editing, setEditing] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  // Load any saved layout after mount (keeps SSR and first client render identical).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (Array.isArray(saved)) {
        const known = new Map(defaults.map((d) => [d.id, d.width] as const));
        const filtered: LayoutItem[] = saved
          .filter((item) => known.has(item.id))
          .map((item) => ({ id: item.id, width: item.width === "full" ? "full" : "half" }));
        const missing = defaults.filter((d) => !filtered.some((f) => f.id === d.id));
        setLayout([...filtered, ...missing]);
      }
    } catch {
      /* ignore malformed storage */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(next: LayoutItem[]) {
    setLayout(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function toggleWidth(id: string) {
    persist(
      layout.map((item) =>
        item.id === id ? { ...item, width: item.width === "full" ? "half" : "full" } : item
      )
    );
  }

  function onDrop(overId: string) {
    if (!dragId || dragId === overId) return;
    const next = [...layout];
    const from = next.findIndex((i) => i.id === dragId);
    const to = next.findIndex((i) => i.id === overId);
    if (from === -1 || to === -1) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    persist(next);
    setDragId(null);
  }

  function reset() {
    persist(defaults);
  }

  const byId = new Map(sections.map((s) => [s.id, s] as const));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        {editing ? (
          <Button variant="ghost" size="sm" onClick={reset}>
            Reset layout
          </Button>
        ) : null}
        <Button
          variant={editing ? "default" : "secondary"}
          size="sm"
          className="gap-2"
          onClick={() => setEditing((value) => !value)}
        >
          {editing ? <Check className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
          {editing ? "Done" : "Customize layout"}
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {layout.map((item) => {
          const section = byId.get(item.id);
          if (!section) return null;

          return (
            <div
              key={item.id}
              draggable={editing}
              onDragStart={() => setDragId(item.id)}
              onDragOver={(event) => editing && event.preventDefault()}
              onDrop={() => onDrop(item.id)}
              className={cn(
                item.width === "full" && "xl:col-span-2",
                editing && "rounded-3xl outline-dashed outline-2 outline-offset-4 outline-primary/40",
                editing && dragId === item.id && "opacity-50"
              )}
            >
              {editing ? (
                <div className="mb-2 flex items-center justify-between gap-2 rounded-2xl bg-muted px-3 py-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                    {section.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleWidth(item.id)}
                    title={item.width === "full" ? "Make half width" : "Make full width"}
                    className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                  >
                    {item.width === "full" ? (
                      <>
                        <Square className="h-3.5 w-3.5" /> Half
                      </>
                    ) : (
                      <>
                        <RectangleHorizontal className="h-3.5 w-3.5" /> Full
                      </>
                    )}
                  </button>
                </div>
              ) : null}
              <div className={cn(editing && "pointer-events-none")}>{section.node}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
