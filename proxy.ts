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

export function proxy(request: NextRequest) {
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

  // The bare root of each portal subdomain should feel like landing on a
  // distinct site's front door — a real redirect (URL bar updates) straight
  // to that portal's own login page, instead of rewriting through to the
  // dashboard shell and only then discovering client-side that there's no
  // session and bouncing to /login. Auth tokens live in localStorage, which
  // this edge middleware can't read, so it can't tell logged-in apart from
  // logged-out here — an already-authenticated visitor is bounced straight
  // back to their dashboard by PortalLoginForm itself, before the login
  // form ever paints.
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `${prefix}/login`;
    return NextResponse.redirect(url);
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
