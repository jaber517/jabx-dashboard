import type { Metadata } from "next";
import { ReviewView } from "@/features/review/review-view";
import { getTasksData } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Weekly review" };

export default async function ReviewPage() {
  const tasks = await getTasksData();
  return <ReviewView tasks={tasks} />;
}
