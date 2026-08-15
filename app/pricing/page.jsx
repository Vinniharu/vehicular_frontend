"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";

import Nav from "@/app/components/landing/sections/Nav";
import Footer from "@/app/components/landing/sections/Footer";
import { GREEN, INK, INK_CARD, PAPER, INK_SOFT } from "@/app/components/landing/theme";
import { SERVICES } from "@/app/services/_data";
import { ServiceStatusPill } from "@/app/services/_status";
import PricingCalculator from "@/app/components/pricing/PricingCalculator";
import { getDriverLicenceFeeSchedule, getVehicleCategoryPricing } from "@/lib/api";

const CALCULABLE_SLUGS = new Set(["drivers-licence", "number-plate", "vehicle-particulars", "tinted-permit"]);

function ServiceCard({ service, expanded, onToggle, feeSchedule, vehicleCategoryPrices }) {
  const Icon = service.icon;
  const isCalculable = CALCULABLE_SLUGS.has(service.slug) && service.status === "live";

  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "rgba(255,255,255,0.08)", background: INK_CARD }}>
      <button
        type="button"
        onClick={() => isCalculable && onToggle(service.slug)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
        style={{ cursor: isCalculable ? "pointer" : "default" }}
      >
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(40, 167, 69,0.15)", color: GREEN }}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-white">{service.title}</p>
            <p className="mt-0.5 truncate text-[12.5px]" style={{ color: INK_SOFT }}>{service.tagline}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <ServiceStatusPill status={service.status} />
          {isCalculable && (
            <ChevronDown
              className="h-4 w-4 text-white/50 transition-transform"
              style={{ transform: expanded ? "rotate(180deg)" : "none" }}
            />
          )}
        </div>
      </button>
      {isCalculable && expanded && (
        <div className="border-t p-5" style={{ borderColor: "rgba(255,255,255,0.08)", background: PAPER }}>
          <PricingCalculator serviceSlug={service.slug} feeSchedule={feeSchedule} vehicleCategoryPrices={vehicleCategoryPrices} />
        </div>
      )}
    </div>
  );
}

export default function PricingPage() {
  let searchParams = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    searchParams = useSearchParams();
  } catch {
    // Guarded the same way LandingPage.jsx is — this page has no <Suspense>
    // boundary around it either.
  }
  const rawRedirectParam = searchParams?.get("redirect");
  const redirectTo = typeof rawRedirectParam === "string" && rawRedirectParam.startsWith("/") ? rawRedirectParam : "/pricing";

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

  const [expandedSlug, setExpandedSlug] = useState(null);
  const [feeSchedule, setFeeSchedule] = useState([]);
  const [vehicleCategoryPrices, setVehicleCategoryPrices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDriverLicenceFeeSchedule(), getVehicleCategoryPricing()]).then(([feeRes, categoryRes]) => {
      if (feeRes.data?.prices) setFeeSchedule(feeRes.data.prices);
      if (categoryRes.data?.prices) setVehicleCategoryPrices(categoryRes.data.prices);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: `html { scroll-behavior: smooth; } body { background: ${INK}; }` }} />
      <Nav logoUrl="/logo.png" scrolled={scrolled} {...authProps} />

      <section className="px-5 pb-10 pt-28 md:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: "rgba(40, 167, 69,0.15)", color: GREEN }}>
            Pricing
          </span>
          <h1 className="mt-4 font-display text-[32px] font-medium leading-tight text-white sm:text-[42px]">
            See exactly what it costs
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed" style={{ color: INK_SOFT }}>
            Pick a service below to configure it and get a live price — pulled straight from what we actually charge, updated the moment we change it.
          </p>
        </div>
      </section>

      <section className="px-5 pb-20 md:px-8">
        <div className="mx-auto max-w-2xl space-y-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16" style={{ color: INK_SOFT }}>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-[13.5px]">Loading current prices…</span>
            </div>
          ) : (
            SERVICES.map((service) => (
              <ServiceCard
                key={service.slug}
                service={service}
                expanded={expandedSlug === service.slug}
                onToggle={(slug) => setExpandedSlug((prev) => (prev === slug ? null : slug))}
                feeSchedule={feeSchedule}
                vehicleCategoryPrices={vehicleCategoryPrices}
              />
            ))
          )}
        </div>
      </section>

      <Footer redirectTo={redirectTo} />
    </div>
  );
}
