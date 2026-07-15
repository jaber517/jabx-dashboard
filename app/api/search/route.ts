import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ results: [] }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  const contains = { contains: query };

  try {
    const [projects, tasks, notes, resources] = await Promise.all([
      db.project.findMany({
        where: { OR: [{ title: contains }, { summary: contains }, { description: contains }] },
        select: { id: true, title: true, summary: true },
        take: 6
      }),
      db.task.findMany({
        where: { OR: [{ title: contains }, { description: contains }] },
        select: { id: true, title: true, description: true },
        take: 6
      }),
      db.note.findMany({
        where: { OR: [{ title: contains }, { content: contains }, { tags: contains }] },
        select: { id: true, title: true, content: true },
        take: 6
      }),
      db.resourceLink.findMany({
        where: { OR: [{ title: contains }, { description: contains }] },
        select: { id: true, title: true, description: true, url: true },
        take: 6
      })
    ]);

    const results = [
      ...projects.map((p) => ({
        type: "Project",
        id: p.id,
        title: p.title,
        subtitle: p.summary,
        href: `/projects/${p.id}`
      })),
      ...tasks.map((t) => ({
        type: "Task",
        id: t.id,
        title: t.title,
        subtitle: t.description,
        href: `/tasks/${t.id}`
      })),
      ...notes.map((n) => ({
        type: "Note",
        id: n.id,
        title: n.title,
        subtitle: n.content,
        href: `/notes/${n.id}`
      })),
      ...resources.map((r) => ({
        type: "Resource",
        id: r.id,
        title: r.title,
        subtitle: r.description,
        href: r.url,
        external: true
      }))
    ];

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
