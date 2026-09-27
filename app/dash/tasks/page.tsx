import { TasksView } from "@/features/tasks/tasks-view";
import { getProjectsData, getTasksData } from "@/lib/data";

export const dynamic = "force-dynamic";

// Filters (status, project, search…) live in the URL and are read by the view.
export default async function TasksPage() {
  const [tasks, projects] = await Promise.all([getTasksData(), getProjectsData()]);
  const projectOptions = projects.map((project) => ({ id: project.id, title: project.title }));

  return <TasksView tasks={tasks} projects={projectOptions} />;
}
