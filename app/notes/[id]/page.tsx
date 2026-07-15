import { notFound } from "next/navigation";
import { NoteDetailView } from "@/features/notes/note-detail-view";
import { getNoteDetail } from "@/lib/data";

export default async function NoteDetailPage({
  params
}: {
  params: { id: string };
}) {
  const note = await getNoteDetail(params.id);

  if (!note) {
    notFound();
  }

  return <NoteDetailView note={note} />;
}
