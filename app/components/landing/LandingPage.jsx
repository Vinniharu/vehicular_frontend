"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import Nav from "./sections/Nav";
import Hero from "./sections/Hero";
import HowItWorks from "./sections/HowItWorks";
import Services from "./sections/Services";
import AppShowcases from "./sections/AppShowcases";
import Lifecycle from "./sections/Lifecycle";
import Faq from "./sections/Faq";
import FinalCta from "./sections/FinalCta";
import Footer from "./sections/Footer";
import StickyMobileCta from "./sections/StickyMobileCta";
import { TestimonialsLoader } from "./TestimonialsLoader";
import { GREEN, INK } from "./theme";

// Scoped, minimal — everything else the old monolith's GLOBAL_STYLES block
// carried (phone-float/slide-cycle/marquee keyframes, .vh-section/.vh-divider/
// .vh-hero-glow helpers) was only ever consumed by the old hero layout this
// rewrite replaces; nothing in the new sections references them, so they're
// dropped rather than ported. Only these three concerns are still load-bearing:
// smooth-scroll for the nav's #how/#showcases/#faq anchor links, a body
// background matching the hero/footer tone for iOS overscroll bounce, and the
// native <details> marker styling the Faq section still relies on.
const GLOBAL_STYLES = `
  html { scroll-behavior: smooth; }
  body { background: ${INK}; }
  details.vh-faq[open] .vh-faq-icon { transform: rotate(45deg); }
  details.vh-faq summary::-webkit-details-marker { display: none; }
  details.vh-faq summary { list-style: none; }
`;

export function LandingPage({ logoUrl = "/logo.png" }) {
  let searchParams = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    searchParams = useSearchParams();
  } catch {
    // If rendered outside Suspense or in static mode — app/page.tsx has no
    // <Suspense> boundary around this component, so this must stay guarded.
  }
  const rawRedirectParam = searchParams?.get("redirect");
  const redirectTo = typeof rawRedirectParam === "string" && rawRedirectParam.startsWith("/") ? rawRedirectParam : "/";

  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("customer");

  useEffect(() => {
    try {
      localStorage.setItem("vh_welcome_seen", "1");
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

  const authProps = { isLoggedIn, dashboardHref, dashboardLabel, redirectTo };

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

      <Nav logoUrl={logoUrl} scrolled={scrolled} {...authProps} />
      <Hero {...authProps} />
      <HowItWorks />
      <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${GREEN}30, transparent)` }} />
      <Services />
      <AppShowcases />
      <Lifecycle />
      <TestimonialsLoader />
      <Faq />
      <FinalCta {...authProps} />
      <Footer redirectTo={redirectTo} />
      <StickyMobileCta {...authProps} />
    </div>
  );
}

export default LandingPage;
