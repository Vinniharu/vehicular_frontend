// Only same-site paths are allowed as post-login redirects. "//evil.com" and
// "/\evil.com" both start with "/" but browsers treat them as another site,
// so a plain startsWith("/") check is an open redirect.
export function safeRedirectPath(raw) {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw === "/") return null;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return null;
  try {
    const url = new URL(raw, "https://vehiculars.local");
    if (url.origin !== "https://vehiculars.local") return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
