import { SettingsView } from "@/features/settings/settings-view";
import { getSettingsStats } from "@/lib/data";

export default async function SettingsPage() {
  const stats = await getSettingsStats();

  return <SettingsView stats={stats} />;
}
