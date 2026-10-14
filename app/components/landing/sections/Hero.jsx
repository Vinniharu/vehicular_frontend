"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import StampSeal from "../StampSeal";
import { HeroPhoneShowcase } from "../HeroPhoneShowcase";
import { TRUST_STATS } from "../landing-data";
import { Container, MkButton } from "@/app/components/marketing/ui";
import { EASE, Stagger, StaggerItem, CountUp } from "@/app/components/marketing/motion";

export default function Hero({ isLoggedIn, dashboardHref, dashboardLabel, redirectTo }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // Gentle parallax: the phone drifts slower than the copy as you scroll away.
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 80]);
  const glowY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 140]);

  const primaryHref = isLoggedIn ? dashboardHref : `/auth/signup?redirect=${encodeURIComponent(redirectTo)}`;

  return (
    <section ref={ref} className="relative overflow-x-clip bg-mk-surface">
      <div aria-hidden className="mk-grid-bg pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-mk-bg"
      />

      <Container className="relative pt-28 pb-16 sm:pt-32 lg:pt-36 lg:pb-24">
        <div className="grid items-center gap-12 lg:gap-10 lg:grid-cols-12">
          <Stagger
            animateOnMount
            gap={0.08}
            delay={0.05}
            className="lg:col-span-7 relative z-10 flex flex-col items-center text-center lg:items-start lg:text-left"
          >
            <StaggerItem className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <StampSeal size={52} label="VERIFIED" sublabel="PROCESS" className="hidden sm:block shrink-0" />
              <span className="inline-flex items-center gap-2 rounded-full border border-mk-line bg-mk-surface/80 px-3.5 py-1.5 text-[12.5px] font-medium text-mk-ink-2 shadow-mk-sm backdrop-blur">
                <span className="mk-pulse-dot h-1.5 w-1.5 rounded-full bg-cx-brand" aria-hidden />
                Government-recognized, done digitally
              </span>
            </StaggerItem>

            <StaggerItem
              as="h1"
              className="mt-6 font-semibold text-mk-ink text-balance"
              style={{ fontSize: "clamp(2.5rem, 5.2vw + 1rem, 5rem)", lineHeight: 1.02, letterSpacing: "-0.035em" }}
            >
              Everything your car needs.{" "}
              <span className="font-display font-normal italic text-cx-brand" style={{ letterSpacing: "-0.02em" }}>
                In one place.
              </span>
            </StaggerItem>

            <StaggerItem as="p" className="mt-6 max-w-xl text-[16.5px] sm:text-[18px] leading-relaxed text-mk-muted text-pretty">
              Renewals, inspections, licences and permits — managed in one place, across Nigeria. Relief from a countdown you didn't know you were losing.
            </StaggerItem>

            <StaggerItem className="mt-9 flex w-full flex-col sm:w-auto sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
              <MkButton href={primaryHref} size="lg" magnetic>
                {isLoggedIn ? dashboardLabel : "Get started"}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </MkButton>
              <MkButton href="#how" variant="secondary" size="lg">
                <Play className="h-3.5 w-3.5 fill-current" />
                See how it works
              </MkButton>
            </StaggerItem>

            <StaggerItem className="mt-12 w-full max-w-xl">
              <div className="grid grid-cols-3 divide-x divide-mk-line rounded-mk-lg border border-mk-line bg-mk-surface/70 shadow-mk-sm backdrop-blur">
                {TRUST_STATS.map(([num, label]) => (
                  <div key={num} className="px-2 py-4 sm:px-5 text-center lg:text-left">
                    <p className="font-mono text-[14px] min-[400px]:text-[16px] sm:text-[22px] font-semibold tracking-[-0.02em] text-mk-ink leading-none">
                      <CountUp value={num} />
                    </p>
                    <p className="mt-2 text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-mk-muted">{label}</p>
                  </div>
                ))}
              </div>
            </StaggerItem>
          </Stagger>

          <div className="lg:col-span-5 relative w-full flex justify-center">
            <motion.div
              aria-hidden
              style={{ y: glowY }}
              className="mk-glow pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] sm:h-[560px] sm:w-[560px] -translate-x-1/2 -translate-y-1/2"
            />
            <motion.div style={{ y: phoneY }} className="relative z-10 w-full max-w-[380px] sm:max-w-[420px] md:max-w-[460px] lg:max-w-none">
              <motion.div
                initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.25 }}
                className="flex justify-center"
              >
                <HeroPhoneShowcase />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
