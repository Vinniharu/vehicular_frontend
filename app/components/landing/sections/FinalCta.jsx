"use client";

import { ArrowRight } from "lucide-react";
import { TRUST_STATS } from "../landing-data";
import { Container, MkButton } from "@/app/components/marketing/ui";
import { CountUp, Reveal, Stagger, StaggerItem } from "@/app/components/marketing/motion";

export default function FinalCta({ isLoggedIn, dashboardHref, dashboardLabel, redirectTo }) {
  return (
    <section className="relative bg-mk-bg pb-20 sm:pb-24 lg:pb-28">
      <Container>
        <Reveal y={20}>
          <div
            className="mk-gradient-pan relative isolate overflow-hidden rounded-[28px] sm:rounded-[36px] px-6 py-16 sm:px-12 sm:py-20 lg:py-24 text-center text-white shadow-mk-lg"
            style={{ backgroundImage: "linear-gradient(120deg, #2fbf50 0%, #28A745 30%, #1f7a35 65%, #0f4a20 100%)" }}
          >
            <div aria-hidden className="mk-grid-bg-dark pointer-events-none absolute inset-0 -z-10 opacity-70" />
            <div
              aria-hidden
              className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[360px] w-[720px] max-w-none -translate-x-1/2"
              style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.22), transparent)" }}
            />

            <Stagger gap={0.08} className="relative mx-auto max-w-3xl">
              <StaggerItem
                as="h2"
                className="font-semibold text-white text-balance"
                style={{ fontSize: "clamp(2.2rem, 4vw + 1rem, 4rem)", lineHeight: 1.02, letterSpacing: "-0.035em" }}
              >
                Your vehicle. Your time.{" "}
                <span className="font-display font-normal italic text-white/90" style={{ letterSpacing: "-0.02em" }}>
                  Our job.
                </span>
              </StaggerItem>
              <StaggerItem as="p" className="mx-auto mt-6 max-w-lg text-[16px] sm:text-[17px] leading-[1.7] text-white/75">
                Join thousands of Nigerian car owners who've handed the hassle to us. Get started in under 2 minutes.
              </StaggerItem>
              <StaggerItem className="mt-10 flex justify-center">
                <MkButton
                  href={isLoggedIn ? dashboardHref : `/auth/signup?redirect=${encodeURIComponent(redirectTo)}`}
                  variant="secondary"
                  size="lg"
                  magnetic
                >
                  {isLoggedIn ? dashboardLabel : "Get started — it's free"}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </MkButton>
              </StaggerItem>

              <StaggerItem className="mx-auto mt-14 grid max-w-xl grid-cols-3 divide-x divide-white/15 border-t border-white/15 pt-8">
                {TRUST_STATS.map(([num, label]) => (
                  <div key={num} className="px-2 text-center">
                    <p className="font-mono text-[14px] min-[400px]:text-[16px] sm:text-[24px] font-semibold tracking-[-0.02em] text-white leading-none">
                      <CountUp value={num} />
                    </p>
                    <p className="mt-2 text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-white/60">{label}</p>
                  </div>
                ))}
              </StaggerItem>
            </Stagger>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
