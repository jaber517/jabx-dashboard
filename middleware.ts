import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "jabx_session";

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(request: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD;

  // Fail closed: if no password is configured, the dashboard stays locked.
  if (!password) {
    return NextResponse.redirect(new URL("/login?unconfigured=1", request.url));
  }

  const expected = await sha256Hex(`${password}:jabx-session-v1`);
  const session = request.cookies.get(SESSION_COOKIE)?.value;

  if (session === expected) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/tasks/:path*",
    "/notes/:path*",
    "/analytics/:path*",
    "/activity/:path*",
    "/calendar/:path*",
    "/resources/:path*",
    "/settings/:path*"
  ]
};
