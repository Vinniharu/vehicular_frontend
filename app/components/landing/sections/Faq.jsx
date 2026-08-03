"use client";

import { motion } from "framer-motion";
import { FAQ_ITEMS } from "../landing-data";
import { INK, GREEN, GOLD, PAPER, INK_SOFT } from "../theme";

function FaqItem({ q, a }) {
  return (
    <details className="vh-faq group rounded-2xl bg-white" style={{ border: `1px solid ${INK}0f` }}>
      <summary className="flex items-center justify-between gap-6 px-6 py-5 cursor-pointer min-h-[44px]">
        <span className="text-[16px] md:text-[17px] font-medium leading-snug" style={{ color: INK }}>{q}</span>
        <span
          className="vh-faq-icon flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-200"
          style={{ background: `${GOLD}1f`, color: GOLD }}
          aria-hidden
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M7 1.5 V12.5 M1.5 7 H12.5" />
          </svg>
        </span>
      </summary>
      <p className="px-6 pb-5 max-w-2xl text-[15px] leading-[1.7]" style={{ color: `${INK}b3` }}>{a}</p>
    </details>
  );
}

export default function Faq() {
  return (
    <section id="faq" className="relative px-4 sm:px-6 md:px-10 py-[64px] sm:py-[80px] lg:py-[96px]" style={{ background: PAPER }}>
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: GREEN }}>
            FAQ —
          </p>
          <h2 className="mt-4 font-display font-medium tracking-[-0.02em] leading-[1.05] text-[clamp(1.75rem,2.4vw+1rem,2.5rem)]" style={{ color: INK }}>
            Questions, answered.
          </h2>
          <p className="mt-5 text-[16px] leading-[1.7]" style={{ color: INK_SOFT }}>
            Everything you need to know before you get started. Still stuck? Reach out and a human will reply.
          </p>
        </motion.div>

        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
