"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, GripVertical, RectangleHorizontal, Settings2, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Width = "full" | "half";
export type HomeSection = { id: string; title: string; defaultWidth: Width; node: ReactNode };
type LayoutItem = { id: string; width: Width };

const STORAGE_KEY = "home-layout-v1";
const FLIP_DURATION = 320;

export function CustomizableGrid({ sections }: { sections: HomeSection[] }) {
  const defaults: LayoutItem[] = sections.map((s) => ({ id: s.id, width: s.defaultWidth }));
  const [layout, setLayout] = useState<LayoutItem[]>(defaults);
  const [editing, setEditing] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const dragOverId = useRef<string | null>(null);
  // A pointermove listener attached at drag-start closes over whatever
  // `layout`/`dragId` were at that instant — React state updates during the
  // drag never reach that closure. This ref is the always-fresh source of
  // truth the drag logic reads from instead.
  const layoutRef = useRef<LayoutItem[]>(defaults);

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
        const restored = [...filtered, ...missing];
        layoutRef.current = restored;
        setLayout(restored);
      }
    } catch {
      /* ignore malformed storage */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(next: LayoutItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  // FLIP: capture where every card currently is, apply the state change, then
  // on the next frame measure the new position and animate from the old one
  // — so a reorder reads as cards sliding into place, not an abrupt jump.
  function reorder(next: LayoutItem[]) {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const prevRects = new Map<string, DOMRect>();
    if (!reduceMotion) {
      itemRefs.current.forEach((el, id) => prevRects.set(id, el.getBoundingClientRect()));
    }

    layoutRef.current = next;
    setLayout(next);
    persist(next);

    if (reduceMotion) return;

    requestAnimationFrame(() => {
      itemRefs.current.forEach((el, id) => {
        const prev = prevRects.get(id);
        if (!prev) return;
        const nextRect = el.getBoundingClientRect();
        const dx = prev.left - nextRect.left;
        const dy = prev.top - nextRect.top;
        if (!dx && !dy) return;
        el.style.transition = "none";
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(() => {
          el.style.transition = `transform ${FLIP_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`;
          el.style.transform = "";
        });
      });
    });
  }

  function toggleWidth(id: string) {
    reorder(
      layout.map((item) =>
        item.id === id ? { ...item, width: item.width === "full" ? "half" : "full" } : item
      )
    );
  }

  function moveTo(sourceId: string, overId: string) {
    if (sourceId === overId) return;
    const current = layoutRef.current;
    const from = current.findIndex((i) => i.id === sourceId);
    const to = current.findIndex((i) => i.id === overId);
    if (from === -1 || to === -1) return;
    const next = [...current];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    reorder(next);
  }

  // Pointer Events unify mouse, touch, and pen, so dragging to reorder
  // actually works on a phone — the native HTML5 drag-and-drop API this
  // replaced never reliably fires from a touchscreen.
  function onGripPointerDown(id: string, event: React.PointerEvent) {
    if (event.button !== undefined && event.button !== 0 && event.pointerType === "mouse") return;
    event.preventDefault();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    setDragId(id);
    dragOverId.current = id;

    function onMove(moveEvent: PointerEvent) {
      // Geometry, not document.elementFromPoint: sibling cards get
      // pointer-events:none while editing (so you can't accidentally open
      // one mid-drag), which would make elementFromPoint skip right past
      // them and only register a drop on the thin header bar.
      let overId: string | undefined;
      itemRefs.current.forEach((el, sectionId) => {
        const rect = el.getBoundingClientRect();
        if (
          moveEvent.clientX >= rect.left &&
          moveEvent.clientX <= rect.right &&
          moveEvent.clientY >= rect.top &&
          moveEvent.clientY <= rect.bottom
        ) {
          overId = sectionId;
        }
      });
      if (overId && overId !== dragOverId.current) {
        dragOverId.current = overId;
        moveTo(id, overId);
      }
    }

    function onUp() {
      setDragId(null);
      dragOverId.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  function reset() {
    reorder(defaults);
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
              ref={(el) => {
                if (el) itemRefs.current.set(item.id, el);
                else itemRefs.current.delete(item.id);
              }}
              data-section-id={item.id}
              className={cn(
                item.width === "full" && "xl:col-span-2",
                "transition-[box-shadow,transform] ease-spring",
                editing && "rounded-3xl outline-dashed outline-2 outline-offset-4 outline-primary/40",
                editing && dragId === item.id && "z-20 scale-[1.02] shadow-glass"
              )}
            >
              {editing ? (
                <div className="mb-2 flex items-center justify-between gap-2 rounded-2xl bg-muted px-3 py-2">
                  <span
                    onPointerDown={(event) => onGripPointerDown(item.id, event)}
                    className="flex touch-none items-center gap-2 text-sm font-medium select-none"
                  >
                    <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground active:cursor-grabbing" />
                    {section.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleWidth(item.id)}
                    title={item.width === "full" ? "Make half width" : "Make full width"}
                    className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted-foreground transition ease-spring hover:text-foreground active:scale-95 motion-reduce:active:scale-100"
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
