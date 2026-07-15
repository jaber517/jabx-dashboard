import { ProjectsView } from "@/features/projects/projects-view";
import { getProjectsData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getProjectsData();

  return <ProjectsView projects={projects} />;
}
