import { NotesView } from "@/features/notes/notes-view";
import { getNotesData } from "@/lib/data";

export default async function NotesPage() {
  const notes = await getNotesData();

  return <NotesView notes={notes} />;
}
