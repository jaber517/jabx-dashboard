import { NotesView } from "@/features/notes/notes-view";
import { getNotesData, getProjectsData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const [notes, projects] = await Promise.all([getNotesData(), getProjectsData()]);
  const projectOptions = projects.map((project) => ({ id: project.id, title: project.title }));

  return <NotesView notes={notes} projects={projectOptions} />;
}
