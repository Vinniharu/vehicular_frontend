"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Loader2, MapPin } from "lucide-react";

import Nav from "@/app/components/landing/sections/Nav";
import Footer from "@/app/components/landing/sections/Footer";
import { SERVICES } from "@/app/services/_data";
import { ServiceStatusPill } from "@/app/services/_status";
import ServiceIcon from "@/app/components/marketing/ServiceIcon";
import PricingCalculator from "@/app/components/pricing/PricingCalculator";
import { Container, PageHero } from "@/app/components/marketing/ui";
import { EASE, Stagger, StaggerItem } from "@/app/components/marketing/motion";
import { getDriverLicenceFeeSchedule, getVehicleCategoryPricing, getServicePricing, getReferenceStates } from "@/lib/api";

const CALCULABLE_SLUGS = new Set(["drivers-licence", "number-plate", "vehicle-particulars", "tinted-permit"]);
const FLAT_PRICED_SLUGS = new Set(["physical-condition-inspection", "roadworthiness-express", "central-motor-registry"]);

function koboToNaira(kobo) {
  return (kobo / 100).toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
}

function getPriceDisplay(service, { servicePriceBySlug, vvMinKobo }) {
  if (service.status !== "live" || CALCULABLE_SLUGS.has(service.slug)) return null;
  if (service.slug === "vehicle-verification") {
    return vvMinKobo != null ? `From ${koboToNaira(vvMinKobo)}` : "Contact us";
  }
  if (FLAT_PRICED_SLUGS.has(service.slug)) {
    const kobo = servicePriceBySlug[service.slug];
    return kobo != null ? koboToNaira(kobo) : "Contact us";
  }
  return null;
}

