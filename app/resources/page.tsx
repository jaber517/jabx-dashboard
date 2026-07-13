import { ResourcesView } from "@/features/resources/resources-view";
import { getProjectsData, getResourcesData } from "@/lib/data";

export default async function ResourcesPage() {
  const [resources, projects] = await Promise.all([getResourcesData(), getProjectsData()]);
  const projectOptions = projects.map((project) => ({ id: project.id, title: project.title }));

  return <ResourcesView resources={resources} projects={projectOptions} />;
}
