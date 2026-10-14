"use client";

import { ArrowRight } from "lucide-react";
import { SERVICE_ITEMS } from "../landing-data";
import ServiceCard from "@/app/components/marketing/ServiceCard";
import { Section, SectionHeading, BentoGrid, MkButton } from "@/app/components/marketing/ui";
import { Reveal, Stagger, StaggerItem } from "@/app/components/marketing/motion";

export default function Services() {
  return (
    <Section id="services" tone="white" className="border-y border-mk-line">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12 sm:mb-14">
        <SectionHeading
          eyebrow="Services"
          title="Everything,"
          accent="in one app."
          description="Pick a service. We handle the queues, paperwork, and follow-ups — end-to-end."
        />
        <Reveal delay={0.1} className="shrink-0">
          <MkButton href="/services" variant="secondary">
            All services
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </MkButton>
        </Reveal>
      </div>

      <Stagger gap={0.06}>
        <BentoGrid>
          {SERVICE_ITEMS.map((item, i) => {
            const isFeatured = item.featured && i < 2;
            return (
              <StaggerItem key={item.slug} className={isFeatured ? "sm:col-span-2 lg:col-span-3" : "lg:col-span-2"}>
                <ServiceCard
                  href={`/services/${item.slug}`}
                  title={item.label}
                  description={item.benefit}
                  icon={item.icon}
                  variant="landing"
                  featured={isFeatured}
                  headingTag="h3"
                />
              </StaggerItem>
            );
          })}
        </BentoGrid>
      </Stagger>
    </Section>
  );
}
