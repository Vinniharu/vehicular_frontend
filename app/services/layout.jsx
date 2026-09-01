"use client";

import Nav from "@/app/components/landing/sections/Nav";
import Footer from "@/app/components/landing/sections/Footer";
import { useMarketingChrome } from "@/app/components/landing/useMarketingChrome";

/**
 * Shared chrome for every /services/* route (hub, parent, child pages),
 * reusing the same Nav/Footer as the landing page instead of a separate,
 * drifting implementation. scrolled is hardcoded true (not wired to a real
 * scroll listener) — these pages have a light hero, not Nav's dark-hero-blend
 * translucent state, so the solid-bar look is correct here from the first
 * frame.
 */
export default function ServicesLayout({ children }) {
  const { authProps } = useMarketingChrome();

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "#F7F7F7" }}>
      <Nav logoUrl="/logo.png" scrolled={true} {...authProps} />
      <main className="flex-1">{children}</main>
      <Footer redirectTo={authProps.redirectTo} />
    </div>
  );
}
