"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { INK, GREEN, PAPER } from "../theme";

export default function FinalCta({ isLoggedIn, dashboardHref, dashboardLabel, redirectTo }) {
  return (
    <section className="relative overflow-hidden px-4 sm:px-6 md:px-10" style={{ background: INK }}>
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 50% 50% at 50% 60%, ${GREEN}1a, transparent 70%)` }}
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-3xl py-[80px] md:py-[100px] text-center"
      >
        <h2 className="font-display font-medium tracking-[-0.03em] leading-[1.0] text-white" style={{ fontSize: "clamp(2.2rem, 4vw + 1rem, 4rem)" }}>
          Your vehicle.
          <br />
          Your time.
          <br />
          <span style={{ color: GREEN }}>Our job.</span>
        </h2>
        <p className="mt-7 max-w-lg mx-auto text-[16px] leading-[1.7] text-white/45">
          Join thousands of Nigerian car owners who've handed the hassle to us. Get started in under 2 minutes.
        </p>
        <div className="mt-10 flex justify-center">
          <Link
            href={isLoggedIn ? dashboardHref : `/auth/signup?redirect=${encodeURIComponent(redirectTo)}`}
            className="group inline-flex items-center gap-2 rounded-xl text-[15px] font-semibold"
            style={{ background: GREEN, color: PAPER, padding: "16px 36px" }}
          >
            {isLoggedIn ? dashboardLabel : "Get started — it's free"}
            <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {[
            ["10,000+", "Jobs completed"],
            ["Nationwide", "Every state, every LGA"],
            ["48 hrs", "Average turnaround"],
          ].map(([num, label]) => (
            <div key={num} className="text-center">
              <p className="font-display text-2xl md:text-3xl font-medium text-white">{num}</p>
              <p className="mt-1.5 text-[11px] uppercase tracking-widest text-white/35">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
