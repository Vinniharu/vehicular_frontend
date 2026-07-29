"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, memo, useCallback, useMemo, lazy, Suspense } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  ShoppingCart,
  ShieldCheck,
  Wrench,
  GraduationCap,
  Building2,
  FileText,
  CreditCard,
  Hash,
  Sun,
  Search,
  Sparkles,
  ChevronRight,
  Play,
  Zap,
  BadgeCheck,
  Ship,
  UserCheck,
  Gift,
} from "lucide-react";
import { TestimonialsLoader } from "./TestimonialsLoader";
import { HeroPhoneShowcase } from "./HeroPhoneShowcase";
import { ServicePhoneShowcase } from "./ServicePhoneShowcase";
import { SHOWCASES } from "./showcase-configs";

/* ─── Memoized sub-components to prevent unnecessary re-renders ─── */

const ShowcaseSlot = memo(function ShowcaseSlot({ serviceId }) {
  if (!SHOWCASES || !SHOWCASES[serviceId]) return null;
  return (
    <div className="mx-auto w-full max-w-[440px]">
      <ServicePhoneShowcase config={SHOWCASES[serviceId]} />
    </div>
  );
});

const SERVICE_LINKS = [
  { slug: "vehicle-particulars", label: "Vehicle particulars" },
  { slug: "drivers-licence", label: "Driver's licence" },
  { slug: "number-plate", label: "Number plates" },
  { slug: "roadworthiness-express", label: "Roadworthiness express" },
  { slug: "tinted-permit", label: "Tinted permit" },
  { slug: "pre-purchase-inspection", label: "Pre-purchase inspection" },
  { slug: "driveconnect", label: "DriveConnect lessons" },
  { slug: "spare-parts", label: "Spare parts" },
  { slug: "vehicle-verification", label: "Vehicle verification" },
  { slug: "port-clearing", label: "Port clearing" },
  { slug: "find-a-technician", label: "Find a technician" },
  { slug: "sponsor-a-service", label: "Sponsor a service" },
];

const SHOWCASE_TABS = [
  { id: "vehicle_particulars", label: "Particulars Renewal" },
  { id: "drivers_licence", label: "Driver's Licence" },
  { id: "number_plate", label: "Number Plates" },
  { id: "rwx_lagos", label: "Roadworthiness" },
  { id: "tinted_permit", label: "Tinted Permit" },
  { id: "pre_purchase_inspection", label: "Pre-Purchase Check" },
  { id: "driveconnect", label: "DriveConnect" },
  { id: "spare_parts", label: "Spare Parts" },
];

const HOW_STEPS = [
  {
    title: "Submit online",
    blurb: "Pick a service and upload what's needed — no paperwork handover.",
    icon: FileText,
  },
  {
    title: "We handle the processing",
    blurb: "We deal with the authority or vendor and update you via SMS.",
    icon: Zap,
  },
  {
    title: "Delivered back to you",
    blurb: "Soft copies land in your dashboard; physical items are delivered where they apply.",
    icon: CheckCircle2,
  },
];

const SERVICE_ITEMS = [
  { slug: "vehicle-particulars", label: "Vehicle particulars", benefit: "Full papers renewed and delivered.", icon: FileText, featured: true },
  { slug: "drivers-licence", label: "Driver's licence", benefit: "Fresh, renew, or reissue — end-to-end.", icon: CreditCard, featured: true },
  { slug: "number-plate", label: "Number plates", benefit: "Order and receive your plate at home.", icon: Hash },
  { slug: "roadworthiness-express", label: "Roadworthiness express", benefit: "Certified in 48 hours, no queues.", icon: ShieldCheck },
  { slug: "tinted-permit", label: "Tinted permit", benefit: "Police-approved permit on your phone.", icon: Sun },
  { slug: "pre-purchase-inspection", label: "Pre-purchase inspection", benefit: "150-point check before you pay.", icon: Search },
  { slug: "driveconnect", label: "DriveConnect lessons", benefit: "Learn to drive with vetted instructors.", icon: GraduationCap },
  { slug: "spare-parts", label: "Spare parts", benefit: "Genuine parts, fitment-checked, delivered.", icon: Wrench },
  { slug: "vehicle-verification", label: "Vehicle verification", benefit: "Confirm papers and ownership are clean.", icon: BadgeCheck },
  { slug: "port-clearing", label: "Port clearing", benefit: "Firm, all-in customs clearing quote.", icon: Ship },
  { slug: "find-a-technician", label: "Find a technician", benefit: "Vetted mechanics, recommended by real customers.", icon: UserCheck },
  { slug: "sponsor-a-service", label: "Sponsor a service", benefit: "Pay for someone else's vehicle service.", icon: Gift },
];

