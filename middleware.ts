import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, expectedSessionToken } from "@/lib/auth-config";
import { isPrivateHost, privateNewsUrl } from "@/lib/hosts";

const PRIVATE_PATHS = [
  "/dashboard",
  "/tasks",
  "/notes",
  "/analytics",
  "/activity",
  "/calendar",
  "/resources",
  "/settings",
  "/login",
  "/api/search",
  "/api/ai-news"
];

const PUBLIC_ASSETS = new Set([
  "/icon.png", "/apple-icon.png", "/manifest.webmanifest", "/sw.js",
  "/jabx-logo-header.jpg", "/logo.jpg"
]);

function atPath(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function notFound() {
  return new NextResponse("Not Found", {
    status: 404,
    headers: { "Cache-Control": "private, no-store" }
  });
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return notFound();
  }

  // Internal routes must never be reachable directly, including encoded paths.
  if (atPath(decodedPath, "/dash")) return notFound();

  const privateHost = isPrivateHost(host);
  if (!privateHost) {
    if (PRIVATE_PATHS.some((path) => atPath(decodedPath, path))) return notFound();
    if (decodedPath === "/ai-news") {
      return NextResponse.redirect(privateNewsUrl(request.nextUrl), 308);
    }
  }

  // Subdomain sites: every path on these hosts shows their landing page.
  if (host.startsWith("claude.")) {
    return pathname === "/claude"
      ? NextResponse.next()
      : NextResponse.rewrite(new URL("/claude", request.url));
  }

  if (!privateHost) return NextResponse.next();

  if (PUBLIC_ASSETS.has(decodedPath) || decodedPath === "/api/health" ||
      decodedPath.startsWith("/_next/") || decodedPath.startsWith("/static/")) {
    return NextResponse.next();
  }

  if (decodedPath !== "/login") {
    const session = request.cookies.get(SESSION_COOKIE)?.value;
    const expected = await expectedSessionToken();
    if (!session || !expected || session !== expected) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.host = host;
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }
  }

  // APIs stay at their real routes and also authenticate in their handlers.
  const destination = request.nextUrl.clone();
  destination.pathname = pathname === "/" ? "/dash/dashboard" : `/dash${pathname}`;
  const response = atPath(decodedPath, "/api")
    ? NextResponse.next()
    : NextResponse.rewrite(destination);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  // Include APIs and dotted paths so private IDs/files cannot bypass the boundary.
  matcher: ["/((?!_next/).*)"]
};
