const BASE_URL = "https://vehiculars.com";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/admin/", "/super-admin/", "/agent/", "/staff/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
