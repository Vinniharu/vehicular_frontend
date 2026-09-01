"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Scroll + auth-state plumbing for marketing layouts that render the
 * shared Nav/Footer but can't safely call useSearchParams() (that needs a
 * Suspense boundary and would opt statically-generated routes — e.g.
 * /services/[slug], /services/[slug]/[child] via generateStaticParams —
 * out of static generation if used in a layout with no boundary). Landing/
 * Pricing/Privacy are page-level and keep reading ?redirect= themselves via
 * their own guarded useSearchParams() call (see LandingPage.jsx) — this
 * hook exists for app/services/layout.jsx only.
 */
export function useMarketingChrome() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("customer");

  useEffect(() => {
    try {
      const token = localStorage.getItem("vh_access_token");
      setIsLoggedIn(!!token);
      const storedUser = localStorage.getItem("vh_user");
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u?.role) setUserRole(u.role);
      } else if (token && token.startsWith("vhc_jwt_")) {
        try {
          const u = JSON.parse(decodeURIComponent(atob(token.split("_")[2])));
          if (u?.role) setUserRole(u.role);
        } catch {}
      }
    } catch {
      /* ignore */
    }
  }, []);

  const dashboardHref = userRole === "admin" ? "/admin" : userRole === "staff" ? "/staff" : "/dashboard";
  const dashboardLabel = userRole === "admin" ? "Admin Portal" : userRole === "staff" ? "Staff Portal" : "Go to Dashboard";

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 8);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const redirectTo = pathname || "/services";
  return { scrolled, redirectTo, authProps: { isLoggedIn, dashboardHref, dashboardLabel, redirectTo } };
}