const LIFECYCLE_STAGES = [
  {
    stage: "01", icon: ShoppingCart, title: "Buy right",
    blurb: "Don't inherit someone else's problem. Verify before you pay.",
    items: [
      { href: "/services/pre-purchase-inspection", label: "Pre-purchase inspection" },
      { href: "/services/vehicle-verification", label: "Vehicle verification" },
      { href: "/services/port-clearing", label: "Port clearing" },
    ],
  },
  {
    stage: "02", icon: ShieldCheck, title: "Stay legal",
    blurb: "Every document tracked, renewed before it lapses. No VIO surprises.",
    items: [
      { href: "/services/vehicle-particulars", label: "Vehicle particulars" },
      { href: "/services/roadworthiness-express", label: "Roadworthiness" },
      { href: "/services/tinted-permit", label: "Tinted permit" },
      { href: "/services/number-plate", label: "Number plate" },
    ],
  },
  {
    stage: "03", icon: Wrench, title: "Stay running",
    blurb: "Genuine parts and vetted technicians, dispatched to wherever your car is.",
    items: [
      { href: "/services/spare-parts", label: "Spare parts" },
      { href: "/services/find-a-technician", label: "Find a technician" },
    ],
  },
  {
    stage: "04", icon: GraduationCap, title: "Get better",
    blurb: "Learn to drive, get licensed, sharpen your theory — properly.",
    items: [
      { href: "/services/drivers-licence", label: "Driver's licence" },
      { href: "/services/driveconnect", label: "DriveConnect lessons" },
    ],
  },
  {
    stage: "05", icon: Building2, title: "Scale up",
    blurb: "Run 3 vehicles or 300. Upload once — we watch every expiry, every driver.",
    items: [
      { href: "/fleet", label: "Fleet dashboard" },
      { href: "/services/sponsor-a-service", label: "Sponsor a service" },
    ],
  },
];

const FAQ_ITEMS = [
  { q: "What does Vehiculars actually do?", a: "We handle everything your car needs — renewals, inspections, driver's licence, number plates, tinted permits, genuine spare parts, repairs, port clearing and pre-purchase verification. One app, one team, from the day you buy to the day you sell." },
  { q: "Where do you operate?", a: "Nationwide — every state in Nigeria. Requests are submitted online from anywhere, and physical items (like plates, licences and permits) are delivered back to you." },
  { q: "How long does a renewal take?", a: "Most vehicle particulars and roadworthiness renewals are completed within 48 hours of submission. Driver's licence depends on biometrics scheduling. Spare parts ship within 24–72 hours depending on the item." },
  { q: "Are the spare parts really genuine?", a: "Yes. We source from vetted vendors and check fitment against your VIN, make, model and year before shipping. If a part doesn't fit, we replace it free." },
  { q: "Is my information safe?", a: "Yes. Documents are handled by vetted agents, encrypted in transit, and never shared with third parties. We're FRSC and NPF compliant." },
  { q: "Can I pay in instalments?", a: "Yes. Easy Installment is available on every service — pay any amount from the minimum deposit today, settle the rest before we deliver." },
  { q: "What if my application is rejected?", a: "If your application is rejected for reasons outside your control, we refund the full processing fee. You'll always know why upfront." },
  { q: "Do you handle fleets?", a: "Yes. Fleet mode lets you bulk-renew, assign drivers, and track every car from one dashboard. Talk to us about volume pricing." },
];

/* ─── Memoized sections ─── */

