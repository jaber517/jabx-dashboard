import { SettingsView } from "@/features/settings/settings-view";
import { currentSessionId } from "@/lib/auth";
import { listPasskeys, listSessions } from "@/lib/auth-store";
import { getSettingsStats } from "@/lib/data";
import { deviceName } from "@/lib/device-name";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [stats, passkeys, sessions, currentId] = await Promise.all([
    getSettingsStats(),
    listPasskeys(),
    listSessions(),
    currentSessionId()
  ]);

  return (
    <SettingsView
      stats={stats}
      security={{
        passkeys: passkeys.map((key) => ({
          id: key.id,
          name: key.name,
          createdAt: key.createdAt.toISOString(),
          lastUsedAt: key.lastUsedAt?.toISOString() ?? null
        })),
        sessions: sessions.map((session) => ({
          id: session.id,
          device: deviceName(session.userAgent),
          method: session.method,
          lastSeenAt: session.lastSeenAt.toISOString(),
          current: session.id === currentId
        }))
      }}
    />
  );
}
