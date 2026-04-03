import { TasksView } from "@/features/tasks/tasks-view";
import { getTasksData } from "@/lib/data";

export default async function TasksPage({
  searchParams
}: {
  searchParams?: { status?: string | string[] };
}) {
  const tasks = await getTasksData();
  const statusParam = searchParams?.status;
  const initialStatus = Array.isArray(statusParam)
    ? statusParam[0] ?? "ALL"
    : statusParam ?? "ALL";

  return <TasksView tasks={tasks} initialStatus={initialStatus} />;
}
