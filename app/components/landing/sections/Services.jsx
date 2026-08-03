"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SERVICE_ITEMS } from "../landing-data";
import { INK, GREEN, GOLD, PAPER, INK_SOFT } from "../theme";

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function ServiceCard({ slug, label, benefit, icon: Icon, featured, index }) {
  const isFeatured = featured && index < 2;
  return (
    <motion.div variants={cardVariants} className={isFeatured ? "col-span-2" : ""}>
      <Link
        href={`/services/${slug}`}
        className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl transition-transform duration-200 hover:-translate-y-1 ${
          isFeatured ? "p-6 sm:p-8 min-h-[200px]" : "p-5 sm:p-6"
        }`}
        style={{
          background: isFeatured ? INK : "#ffffff",
          border: isFeatured ? `1px solid ${GOLD}33` : `1px solid ${INK}14`,
        }}
      >
        {isFeatured && (
          <div
            aria-hidden
            className="absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-25"
            style={{ background: `radial-gradient(circle, ${GOLD}, transparent 70%)` }}
          />
        )}
        <div>
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: isFeatured ? `${GOLD}26` : `${GREEN}1a`, color: isFeatured ? GOLD : GREEN }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <h3 className="mt-4 font-display text-[18px] font-medium leading-tight" style={{ color: isFeatured ? "#ffffff" : INK }}>
            {label}
          </h3>
          <p className="mt-2 text-[14px] leading-relaxed" style={{ color: isFeatured ? "rgba(255,255,255,0.55)" : INK_SOFT }}>
            {benefit}
          </p>
        </div>
        <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: isFeatured ? GOLD : GREEN }}>
          View details
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1" />
        </span>
      </Link>
    </motion.div>
  );
}

export default function Services() {
  return (
    <section id="services" className="relative px-4 sm:px-6 md:px-10 py-[64px] sm:py-[80px] lg:py-[96px]" style={{ background: PAPER }}>
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14"
        >
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: GREEN }}>
              Services —
            </p>
            <h2 className="mt-4 font-display font-medium tracking-[-0.02em] leading-[1.05] text-[clamp(1.75rem,2.4vw+1rem,2.5rem)]" style={{ color: INK }}>
              Everything, in one app.
            </h2>
            <p className="mt-4 max-w-md text-[16px] leading-[1.7]" style={{ color: INK_SOFT }}>
              Pick a service. We handle the queues, paperwork, and follow-ups — end-to-end.
            </p>
          </div>
        </motion.div>

        <motion.div
          variants={gridVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
        >
          {SERVICE_ITEMS.map((item, i) => (
            <ServiceCard key={item.slug} {...item} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
