import { notFound } from "next/navigation";
import { ProjectDetailView } from "@/features/projects/project-detail-view";
import { getProjectDetail } from "@/lib/data";

export default async function ProjectDetailPage({
  params
}: {
  params: { id: string };
}) {
  const project = await getProjectDetail(params.id);

  if (!project) {
    notFound();
  }

  return <ProjectDetailView project={project} />;
}
