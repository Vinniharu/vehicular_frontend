"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, CalendarCheck, Coins, Plus, ShieldAlert, Star, UserCheck, Wrench } from "lucide-react";

import Nav from "@/app/components/landing/sections/Nav";
import Footer from "@/app/components/landing/sections/Footer";
import { GREEN, INK, INK_CARD, PAPER, GOLD, INK_SOFT } from "@/app/components/landing/theme";

// "Recommend an Expert" lives in the Vehiculars Spare Parts app.
const RECOMMEND_HREF = "https://spare.vehiculars.com/download";

const STEPS = [
  { n: "1", title: "Recommend", body: "Tell us about an auto expert you've used and trust. It takes 60 seconds.", icon: Wrench },
  { n: "2", title: "We verify", body: "Our team checks their identity and skills before they join Vehiculars.", icon: BadgeCheck },
  { n: "3", title: "You earn", body: "You get a bonus when they're verified, plus credit every time they complete a job.", icon: Coins },
  {
    n: "4",
    title: "Renew for less, or free",
    body: "Your credit pays for your vehicle particulars and driver's licence renewal when they're due.",
    icon: CalendarCheck,
  },
];

const EXPERTS = [
  "Mechanic",
  "Auto Electrician",
  "AC Technician",
  "Panel Beater",
  "Vulcanizer",
  "Gearbox Specialist",
  "Diagnostics (Car Scanning)",
  "Auto Painter",
];

const TRUST_RULES = [
  { text: "Every customer rates every job.", icon: Star },
  { text: "If your expert gets poor ratings, they're suspended and your earnings stop.", icon: ShieldAlert },
  { text: "You can only recommend someone you've actually used.", icon: UserCheck },
];

const FAQS = [
  {
    q: "How much can I earn?",
    a: "You get a bonus when your expert is verified, plus a commission on every job they complete. The more jobs they do, the more you earn.",
  },
  {
    q: "Can I withdraw my earnings as cash?",
    a: "No. Earnings are credited to your Vehiculars wallet and can be used for vehicle particulars renewal, driver's licence renewal, and other Vehiculars services.",
  },
  { q: "Does my credit expire?", a: "No. It stays in your wallet until you use it." },
  {
    q: "Can I recommend more than one expert?",
    a: "Yes. Recommend as many genuine experts as you know. Each one earns for you separately.",
  },
  {
    q: "What if someone else already recommended the same expert?",
    a: "The first person to recommend a verified expert gets the earnings.",
  },
  { q: "Does my expert pay anything?", a: "No. Your commission comes from Vehiculars, not from your expert's pay." },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5 },
};
const gridVariants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function RecommendButton({ dark = false, className = "" }) {
  return (
    <a
      href={RECOMMEND_HREF}
      className={`group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold transition-transform duration-150 hover:-translate-y-0.5 ${className}`}
      style={dark ? { background: GREEN, color: PAPER } : { background: INK, color: PAPER }}
    >
      Recommend an Expert
      <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
    </a>
  );
}

function Eyebrow({ children, color = GREEN }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color }}>
      {children}
    </p>
  );
}

