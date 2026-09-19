import { SettingsView } from "@/features/settings/settings-view";
import { getSettingsStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const stats = await getSettingsStats();

  return <SettingsView stats={stats} />;
}
