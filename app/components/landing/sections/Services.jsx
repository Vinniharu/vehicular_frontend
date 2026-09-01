"use client";

import { motion } from "framer-motion";
import { SERVICE_ITEMS } from "../landing-data";
import { INK, GREEN, PAPER, INK_SOFT } from "../theme";
import ServiceCard from "@/app/components/marketing/ServiceCard";

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

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
          {SERVICE_ITEMS.map((item, i) => {
            const isFeatured = item.featured && i < 2;
            return (
              <motion.div key={item.slug} variants={cardVariants} className={isFeatured ? "col-span-2" : ""}>
                <ServiceCard
                  href={`/services/${item.slug}`}
                  title={item.label}
                  description={item.benefit}
                  icon={item.icon}
                  variant="landing"
                  featured={isFeatured}
                  headingTag="h3"
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