/** Decorative renewal-progress card for the hero (illustrative, not live data). */
function ProgressCard() {
  return (
    <div
      className="relative w-full max-w-sm rounded-3xl p-6"
      style={{ background: INK_CARD, border: `1px solid ${GREEN}2e`, boxShadow: "0 30px 80px -40px rgba(0,0,0,0.7)" }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">Plate renewal</span>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${GOLD}26`, color: GOLD }}>
          Due in 5 months
        </span>
      </div>
      <p className="mt-3 font-display text-[19px] font-medium text-white">Toyota Camry</p>
      <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: "0%" }}
          whileInView={{ width: "64%" }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${GREEN}, #7BE29A)` }}
        />
      </div>
      <p className="mt-3 text-[13px] text-white/70">
        <span className="font-semibold text-white">64% covered</span> by your earnings
      </p>
      <div className="mt-5 space-y-2.5 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        {[
          ["Your mechanic finished a job", "+ credit"],
          ["Expert verified", "+ bonus"],
        ].map(([label, amt]) => (
          <div key={label} className="flex items-center justify-between text-[13px]">
            <span className="text-white/70">{label}</span>
            <span className="font-semibold" style={{ color: "#7BE29A" }}>
              {amt}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EarnPage() {
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    try {
      setIsLoggedIn(!!localStorage.getItem("vh_access_token"));
    } catch {
      /* ignore */
    }
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ background: PAPER }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `html{scroll-behavior:smooth}body{background:${INK}}
details.vh-earn-faq[open] .vh-earn-faq-icon{transform:rotate(45deg)}
details.vh-earn-faq summary::-webkit-details-marker{display:none}
details.vh-earn-faq summary{list-style:none}`,
        }}
      />
      <Nav
        logoUrl="/logo.png"
        scrolled={scrolled}
        isLoggedIn={isLoggedIn}
        dashboardHref="/dashboard"
        dashboardLabel="Go to Dashboard"
        redirectTo="/earn"
      />

      {/* HERO */}
      <section className="relative -mt-16 overflow-hidden px-5 pb-20 pt-32 md:px-8 lg:pb-28 lg:pt-40" style={{ background: INK }}>
        <div aria-hidden className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full blur-3xl" style={{ background: `${GREEN}30` }} />
        <div aria-hidden className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full blur-3xl" style={{ background: `${GOLD}1f` }} />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Eyebrow color="#7BE29A">Vehiculars Earn —</Eyebrow>
            <h1 className="mt-5 font-display text-[clamp(2.25rem,4.2vw+1rem,4rem)] font-medium leading-[1.02] tracking-[-0.025em] text-white">
              Your trusted mechanic can renew your papers for you.
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-[1.7] text-white/70">
              Recommend a genuine auto expert to Vehiculars. Every job they complete earns you credit toward your vehicle papers and
              driver&apos;s licence renewal.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <RecommendButton dark />
              <a href="#how" className="text-[15px] font-medium text-white/70 transition-colors duration-150 hover:text-white">
                How it works
              </a>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="flex justify-center lg:justify-end"
          >
            <ProgressCard />
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="px-5 py-[72px] md:px-8 lg:py-[96px]" style={{ background: PAPER }}>
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mx-auto mb-14 max-w-2xl text-center">
            <Eyebrow>Vehiculars Earn —</Eyebrow>
            <h2 className="mt-4 font-display text-[clamp(1.75rem,2.4vw+1rem,2.5rem)] font-medium leading-[1.05] tracking-[-0.02em]" style={{ color: INK }}>
              How it works
            </h2>
          </motion.div>
          <motion.ol
            variants={gridVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {STEPS.map(({ n, title, body, icon: Icon }) => (
              <motion.li
                key={n}
                variants={itemVariants}
                className="relative flex flex-col rounded-2xl bg-white p-6 transition-transform duration-200 hover:-translate-y-1"
                style={{ border: `1px solid ${INK}14` }}
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${GREEN}1a`, color: GREEN }}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-[34px] font-medium leading-none" style={{ color: `${INK}14` }}>
                    {n}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-[21px] font-medium" style={{ color: INK }}>
                  {n}. {title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed" style={{ color: INK_SOFT }}>
                  {body}
                </p>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </section>

      {/* WHO CAN YOU RECOMMEND */}
      <section className="px-5 pb-[72px] md:px-8 lg:pb-[96px]" style={{ background: PAPER }}>
        <motion.div {...fadeUp} className="mx-auto max-w-4xl rounded-3xl bg-white p-8 text-center sm:p-12" style={{ border: `1px solid ${INK}14` }}>
          <Eyebrow color={GOLD}>Who can you recommend? —</Eyebrow>
          <ul className="mt-7 flex flex-wrap justify-center gap-2.5">
            {EXPERTS.map((e) => (
              <li
                key={e}
                className="rounded-full px-4 py-2 text-[14px] font-medium transition-colors duration-150 hover:bg-[#28A745] hover:text-white"
                style={{ background: `${GREEN}12`, color: INK, border: `1px solid ${GREEN}2e` }}
              >
                {e}
              </li>
            ))}
          </ul>
        </motion.div>
      </section>

      {/* ONLY RECOMMEND SOMEONE YOU TRUST */}
      <section className="relative overflow-hidden px-5 py-[72px] md:px-8 lg:py-[96px]" style={{ background: INK }}>
        <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full blur-3xl" style={{ background: `${GREEN}24` }} />
        <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div {...fadeUp}>
            <Eyebrow color="#7BE29A">Vehiculars Earn —</Eyebrow>
            <h2 className="mt-4 font-display text-[clamp(1.75rem,2.4vw+1rem,2.6rem)] font-medium leading-[1.05] tracking-[-0.02em] text-white">
              Only recommend someone you trust
            </h2>
            <p className="mt-5 text-[17px] leading-[1.7] text-white/70">You only earn when your expert does good work.</p>
            <p className="mt-8 font-display text-[clamp(1.25rem,1.2vw+1rem,1.6rem)] font-medium leading-snug" style={{ color: GOLD }}>
              A good expert earns you credit for years. A bad one earns you nothing.
            </p>
          </motion.div>
          <motion.ul variants={gridVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="space-y-3">
            {TRUST_RULES.map(({ text, icon: Icon }) => (
              <motion.li
                key={text}
                variants={itemVariants}
                className="flex items-start gap-4 rounded-2xl p-5"
                style={{ background: INK_CARD, border: `1px solid ${GREEN}1f` }}
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${GREEN}26`, color: "#7BE29A" }}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="pt-2 text-[15px] leading-relaxed text-white/85">{text}</span>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </section>

      {/* WHY IT MATTERS */}
      <section className="px-5 py-[72px] md:px-8 lg:py-[96px]" style={{ background: PAPER }}>
        <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
          <Eyebrow>Why it matters —</Eyebrow>
          <p className="mt-6 font-display text-[clamp(1.4rem,1.6vw+1rem,2.1rem)] font-medium leading-[1.3] tracking-[-0.01em]" style={{ color: INK }}>
            Finding an honest mechanic in Nigeria is hard. You already know one. Help other drivers find them, and get rewarded every time they do.
          </p>
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="px-5 pb-[72px] md:px-8 lg:pb-[96px]" style={{ background: PAPER }}>
        <div className="mx-auto max-w-3xl">
          <motion.div {...fadeUp} className="mb-10 text-center">
            <Eyebrow>FAQ —</Eyebrow>
            <h2 className="mt-4 font-display text-[clamp(1.75rem,2.4vw+1rem,2.5rem)] font-medium leading-[1.05] tracking-[-0.02em]" style={{ color: INK }}>
              Frequently asked questions
            </h2>
          </motion.div>
          <div className="space-y-3">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="vh-earn-faq group rounded-2xl bg-white px-6 py-5" style={{ border: `1px solid ${INK}14` }}>
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-left">
                  <span className="text-[16px] font-semibold" style={{ color: INK }}>
                    {q}
                  </span>
                  <span
                    className="vh-earn-faq-icon inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200"
                    style={{ background: `${GREEN}1a`, color: GREEN }}
                  >
                    <Plus className="h-4 w-4" />
                  </span>
                </summary>
                <p className="mt-3 pr-10 text-[15px] leading-relaxed" style={{ color: INK_SOFT }}>
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="px-5 pb-[72px] md:px-8 lg:pb-[96px]" style={{ background: PAPER }}>
        <motion.div
          {...fadeUp}
          className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] px-7 py-14 text-center sm:px-12 sm:py-20"
          style={{ background: `linear-gradient(135deg, ${INK} 0%, #12301f 100%)` }}
        >
          <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full blur-3xl" style={{ background: `${GREEN}40` }} />
          <h2 className="relative mx-auto max-w-2xl font-display text-[clamp(1.9rem,2.8vw+1rem,3rem)] font-medium leading-[1.05] tracking-[-0.02em] text-white">
            Know a good mechanic? Let them work for your papers.
          </h2>
          <div className="relative mt-9 flex justify-center">
            <RecommendButton dark />
          </div>
        </motion.div>
        <p className="mx-auto mt-8 max-w-3xl text-center text-[12.5px] italic leading-relaxed" style={{ color: INK_SOFT }}>
          Earnings depend on jobs completed by your verified expert. Credit is usable for Vehiculars services only. Vehiculars reserves the right
          to suspend experts or reverse earnings in cases of fraud. Terms apply.
        </p>
      </section>

      <Footer redirectTo="/earn" />
    </div>
  );
}
