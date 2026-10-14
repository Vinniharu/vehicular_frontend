"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { LIFECYCLE_STAGES } from "../landing-data";
import { Section, SectionHeading } from "@/app/components/marketing/ui";
import { EASE, Stagger, StaggerItem } from "@/app/components/marketing/motion";

function LifecycleStage({ stage, isLast }) {
  const Icon = stage.icon;
  return (
    <div className={`relative flex gap-5 lg:block lg:pb-0 ${isLast ? "pb-0" : "pb-10"}`}>
      {/* Mobile rail segment */}
      {!isLast && <span aria-hidden className="absolute left-[21px] top-12 bottom-0 w-px bg-mk-line-strong lg:hidden" />}

      <div className="relative z-10 shrink-0">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-cx-brand/25 bg-mk-surface text-cx-brand-deep shadow-mk-sm">
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <div className="min-w-0 flex-1 lg:mt-7">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mk-muted">
          Stage <span className="text-cx-brand-deep">{stage.stage}</span>
        </p>
        <h3 className="mt-2 text-[21px] font-semibold tracking-[-0.025em] leading-tight text-mk-ink">{stage.title}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-mk-muted">{stage.blurb}</p>
        {stage.items?.length > 0 && (
          <ul className="mt-5 overflow-hidden rounded-mk border border-mk-line bg-mk-surface shadow-mk-sm divide-y divide-mk-line">
            {stage.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="mk-focus group/link flex min-h-[44px] items-center justify-between gap-2 px-4 py-2.5 text-[14px] font-medium text-mk-ink-2 transition-colors duration-200 hover:bg-cx-brand-soft hover:text-mk-ink"
                >
                  <span>{item.label}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-mk-muted transition-transform duration-200 group-hover/link:translate-x-0.5 group-hover/link:text-cx-brand-deep" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function Lifecycle() {
  const reduce = useReducedMotion();
  return (
    <Section id="lifecycle" tone="light">
      <SectionHeading
        align="center"
        eyebrow="Lifecycle"
        title="With your car from"
        accent="purchase to resale."
        description="Vehiculars isn't a renewal service. It's the home base for every car you own — every stage, every job, one app."
      />

      <div className="relative mt-14 sm:mt-16">
        {/* Desktop rail through the stage markers; draws in on view */}
        <motion.div
          aria-hidden
          className="absolute left-0 right-0 top-[22px] hidden h-px origin-left bg-gradient-to-r from-cx-brand/50 via-mk-line-strong to-mk-line lg:block"
          initial={reduce ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "0px 0px -15% 0px" }}
          transition={{ duration: 1.2, ease: EASE }}
        />
        <Stagger gap={0.1} className="relative grid lg:grid-cols-3 lg:gap-10">
          {LIFECYCLE_STAGES.map((stage, i) => (
            <StaggerItem key={stage.title}>
              <LifecycleStage stage={stage} isLast={i === LIFECYCLE_STAGES.length - 1} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </Section>
  );
}
