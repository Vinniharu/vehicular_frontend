"use client";

import { useState, useMemo, memo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { ServicePhoneShowcase } from "../ServicePhoneShowcase";
import { SHOWCASES } from "../showcase-configs";
import { SHOWCASE_TABS } from "../landing-data";
import { Section, SectionHeading, MkButton, Pill } from "@/app/components/marketing/ui";
import { EASE, Reveal } from "@/app/components/marketing/motion";

const ShowcaseSlot = memo(function ShowcaseSlot({ serviceId }) {
  if (!SHOWCASES || !SHOWCASES[serviceId]) return null;
  return (
    <div className="mx-auto w-full max-w-[440px]">
      <ServicePhoneShowcase config={SHOWCASES[serviceId]} />
    </div>
  );
});

export default function AppShowcases() {
  const reduce = useReducedMotion();
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

  const swap = reduce
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 1 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
        transition: { duration: 0.35, ease: EASE },
      };

  return (
    <Section id="showcases" tone="light" className="overflow-x-clip">
      <div aria-hidden className="mk-glow pointer-events-none absolute left-1/2 top-24 h-[360px] w-[680px] max-w-full -translate-x-1/2 opacity-60" />

      <SectionHeading
        align="center"
        eyebrow="App preview"
        title="See how every service flows"
        accent="on your phone."
        description="From document renewals to full vehicle inspections, track real-time agent updates and verified deliverables right inside your Vehiculars app."
      />

      {/* Segmented control; scrolls horizontally on its own on small screens */}
      <Reveal delay={0.05} className="relative mt-10 -mx-5 sm:mx-0">
        <div className="overflow-x-auto px-5 pb-2 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div
            role="tablist"
            aria-label="Service previews"
            className="mx-auto flex w-max gap-1 rounded-full border border-mk-line bg-mk-surface p-1 shadow-mk-sm"
          >
            {SHOWCASE_TABS.map((tab) => {
              const active = activeShowcase === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveShowcase(tab.id)}
                  className={`mk-focus relative min-h-[44px] whitespace-nowrap rounded-full px-4 text-[13.5px] font-medium transition-colors duration-300 ${
                    active ? "text-white" : "text-mk-muted hover:text-mk-ink"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="showcase-tab-pill"
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-cx-brand shadow-mk-brand"
                      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Reveal>

      <div className="relative mt-12 sm:mt-14 grid items-center gap-12 md:grid-cols-12 md:gap-14">
        <div className="md:col-span-5" role="tabpanel" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={activeShowcase} {...swap}>
              <Pill>
                <Sparkles className="h-3.5 w-3.5" />
                Live walkthrough
              </Pill>
              <h3 className="mt-5 text-[26px] sm:text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] text-mk-ink text-balance">
                {showcaseData.title}
              </h3>
              <p className="mt-3 text-[15.5px] leading-relaxed text-mk-muted">{showcaseData.sub}</p>

              <ul className="mt-7 space-y-2.5">
                {showcaseData.cards.map((card, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 rounded-mk border border-mk-line bg-mk-surface p-3.5 shadow-mk-sm"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cx-brand" />
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-mk-ink">{card.title || card.label || "Verified stage"}</p>
                      {card.sub && <p className="mt-0.5 text-[13px] text-mk-muted">{card.sub}</p>}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <MkButton href={`/services/${showcaseData.serviceSlug}`} className="max-sm:w-full">
                  Start {showcaseData.tabLabel}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </MkButton>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="md:col-span-7 flex justify-center">
          <div className="w-full max-w-[464px] rounded-[32px] border border-mk-line bg-mk-surface p-2 shadow-mk-lg sm:p-3">
            <ShowcaseSlot serviceId={activeShowcase} />
          </div>
        </div>
      </div>
    </Section>
  );
}
