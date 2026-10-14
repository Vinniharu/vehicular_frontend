"use client";

import Nav from "@/app/components/landing/sections/Nav";
import Footer from "@/app/components/landing/sections/Footer";
import { useMarketingChrome } from "@/app/components/landing/useMarketingChrome";

/**
 * Shared chrome for every /services/* route (hub, parent, child pages),
 * reusing the same Nav/Footer as the landing page instead of a separate,
 * drifting implementation. Nav's frosted state follows a real scroll
 * listener from useMarketingChrome — the pages under it open on a light
 * hero, so the transparent top-of-page state reads correctly too.
 */
export default function ServicesLayout({ children }) {
  const { scrolled, authProps } = useMarketingChrome();

  return (
    <div className="mk-root min-h-dvh flex flex-col bg-mk-bg">
      <Nav logoUrl="/logo.png" scrolled={scrolled} {...authProps} />
      <main className="flex-1">{children}</main>
      <Footer redirectTo={authProps.redirectTo} />
    </div>
  );
}
