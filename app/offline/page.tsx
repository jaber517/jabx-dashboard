import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="page-shell items-center justify-center py-20">
      <div className="surface-panel-elevated max-w-lg rounded-3xl p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <WifiOff className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold">You&apos;re offline</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The dashboard shell is still available. Once the local server or your
          connection is back, synced data and pages will resume automatically.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-95"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
