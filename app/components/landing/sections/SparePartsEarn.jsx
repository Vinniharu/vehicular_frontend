"use client";

import { ArrowRight, ArrowUpRight, BadgeCheck, Coins, Download, Package, ShieldCheck, Store, Wallet, Wrench } from "lucide-react";
import { Section, SectionHeading, MkButton, MkCard } from "@/app/components/marketing/ui";
import { Reveal, Stagger, StaggerItem } from "@/app/components/marketing/motion";

const SPARE_PARTS_URL = "https://spare.vehiculars.com";
const SPARE_PARTS_DOWNLOAD = "https://spare.vehiculars.com/download";

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

function PointList({ points, accent = "brand" }) {
  const chip = accent === "gold" ? "bg-mk-gold/15 text-mk-gold" : "bg-cx-brand/15 text-[#7BE29A]";
  return (
    <ul className="mt-7 space-y-3.5">
      {points.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-start gap-3">
          <span className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${chip}`}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-[15px] leading-relaxed text-white/75">{text}</span>
        </li>
      ))}
    </ul>
  );
}

export default function SparePartsEarn() {
  return (
    <Section id="more" tone="dark" className="overflow-x-clip">
      <div aria-hidden className="mk-grid-bg-dark pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] max-w-full -translate-x-1/2 opacity-70"
        style={{ background: "radial-gradient(closest-side, rgba(40,167,69,0.22), transparent)" }}
      />

      <div className="relative">
        <SectionHeading
          align="center"
          tone="dark"
          eyebrow="More from Vehiculars"
          title="Parts for your car."
          accent="Credit for your papers."
          description="Two new ways Vehiculars keeps you on the road, with one wallet across both."
        />

        <Stagger gap={0.1} className="mt-12 sm:mt-14 grid gap-5 lg:grid-cols-2">
          {/* Spare Parts */}
          <StaggerItem className="h-full">
            <MkCard as="article" tone="dark" className="mk-lift relative flex h-full flex-col overflow-hidden p-7 sm:p-9 hover:border-cx-brand/40">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full"
                style={{ background: "radial-gradient(closest-side, rgba(40,167,69,0.28), transparent)" }}
              />
              <div className="relative flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#7BE29A]">Vehiculars Spare Parts</span>
                <span className="rounded-full border border-cx-brand/30 bg-cx-brand/15 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#7BE29A]">
                  New
                </span>
              </div>
              <h3 className="relative mt-5 text-[clamp(1.5rem,1.4vw+1rem,2rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-white text-balance">
                Genuine parts from verified Ladipo dealers, collected safely at our kiosk.
              </h3>
              <p className="relative mt-4 text-[15px] leading-relaxed text-white/60">
                Post the part you need, compare quotes from vetted dealers and pick it up with a code only you have.
              </p>
              <div className="relative">
                <PointList points={SPARE_POINTS} />
              </div>
              <div className="relative mt-auto flex flex-col gap-3 pt-9 sm:flex-row sm:flex-wrap">
                <MkButton href={SPARE_PARTS_URL}>
                  Visit Spare Parts
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </MkButton>
                <MkButton href={SPARE_PARTS_DOWNLOAD} variant="onDark">
                  <Download className="h-4 w-4" />
                  Get the app
                </MkButton>
              </div>
            </MkCard>
          </StaggerItem>

          {/* Earn */}
          <StaggerItem className="h-full">
            <MkCard as="article" tone="dark" className="mk-lift relative flex h-full flex-col overflow-hidden p-7 sm:p-9 hover:border-mk-gold/40">
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full"
                style={{ background: "radial-gradient(closest-side, rgba(201,162,39,0.22), transparent)" }}
              />
              <div className="relative flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-mk-gold">Vehiculars Earn</span>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-mk-gold/25 bg-mk-gold/10 text-mk-gold">
                  <Coins className="h-[18px] w-[18px]" />
                </span>
              </div>
              <h3 className="relative mt-5 text-[clamp(1.5rem,1.4vw+1rem,2rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-white text-balance">
                Your trusted mechanic can renew your papers for you.
              </h3>
              <p className="relative mt-4 text-[15px] leading-relaxed text-white/60">
                Recommend a genuine auto expert. Every job they complete earns you credit toward your renewals.
              </p>
              <div className="relative">
                <PointList points={EARN_POINTS} accent="gold" />
              </div>
              <div className="relative mt-auto flex flex-col gap-3 pt-9 sm:flex-row sm:flex-wrap">
                <MkButton href="/earn" variant="secondary">
                  How Earn works
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </MkButton>
                <MkButton href={SPARE_PARTS_DOWNLOAD} variant="onDark">
                  Recommend an Expert
                </MkButton>
              </div>
            </MkCard>
          </StaggerItem>
        </Stagger>

        <Reveal delay={0.1} className="mt-10 flex justify-center">
          <p className="inline-flex items-start sm:items-center gap-2.5 rounded-mk sm:rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-left sm:text-center text-[13px] leading-relaxed text-white/60">
            <Wallet className="h-4 w-4 shrink-0 text-[#7BE29A]" />
            Link your Spare Parts and Vehiculars accounts in Settings to use one shared wallet on both.
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
