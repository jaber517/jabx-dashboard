"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { FilterBadge } from "@/components/ui/filter-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { categoryDot, categoryLabels } from "@/lib/constants";
import { formatRelativeDate } from "@/lib/formatters";
import { PROJECT_CATEGORIES } from "@/types";
import type { NoteRecord } from "@/types";
import { CreateNoteDialog } from "@/features/notes/create-note-dialog";
import { NoteCardActions } from "@/features/notes/note-card-actions";
import { useUndo } from "@/components/providers/undo-provider";
import { plainText } from "@/lib/markdown";
import { useUrlState } from "@/lib/use-url-state";
import { cn } from "@/lib/utils";

export function NotesView({
  notes,
  projects = []
}: {
  notes: NoteRecord[];
  projects?: { id: string; title: string }[];
}) {
  const [filters, setFilters] = useUrlState({ q: "", category: "ALL", sort: "RECENT" });
  const { category, sort } = filters;
  const [query, setQueryState] = useState(filters.q);
  const deferredQuery = useDeferredValue(query);
  const setQuery = (value: string) => {
    setQueryState(value);
    setFilters({ q: value });
  };
  const setCategory = (value: string) => setFilters({ category: value });
  const chip = (active: boolean) =>
    cn(
      "flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
      active ? "border-primary bg-muted text-foreground" : "border-border text-muted-foreground hover:text-foreground"
    );

  const { isPendingDelete } = useUndo();
  const filteredNotes = notes.filter((note) => {
    if (isPendingDelete(note.id)) return false;
    const haystack = `${note.title} ${note.content} ${note.tags.join(" ")}`.toLowerCase();
    const matchesQuery = deferredQuery.length === 0 || haystack.includes(deferredQuery.toLowerCase());
    return matchesQuery && (category === "ALL" || note.category === category);
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    switch (sort) {
      case "TITLE":
        return a.title.localeCompare(b.title);
      case "OLDEST":
        return Date.parse(a.updatedAt) - Date.parse(b.updatedAt);
      default:
        return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    }
  });

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Workspace"
        title="Notes"
        description="Project thinking, meeting outcomes, reusable ideas and prompt patterns."
        actions={<CreateNoteDialog projects={projects} />}
      />

      <div className="flex flex-col gap-3">
        <div role="group" aria-label="Category" className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={category === "ALL"} onClick={() => setCategory("ALL")} className={chip(category === "ALL")}>
            All <span className="tabular-nums text-muted-foreground">{notes.length}</span>
          </button>
          {PROJECT_CATEGORIES.map((item) => (
            <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={chip(category === item)}>
              <span className={cn("h-2 w-2 rounded-full", categoryDot[item])} aria-hidden="true" />
              {categoryLabels[item]}
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes, tags and ideas…" aria-label="Search notes" className="h-10" />
          <Select value={sort} onChange={(event) => setFilters({ sort: event.target.value })} aria-label="Sort" className="h-10">
            <option value="RECENT">Sort: Newest first</option>
            <option value="OLDEST">Sort: Oldest first</option>
            <option value="TITLE">Sort: Title A–Z</option>
          </Select>
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <EmptyState
          title="No notes found"
          description="Try a broader search term or switch back to all categories to see more ideas."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {sortedNotes.map((note) => (
            <Card
              key={note.id}
              className="relative flex h-full flex-col transition-colors [&:has(>a:hover)]:border-primary"
            >
              <Link
                href={`/notes/${note.id}`}
                aria-label={note.title}
                className="absolute inset-0 z-0 rounded-3xl"
              />
              <CardHeader className="pointer-events-none">
                <div className="flex items-center justify-between gap-3">
                  <FilterBadge className="text-muted-foreground" onSelect={() => setCategory(note.category)}>
                    {categoryLabels[note.category]}
                  </FilterBadge>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeDate(note.updatedAt)}
                    </span>
                    <div className="pointer-events-auto relative z-10">
                      <NoteCardActions note={note} projects={projects} />
                    </div>
                  </div>
                </div>
                <CardTitle className="mt-2">{note.title}</CardTitle>
              </CardHeader>
              <CardContent className="pointer-events-none flex flex-1 flex-col justify-between">
                <div>
                  {note.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={note.imageUrl}
                      alt=""
                      className="mb-4 max-h-48 w-full rounded-2xl border border-border object-cover"
                    />
                  ) : null}
                  <p className="text-sm leading-6 text-muted-foreground line-clamp-4">{plainText(note.content)}</p>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {note.tags.map((tag) => (
                    <FilterBadge key={tag} className="text-primary" onSelect={() => setQuery(tag)}>
                      #{tag}
                    </FilterBadge>
                  ))}
                </div>
                {note.project ? (
                  <p className="mt-4 text-xs text-muted-foreground">Linked to {note.project.title}</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
