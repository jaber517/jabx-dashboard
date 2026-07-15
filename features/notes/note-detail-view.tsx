import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { categoryLabels } from "@/lib/constants";
import { formatRelativeDate } from "@/lib/formatters";
import type { NoteRecord } from "@/types";
import { NoteCardActions } from "@/features/notes/note-card-actions";

export function NoteDetailView({ note }: { note: NoteRecord }) {
  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Note"
        title={note.title}
        description={`Last updated ${formatRelativeDate(note.updatedAt)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/notes" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              All notes
            </Link>
            <NoteCardActions note={note} />
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-muted text-muted-foreground">{categoryLabels[note.category]}</Badge>
            </div>
            <CardTitle className="mt-2">{note.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {note.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={note.imageUrl}
                alt=""
                className="max-h-80 w-full rounded-2xl border border-border object-cover"
              />
            ) : null}
            <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{note.content}</p>
            {note.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {note.tags.map((tag) => (
                  <Badge key={tag} className="bg-primary/10 text-primary">
                    #{tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Where this note lives.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Category</span>
              <span className="text-right">{categoryLabels[note.category]}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Project</span>
              {note.project ? (
                <Link href={`/projects/${note.project.id}`} className="text-right text-primary hover:underline">
                  {note.project.title}
                </Link>
              ) : (
                <span className="text-right">Not linked</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
