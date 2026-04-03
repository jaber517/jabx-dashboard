import { ResourcesView } from "@/features/resources/resources-view";
import { getResourcesData } from "@/lib/data";

export default async function ResourcesPage() {
  const resources = await getResourcesData();

  return <ResourcesView resources={resources} />;
}
