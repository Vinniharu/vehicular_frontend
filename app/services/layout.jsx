import Link from "next/link";

/**
 * Shared chrome for every /services/* route (hub, parent, child pages).
 * app/layout.tsx provides no header/footer of its own, and LandingPage.jsx
 * renders its nav/footer inline rather than as reusable components, so this
 * is a lightweight, visually-matching nav/footer purpose-built for the
 * services section rather than a refactor of the landing page.
 */
export default function ServicesLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F7F7F7" }}>
      <header
        className="sticky top-0 z-50"
        style={{ background: "rgba(17, 17, 17,0.95)", backdropFilter: "blur(12px)", borderBottom: "0.5px solid rgba(40, 167, 69,0.15)" }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-2.5 text-white">
            <img src="/logo.png" alt="Vehiculars" className="h-8 w-auto object-contain" />
            <span className="font-display text-[18px] font-medium tracking-tight">Vehiculars</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-[14px] font-medium text-white/80">
            <Link href="/" className="transition-colors duration-150 hover:text-white">Home</Link>
            <Link href="/services" className="transition-colors duration-150 hover:text-white">All services</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="hidden sm:inline-flex items-center rounded-lg text-[14px] font-medium text-white/80 hover:text-white transition-colors duration-150 px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center rounded-xl text-[14px] font-semibold"
              style={{ background: "#28A745", color: "#ffffff", padding: "9px 22px" }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer style={{ background: "#111111", borderTop: "1px solid rgba(40, 167, 69,0.08)" }} className="px-5 md:px-8 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-3">
            <div className="col-span-2 md:col-span-1">
              <span className="font-display text-[18px] font-medium text-white">Vehiculars</span>
              <p className="mt-4 text-[13px] leading-relaxed text-white/45 max-w-xs">
                Everything your car needs — handled end-to-end, delivered nationwide.
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-white/40 mb-4">Services</p>
              <ul className="space-y-2.5 text-[13px] text-white/60">
                <li><Link href="/services" className="hover:text-white transition-colors duration-150">All services</Link></li>
                <li><Link href="/" className="hover:text-white transition-colors duration-150">Back to home</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-white/40 mb-4">Account</p>
              <ul className="space-y-2.5 text-[13px] text-white/60">
                <li><Link href="/auth/login" className="hover:text-white transition-colors duration-150">Sign in</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white transition-colors duration-150">Create account</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-8 md:flex-row" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <p className="text-[12px] text-white/35">&copy; {new Date().getFullYear()} Vehiculars. All rights reserved.</p>
            <p className="text-[12px] text-white/35">Made in Nigeria</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
