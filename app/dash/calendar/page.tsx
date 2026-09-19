import { CalendarView } from "@/features/calendar/calendar-view";
import { getCalendarData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const items = await getCalendarData();

  return <CalendarView items={items} />;
}
