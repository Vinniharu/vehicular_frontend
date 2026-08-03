"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import MobileDrawer from "@/app/dashboard/_shared/MobileDrawer";
import { SERVICE_LINKS } from "../landing-data";
import { INK, GREEN, PAPER } from "../theme";

export default function Nav({ logoUrl, scrolled, isLoggedIn, dashboardHref, dashboardLabel, redirectTo }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-50 transition-colors duration-200"
        style={{
          background: scrolled ? `${INK}f2` : `${INK}66`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: scrolled ? `0.5px solid ${GREEN}26` : "0.5px solid transparent",
          boxShadow: scrolled ? "0 4px 20px rgba(0,0,0,0.3)" : "none",
        }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-2.5 text-white">
            <img src={logoUrl} alt="Vehiculars" className="h-8 w-auto object-contain" loading="eager" />
            <span className="font-display text-[18px] font-medium tracking-tight">Vehiculars</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-white/80">
            <div className="relative group">
              <button type="button" className="inline-flex items-center gap-1 transition-colors duration-150 hover:text-white" aria-haspopup="true">
                Services
                <svg className="h-3 w-3 opacity-50" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div
                className="invisible absolute left-1/2 top-full z-50 mt-3 w-64 -translate-x-1/2 rounded-2xl p-2 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100"
                style={{ background: `${INK}fa`, border: `1px solid ${GREEN}1f` }}
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
                className="hidden sm:inline-flex items-center rounded-xl text-[14px] font-semibold"
                style={{ background: GREEN, color: PAPER, padding: "9px 22px" }}
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
                  className="hidden sm:inline-flex items-center rounded-xl text-[14px] font-semibold"
                  style={{ background: GREEN, color: PAPER, padding: "9px 22px" }}
                >
                  Get Started
                </Link>
              </>
            )}
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="md:hidden inline-flex h-11 w-11 items-center justify-center text-white"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileDrawer
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        title="Menu"
        side="right"
        panelClassName="top-0 right-0 h-full w-[85vw] max-w-sm"
      >
        <div className="flex h-full flex-col overflow-y-auto" style={{ background: INK }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `0.5px solid ${GREEN}1f` }}>
            <span className="font-display text-[16px] font-medium text-white">Menu</span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center text-white/70 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 px-4 py-5 text-[15px] font-medium text-white">
            <p className="px-2 text-[11px] uppercase tracking-widest text-[#28A745]/70 mb-1">Services</p>
            {SERVICE_LINKS.map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                onClick={() => setMobileOpen(false)}
                className="min-h-[44px] flex items-center rounded-lg px-3 py-2.5 text-white/85 hover:bg-[#28A745]/10 hover:text-white transition-colors duration-150"
              >
                {s.label}
              </Link>
            ))}
            <div className="my-3 h-px" style={{ background: `${GREEN}30` }} />
            {[
              { href: "/pricing", label: "Pricing" },
              { href: "#how", label: "How it works" },
              { href: "#showcases", label: "App preview" },
              { href: "#contact", label: "Contact" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="min-h-[44px] flex items-center rounded-lg px-3 py-2.5 text-white/85 hover:bg-[#28A745]/10 hover:text-white transition-colors duration-150"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="px-4 pb-6 pt-2" style={{ borderTop: `0.5px solid ${GREEN}1f` }}>
            {isLoggedIn ? (
              <Link
                href={dashboardHref}
                onClick={() => setMobileOpen(false)}
                className="flex min-h-[48px] items-center justify-center rounded-xl text-[15px] font-semibold"
                style={{ background: GREEN, color: PAPER }}
              >
                {dashboardLabel}
              </Link>
            ) : (
              <div className="flex flex-col gap-2.5">
                <Link
                  href={`/auth/signup?redirect=${encodeURIComponent(redirectTo)}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-[48px] items-center justify-center rounded-xl text-[15px] font-semibold"
                  style={{ background: GREEN, color: PAPER }}
                >
                  Get Started
                </Link>
                <Link
                  href={`/auth/login?redirect=${encodeURIComponent(redirectTo)}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-[48px] items-center justify-center rounded-xl text-[15px] font-medium text-white/80"
                  style={{ border: "1px solid rgba(255,255,255,0.15)" }}
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </MobileDrawer>
    </>
  );
}
