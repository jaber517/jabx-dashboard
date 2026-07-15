import { HomeDashboard } from "@/features/home/home-dashboard";
import { getHomePageData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getHomePageData();

  return <HomeDashboard {...data} />;
}
