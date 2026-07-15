import { notFound } from "next/navigation";
import { NoteDetailView } from "@/features/notes/note-detail-view";
import { getNoteDetail, getProjectsData } from "@/lib/data";

export default async function NoteDetailPage({
  params
}: {
  params: { id: string };
}) {
  const [note, projects] = await Promise.all([getNoteDetail(params.id), getProjectsData()]);

  if (!note) {
    notFound();
  }

  const projectOptions = projects.map((project) => ({ id: project.id, title: project.title }));

  return <NoteDetailView note={note} projects={projectOptions} />;
}
