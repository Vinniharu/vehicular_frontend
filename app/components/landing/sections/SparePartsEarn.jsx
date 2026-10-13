"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, BadgeCheck, Coins, Download, Package, ShieldCheck, Store, Wrench } from "lucide-react";
import { INK, GREEN, GOLD, PAPER, INK_SOFT } from "../theme";

const SPARE_PARTS_URL = "https://spare.vehiculars.com";
const SPARE_PARTS_DOWNLOAD = "https://spare.vehiculars.com/download";

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const SPARE_POINTS = [
  { icon: BadgeCheck, text: "Quotes from verified Ladipo dealers, with live photos of the actual part" },
  { icon: Store, text: "Collect safely at the Vehiculars kiosk with your handover code" },
  { icon: ShieldCheck, text: "Send a quote to your mechanic on WhatsApp before you pay" },
];

const EARN_POINTS = [
  { icon: Wrench, text: "Recommend a mechanic or auto expert you already trust" },
  { icon: Coins, text: "Earn wallet credit as they get work through Vehiculars" },
  { icon: Package, text: "Use it for your particulars and driver's licence renewal" },
];

function PointList({ points, dark }) {
  return (
    <ul className="mt-6 space-y-3">
      {points.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-start gap-3">
          <span
            className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ background: dark ? `${GREEN}26` : `${GREEN}1a`, color: dark ? "#7BE29A" : GREEN }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-[15px] leading-relaxed" style={{ color: dark ? "rgba(255,255,255,0.78)" : INK_SOFT }}>
            {text}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function SparePartsEarn() {
  return (
    <section id="more" className="relative overflow-hidden px-4 sm:px-6 md:px-10 py-[64px] sm:py-[80px] lg:py-[96px]" style={{ background: PAPER }}>
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: GREEN }}>
            More from Vehiculars —
          </p>
          <h2 className="mt-4 font-display font-medium tracking-[-0.02em] leading-[1.05] text-[clamp(1.75rem,2.4vw+1rem,2.5rem)]" style={{ color: INK }}>
            Parts for your car. Credit for your papers.
          </h2>
          <p className="mt-5 text-[16px] leading-[1.7]" style={{ color: INK_SOFT }}>
            Two new ways Vehiculars keeps you on the road, with one wallet across both.
          </p>
        </motion.div>

        <motion.div
          variants={gridVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-5 lg:grid-cols-2"
        >
          {/* Spare Parts */}
          <motion.article
            variants={cardVariants}
            className="relative flex flex-col overflow-hidden rounded-3xl p-7 sm:p-9"
            style={{ background: INK, border: `1px solid ${GREEN}26` }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
              style={{ background: `${GREEN}33` }}
            />
            <div className="relative flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color: "#7BE29A" }}>
                Vehiculars Spare Parts
              </span>
              <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide" style={{ background: `${GREEN}26`, color: "#7BE29A" }}>
                New
              </span>
            </div>
            <h3 className="relative mt-5 font-display text-[clamp(1.6rem,1.6vw+1rem,2.1rem)] font-medium leading-[1.1] text-white">
              Genuine parts from verified Ladipo dealers, collected safely at our kiosk.
            </h3>
            <p className="relative mt-4 text-[15px] leading-relaxed text-white/70">
              Post the part you need, compare quotes from vetted dealers and pick it up with a code only you have.
            </p>
            <div className="relative">
              <PointList points={SPARE_POINTS} dark />
            </div>
            <div className="relative mt-8 flex flex-wrap gap-3 pt-2">
              <a
                href={SPARE_PARTS_URL}
                className="group inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold"
                style={{ background: GREEN, color: PAPER }}
              >
                Visit Spare Parts
                <ArrowUpRight className="h-4 w-4 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <a
                href={SPARE_PARTS_DOWNLOAD}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold text-white/85 transition-colors duration-150 hover:text-white"
                style={{ border: "1px solid rgba(255,255,255,0.18)" }}
              >
                <Download className="h-4 w-4" />
                Get the app
              </a>
            </div>
          </motion.article>

          {/* Earn */}
          <motion.article
            variants={cardVariants}
            className="relative flex flex-col overflow-hidden rounded-3xl bg-white p-7 sm:p-9"
            style={{ border: `1px solid ${INK}14`, boxShadow: "0 20px 50px -30px rgba(11,18,16,0.35)" }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full blur-3xl"
              style={{ background: `${GOLD}26` }}
            />
            <div className="relative flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color: GOLD }}>
                Vehiculars Earn
              </span>
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: `${GOLD}1f`, color: GOLD }}
              >
                <Coins className="h-4.5 w-4.5" />
              </span>
            </div>
            <h3 className="relative mt-5 font-display text-[clamp(1.6rem,1.6vw+1rem,2.1rem)] font-medium leading-[1.1]" style={{ color: INK }}>
              Your trusted mechanic can renew your papers for you.
            </h3>
            <p className="relative mt-4 text-[15px] leading-relaxed" style={{ color: INK_SOFT }}>
              Recommend a genuine auto expert. Every job they complete earns you credit toward your renewals.
            </p>
            <div className="relative">
              <PointList points={EARN_POINTS} />
            </div>
            <div className="relative mt-8 flex flex-wrap gap-3 pt-2">
              <Link
                href="/earn"
                className="group inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold"
                style={{ background: INK, color: PAPER }}
              >
                How Earn works
                <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
              <a
                href={SPARE_PARTS_DOWNLOAD}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold transition-colors duration-150"
                style={{ border: `1px solid ${INK}1f`, color: INK }}
              >
                Recommend an Expert
              </a>
            </div>
          </motion.article>
        </motion.div>

        <p className="mt-8 text-center text-[13px]" style={{ color: INK_SOFT }}>
          Link your Spare Parts and Vehiculars accounts in Settings to use one shared wallet on both.
        </p>
      </div>
    </section>
  );
}
