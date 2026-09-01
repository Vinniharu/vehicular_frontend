"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { LIFECYCLE_STAGES } from "../landing-data";
import { INK, GREEN, GOLD, PAPER, INK_SOFT } from "../theme";

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function LifecycleCard({ stage }) {
  const Icon = stage.icon;
  return (
    <motion.div
      variants={cardVariants}
      className="group relative flex flex-col rounded-2xl bg-white p-6 sm:p-7 transition-transform duration-200 hover:-translate-y-1"
      style={{ border: `1px solid ${INK}14` }}
    >
      <div className="flex items-start justify-between">
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-200"
          style={{ background: `${GREEN}1a`, color: GREEN }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color: GOLD }}>
          {stage.stage}
        </span>
      </div>
      <h3 className="mt-5 font-display text-[22px] font-medium leading-tight" style={{ color: INK }}>
        {stage.title}
      </h3>
      <p className="mt-2 text-[15px] leading-relaxed" style={{ color: INK_SOFT }}>
        {stage.blurb}
      </p>
      {stage.items?.length > 0 && (
        <ul className="mt-5 space-y-1 border-t pt-4" style={{ borderColor: `${INK}14` }}>
          {stage.items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group/link flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-[14px] font-medium transition-colors duration-150 hover:bg-[#28A745]/5"
                style={{ color: `${INK}cc` }}
              >
                <span>{item.label}</span>
                <ChevronRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5" style={{ color: `${INK}4d` }} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

export default function Lifecycle() {
  return (
    <section id="lifecycle" className="relative px-4 sm:px-6 md:px-10 py-[64px] sm:py-[80px] lg:py-[96px]" style={{ background: PAPER }}>
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: GREEN }}>
            Lifecycle —
          </p>
          <h2 className="mt-4 font-display font-medium tracking-[-0.02em] leading-[1.05] text-[clamp(1.75rem,2.4vw+1rem,2.5rem)]" style={{ color: INK }}>
            With your car from purchase to resale.
          </h2>
          <p className="mt-5 text-[16px] leading-[1.7]" style={{ color: INK_SOFT }}>
            Vehiculars isn't a renewal service. It's the home base for every car you own — every stage, every job, one app.
          </p>
        </motion.div>

        <motion.div
          variants={gridVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {LIFECYCLE_STAGES.map((stage) => (
            <LifecycleCard key={stage.title} stage={stage} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
