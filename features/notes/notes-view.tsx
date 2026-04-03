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

export function NotesView({ notes }: { notes: NoteRecord[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const deferredQuery = useDeferredValue(query);

  const filteredNotes = notes.filter((note) => {
    const haystack = `${note.title} ${note.content} ${note.tags.join(" ")}`.toLowerCase();
    const matchesQuery = deferredQuery.length === 0 || haystack.includes(deferredQuery.toLowerCase());
    return matchesQuery && (category === "ALL" || note.category === category);
  });

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Vault"
        title="Notes and ideas"
        description="A searchable knowledge vault for project thinking, meeting outcomes, reusable ideas, and prompt patterns."
      />

      <Card>
        <CardHeader>
          <CardTitle>Search and filter</CardTitle>
          <CardDescription>
            Search titles, note content, and tags across the vault.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1.3fr_0.7fr]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes, tags, and ideas..." />
          <Select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="ALL">All categories</option>
            {PROJECT_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {categoryLabels[item]}
              </option>
            ))}
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
          {filteredNotes.map((note) => (
            <Card key={note.id} className="flex h-full flex-col">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <Badge className="bg-muted text-muted-foreground">
                    {categoryLabels[note.category]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeDate(note.updatedAt)}
                  </span>
                </div>
                <CardTitle className="mt-2">{note.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between">
                <p className="text-sm leading-6 text-muted-foreground">{note.content}</p>
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
