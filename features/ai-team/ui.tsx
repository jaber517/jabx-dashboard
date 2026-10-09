"use client";

import { createContext, useContext, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { aiTeam } from "@/lib/team";
import { cn } from "@/lib/utils";
import { parseInline, type InlinePart } from "./runs";
import { tones, type Tone } from "./status";
import type { Employee } from "./types";

// --- Offline ----------------------------------------------------------------------------
// True while the laptop is unreachable: composers and action buttons are disabled.
const OfflineContext = createContext(false);
export const OfflineProvider = OfflineContext.Provider;
export const useOffline = () => useContext(OfflineContext);

export function NeedsMacBook({ className }: { className?: string }) {
  if (!useOffline()) return null;
  return <p className={cn("text-[13px] font-medium text-muted-foreground", className)}>Needs your MacBook</p>;
}

// --- Small building blocks ---------------------------------------------------------------
export function ToneBadge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <Badge className={tones[tone]}>{children}</Badge>;
}

export function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{value ?? "—"}</dd>
    </div>
  );
}

export function Fields({ children }: { children: ReactNode }) {
  return <dl className="divide-y divide-border">{children}</dl>;
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm font-medium text-danger" role="alert">
      {children}
    </p>
  );
}

export function MutedText({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[13px] leading-5 text-muted-foreground", className)}>{children}</p>;
}

// Adam writes light Markdown. Render only **bold** and `code`, as React nodes, never as HTML.
function renderParts(parts: InlinePart[]): ReactNode[] {
  return parts.map((part, index) => {
    if (part.kind === "bold") return <strong key={index}>{renderParts(part.children ?? [])}</strong>;
    if (part.kind === "code") {
      return (
        <code key={index} className="rounded-lg bg-muted px-1 py-0.5 text-[0.9em]">
          {part.text}
        </code>
      );
    }
    return part.text;
  });
}

export function InlineText({ text }: { text: string }) {
  return <>{renderParts(parseInline(text))}</>;
}

// --- People ------------------------------------------------------------------------------
export const LEAD_ID = "adam";

// The six people, from the snapshot when it has loaded, else from dash's own list, always
// with the portraits in public/team.
export function teamEmployees(snapshot: Employee[] | undefined): Employee[] {
  const local = new Map(aiTeam.map((member) => [member.id, member]));
  const list: Employee[] = snapshot?.length
    ? snapshot
    : aiTeam.map((member) => ({ id: member.id, name: member.name, role: member.role, photo: member.photo }));
  return list.map((employee) => ({ ...employee, photo: local.get(employee.id)?.photo ?? null }));
}

export function Portrait({ employee, size = 56 }: { employee: Employee; size?: number }) {
  if (!employee.photo) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-2xl bg-muted text-lg font-bold text-muted-foreground"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        {employee.name.slice(0, 1)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={employee.photo} alt="" width={size} height={size} className="shrink-0 rounded-2xl object-cover" />
  );
}
