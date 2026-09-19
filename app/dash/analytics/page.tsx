import { AnalyticsView } from "@/features/analytics/analytics-view";
import { getAnalyticsData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return <AnalyticsView {...data} />;
}
