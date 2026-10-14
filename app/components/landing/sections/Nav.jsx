"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import MobileDrawer from "@/app/dashboard/_shared/MobileDrawer";
import ServiceIcon from "@/app/components/marketing/ServiceIcon";
import { MkButton } from "@/app/components/marketing/ui";
import { EASE } from "@/app/components/marketing/motion";
import { SERVICE_ITEMS } from "../landing-data";

const cx = (...parts) => parts.filter(Boolean).join(" ");

export default function Nav({ logoUrl, scrolled, isLoggedIn, dashboardHref, dashboardLabel, redirectTo }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const howHref = isHome ? "#how" : "/#how";
  const showcasesHref = isHome ? "#showcases" : "/#showcases";
  const loginHref = `/auth/login?redirect=${encodeURIComponent(redirectTo)}`;
  const signupHref = `/auth/signup?redirect=${encodeURIComponent(redirectTo)}`;

  const linkClass =
    "mk-focus relative rounded-full px-3 py-2 text-[14px] font-medium text-mk-ink-2 transition-colors duration-200 hover:text-mk-ink hover:bg-mk-ink/[0.04]";

  return (
    <>
      <header
        className={cx(
          "sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          scrolled
            ? "border-b border-mk-line/80 bg-white/75 shadow-[0_1px_0_rgba(11,18,16,0.02),0_8px_24px_-16px_rgba(11,18,16,0.18)] backdrop-blur-xl backdrop-saturate-150"
            : "border-b border-transparent bg-white/0"
        )}
      >
        <div
          className={cx(
            "mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-6 lg:px-8 transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            scrolled ? "h-16" : "h-[72px]"
          )}
        >
          <Link href="/" className="mk-focus flex items-center gap-2.5 rounded-lg text-mk-ink">
            <img src={logoUrl} alt="Vehiculars" className="h-8 w-auto object-contain" loading="eager" />
            <span className="text-[17px] font-semibold tracking-[-0.02em]">Vehiculars</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5" aria-label="Main">
            <div
              className="relative"
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
              onFocus={() => setServicesOpen(true)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setServicesOpen(false);
              }}
            >
              <button
                type="button"
                className={cx(linkClass, "inline-flex items-center gap-1")}
                aria-haspopup="true"
                aria-expanded={servicesOpen}
                onClick={() => setServicesOpen((v) => !v)}
              >
                Services
                <ChevronDown className={cx("h-3.5 w-3.5 opacity-60 transition-transform duration-300", servicesOpen && "rotate-180")} />
              </button>
              <AnimatePresence>
                {servicesOpen && (
                  <motion.div
                    initial={reduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="absolute left-1/2 top-full z-50 w-[560px] -translate-x-1/2 pt-3"
                  >
                    <div className="grid grid-cols-2 gap-1 rounded-mk-lg border border-mk-line bg-white p-2 shadow-mk-lg">
                      {SERVICE_ITEMS.map((s) => (
                        <Link
                          key={s.slug}
                          href={`/services/${s.slug}`}
                          onClick={() => setServicesOpen(false)}
                          className="mk-focus group flex items-start gap-3 rounded-mk p-3 transition-colors duration-200 hover:bg-cx-brand-soft/60"
                        >
                          <ServiceIcon icon={s.icon} tone="brand" size="sm" />
                          <span className="min-w-0">
                            <span className="block text-[13.5px] font-semibold text-mk-ink">{s.label}</span>
                            <span className="mt-0.5 block text-[12.5px] leading-snug text-mk-muted">{s.benefit}</span>
                          </span>
                        </Link>
                      ))}
                      <Link
                        href="/services"
                        onClick={() => setServicesOpen(false)}
                        className="mk-focus col-span-2 mt-1 flex items-center justify-between rounded-mk bg-mk-bg px-4 py-3 text-[13px] font-semibold text-mk-ink transition-colors hover:bg-cx-brand-soft"
                      >
                        All services
                        <ArrowRight className="h-4 w-4 text-cx-brand transition-transform duration-300 group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link href="/pricing" className={linkClass}>Pricing</Link>
            <a href="https://spare.vehiculars.com" className={linkClass}>Spare Parts</a>
            <Link href="/earn" className={linkClass}>Earn</Link>
            <a href={howHref} className={linkClass}>How it works</a>
            <a href={showcasesHref} className={linkClass}>App preview</a>
            <a href="#contact" className={linkClass}>Contact</a>
          </nav>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <MkButton href={dashboardHref} size="sm" className="hidden sm:inline-flex">
                {dashboardLabel}
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </MkButton>
            ) : (
              <>
                <MkButton href={loginHref} variant="ghost" size="sm" className="hidden sm:inline-flex">
                  Sign In
                </MkButton>
                <MkButton href={signupHref} size="sm" className="hidden sm:inline-flex">
                  Get Started
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </MkButton>
              </>
            )}
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="mk-focus lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-full text-mk-ink hover:bg-mk-ink/[0.05]"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileDrawer open={mobileOpen} onOpenChange={setMobileOpen} title="Menu" side="right" panelClassName="top-0 right-0 h-full w-[88vw] max-w-sm">
        <div className="flex h-full flex-col overflow-y-auto bg-white">
          <div className="flex items-center justify-between border-b border-mk-line px-5 py-4">
            <span className="text-[16px] font-semibold tracking-tight text-mk-ink">Menu</span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="mk-focus inline-flex h-11 w-11 items-center justify-center rounded-full text-mk-muted hover:bg-mk-ink/[0.05] hover:text-mk-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4 text-[15px] font-medium" aria-label="Mobile">
            <p className="px-3 pb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-cx-brand-deep">Services</p>
            {SERVICE_ITEMS.map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                onClick={() => setMobileOpen(false)}
                className="flex min-h-[44px] items-center gap-3 rounded-mk px-3 py-2 text-mk-ink-2 transition-colors hover:bg-cx-brand-soft/60 hover:text-mk-ink"
              >
                <ServiceIcon icon={s.icon} tone="brand" size="sm" />
                {s.label}
              </Link>
            ))}
            <div className="my-3 h-px bg-mk-line" />
            {[
              { href: "/pricing", label: "Pricing" },
              { href: "https://spare.vehiculars.com", label: "Spare Parts" },
              { href: "/earn", label: "Earn" },
              { href: howHref, label: "How it works" },
              { href: showcasesHref, label: "App preview" },
              { href: "#contact", label: "Contact" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex min-h-[44px] items-center rounded-mk px-3 py-2 text-mk-ink-2 transition-colors hover:bg-mk-ink/[0.04] hover:text-mk-ink"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="border-t border-mk-line px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-4">
            {isLoggedIn ? (
              <MkButton href={dashboardHref} size="lg" className="w-full" onClick={() => setMobileOpen(false)}>
                {dashboardLabel}
              </MkButton>
            ) : (
              <div className="flex flex-col gap-2.5">
                <MkButton href={signupHref} size="lg" className="w-full" onClick={() => setMobileOpen(false)}>
                  Get Started
                </MkButton>
                <MkButton href={loginHref} variant="secondary" size="lg" className="w-full" onClick={() => setMobileOpen(false)}>
                  Sign In
                </MkButton>
              </div>
            )}
          </div>
        </div>
      </MobileDrawer>
    </>
  );
}
