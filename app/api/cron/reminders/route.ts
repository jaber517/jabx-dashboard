import { NextResponse } from "next/server";
import { pushConfigured, sendToAll } from "@/lib/push";
import { morningDigest } from "@/lib/reminders";

export const dynamic = "force-dynamic";

// Called each morning by Vercel Cron (vercel.json) with CRON_SECRET.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!pushConfigured()) return NextResponse.json({ ok: false, error: "Push is not configured." }, { status: 500 });

  const digest = await morningDigest();
  if (!digest) return NextResponse.json({ ok: true, sent: 0, reason: "Nothing due today or overdue." });
  const result = await sendToAll(digest);
  return NextResponse.json({ ok: true, ...result, title: digest.title });
}
