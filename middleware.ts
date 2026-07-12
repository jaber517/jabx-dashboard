import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, expectedSessionToken } from "@/lib/auth-config";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/projects",
  "/tasks",
  "/notes",
  "/analytics",
  "/activity",
  "/calendar",
  "/resources",
  "/settings"
];

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  // Subdomain sites: every path on these hosts shows their landing page.
  if (host.startsWith("occ.")) {
    return pathname === "/occ"
      ? NextResponse.next()
      : NextResponse.rewrite(new URL("/occ", request.url));
  }

  if (host.startsWith("claude.")) {
    return pathname === "/claude"
      ? NextResponse.next()
      : NextResponse.rewrite(new URL("/claude", request.url));
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value;

  if (session === (await expectedSessionToken())) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Everything except Next internals, API routes, and static files (paths with a dot).
  matcher: ["/((?!_next/|api/|.*\\..*).*)"]
};
