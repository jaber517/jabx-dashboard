import { notFound } from "next/navigation";
import { TaskDetailView } from "@/features/tasks/task-detail-view";
import { getProjectsData, getTaskDetail } from "@/lib/data";

export default async function TaskDetailPage({
  params
}: {
  params: { id: string };
}) {
  const [task, projects] = await Promise.all([getTaskDetail(params.id), getProjectsData()]);

  if (!task) {
    notFound();
  }

  const projectOptions = projects.map((project) => ({ id: project.id, title: project.title }));

  return <TaskDetailView task={task} projects={projectOptions} />;
}
