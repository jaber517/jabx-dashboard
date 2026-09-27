import { SettingsView } from "@/features/settings/settings-view";
import { currentSessionId } from "@/lib/auth";
import { listPasskeys, listSessions } from "@/lib/auth-store";
import { getSettingsStats } from "@/lib/data";
import { deviceName } from "@/lib/device-name";
import { fileStorageEnabled, listBackups } from "@/lib/files";
import { countInlinePhotos } from "@/lib/backup";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const storage = fileStorageEnabled();
  const [stats, passkeys, sessions, currentId, backups, inlinePhotos] = await Promise.all([
    getSettingsStats(),
    listPasskeys(),
    listSessions(),
    currentSessionId(),
    storage ? listBackups().catch(() => []) : Promise.resolve([]),
    countInlinePhotos()
  ]);

  return (
    <SettingsView
      stats={stats}
      data={{
        storage,
        inlinePhotos,
        backups: backups.map((blob) => ({
          name: blob.pathname.replace("backups/", ""),
          size: blob.size,
          uploadedAt: blob.uploadedAt.toISOString()
        }))
      }}
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
