import { TasksView } from "@/features/tasks/tasks-view";
import { getProjectsData, getTasksData } from "@/lib/data";

export default async function TasksPage({
  searchParams
}: {
  searchParams?: { status?: string | string[] };
}) {
  const [tasks, projects] = await Promise.all([getTasksData(), getProjectsData()]);
  const statusParam = searchParams?.status;
  const initialStatus = Array.isArray(statusParam)
    ? statusParam[0] ?? "ALL"
    : statusParam ?? "ALL";

  const projectOptions = projects.map((project) => ({ id: project.id, title: project.title }));

  return <TasksView tasks={tasks} projects={projectOptions} initialStatus={initialStatus} />;
}
