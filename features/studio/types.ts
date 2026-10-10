export const STUDIO_STAGES = [
  "Lead received",
  "Discovery",
  "Estimate",
  "Approval",
  "Build",
  "Review and QA",
  "Delivery",
  "Follow-up",
  "Closed – not going ahead"
] as const;

export type StudioStage = (typeof STUDIO_STAGES)[number];

export const DEFAULT_STAGE: StudioStage = "Lead received";

export function resolveLeadStage(stage: string | null | undefined): StudioStage {
  if (!stage) return DEFAULT_STAGE;
  return (STUDIO_STAGES as readonly string[]).includes(stage)
    ? (stage as StudioStage)
    : DEFAULT_STAGE;
}

export type EmailStatus = "pending" | "sent" | "failed";

export type Lead = {
  id: string;
  submitted_at: string;
  name: string;
  company: string;
  sector: string;
  email: string;
  phone: string | null;
  package: string;
  problem: string;
  timing: string;
  email_status: EmailStatus;
  email_sent_at: string | null;
};

export type LeadWithStage = Lead & {
  stage: StudioStage;
  note: string | null;
  stageUpdatedAt: Date | string | null;
};

export const stageTone: Record<StudioStage, string> = {
  "Lead received": "text-tone-blue",
  Discovery: "text-tone-violet",
  Estimate: "text-tone-amber",
  Approval: "text-tone-blue",
  Build: "text-tone-green",
  "Review and QA": "text-tone-amber",
  Delivery: "text-tone-green",
  "Follow-up": "text-tone-violet",
  "Closed – not going ahead": "text-tone-slate"
};
