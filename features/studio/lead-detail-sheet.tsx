"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, Check, Mail, Phone, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateLeadStage } from "@/lib/actions";
import { formatDate } from "@/lib/formatters";
import { STUDIO_STAGES, stageTone, type LeadWithStage, type StudioStage } from "./types";

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : formatDate(date, "MMM d, yyyy · HH:mm");
}

export function LeadDetailSheet({
  lead,
  onClose,
  onStageUpdated
}: {
  lead: LeadWithStage;
  onClose: () => void;
  onStageUpdated?: (leadId: string, stage: StudioStage, note: string | null) => void;
}) {
  const [stage, setStage] = useState<StudioStage>(lead.stage);
  const [note, setNote] = useState(lead.note ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setStage(lead.stage);
    setNote(lead.note ?? "");
    setError(null);
    setSaved(false);
  }, [lead]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleSave() {
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateLeadStage(lead.id, stage, note);
      if (result.ok) {
        setSaved(true);
        onStageUpdated?.(lead.id, stage, note.trim() || null);
      } else {
        setError(result.error ?? "Failed to update stage.");
      }
    });
  }

  const isFailed = lead.email_status === "failed";

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-[#07111B]/70"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Lead details: ${lead.name}`}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-surface p-5 shadow-2xl sm:p-6 overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="min-w-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Lead details
            </span>
            <h2 className="mt-1 truncate text-xl font-bold text-foreground">
              {lead.name}
            </h2>
            <p className="truncate text-sm font-medium text-muted-foreground">
              {lead.company} · {lead.sector}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {isFailed ? (
          <div
            role="alert"
            className="mt-4 flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-3.5 text-sm text-danger"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <strong className="font-semibold">Email confirmation failed</strong>
              <p className="mt-0.5 text-xs text-danger/90">
                The automated confirmation email failed to deliver to this lead.
              </p>
            </div>
          </div>
        ) : null}

        <section aria-label="Pipeline stage control" className="mt-6 rounded-2xl border border-border bg-muted/40 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Pipeline stage
          </h3>
          <div className="mt-3 flex flex-col gap-3">
            <div>
              <label htmlFor="stage-select" className="sr-only">
                Stage
              </label>
              <Select
                id="stage-select"
                value={stage}
                onChange={(event) => setStage(event.target.value as StudioStage)}
                className="h-10 w-full"
              >
                {STUDIO_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="stage-note" className="text-xs font-medium text-muted-foreground">
                Stage note (optional)
              </label>
              <Textarea
                id="stage-note"
                rows={2}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Add a short note about this stage change…"
                className="mt-1.5 resize-none text-sm"
              />
            </div>

            {error ? (
              <p className="text-xs font-semibold text-danger" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-xs text-muted-foreground">
                {lead.stageUpdatedAt
                  ? `Updated ${formatDateTime(String(lead.stageUpdatedAt))}`
                  : "No updates yet"}
              </span>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isPending || (stage === lead.stage && note === (lead.note ?? ""))}
                size="sm"
              >
                {isPending ? "Saving…" : saved ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" /> Saved
                  </>
                ) : (
                  "Update stage"
                )}
              </Button>
            </div>
          </div>
        </section>

        <section aria-label="Lead form submission" className="mt-6 flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Submission fields
          </h3>

          <dl className="grid gap-3 divide-y divide-border text-sm">
            <div className="grid grid-cols-[7.5rem_1fr] gap-3 pt-2">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium text-foreground">{lead.name}</dd>
            </div>

            <div className="grid grid-cols-[7.5rem_1fr] gap-3 pt-2">
              <dt className="text-muted-foreground">Company</dt>
              <dd className="font-medium text-foreground">{lead.company}</dd>
            </div>

            <div className="grid grid-cols-[7.5rem_1fr] gap-3 pt-2">
              <dt className="text-muted-foreground">Sector</dt>
              <dd className="font-medium text-foreground">{lead.sector}</dd>
            </div>

            <div className="grid grid-cols-[7.5rem_1fr] gap-3 pt-2">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="min-w-0">
                <a
                  href={`mailto:${lead.email}`}
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline break-all"
                >
                  <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {lead.email}
                </a>
              </dd>
            </div>

            <div className="grid grid-cols-[7.5rem_1fr] gap-3 pt-2">
              <dt className="text-muted-foreground">Phone</dt>
              <dd>
                {lead.phone ? (
                  <a
                    href={`tel:${lead.phone}`}
                    className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                  >
                    <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {lead.phone}
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </dd>
            </div>

            <div className="grid grid-cols-[7.5rem_1fr] gap-3 pt-2">
              <dt className="text-muted-foreground">Package</dt>
              <dd className="font-medium text-foreground">{lead.package}</dd>
            </div>

            <div className="grid grid-cols-[7.5rem_1fr] gap-3 pt-2">
              <dt className="text-muted-foreground">Timing</dt>
              <dd className="font-medium text-foreground">{lead.timing}</dd>
            </div>

            <div className="grid grid-cols-[7.5rem_1fr] gap-3 pt-2">
              <dt className="text-muted-foreground">Submitted</dt>
              <dd className="font-medium text-foreground">
                {formatDateTime(lead.submitted_at)}
              </dd>
            </div>

            <div className="grid grid-cols-[7.5rem_1fr] gap-3 pt-2">
              <dt className="text-muted-foreground">Email status</dt>
              <dd className="flex items-center gap-2">
                {lead.email_status === "failed" ? (
                  <Badge className="border-danger/40 text-danger">Failed</Badge>
                ) : lead.email_status === "sent" ? (
                  <Badge className="text-success">Sent</Badge>
                ) : (
                  <Badge className="text-tone-amber">Pending</Badge>
                )}
                {lead.email_sent_at ? (
                  <span className="text-xs text-muted-foreground">
                    at {formatDateTime(lead.email_sent_at)}
                  </span>
                ) : null}
              </dd>
            </div>

            <div className="flex flex-col gap-2 pt-3">
              <dt className="text-muted-foreground">Problem</dt>
              <dd className="whitespace-pre-wrap rounded-2xl bg-muted/50 p-3.5 text-sm leading-relaxed text-foreground">
                {lead.problem}
              </dd>
            </div>
          </dl>
        </section>
      </aside>
    </>
  );
}