const HowStep = memo(function HowStep({ step, index, isActive, onClick }) {
  const Icon = step.icon;
  return (
    <div className="relative cursor-pointer group" onClick={onClick}>
      <div className="h-[3px] w-full rounded-full mb-8 overflow-hidden" style={{ background: "rgba(17, 17, 17,0.08)" }}>
        <div
          className="h-full bg-[#28A745] rounded-full"
          style={{
            width: isActive ? "100%" : "0%",
            transition: isActive ? "width 4s linear" : "width 0.2s ease",
            willChange: isActive ? "width" : "auto",
          }}
        />
      </div>
      <div
        className={`flex items-start gap-4 rounded-2xl p-6 transition-colors duration-200 ${isActive ? "bg-white shadow-lg shadow-black/5" : "hover:bg-white/50"}`}
        style={{ border: isActive ? "1px solid rgba(40, 167, 69,0.15)" : "1px solid transparent" }}
      >
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${isActive ? "bg-[#28A745] text-white" : "bg-[#111111]/8 text-[#111111]/60"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <span className="font-mono text-[11px] text-[#111111]/35 uppercase tracking-widest">
            Step {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-1.5 font-display text-[19px] font-medium leading-tight text-[#111111]">
            {step.title}
          </h3>
          <p className={`mt-2 text-[14px] leading-relaxed text-[#111111]/65 transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-0 h-0 overflow-hidden md:opacity-100 md:h-auto"}`}>
            {step.blurb}
          </p>
        </div>
      </div>
    </div>
  );
});

const ServiceCard = memo(function ServiceCard({ slug, label, benefit, icon: Icon, featured, index }) {
  const isFeatured = featured && index < 2;
  return (
    <Link
      key={slug}
      href={`/services/${slug}`}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl transition-transform duration-200 hover:-translate-y-1 ${
        isFeatured ? "col-span-2 p-6 sm:p-8 min-h-[200px]" : "p-5 sm:p-6"
      }`}
      style={{
        background: isFeatured ? "#111111" : "#ffffff",
        border: isFeatured ? "1px solid rgba(40, 167, 69,0.15)" : "1px solid rgba(17, 17, 17,0.08)",
      }}
    >
      {isFeatured && (
        <div aria-hidden className="absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #28A745, transparent 70%)" }} />
      )}
      <div>
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
          isFeatured ? "bg-[#28A745]/20 text-[#28A745]" : "bg-[#28A745]/10 text-[#28A745]"
        }`}>
          <Icon className="h-5 w-5" />
        </span>
        <h3 className={`mt-4 font-display text-[18px] font-medium leading-tight ${
          isFeatured ? "text-white" : "text-[#111111]"
        }`}>
          {label}
        </h3>
        <p className={`mt-2 text-[14px] leading-relaxed ${
          isFeatured ? "text-white/55" : "text-[#111111]/60"
        }`}>{benefit}</p>
      </div>
      <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#28A745]">
        View details
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1" />
      </span>
    </Link>
  );
});

const LifecycleCard = memo(function LifecycleCard({ stage }) {
  const Icon = stage.icon;
  return (
    <div
      className="group relative flex flex-col rounded-2xl bg-white p-6 sm:p-7 transition-transform duration-200 hover:-translate-y-1"
      style={{ border: "1px solid rgba(17, 17, 17,0.08)" }}
    >
      <div className="flex items-start justify-between">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#28A745]/10 text-[#28A745] transition-colors duration-200 group-hover:bg-[#28A745] group-hover:text-white">
          <Icon className="h-5 w-5" />
        </span>
        <span className="font-mono text-[11px] uppercase tracking-widest text-[#111111]/30">
          {stage.stage}
        </span>
      </div>
      <h3 className="mt-5 font-display text-[22px] font-medium leading-tight text-[#111111]">
        {stage.title}
      </h3>
      <p className="mt-2 text-[15px] leading-relaxed text-[#111111]/65">{stage.blurb}</p>
      <ul className="mt-5 space-y-1 border-t border-[#111111]/8 pt-4">
        {stage.items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="group/link flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-[14px] font-medium text-[#111111]/80 transition-colors duration-150 hover:bg-[#28A745]/5 hover:text-[#111111]"
            >
              <span>{item.label}</span>
              <ChevronRight className="h-3.5 w-3.5 text-[#111111]/30 transition-transform duration-150 group-hover/link:translate-x-0.5 group-hover/link:text-[#28A745]" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
});

const FaqItem = memo(function FaqItem({ q, a }) {
  return (
    <details className="vh-faq group rounded-2xl bg-white"
      style={{ border: "1px solid rgba(17, 17, 17,0.06)" }}>
      <summary className="flex items-center justify-between gap-6 px-6 py-5 cursor-pointer">
        <span className="text-[16px] md:text-[17px] font-medium text-[#111111] leading-snug">{q}</span>
        <span
          className="vh-faq-icon flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-200"
          style={{ background: "rgba(40, 167, 69,0.08)", color: "#28A745" }}
          aria-hidden
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M7 1.5 V12.5 M1.5 7 H12.5" />
          </svg>
        </span>
      </summary>
      <p className="px-6 pb-5 max-w-2xl text-[15px] leading-[1.7] text-[#111111]/70">{a}</p>
    </details>
  );
});

/* ─── Global styles (rendered once, outside component) ─── */
const GLOBAL_STYLES = `
  @keyframes phonefade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes phoneFloatA { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  @keyframes phoneFloatB { 0%,100% { transform: translateY(2rem); } 50% { transform: translateY(calc(2rem - 12px)); } }
  @media (min-width: 640px) {
    @keyframes phoneFloatB { 0%,100% { transform: translateY(3rem); } 50% { transform: translateY(calc(3rem - 12px)); } }
  }
  @media (prefers-reduced-motion: reduce) {
    .animate-\\[phoneFloatA_6s_ease-in-out_infinite\\],
    .animate-\\[phoneFloatB_7s_ease-in-out_infinite\\] { animation: none !important; }
  }
  @keyframes slideCycle2 {
    0%, 42% { opacity: 1; transform: translateY(0); }
    50%, 92% { opacity: 0; transform: translateY(6px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideCycle3 {
    0%, 28% { opacity: 1; }
    33%, 95% { opacity: 0; }
    100% { opacity: 1; }
  }
  @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

  html { scroll-behavior: smooth; }
  body { background: #111111; }

  .vh-section { position: relative; z-index: 1; contain: layout style; }
  .vh-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(40, 167, 69,0.3), transparent); margin: 0 auto; max-width: 800px; }
  .vh-hero-glow { position: absolute; width: 600px; height: 600px; border-radius: 50%; pointer-events: none; background: radial-gradient(circle, rgba(40, 167, 69,0.15), transparent 65%); top: -200px; right: -100px; z-index: 0; will-change: auto; }
  .vh-hero-glow-2 { position: absolute; width: 400px; height: 400px; border-radius: 50%; pointer-events: none; background: radial-gradient(circle, rgba(40, 167, 69,0.08), transparent 65%); bottom: -100px; left: -80px; z-index: 0; will-change: auto; }

  details.vh-faq[open] .vh-faq-icon { transform: rotate(45deg); }
  details.vh-faq summary::-webkit-details-marker { display: none; }
  details.vh-faq summary { list-style: none; }
`;

/* ─── Main Component ─── */

export function LandingPage({ logoUrl = "/logo.png" }) {
  let searchParams = null;
  try {
    searchParams = useSearchParams();
  } catch {
    // If rendered outside Suspense or in static mode
  }
  const rawRedirectParam = searchParams?.get("redirect");
  const redirectTo = typeof rawRedirectParam === "string" && rawRedirectParam.startsWith("/") ? rawRedirectParam : "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeShowcase, setActiveShowcase] = useState("drivers_licence");
  const [activeStep, setActiveStep] = useState(0);
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
    } catch { /* ignore */ }
  }, []);

  const dashboardHref = userRole === "admin" ? "/admin" : userRole === "staff" ? "/staff" : "/dashboard";
  const dashboardLabel = userRole === "admin" ? "Admin Portal" : userRole === "staff" ? "Staff Portal" : "Go to Dashboard";

  // Throttled scroll listener using rAF
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

  // Auto-cycle how-it-works steps
  useEffect(() => {
    const timer = setInterval(() => setActiveStep((s) => (s + 1) % 3), 4000);
    return () => clearInterval(timer);
  }, []);

  const handleStepClick = useCallback((i) => setActiveStep(i), []);

  // Memoize the showcase data lookup
  const showcaseData = useMemo(() => ({
    title: SHOWCASES[activeShowcase]?.screens?.[0]?.title || "Instant Processing",
    sub: SHOWCASES[activeShowcase]?.screens?.[0]?.sub || "Seamless updates delivered directly to your device with nationwide coverage.",
    cards: SHOWCASES[activeShowcase]?.cards || [],
    tabLabel: SHOWCASE_TABS.find((t) => t.id === activeShowcase)?.label || "Service",
    serviceSlug: activeShowcase === "rwx_lagos" ? "roadworthiness-express" : activeShowcase.replace(/_/g, "-"),
  }), [activeShowcase]);

  // Memoize nav background to avoid recalc on every render
  const navStyle = useMemo(() => ({
    background: scrolled ? "rgba(17, 17, 17,0.95)" : "rgba(17, 17, 17,0.40)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: scrolled ? "0.5px solid rgba(40, 167, 69,0.15)" : "0.5px solid transparent",
    boxShadow: scrolled ? "0 4px 20px rgba(0,0,0,0.3)" : "none",
  }), [scrolled]);

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 transition-colors duration-200" style={navStyle}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-2.5 text-white">
            <img src={logoUrl} alt="Vehiculars" className="h-8 w-auto object-contain" loading="eager" />
            <span className="font-display text-[18px] font-medium tracking-tight">Vehiculars</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-white/80">
            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center gap-1 transition-colors duration-150 hover:text-white"
                aria-haspopup="true"
              >
                Services
                <svg className="h-3 w-3 opacity-50" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div
                className="invisible absolute left-1/2 top-full z-50 mt-3 w-64 -translate-x-1/2 rounded-2xl p-2 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100"
                style={{ background: "rgba(17, 17, 17,0.98)", border: "1px solid rgba(40, 167, 69,0.12)" }}
              >
                {SERVICE_LINKS.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/services/${s.slug}`}
                    className="block rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/80 transition-colors duration-150 hover:bg-[#28A745]/10 hover:text-white"
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
            <Link href="/pricing" className="transition-colors duration-150 hover:text-white">Pricing</Link>
            <a href="#how" className="transition-colors duration-150 hover:text-white">How it works</a>
            <a href="#showcases" className="transition-colors duration-150 hover:text-white">App preview</a>
            <a href="#contact" className="transition-colors duration-150 hover:text-white">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href={dashboardHref}
                className="inline-flex items-center rounded-xl text-[14px] font-semibold"
                style={{ background: "#28A745", color: "#f0ede6", padding: "9px 22px" }}
              >
                {dashboardLabel}
              </Link>
            ) : (
              <>
                <Link
                  href={`/auth/login?redirect=${encodeURIComponent(redirectTo)}`}
                  className="hidden sm:inline-flex items-center rounded-lg text-[14px] font-medium text-white/80 hover:text-white transition-colors duration-150 px-4 py-2"
                >
                  Sign In
                </Link>
                <Link
                  href={`/auth/signup?redirect=${encodeURIComponent(redirectTo)}`}
                  className="inline-flex items-center rounded-xl text-[14px] font-semibold"
                  style={{ background: "#28A745", color: "#f0ede6", padding: "9px 22px" }}
                >
                  Get Started
                </Link>
              </>
            )}
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center h-10 w-10 text-white"
            >
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden" style={{ background: "rgba(17, 17, 17,0.98)", borderTop: "0.5px solid rgba(40, 167, 69,0.12)" }}>
            <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-5 text-[14px] font-medium text-white">
              <p className="text-xs uppercase tracking-wider text-[#28A745]/60 mb-1">Services</p>
              {SERVICE_LINKS.map((s) => (
                <Link
                  key={s.slug}
                  href={`/services/${s.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-white/80 hover:bg-[#28A745]/10 hover:text-white transition-colors duration-150"
                >
                  {s.label}
                </Link>
              ))}
              <div className="my-3 vh-divider" />
              <Link href="/pricing" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 hover:bg-[#28A745]/10 transition-colors duration-150">Pricing</Link>
              <a href="#how" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 hover:bg-[#28A745]/10 transition-colors duration-150">How it works</a>
              <a href="#showcases" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 hover:bg-[#28A745]/10 transition-colors duration-150">App preview</a>
              <a href="#contact" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 hover:bg-[#28A745]/10 transition-colors duration-150">Contact</a>
            </nav>
          </div>
        )}
      </header>

      {/* ── HERO — Dark, immersive ── */}
      <section className="relative overflow-hidden min-h-screen vh-section" style={{ background: "#111111" }}>
        <div className="vh-hero-glow" aria-hidden />
        <div className="vh-hero-glow-2" aria-hidden />
        {/* Subtle grid pattern — static, no animation */}
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(40, 167, 69,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(40, 167, 69,0.04) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, #000 20%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, #000 20%, transparent 80%)",
        }} />

        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8 pt-24 pb-16 lg:pt-36 lg:pb-28">
          <div className="grid items-center gap-10 md:gap-12 lg:gap-8 md:grid-cols-12">
            <div className="md:col-span-7 relative z-10 flex flex-col items-center text-center md:items-start md:text-left">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12px] font-medium text-[#28A745] mb-6 lg:mb-8"
                style={{ background: "rgba(40, 167, 69,0.08)", border: "1px solid rgba(40, 167, 69,0.15)" }}>
                <span className="h-1.5 w-1.5 rounded-full bg-[#28A745] animate-pulse" />
                <span className="uppercase tracking-[0.14em]">Vehicle management platform</span>
              </div>

              <h1
                className="font-display font-medium tracking-[-0.03em] text-white"
                style={{ fontSize: "clamp(2.4rem, 5.5vw + 1rem, 4.5rem)", lineHeight: 1.02 }}
              >
                Everything your
                <br />
                car needs.
                <br />
                <span className="text-[#28A745]">In one place.</span>
              </h1>

              <p className="mt-6 lg:mt-7 max-w-lg text-[16px] sm:text-[18px] leading-relaxed text-white/55">
                Renewals, inspections, genuine parts and more — managed in one place, across Nigeria. Relief from a countdown you didn't know you were losing.
              </p>

              <div className="mt-8 lg:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center md:justify-start gap-3.5 sm:gap-4 w-full">
                <Link
                  href={isLoggedIn ? dashboardHref : `/auth/signup?redirect=${encodeURIComponent(redirectTo)}`}
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl px-8 text-[15px] font-semibold w-full sm:w-auto"
                  style={{ background: "#28A745", color: "#f0ede6" }}
                >
                  {isLoggedIn ? dashboardLabel : "Get started"}
                  <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#how"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-medium text-white/60 transition-colors duration-150 hover:text-white w-full sm:w-auto"
                  style={{ border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  <Play className="h-3.5 w-3.5" />
                  See how it works
                </a>
              </div>

              {/* Proof numbers */}
              <div className="mt-12 lg:mt-14 grid grid-cols-3 items-start justify-items-center md:justify-items-start gap-4 sm:gap-8 lg:gap-12">
                {[
                  ["40,000+", "Drivers served"],
                  ["Nationwide", "Every state"],
                  ["48 hrs", "Avg. turnaround"],
                ].map(([num, label]) => (
                  <div key={num} className="text-center md:text-left">
                    <p className="font-display text-[22px] sm:text-[26px] font-medium text-white leading-none">{num}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-widest text-white/40">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-5 relative z-10 w-full flex justify-center items-center">
              <div className="w-full max-w-[380px] sm:max-w-[420px] md:max-w-[480px] lg:max-w-none flex justify-center">
                <HeroPhoneShowcase />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{
          background: "linear-gradient(to bottom, transparent, #f0ede6)"
        }} />
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        id="how"
        className="vh-section relative px-4 sm:px-6 md:px-10 py-[64px] sm:py-[80px] lg:py-[96px]"
        style={{ background: "#f0ede6" }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto">
            <p className="font-mono text-[11px] uppercase tracking-widest text-[#28A745]">
              How it works —
            </p>
            <h2 className="mt-4 font-display font-medium tracking-[-0.02em] leading-[1.05] text-[#111111] text-[clamp(1.75rem,2.4vw+1rem,2.5rem)]">
              Submit online. We handle the rest.
            </h2>
            <p className="mt-5 max-w-md mx-auto text-[16px] leading-[1.7] text-[#111111]/70">
              Start a request in under 2 minutes from your phone. We process it with the relevant authority or vendor and deliver the result back to you.
            </p>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-0">
            {HOW_STEPS.map((s, i) => (
              <HowStep key={i} step={s} index={i} isActive={activeStep === i} onClick={() => handleStepClick(i)} />
            ))}
          </div>
        </div>
      </section>

      <div className="vh-divider" style={{ background: "linear-gradient(90deg, transparent, rgba(17, 17, 17,0.12), transparent)" }} />

      {/* ── SERVICES ── */}
      <section
        id="services"
        className="vh-section relative px-4 sm:px-6 md:px-10 py-[64px] sm:py-[80px] lg:py-[96px]"
        style={{ background: "#f0ede6" }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-[#28A745]">
                Services —
              </p>
              <h2 className="mt-4 font-display font-medium tracking-[-0.02em] leading-[1.05] text-[#111111] text-[clamp(1.75rem,2.4vw+1rem,2.5rem)]">
                Everything, in one app.
              </h2>
              <p className="mt-4 max-w-md text-[16px] leading-[1.7] text-[#111111]/70">
                Pick a service. We handle the queues, paperwork, and follow-ups — end-to-end.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {SERVICE_ITEMS.map((item, i) => (
              <ServiceCard key={item.slug} {...item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── APP SHOWCASES ── */}
      <section
        id="showcases"
        className="vh-section relative px-4 sm:px-6 md:px-10 py-[64px] sm:py-[80px] lg:py-[96px]"
        style={{ background: "#111111" }}
      >
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(40, 167, 69,0.06), transparent 60%)",
        }} />
        <div className="relative mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto">
            <p className="font-mono text-[11px] uppercase tracking-widest text-[#28A745]">
              App Preview —
            </p>
            <h2 className="mt-4 font-display font-medium tracking-[-0.02em] leading-[1.05] text-white text-[clamp(1.75rem,2.4vw+1rem,2.5rem)]">
              See how every service flows on your phone.
            </h2>
            <p className="mt-5 max-w-md mx-auto text-[16px] leading-[1.7] text-white/55">
              From document renewals to genuine spare parts, track real-time agent updates and verified deliverables right inside your Vehiculars app.
            </p>
          </div>

          {/* Pill tabs */}
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {SHOWCASE_TABS.map((tab) => {
              const active = activeShowcase === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveShowcase(tab.id)}
                  className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-150 ${
                    active
                      ? "bg-[#28A745] text-white"
                      : "text-white/60 hover:text-white/90"
                  }`}
                  style={{
                    border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,0.06)",
                    background: active ? "#28A745" : "rgba(255,255,255,0.04)",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="mt-14 grid items-center gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-5 text-white">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] text-[#28A745] font-medium mb-5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(40, 167, 69,0.15)" }}>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Live Walkthrough</span>
              </div>
              <h3 className="font-display text-[28px] sm:text-[32px] font-medium text-white leading-tight tracking-[-0.01em]">
                {showcaseData.title}
              </h3>
              <p className="mt-4 text-[15px] leading-relaxed text-white/55">
                {showcaseData.sub}
              </p>
              
              <div className="mt-8 space-y-3">
                {showcaseData.cards.map((card, idx) => (
                  <div key={idx} className="flex items-start gap-3 rounded-xl p-3.5"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <CheckCircle2 className="h-5 w-5 text-[#28A745] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[13px] font-semibold text-white/90">
                        {card.title || card.label || "Verified stage"}
                      </p>
                      {card.sub && (
                        <p className="text-[12px] text-white/45 mt-0.5">{card.sub}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Link
                  href={`/services/${showcaseData.serviceSlug}`}
                  className="group inline-flex items-center gap-2 rounded-xl bg-[#28A745] px-6 py-3.5 text-[14px] font-semibold text-white"
                >
                  Start {showcaseData.tabLabel}
                  <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            <div className="md:col-span-7 flex justify-center">
              <ShowcaseSlot serviceId={activeShowcase} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Lifecycle ── */}
      <section
        id="lifecycle"
        className="vh-section relative px-4 sm:px-6 md:px-10 py-[64px] sm:py-[80px] lg:py-[96px]"
        style={{ background: "#f0ede6" }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="font-mono text-[11px] uppercase tracking-widest text-[#28A745]">
              Lifecycle —
            </p>
            <h2 className="mt-4 font-display font-medium tracking-[-0.02em] leading-[1.05] text-[#111111] text-[clamp(1.75rem,2.4vw+1rem,2.5rem)]">
              With your car from purchase to resale.
            </h2>
            <p className="mt-5 text-[16px] leading-[1.7] text-[#111111]/70">
              Vehiculars isn't a renewal service. It's the home base for every car you own — every stage, every job, one app.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {LIFECYCLE_STAGES.map((stage) => (
              <LifecycleCard key={stage.title} stage={stage} />
            ))}
          </div>
        </div>
      </section>

      <TestimonialsLoader />

      {/* ── FAQ ── */}
      <section
        id="faq"
        className="vh-section relative px-4 sm:px-6 md:px-10 py-[64px] sm:py-[80px] lg:py-[96px]"
        style={{ background: "#f0ede6" }}
      >
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-14">
            <p className="font-mono text-[11px] uppercase tracking-widest text-[#28A745]">
              FAQ —
            </p>
            <h2 className="mt-4 font-display font-medium tracking-[-0.02em] leading-[1.05] text-[#111111] text-[clamp(1.75rem,2.4vw+1rem,2.5rem)]">
              Questions, answered.
            </h2>
            <p className="mt-5 text-[16px] leading-[1.7] text-[#111111]/70">
              Everything you need to know before you get started. Still stuck? Reach out and a human will reply.
            </p>
          </div>

          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section
        className="vh-section relative overflow-hidden px-4 sm:px-6 md:px-10"
        style={{ background: "#111111" }}
      >
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 50% 50% at 50% 60%, rgba(40, 167, 69,0.10), transparent 70%)",
        }} />
        <div className="relative mx-auto max-w-3xl py-[80px] md:py-[100px] text-center">
          <h2
            className="font-display font-medium tracking-[-0.03em] leading-[1.0] text-white"
            style={{ fontSize: "clamp(2.2rem, 4vw + 1rem, 4rem)" }}
          >
            Your vehicle.
            <br />
            Your time.
            <br />
            <span className="text-[#28A745]">Our job.</span>
          </h2>
          <p className="mt-7 max-w-lg mx-auto text-[16px] leading-[1.7] text-white/45">
            Join thousands of Nigerian car owners who've handed the hassle to us. Get started in under 2 minutes.
          </p>
          <div className="mt-10 flex justify-center">
            <Link
              href={isLoggedIn ? dashboardHref : `/auth/signup?redirect=${encodeURIComponent(redirectTo)}`}
              className="group inline-flex items-center gap-2 rounded-xl text-[15px] font-semibold"
              style={{ background: "#28A745", color: "#f0ede6", padding: "16px 36px" }}
            >
              {isLoggedIn ? dashboardLabel : "Get started — it's free"}
              <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-14">
            {[
              ["10,000+", "Jobs completed"],
              ["Nationwide", "Every state, every LGA"],
              ["48 hrs", "Average turnaround"],
            ].map(([num, label]) => (
              <div key={num} className="text-center">
                <p className="font-display text-2xl md:text-3xl font-medium text-white">{num}</p>
                <p className="mt-1.5 text-[11px] uppercase tracking-widest text-white/35">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{ background: "#111111", borderTop: "1px solid rgba(40, 167, 69,0.08)" }}
        className="relative z-[1] px-5 md:px-8 py-14"
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-3">
            <div className="col-span-2 md:col-span-1">
              <span className="font-display text-[18px] font-medium text-white">Vehiculars</span>
              <p className="mt-4 text-[13px] leading-relaxed text-white/45 max-w-xs">
                Everything your car needs — handled end-to-end, delivered nationwide.
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-white/40 mb-4">Company</p>
              <ul className="space-y-2.5 text-[13px] text-white/60">
                <li><a href="#how" className="hover:text-white transition-colors duration-150">How it works</a></li>
                <li><a href="#showcases" className="hover:text-white transition-colors duration-150">App preview</a></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors duration-150">Pricing</Link></li>
                <li><a href="#contact" className="hover:text-white transition-colors duration-150">Contact</a></li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-white/40 mb-4">Legal</p>
              <ul className="space-y-2.5 text-[13px] text-white/60">
                <li><Link href="/privacy" className="hover:text-white transition-colors duration-150">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors duration-150">Terms</Link></li>
                <li><Link href={`/auth/login?redirect=${encodeURIComponent(redirectTo)}`} className="hover:text-white transition-colors duration-150">Sign in</Link></li>
                <li><Link href={`/auth/signup?redirect=${encodeURIComponent(redirectTo)}`} className="hover:text-white transition-colors duration-150">Create account</Link></li>
              </ul>
            </div>
          </div>
          <div
            className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-8 md:flex-row"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <p className="text-[12px] text-white/35">
              &copy; {new Date().getFullYear()} Vehiculars. All rights reserved.
            </p>
            <p className="text-[12px] text-white/35">
              Made in Nigeria
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
