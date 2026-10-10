"use client";

import { useMemo, useState } from "react";
import { Briefcase, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { LeadCard } from "./lead-card";
import { LeadDetailSheet } from "./lead-detail-sheet";
import {
  STUDIO_STAGES,
  stageTone,
  type LeadWithStage,
  type StudioStage
} from "./types";

export function StudioView({
  connected,
  reason,
  isFixture = false,
  leads: initialLeads = []
}: {
  connected: boolean;
  reason?: string;
  isFixture?: boolean;
  leads?: LeadWithStage[];
}) {
  const [leads, setLeads] = useState<LeadWithStage[]>(initialLeads);
  const [selectedLead, setSelectedLead] = useState<LeadWithStage | null>(null);

  const leadsByStage = useMemo(() => {
    const map = new Map<StudioStage, LeadWithStage[]>();
    for (const stage of STUDIO_STAGES) {
      map.set(stage, []);
    }
    for (const lead of leads) {
      const list = map.get(lead.stage) ?? [];
      list.push(lead);
      map.set(lead.stage, list);
    }
    return map;
  }, [leads]);

  function handleStageUpdated(leadId: string, stage: StudioStage, note: string | null) {
    const now = new Date().toISOString();
    setLeads((current) =>
      current.map((lead) =>
        lead.id === leadId
          ? { ...lead, stage, note, stageUpdatedAt: now }
          : lead
      )
    );
    setSelectedLead((current) =>
      current && current.id === leadId
        ? { ...current, stage, note, stageUpdatedAt: now }
        : current
    );
  }

  return (
    <div className="page-shell">
      <PageHeader
        title="Studio"
        description="Inbound requests from the Jabx website moved through the sales pipeline."
        actions={
          isFixture ? (
            <Badge className="text-tone-amber">Fixtures enabled</Badge>
          ) : undefined
        }
      />

      {!connected ? (
        <section
          aria-label="Studio pipeline not connected"
          className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-surface px-5 py-8 text-center"
        >
          <div className="rounded-3xl bg-muted p-4 text-muted-foreground">
            <Briefcase className="h-10 w-10" aria-hidden="true" />
          </div>
          <div className="grid max-w-md gap-1.5">
            <h2 className="text-xl font-bold">Leads API not connected</h2>
            <p className="text-[15px] leading-6 text-muted-foreground">
              {reason ??
                "Inbound requests arrive from the studio contact form worker. Configure LEADS_API_URL and LEADS_API_TOKEN to view live leads."}
            </p>
            <p className="text-[13px] text-muted-foreground">
              In development, set{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">
                STUDIO_FIXTURES=1
              </code>{" "}
              to test with sample leads.
            </p>
          </div>
        </section>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>
              Total leads:{" "}
              <strong className="text-foreground">{leads.length}</strong>
            </span>
            {isFixture ? (
              <span className="text-xs">
                Showing 4 development fixtures with example.test addresses
              </span>
            ) : null}
          </div>

          {/* Desktop Board: horizontal columns */}
          <div
            className="hidden md:flex gap-4 overflow-x-auto pb-6"
            role="region"
            aria-label="Studio pipeline board"
          >
            {STUDIO_STAGES.map((stage) => {
              const stageLeads = leadsByStage.get(stage) ?? [];
              return (
                <section
                  key={stage}
                  aria-label={`${stage} (${stageLeads.length} leads)`}
                  className="flex w-[280px] shrink-0 flex-col gap-3 rounded-3xl border border-border bg-background/60 p-3 dark:bg-[#0B1824]/60"
                >
                  <div className="flex items-center justify-between px-1.5 py-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn("h-2 w-2 rounded-full bg-current", stageTone[stage])}
                        aria-hidden="true"
                      />
                      <h3 className="text-sm font-bold text-foreground truncate">
                        {stage}
                      </h3>
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                      {stageLeads.length}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {stageLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        selected={selectedLead?.id === lead.id}
                        onSelect={setSelectedLead}
                      />
                    ))}
                    {stageLeads.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border/80 p-4 text-center text-xs text-muted-foreground">
                        No leads
                      </div>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Mobile View: list per stage */}
          <div
            className="flex flex-col gap-3 md:hidden"
            role="region"
            aria-label="Studio pipeline stage lists"
          >
            {STUDIO_STAGES.map((stage) => {
              const stageLeads = leadsByStage.get(stage) ?? [];
              const hasLeads = stageLeads.length > 0;
              return (
                <details
                  key={stage}
                  open={hasLeads}
                  className="group overflow-hidden rounded-3xl border border-border bg-surface"
                >
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 py-2 hover:bg-muted/40">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn("h-2 w-2 rounded-full bg-current", stageTone[stage])}
                        aria-hidden="true"
                      />
                      <h3 className="text-sm font-bold text-foreground">
                        {stage}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                        {stageLeads.length}
                      </span>
                      <ChevronRight
                        className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90"
                        aria-hidden="true"
                      />
                    </div>
                  </summary>

                  <div className="border-t border-border p-3 flex flex-col gap-2.5">
                    {hasLeads ? (
                      stageLeads.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          selected={selectedLead?.id === lead.id}
                          onSelect={setSelectedLead}
                        />
                      ))
                    ) : (
                      <p className="py-2 text-center text-xs text-muted-foreground">
                        No leads in this stage
                      </p>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      )}

      {selectedLead ? (
        <LeadDetailSheet
          key={selectedLead.id}
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStageUpdated={handleStageUpdated}
        />
      ) : null}
    </div>
  );
}
