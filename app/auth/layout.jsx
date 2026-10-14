"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Shield, Clock, MapPin, Lock } from "lucide-react";
import { EASE } from "@/app/components/marketing/motion";

const TRUST_POINTS = [
  { icon: Clock, title: "48-Hour Turnaround", body: "Fast dispatch for fresh and renewal licences." },
  { icon: MapPin, title: "Nationwide Coverage", body: "All 36 States and the FCT supported." },
  { icon: Shield, title: "Official VIO Integration", body: "Verified biometrics capture & genuine documentation." },
];

/** Soft green light that drifts slowly behind the brand panel (transform only). */
function DriftingGlow({ className, duration, path }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      className={`mk-glow pointer-events-none absolute rounded-full ${className}`}
      animate={reduce ? undefined : path}
      transition={reduce ? undefined : { duration, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
    />
  );
}

export default function AuthLayout({ children }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const wide = pathname?.startsWith("/auth/signup");

  return (
    <div className="mk-root min-h-screen lg:flex">
      {/* Left — brand panel (desktop) */}
      <aside className="relative hidden overflow-hidden bg-mk-dark text-white lg:flex lg:min-h-screen lg:w-[46%] lg:flex-col lg:justify-between lg:px-12 lg:py-10 xl:px-16">
        <div aria-hidden className="mk-grid-bg-dark pointer-events-none absolute inset-0 opacity-70" />
        <DriftingGlow className="-left-32 top-[-10%] h-[520px] w-[520px]" duration={18} path={{ x: [0, 80, 20], y: [0, 60, 120], scale: [1, 1.08, 0.96] }} />
        <DriftingGlow className="-right-40 bottom-[-15%] h-[460px] w-[460px] opacity-70" duration={22} path={{ x: [0, -60, -10], y: [0, -80, -30], scale: [1, 0.94, 1.06] }} />
        <div aria-hidden className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

        <div className="relative z-10">
          <Link href="/" className="mk-focus inline-flex items-center gap-3 rounded-lg transition-opacity hover:opacity-80">
            <img src="/logo.png" alt="Vehiculars" className="h-8 w-auto object-contain" />
            <span className="text-[19px] font-semibold tracking-[-0.02em] text-white">Vehiculars</span>
          </Link>
        </div>

        <motion.div
          className="relative z-10 my-auto max-w-lg py-12"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-cx-brand/25 bg-cx-brand/10 px-3.5 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#5fd17a]">
            <span className="h-1.5 w-1.5 rounded-full bg-cx-brand mk-pulse-dot" aria-hidden />
            End-to-End Vehicle Management
          </p>

          <h2
            className="mt-6 font-semibold tracking-[-0.03em] text-white text-balance"
            style={{ fontSize: "clamp(2rem, 2.6vw + 0.5rem, 2.9rem)", lineHeight: 1.08 }}
          >
            Where your vehicle documents{" "}
            <span className="font-display font-normal italic text-[#5fd17a]">live</span>.
          </h2>

          <p className="mt-5 text-[15.5px] leading-relaxed text-white/60 text-pretty">
            Relief from a countdown you didn&apos;t know you were losing. Renewals, roadworthiness inspections, physical condition checks, and VIO compliance — managed from a single secure portal across Nigeria.
          </p>

          <ul className="mt-10 space-y-3">
            {TRUST_POINTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-3.5 rounded-mk border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cx-brand/15 text-[#5fd17a] ring-1 ring-inset ring-cx-brand/25">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-[13.5px] leading-relaxed">
                  <span className="block font-semibold text-white">{title}</span>
                  <span className="text-white/55">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </motion.div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/[0.08] pt-6 font-mono text-[12px] text-white/40">
          <span>&copy; {new Date().getFullYear()} Vehiculars</span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-3 w-3" aria-hidden /> Made in Nigeria
          </span>
        </div>
      </aside>

      {/* Right — form surface */}
      <main className="relative flex min-h-screen w-full flex-col bg-mk-bg lg:w-[54%]">
        <div aria-hidden className="mk-grid-bg pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-70" />

        <header className="relative z-10 flex items-center justify-between gap-4 px-4 py-4 sm:px-8 sm:py-6">
          <Link href="/" className="mk-focus flex min-h-[44px] items-center gap-2.5 rounded-lg lg:hidden">
            <img src="/logo.png" alt="Vehiculars" className="h-7 w-auto object-contain" />
            <span className="text-[17px] font-semibold tracking-[-0.02em] text-mk-ink">Vehiculars</span>
          </Link>
          <Link
            href="/"
            className="mk-focus ml-auto inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-[13.5px] font-medium text-mk-muted transition-colors hover:bg-mk-ink/[0.04] hover:text-mk-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back to website
          </Link>
        </header>

        <div className="relative z-10 flex flex-1 items-start justify-center px-4 pb-10 pt-2 sm:items-center sm:px-8 sm:py-10">
          <motion.div
            key={pathname}
            className={`w-full ${wide ? "max-w-[560px]" : "max-w-[460px]"}`}
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <div className="rounded-mk-lg border border-mk-line bg-mk-surface px-5 py-7 shadow-mk-lg sm:px-10 sm:py-10">
              {children}
            </div>
            <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[12.5px] text-mk-muted">
              <Lock className="h-3.5 w-3.5 text-cx-brand" aria-hidden />
              Your details are encrypted and never sold.
            </p>
          </motion.div>
        </div>

        <footer className="relative z-10 border-t border-mk-line px-4 py-5 text-center font-mono text-[12px] text-mk-muted lg:hidden">
          <p>&copy; {new Date().getFullYear()} Vehiculars. Nationwide Compliance.</p>
        </footer>
      </main>
    </div>
  );
}
