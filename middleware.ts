import { NextRequest, NextResponse } from "next/server";

// Maps a subdomain prefix (the part before the first ".") to the internal
// Next.js path prefix that actually serves that portal. vehiculars.com
// itself (and any unrecognized/local host) is left alone — the customer
// portal already lives at the path root (/dashboard, /auth, /services, ...).
const HOST_PREFIX: Record<string, string> = {
  admin: "/admin",
  super: "/super-admin",
  agent: "/agent",
  staff: "/staff",
};

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const subdomain = host.split(".")[0];
  const prefix = HOST_PREFIX[subdomain];

  if (!prefix) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Password reset (and any other shared /auth/* page) stays at one shared
  // path regardless of which subdomain a reset-link was generated for — the
  // page itself is already generic (token + new-password form only), so
  // there's no need for a per-portal copy of it.
  if (pathname.startsWith("/auth")) {
    return NextResponse.next();
  }

  if (pathname.startsWith(prefix)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `${prefix}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next/static|_next/image|favicon.ico|logo.png|icon.png|apple-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
