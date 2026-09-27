import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { readFile, storedPathname } from "@/lib/files";

export const dynamic = "force-dynamic";

// Serves a photo from the private file store, only to a signed-in session.
export async function GET(_request: Request, { params }: { params: { path: string[] } }) {
  if (!(await isAuthed())) return new NextResponse("Not found", { status: 404 });

  const pathname = storedPathname(`/api/files/${params.path.join("/")}`);
  if (!pathname) return new NextResponse("Not found", { status: 404 });

  const file = await readFile(pathname).catch(() => null);
  if (!file || file.statusCode !== 200) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(file.stream, {
    headers: {
      "Content-Type": file.blob.contentType,
      "Content-Length": String(file.blob.size),
      // File names are random and never reused, so the browser may keep them.
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
