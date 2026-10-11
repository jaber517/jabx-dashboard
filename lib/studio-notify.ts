import { createHash, timingSafeEqual } from "node:crypto";

export type StudioNotification = {
  company: string;
  package: string;
  sector: string;
};

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function isAuthorizedStudioNotification(
  authorization: string | null,
  secret: string | undefined
): boolean {
  if (!secret) return false;

  return timingSafeEqual(
    digest(authorization ?? ""),
    digest(`Bearer ${secret}`)
  );
}

export function parseStudioNotification(value: unknown): StudioNotification | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const body = value as Record<string, unknown>;
  if (
    typeof body.company !== "string" ||
    body.company.length < 2 ||
    body.company.length > 150 ||
    typeof body.package !== "string" ||
    typeof body.sector !== "string"
  ) {
    return null;
  }

  return {
    company: body.company,
    package: body.package,
    sector: body.sector
  };
}
