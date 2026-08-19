"use client";

import Link from "next/link";

/**
 * Parameterized extraction of app/auth/layout.jsx's split-column, dark-
 * throughout (#111111, #28A745 green) branded shell — the customer login
 * keeps using AuthLayout unchanged; this is for portals that deliberately
 * want the same branded treatment instead of PortalLoginForm's plain card
 * (currently only the dealer portal — see app/dealer/login/page.jsx).
 */
export default function BrandedAuthLayout({ badge, headline, headlineAccent, description, features = [], children }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row selection:bg-[#28A745] selection:text-white" style={{ background: "#111111", color: "#f0ede6" }}>
      {/* Left Column — Institutional Brand Surface (Desktop) */}
      <aside
        className="hidden lg:flex lg:w-1/2 flex-col justify-between px-12 xl:px-16 py-12 border-r relative overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #111111 0%, #08140c 100%)",
          borderColor: "rgba(255, 255, 255, 0.06)",
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(40, 167, 69,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(40, 167, 69,0.05) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 80% 80% at 30% 50%, #000 40%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 30% 50%, #000 40%, transparent 100%)",
          }}
        />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 transition-opacity hover:opacity-80">
            <img src="/logo.png" alt="Vehiculars" className="h-8 w-auto object-contain" />
            <span className="font-display text-[20px] font-medium tracking-tight text-white">Vehiculars</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg my-auto py-12">
          <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[11px] font-mono text-[#28A745] mb-6"
            style={{ background: "rgba(40, 167, 69,0.1)", border: "1px solid rgba(40, 167, 69,0.2)" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#28A745]" />
            <span className="uppercase tracking-widest">{badge}</span>
          </div>

          <h2
            className="font-display font-medium text-white tracking-[-0.02em] leading-[1.12]"
            style={{ fontSize: "clamp(2rem, 3vw, 2.75rem)" }}
          >
            {headline} {headlineAccent && <span className="text-[#28A745]">{headlineAccent}</span>}
          </h2>

          <p className="mt-5 text-[15px] leading-relaxed text-white/60">{description}</p>

          {features.length > 0 && (
            <div className="mt-10 space-y-4 pt-8 border-t border-white/[0.08]">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="flex items-center gap-3.5 text-[13px] text-white/80">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#28A745]/15 text-[#28A745]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-white">{feature.title}</span>
                      <span className="text-white/50 ml-1.5">— {feature.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="relative z-10 flex items-center justify-between text-[12px] font-mono text-white/40 pt-6 border-t border-white/[0.06]">
          <span>&copy; {new Date().getFullYear()} Vehiculars</span>
          <span>Made in Nigeria</span>
        </div>
      </aside>

      {/* Right Column — Authentication Form Surface */}
      <main className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between bg-[#111111]">
        <header className="px-6 sm:px-10 py-6 flex items-center justify-between">
          <Link href="/" className="lg:hidden flex items-center gap-2.5">
            <img src="/logo.png" alt="Vehiculars" className="h-7 w-auto object-contain" />
            <span className="font-display text-[18px] font-medium text-white">Vehiculars</span>
          </Link>
          <Link
            href="/"
            className="text-[13px] font-mono text-white/60 hover:text-white transition-colors duration-150 inline-flex items-center gap-1.5 ml-auto"
          >
            <span>&larr;</span> Back to website
          </Link>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-10">
          <div className="w-full max-w-[420px]">
            {children}
          </div>
        </div>

        <footer className="lg:hidden px-6 py-6 text-center text-[12px] font-mono text-white/40 border-t border-white/[0.06]">
          <p>&copy; {new Date().getFullYear()} Vehiculars.</p>
        </footer>
      </main>
    </div>
  );
}
