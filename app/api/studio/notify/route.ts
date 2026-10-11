import { NextResponse } from "next/server";
import { pushConfigured, sendToAll } from "@/lib/push";
import { leadPackages } from "@/lib/services";
import {
  isAuthorizedStudioNotification,
  parseStudioNotification
} from "@/lib/studio-notify";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (
    !isAuthorizedStudioNotification(
      request.headers.get("authorization"),
      process.env.STUDIO_NOTIFY_SECRET
    )
  ) {
    return new NextResponse("Not found", { status: 404 });
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const notification = parseStudioNotification(input);
  if (!notification) {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  if (!pushConfigured()) return NextResponse.json({ ok: true, sent: 0 });

  const result = await sendToAll({
    title: "New Jabx request",
    body: `${notification.company} · ${leadPackages.find((item) => item.value === notification.package)?.label ?? notification.package}`,
    url: "/studio",
    tag: "studio-lead"
  });

  return NextResponse.json({ ok: true, ...result });
}
