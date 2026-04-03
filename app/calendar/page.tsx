import { CalendarView } from "@/features/calendar/calendar-view";
import { getCalendarData } from "@/lib/data";

export default async function CalendarPage() {
  const milestones = await getCalendarData();

  return <CalendarView milestones={milestones} />;
}
