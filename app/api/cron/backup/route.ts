import { NextResponse } from "next/server";
import { createBackup } from "@/lib/backup";
import { fileStorageEnabled } from "@/lib/files";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Called once a day by Vercel Cron (vercel.json), which sends
// "Authorization: Bearer <CRON_SECRET>". Anything else gets a 404.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!fileStorageEnabled()) return NextResponse.json({ ok: false, error: "File storage is not configured." }, { status: 500 });

  const result = await createBackup();
  return NextResponse.json({ ok: true, ...result });
}
