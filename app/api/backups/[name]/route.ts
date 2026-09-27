import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { BACKUP_PREFIX, readFile } from "@/lib/files";

export const dynamic = "force-dynamic";

// Downloads one backup file, signed in only.
export async function GET(_request: Request, { params }: { params: { name: string } }) {
  if (!(await isAuthed())) return new NextResponse("Not found", { status: 404 });
  if (!/^\d{4}-\d{2}-\d{2}\.json$/.test(params.name)) return new NextResponse("Not found", { status: 404 });

  const file = await readFile(`${BACKUP_PREFIX}${params.name}`).catch(() => null);
  if (!file || file.statusCode !== 200) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(file.stream, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="jabx-dashboard-backup-${params.name}"`,
      "Cache-Control": "private, no-store"
    }
  });
}
