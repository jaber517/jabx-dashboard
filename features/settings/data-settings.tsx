"use client";

import { useState, useTransition } from "react";
import { Archive, Download, ImageUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUndo } from "@/components/providers/undo-provider";
import { backupNow, movePhotosToStorage } from "@/lib/maintenance-actions";
import { formatRelativeDate } from "@/lib/formatters";

export type DataSettingsProps = {
  storage: boolean;
  backups: { name: string; size: number; uploadedAt: string }[];
  inlinePhotos: number;
};

function kb(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DataSettings({ storage, backups, inlinePhotos }: DataSettingsProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const { notify } = useUndo();

  function run(action: () => Promise<{ ok: true; message: string } | { ok: false; error: string }>) {
    setError("");
    startTransition(async () => {
      const result = await action();
      if (result.ok) notify(result.message);
      else setError(result.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border text-primary">
          <Archive className="h-5 w-5" aria-hidden="true" />
        </div>
        <CardTitle className="mt-2">Backups</CardTitle>
        <CardDescription>
          {storage
            ? "A copy of everything is saved every night to private file storage. The last 30 days are kept."
            : "Backups need file storage, which is only set up on the live dashboard."}
        </CardDescription>
      </CardHeader>
      {storage ? (
        <CardContent className="space-y-4">
          {backups.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              No backups yet. The first runs tonight, or make one now.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-2xl border border-border">
              {backups.slice(0, 5).map((backup, index) => (
                <li key={backup.name} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {backup.name.replace(".json", "")}
                      {index === 0 ? <span className="ml-2 text-xs font-medium text-muted-foreground">Latest</span> : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {kb(backup.size)} · saved {formatRelativeDate(backup.uploadedAt)}
                    </p>
                  </div>
                  <a
                    href={`/api/backups/${backup.name}`}
                    className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold text-primary hover:bg-muted"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download
                  </a>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" disabled={pending} onClick={() => run(backupNow)}>
              Back up now
            </Button>
            {inlinePhotos > 0 ? (
              <Button type="button" variant="secondary" disabled={pending} onClick={() => run(movePhotosToStorage)} className="gap-2">
                <ImageUp className="h-4 w-4" aria-hidden="true" />
                Move {inlinePhotos} photo{inlinePhotos === 1 ? "" : "s"} to file storage
              </Button>
            ) : null}
          </div>
          {inlinePhotos > 0 ? (
            <p className="text-[13px] text-muted-foreground">
              Older photos are still stored inside the database, which slows pages down. Moving them is a one-time step.
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}