function ServiceCard({ service, expanded, onToggle, feeSchedule, vehicleCategoryPrices, priceDisplay }) {
  const isCalculable = CALCULABLE_SLUGS.has(service.slug) && service.status === "live";
  const reduce = useReducedMotion();
  const panelId = `pricing-panel-${service.slug}`;

  return (
    <div
      className={`overflow-hidden rounded-mk-lg border bg-mk-surface transition-[border-color,box-shadow] duration-300 ${
        expanded ? "border-cx-brand/40 shadow-mk" : "border-mk-line shadow-mk-sm"
      } ${isCalculable && !expanded ? "hover:border-mk-line-strong hover:shadow-mk" : ""}`}
    >
      <button
        type="button"
        onClick={() => isCalculable && onToggle(service.slug)}
        aria-expanded={isCalculable ? expanded : undefined}
        aria-controls={isCalculable ? panelId : undefined}
        className="mk-focus flex min-h-[44px] w-full items-start gap-4 p-4 text-left sm:items-center sm:p-5"
        style={{ cursor: isCalculable ? "pointer" : "default" }}
      >
        <ServiceIcon icon={service.icon} tone={expanded ? "brandStrong" : "brand"} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold tracking-[-0.01em] text-mk-ink">{service.title}</p>
            <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-mk-muted sm:truncate">{service.tagline}</p>
          </div>
          {(priceDisplay || service.status !== "live") && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {priceDisplay && (
                <span className="rounded-full bg-cx-brand-soft px-2.5 py-1 font-mono text-[12.5px] font-semibold text-cx-brand-deep">
                  {priceDisplay}
                </span>
              )}
              <ServiceStatusPill status={service.status} />
            </div>
          )}
        </div>
        {isCalculable && (
          <span
            className={`mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-[transform,background-color,border-color] duration-300 sm:mt-0 ${
              expanded ? "rotate-180 border-cx-brand/30 bg-cx-brand-soft text-cx-brand-deep" : "border-mk-line text-mk-muted"
            }`}
            aria-hidden
          >
            <ChevronDown className="h-4 w-4" />
          </span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {isCalculable && expanded && (
          <motion.div
            key="panel"
            id={panelId}
            initial={reduce ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduce ? { opacity: 0, height: 0, transition: { duration: 0 } } : { opacity: 0, height: 0 }}
            transition={{ duration: reduce ? 0 : 0.4, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="border-t border-mk-line bg-mk-bg/60 p-4 sm:p-6">
              <PricingCalculator serviceSlug={service.slug} feeSchedule={feeSchedule} vehicleCategoryPrices={vehicleCategoryPrices} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
  const [servicePrices, setServicePrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState(""); // "" = General (all states)

  useEffect(() => {
    getReferenceStates().then((res) => {
      if (res.data) setStates(res.data);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const stateId = selectedStateId || undefined;
    Promise.all([
      getDriverLicenceFeeSchedule({ state_id: stateId }),
      getVehicleCategoryPricing(stateId),
      getServicePricing(stateId),
    ]).then(([feeRes, categoryRes, serviceRes]) => {
      if (feeRes.data?.prices) setFeeSchedule(feeRes.data.prices);
      if (categoryRes.data?.prices) setVehicleCategoryPrices(categoryRes.data.prices);
      if (serviceRes.data?.prices) setServicePrices(serviceRes.data.prices);
      setLoading(false);
    });
  }, [selectedStateId]);

  const servicePriceBySlug = useMemo(
    () => Object.fromEntries(servicePrices.map((p) => [p.slug, p.amount_kobo])),
    [servicePrices]
  );

  const vvMinKobo = useMemo(() => {
    const vvPrices = feeSchedule.filter((p) => p.application_type?.startsWith("vehicle_verification_"));
    if (vvPrices.length === 0) return null;
    return Math.min(...vvPrices.map((p) => p.amount_kobo));
  }, [feeSchedule]);

  return (
    <div className="mk-root min-h-dvh">
      <style dangerouslySetInnerHTML={{ __html: `html { scroll-behavior: smooth; } body { background: var(--mk-bg); }` }} />
      <Nav logoUrl="/logo.png" scrolled={scrolled} {...authProps} />

      <PageHero
        eyebrow="Pricing"
        title="See exactly what it costs"
        description="Pick a service below to configure it and get a live price — pulled straight from what we actually charge, updated the moment we change it."
      >
        <div className="mx-auto w-full max-w-sm text-left">
          <label htmlFor="pricing-state" className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-mk-ink-2">
            <MapPin className="h-3.5 w-3.5 text-cx-brand" aria-hidden />
            State
          </label>
          <div className="relative">
            <select
              id="pricing-state"
              value={selectedStateId}
              onChange={(e) => {
                setExpandedSlug(null);
                setSelectedStateId(e.target.value);
              }}
              className="mk-focus h-11 w-full appearance-none rounded-xl border border-mk-line-strong bg-mk-surface pl-3.5 pr-10 text-[16px] text-mk-ink shadow-mk-sm outline-none transition-colors hover:border-mk-ink/30 focus:border-cx-brand sm:text-[14px]"
            >
              <option value="">General (all states)</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mk-muted" aria-hidden />
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-mk-muted">
            Some services are priced differently in certain states — pick yours to see the exact price.
          </p>
        </div>
      </PageHero>

      <section className="py-12 sm:py-16 lg:py-20">
        <Container>
          <div className="mx-auto max-w-3xl">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-mk-muted" role="status">
              <Loader2 className="h-4 w-4 animate-spin text-cx-brand" />
              <span className="text-[14px]">Loading current prices…</span>
            </div>
          ) : (
            <Stagger animateOnMount gap={0.05} className="space-y-3">
              {SERVICES.map((service) => (
                <StaggerItem key={service.slug}>
                  <ServiceCard
                    service={service}
                    expanded={expandedSlug === service.slug}
                    onToggle={(slug) => setExpandedSlug((prev) => (prev === slug ? null : slug))}
                    feeSchedule={feeSchedule}
                    vehicleCategoryPrices={vehicleCategoryPrices}
                    priceDisplay={getPriceDisplay(service, { servicePriceBySlug, vvMinKobo })}
                  />
                </StaggerItem>
              ))}
            </Stagger>
          )}
          </div>
        </Container>
      </section>

      <Footer redirectTo={redirectTo} />
    </div>
  );
}
