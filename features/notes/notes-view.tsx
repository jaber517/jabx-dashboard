"use client";

import { useDeferredValue, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { categoryLabels } from "@/lib/constants";
import { formatRelativeDate } from "@/lib/formatters";
import { PROJECT_CATEGORIES } from "@/types";
import type { NoteRecord } from "@/types";
import { CreateNoteDialog } from "@/features/notes/create-note-dialog";
import { NoteCardActions } from "@/features/notes/note-card-actions";

export function NotesView({ notes }: { notes: NoteRecord[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState("RECENT");
  const deferredQuery = useDeferredValue(query);

  const filteredNotes = notes.filter((note) => {
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
        eyebrow="Vault"
        title="Notes and ideas"
        description="A searchable knowledge vault for project thinking, meeting outcomes, reusable ideas, and prompt patterns."
        actions={<CreateNoteDialog />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Search and filter</CardTitle>
          <CardDescription>
            Search titles, note content, and tags across the vault.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1.2fr_0.6fr_0.6fr]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes, tags, and ideas..." />
          <Select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="ALL">All categories</option>
            {PROJECT_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {categoryLabels[item]}
              </option>
            ))}
          </Select>
          <Select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="RECENT">Sort: Newest first</option>
            <option value="OLDEST">Sort: Oldest first</option>
            <option value="TITLE">Sort: Title A–Z</option>
          </Select>
        </CardContent>
      </Card>

      {filteredNotes.length === 0 ? (
        <EmptyState
          title="No notes found"
          description="Try a broader search term or switch back to all categories to see more ideas."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {sortedNotes.map((note) => (
            <Card key={note.id} className="flex h-full flex-col">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <Badge className="bg-muted text-muted-foreground">
                    {categoryLabels[note.category]}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeDate(note.updatedAt)}
                    </span>
                    <NoteCardActions note={note} />
                  </div>
                </div>
                <CardTitle className="mt-2">{note.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between">
                <div>
                  {note.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={note.imageUrl}
                      alt=""
                      className="mb-4 max-h-48 w-full rounded-2xl border border-border object-cover"
                    />
                  ) : null}
                  <p className="text-sm leading-6 text-muted-foreground">{note.content}</p>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {note.tags.map((tag) => (
                    <Badge key={tag} className="bg-primary/10 text-primary">
                      #{tag}
                    </Badge>
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
