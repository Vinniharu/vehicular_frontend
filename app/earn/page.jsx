"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BadgeCheck, CalendarCheck, Coins, Plus, ShieldAlert, Star, UserCheck, Wrench } from "lucide-react";

import Nav from "@/app/components/landing/sections/Nav";
import Footer from "@/app/components/landing/sections/Footer";
import { Container, Eyebrow, MkButton, Section, SectionHeading } from "@/app/components/marketing/ui";
import { EASE, Reveal, Stagger, StaggerItem } from "@/app/components/marketing/motion";

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

function RecommendButton({ variant = "primary", className = "" }) {
  return (
    <MkButton href={RECOMMEND_HREF} variant={variant} size="lg" magnetic className={className}>
      Recommend an Expert
      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
    </MkButton>
  );
}

/** Decorative renewal-progress card for the hero (illustrative, not live data). */
function ProgressCard() {
  const reduce = useReducedMotion();
  return (
    <div className="relative w-full max-w-sm">
      <div aria-hidden className="mk-glow pointer-events-none absolute -inset-10" />
      <div className="mk-gradient-border relative rounded-mk-lg p-6 shadow-mk-lg">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-mk-muted">Plate renewal</span>
          <span className="whitespace-nowrap rounded-full border border-mk-gold/25 bg-mk-gold/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#8a6d12]">
            Due in 5 months
          </span>
        </div>
        <p className="mt-3 text-[19px] font-semibold tracking-[-0.02em] text-mk-ink">Toyota Camry</p>
        <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-mk-ink/[0.06]">
          <motion.div
            initial={reduce ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: reduce ? 0 : 1.2, ease: EASE, delay: 0.3 }}
            className="h-full w-[64%] origin-left rounded-full bg-gradient-to-r from-cx-brand to-[#7BE29A]"
          />
        </div>
        <p className="mt-3 text-[13.5px] text-mk-muted">
          <span className="font-mono font-semibold text-mk-ink">64% covered</span> by your earnings
        </p>
        <div className="mt-5 space-y-2.5 border-t border-mk-line pt-4">
          {[
            ["Your mechanic finished a job", "+ credit"],
            ["Expert verified", "+ bonus"],
          ].map(([label, amt]) => (
            <div key={label} className="flex items-center justify-between gap-3 text-[13.5px]">
              <span className="text-mk-ink-2">{label}</span>
              <span className="rounded-full bg-cx-brand-soft px-2 py-0.5 font-mono text-[12px] font-semibold text-cx-brand-deep">{amt}</span>
            </div>
          ))}
        </div>
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
    <div className="mk-root min-h-dvh">
      <style
        dangerouslySetInnerHTML={{
          __html: `html{scroll-behavior:smooth}body{background:var(--mk-bg)}
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
      <section className="relative overflow-hidden border-b border-mk-line bg-mk-surface">
        <div aria-hidden className="mk-grid-bg pointer-events-none absolute inset-0" />
        <div aria-hidden className="mk-glow pointer-events-none absolute -left-40 -top-32 h-[420px] w-[620px]" />
        <Container className="relative grid items-center gap-14 py-16 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
          <Stagger animateOnMount gap={0.08}>
            <StaggerItem>
              <Eyebrow>Vehiculars Earn —</Eyebrow>
            </StaggerItem>
            <StaggerItem>
              <h1
                className="mt-5 font-semibold tracking-[-0.035em] text-mk-ink text-balance"
                style={{ fontSize: "clamp(2.25rem, 4.2vw + 1rem, 4rem)", lineHeight: 1.03 }}
              >
                Your trusted mechanic can renew your papers{" "}
                <span className="font-display font-normal italic text-cx-brand">for you.</span>
              </h1>
            </StaggerItem>
            <StaggerItem>
              <p className="mt-6 max-w-xl text-[17px] leading-[1.7] text-mk-ink-2">
                Recommend a genuine auto expert to Vehiculars. Every job they complete earns you credit toward your vehicle papers and
                driver&apos;s licence renewal.
              </p>
            </StaggerItem>
            <StaggerItem className="mt-9 flex flex-wrap items-center gap-3">
              <RecommendButton />
              <MkButton href="#how" variant="ghost" size="lg">
                How it works
              </MkButton>
            </StaggerItem>
          </Stagger>
          <Reveal delay={0.15} y={24} className="flex justify-center lg:justify-end">
            <ProgressCard />
          </Reveal>
        </Container>
      </section>

      {/* HOW IT WORKS */}
      <Section id="how" tone="light">
        <SectionHeading eyebrow="Vehiculars Earn —" title="How it works" align="center" className="mb-14" />
        <Stagger as="ol" gap={0.08} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ n, title, body, icon: Icon }) => (
            <StaggerItem
              as="li"
              key={n}
              className="mk-lift relative flex flex-col rounded-mk-lg border border-mk-line bg-mk-surface p-6 shadow-mk-sm"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-cx-brand-soft text-cx-brand-deep shadow-[inset_0_0_0_1px_rgba(40,167,69,0.16)]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-mono text-[28px] font-medium leading-none text-mk-ink/10">0{n}</span>
              </div>
              <h3 className="mt-5 text-[19px] font-semibold tracking-[-0.02em] text-mk-ink">
                {n}. {title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-mk-muted">{body}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* WHO CAN YOU RECOMMEND */}
      <section className="pb-20 sm:pb-24 lg:pb-28">
        <Container>
          <Reveal className="mx-auto max-w-4xl rounded-mk-lg border border-mk-line bg-mk-surface p-6 text-center shadow-mk sm:p-12">
            <Eyebrow>Who can you recommend? —</Eyebrow>
            <Stagger as="ul" gap={0.04} className="mt-7 flex flex-wrap justify-center gap-2.5">
              {EXPERTS.map((e) => (
                <StaggerItem
                  as="li"
                  key={e}
                  className="rounded-full border border-cx-brand/20 bg-cx-brand-soft px-4 py-2 text-[14px] font-medium text-mk-ink transition-colors duration-200 hover:bg-cx-brand hover:text-white"
                >
                  {e}
                </StaggerItem>
              ))}
            </Stagger>
          </Reveal>
        </Container>
      </section>

      {/* ONLY RECOMMEND SOMEONE YOU TRUST */}
      <section className="relative overflow-hidden bg-mk-dark py-20 text-white sm:py-24 lg:py-28">
        <div aria-hidden className="mk-grid-bg-dark pointer-events-none absolute inset-0" />
        <div aria-hidden className="mk-glow pointer-events-none absolute -right-20 -top-20 h-80 w-[520px]" />
        <Container className="relative grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <Eyebrow tone="dark">Vehiculars Earn —</Eyebrow>
            <h2
              className="mt-4 font-semibold tracking-[-0.03em] text-white text-balance"
              style={{ fontSize: "clamp(1.75rem, 2.4vw + 1rem, 2.6rem)", lineHeight: 1.08 }}
            >
              Only recommend someone you trust
            </h2>
            <p className="mt-5 text-[17px] leading-[1.7] text-white/65">You only earn when your expert does good work.</p>
            <p className="mt-8 font-display text-[clamp(1.25rem,1.2vw+1rem,1.6rem)] italic leading-snug text-mk-gold">
              A good expert earns you credit for years. A bad one earns you nothing.
            </p>
          </Reveal>
          <Stagger as="ul" gap={0.08} className="space-y-3">
            {TRUST_RULES.map(({ text, icon: Icon }) => (
              <StaggerItem
                as="li"
                key={text}
                className="flex items-start gap-4 rounded-mk-lg border border-white/10 bg-mk-dark-card p-5"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cx-brand/15 text-[#7BE29A]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="pt-2 text-[15px] leading-relaxed text-white/85">{text}</span>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* WHY IT MATTERS */}
      <Section tone="light">
        <Reveal className="mx-auto max-w-3xl text-center">
          <Eyebrow>Why it matters —</Eyebrow>
          <p
            className="mt-6 font-medium tracking-[-0.02em] text-mk-ink text-balance"
            style={{ fontSize: "clamp(1.4rem, 1.6vw + 1rem, 2.1rem)", lineHeight: 1.3 }}
          >
            Finding an honest mechanic in Nigeria is hard. You already know one. Help other drivers find them, and get rewarded every time they do.
          </p>
        </Reveal>
      </Section>

      {/* FAQ */}
      <section className="pb-20 sm:pb-24 lg:pb-28">
        <Container>
          <div className="mx-auto max-w-3xl">
          <SectionHeading eyebrow="FAQ —" title="Frequently asked questions" align="center" className="mb-10" />
          <Stagger gap={0.05} className="space-y-3">
            {FAQS.map(({ q, a }) => (
              <StaggerItem key={q}>
                <details className="vh-earn-faq group rounded-mk-lg border border-mk-line bg-mk-surface shadow-mk-sm transition-[border-color,box-shadow] duration-300 open:border-mk-line-strong open:shadow-mk">
                  <summary className="mk-focus flex min-h-[44px] cursor-pointer items-center justify-between gap-4 rounded-mk-lg px-5 py-4 text-left sm:px-6 sm:py-5">
                    <span className="text-[16px] font-semibold tracking-[-0.01em] text-mk-ink">{q}</span>
                    <span className="vh-earn-faq-icon inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cx-brand-soft text-cx-brand-deep transition-transform duration-300">
                      <Plus className="h-4 w-4" />
                    </span>
                  </summary>
                  <p className="px-5 pb-5 pr-14 text-[15px] leading-relaxed text-mk-muted sm:px-6 sm:pr-16">{a}</p>
                </details>
              </StaggerItem>
            ))}
          </Stagger>
          </div>
        </Container>
      </section>

      {/* CLOSING CTA */}
      <section className="pb-20 sm:pb-24 lg:pb-28">
        <Container>
          <Reveal className="relative overflow-hidden rounded-[28px] bg-mk-dark px-6 py-14 text-center shadow-mk-lg sm:px-12 sm:py-20">
            <div aria-hidden className="mk-grid-bg-dark pointer-events-none absolute inset-0" />
            <div aria-hidden className="mk-glow pointer-events-none absolute -left-24 -top-24 h-80 w-80" />
            <h2
              className="relative mx-auto max-w-2xl font-semibold tracking-[-0.03em] text-white text-balance"
              style={{ fontSize: "clamp(1.9rem, 2.8vw + 1rem, 3rem)", lineHeight: 1.06 }}
            >
              Know a good mechanic? Let them work for your papers.
            </h2>
            <div className="relative mt-9 flex justify-center">
              <RecommendButton />
            </div>
          </Reveal>
          <p className="mx-auto mt-8 max-w-3xl text-center text-[12.5px] italic leading-relaxed text-mk-muted">
            Earnings depend on jobs completed by your verified expert. Credit is usable for Vehiculars services only. Vehiculars reserves the right
            to suspend experts or reverse earnings in cases of fraud. Terms apply.
          </p>
        </Container>
      </section>

      <Footer redirectTo="/earn" />
    </div>
  );
}
