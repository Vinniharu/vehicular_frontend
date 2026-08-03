"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import StampSeal from "../StampSeal";
import { HeroPhoneShowcase } from "../HeroPhoneShowcase";
import { INK, GREEN, GOLD, PAPER } from "../theme";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const stampIn = {
  hidden: { opacity: 0, scale: 2.1, rotate: -18 },
  show: {
    opacity: 1,
    scale: 1,
    rotate: -7,
    transition: { type: "spring", stiffness: 220, damping: 14, mass: 0.9, delay: 0.35 },
  },
};

export default function Hero({ isLoggedIn, dashboardHref, dashboardLabel, redirectTo }) {
  const prefersReducedMotion = useReducedMotion();
  const variants = prefersReducedMotion
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : containerVariants;
  const itemVariants = prefersReducedMotion ? { hidden: { opacity: 1 }, show: { opacity: 1 } } : fadeUp;
  const seal = prefersReducedMotion
    ? { hidden: { opacity: 1, scale: 1, rotate: -7 }, show: { opacity: 1, scale: 1, rotate: -7 } }
    : stampIn;

  return (
    <section className="relative overflow-hidden min-h-screen" style={{ background: INK }}>
      {/* Ambient glows */}
      <div
        aria-hidden
        className="absolute -right-24 -top-48 h-[600px] w-[600px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${GREEN}26, transparent 65%)` }}
      />
      <div
        aria-hidden
        className="absolute -left-20 bottom-[-100px] h-[400px] w-[400px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${GOLD}14, transparent 65%)` }}
      />
      {/* Subtle document-grid pattern */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${GREEN}0a 1px, transparent 1px), linear-gradient(90deg, ${GREEN}0a 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, #000 20%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, #000 20%, transparent 80%)",
        }}
      />

      <motion.div
        variants={variants}
        initial="hidden"
        animate="show"
        className="relative mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8 pt-24 pb-16 lg:pt-32 lg:pb-28"
      >
        <div className="grid items-center gap-10 md:gap-12 lg:gap-8 md:grid-cols-12">
          <div className="md:col-span-7 relative z-10 flex flex-col items-center text-center md:items-start md:text-left">
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6 lg:mb-8">
              <motion.div variants={seal}>
                <StampSeal size={64} label="VERIFIED" sublabel="PROCESS" />
              </motion.div>
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12px] font-medium"
                style={{ background: `${GREEN}14`, border: `1px solid ${GREEN}26`, color: GREEN }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: GREEN }} />
                <span className="uppercase tracking-[0.14em]">Government-recognized, done digitally</span>
              </div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="font-display font-medium tracking-[-0.03em] text-white"
              style={{ fontSize: "clamp(2.4rem, 5.5vw + 1rem, 4.5rem)", lineHeight: 1.02 }}
            >
              Everything your
              <br />
              car needs.
              <br />
              <span style={{ color: GREEN }}>In one place.</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="mt-6 lg:mt-7 max-w-lg text-[16px] sm:text-[18px] leading-relaxed text-white/55">
              Renewals, inspections, genuine parts and more — managed in one place, across Nigeria. Relief from a countdown you didn't know you were losing.
            </motion.p>

            <motion.div variants={itemVariants} className="mt-8 lg:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center md:justify-start gap-3.5 sm:gap-4 w-full">
              <Link
                href={isLoggedIn ? dashboardHref : `/auth/signup?redirect=${encodeURIComponent(redirectTo)}`}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl px-8 text-[15px] font-semibold w-full sm:w-auto"
                style={{ background: GREEN, color: PAPER }}
              >
                {isLoggedIn ? dashboardLabel : "Get started"}
                <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-medium text-white/60 transition-colors duration-150 hover:text-white w-full sm:w-auto"
                style={{ border: "1px solid rgba(255,255,255,0.10)" }}
              >
                <Play className="h-3.5 w-3.5" />
                See how it works
              </a>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-12 lg:mt-14 grid grid-cols-3 items-start justify-items-center md:justify-items-start gap-4 sm:gap-8 lg:gap-12">
              {[
                ["40,000+", "Drivers served"],
                ["Nationwide", "Every state"],
                ["48 hrs", "Avg. turnaround"],
              ].map(([num, label]) => (
                <div key={num} className="text-center md:text-left">
                  <p className="font-display text-[22px] sm:text-[26px] font-medium text-white leading-none">{num}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-widest text-white/40">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div variants={itemVariants} className="md:col-span-5 relative z-10 w-full flex justify-center items-center">
            <div className="w-full max-w-[380px] sm:max-w-[420px] md:max-w-[480px] lg:max-w-none flex justify-center">
              <HeroPhoneShowcase />
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, transparent, ${PAPER})` }}
      />
    </section>
  );
}
