import { ActivityView } from "@/features/activity/activity-view";
import { getActivityData } from "@/lib/data";

export default async function ActivityPage() {
  const activities = await getActivityData();

  return <ActivityView activities={activities} />;
}
