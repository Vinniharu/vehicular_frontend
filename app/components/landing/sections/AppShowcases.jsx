"use client";

import { useState, useMemo, memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { ServicePhoneShowcase } from "../ServicePhoneShowcase";
import { SHOWCASES } from "../showcase-configs";
import { SHOWCASE_TABS } from "../landing-data";
import { INK, GREEN } from "../theme";

const ShowcaseSlot = memo(function ShowcaseSlot({ serviceId }) {
  if (!SHOWCASES || !SHOWCASES[serviceId]) return null;
  return (
    <div className="mx-auto w-full max-w-[440px]">
      <ServicePhoneShowcase config={SHOWCASES[serviceId]} />
    </div>
  );
});

export default function AppShowcases() {
  const [activeShowcase, setActiveShowcase] = useState("drivers_licence");

  const showcaseData = useMemo(
    () => ({
      title: SHOWCASES[activeShowcase]?.screens?.[0]?.title || "Instant Processing",
      sub: SHOWCASES[activeShowcase]?.screens?.[0]?.sub || "Seamless updates delivered directly to your device with nationwide coverage.",
      cards: SHOWCASES[activeShowcase]?.cards || [],
      tabLabel: SHOWCASE_TABS.find((t) => t.id === activeShowcase)?.label || "Service",
      serviceSlug: activeShowcase === "rwx_lagos" ? "roadworthiness-express" : activeShowcase.replace(/_/g, "-"),
    }),
    [activeShowcase]
  );

  return (
    <section id="showcases" className="relative px-4 sm:px-6 md:px-10 py-[64px] sm:py-[80px] lg:py-[96px]" style={{ background: INK }}>
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 60% 40% at 50% 30%, ${GREEN}0f, transparent 60%)` }}
      />
      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: GREEN }}>
            App Preview —
          </p>
          <h2 className="mt-4 font-display font-medium tracking-[-0.02em] leading-[1.05] text-white text-[clamp(1.75rem,2.4vw+1rem,2.5rem)]">
            See how every service flows on your phone.
          </h2>
          <p className="mt-5 max-w-md mx-auto text-[16px] leading-[1.7] text-white/55">
            From document renewals to genuine spare parts, track real-time agent updates and verified deliverables right inside your Vehiculars app.
          </p>
        </motion.div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {SHOWCASE_TABS.map((tab) => {
            const active = activeShowcase === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveShowcase(tab.id)}
                className="rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-150"
                style={{
                  color: active ? "#ffffff" : "rgba(255,255,255,0.6)",
                  border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,0.06)",
                  background: active ? GREEN : "rgba(255,255,255,0.04)",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-14 grid items-center gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-5 text-white">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-medium mb-5"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${GREEN}26`, color: GREEN }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Live Walkthrough</span>
            </div>
            <h3 className="font-display text-[28px] sm:text-[32px] font-medium text-white leading-tight tracking-[-0.01em]">
              {showcaseData.title}
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-white/55">{showcaseData.sub}</p>

            <div className="mt-8 space-y-3">
              {showcaseData.cards.map((card, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" style={{ color: GREEN }} />
                  <div>
                    <p className="text-[13px] font-semibold text-white/90">{card.title || card.label || "Verified stage"}</p>
                    {card.sub && <p className="text-[12px] text-white/45 mt-0.5">{card.sub}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <Link
                href={`/services/${showcaseData.serviceSlug}`}
                className="group inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[14px] font-semibold text-white"
                style={{ background: GREEN }}
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
  );
}
