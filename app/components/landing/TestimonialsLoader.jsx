"use client";

import React, { useEffect, useState } from "react";
import { TestimonialsCarousel } from "./TestimonialsCarousel";
import { Section, SectionHeading } from "@/app/components/marketing/ui";
import { Reveal } from "@/app/components/marketing/motion";

// Screenshots flagged showsDocument include part of a real licence (and in
// one case the holder's face, DOB and address). They stay out of the public
// carousel: ad platforms reject government-ID imagery and it is personal data.
export const WHATSAPP_TESTIMONIALS = [
  {
    id: "1",
    image: "/testimony/tes1.jpeg",
    title: "Driver's Licence Update",
    alt: "Customer WhatsApp review for temporary driver's licence",
  },
  {
    id: "2",
    image: "/testimony/tes2.jpeg",
    title: "Seamless Renewal Service",
    alt: "Customer WhatsApp feedback praising the seamless renewal process",
  },
  {
    id: "3",
    image: "/testimony/tes3.jpeg",
    showsDocument: true,
    title: "Licence Document Collected",
    alt: "Customer WhatsApp confirmation of collecting driver's licence document",
  },
  {
    id: "4",
    image: "/testimony/tes4.jpeg",
    showsDocument: true,
    title: "Temporary Licence Received",
    alt: "Customer photo confirming collection of temporary driver licence",
  },
  {
    id: "5",
    image: "/testimony/tes5.jpeg",
    showsDocument: true,
    title: "Customer Feedback",
    alt: "Customer WhatsApp chat sharing feedback on the Vehiculars service",
  },
  {
    id: "6",
    image: "/testimony/tes6.jpeg",
    showsDocument: true,
    title: "Biometric Capture Done",
    alt: "Customer WhatsApp message after biometric capture praising Vehicular",
  },
  {
    id: "7",
    image: "/testimony/tes7.jpeg",
    title: "Fast Service & Referrals",
    alt: "Customer thanking Vehicular for prompt service and referring others",
  },
  {
    id: "8",
    image: "/testimony/tes8.jpeg",
    title: "No Queues & Direct Delivery",
    alt: "Customer feedback confirming convenient delivery without queueing",
  },
];

export function TestimonialsLoader({
  serviceId,
  eyebrow = "Real customer stories",
  heading = "What our customers are saying",
}) {
  const [items, setItems] = useState(() => WHATSAPP_TESTIMONIALS.filter((t) => !t.showsDocument));

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const url = serviceId
          ? `/api/testimonials?service_id=${encodeURIComponent(serviceId)}`
          : `/api/testimonials`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data) && data.length > 0) {
            setItems(data);
          }
        }
      } catch {
        // Fallback to SAMPLE_TESTIMONIALS if API route is not created yet
      }
    })();
    return () => {
      active = false;
    };
  }, [serviceId]);

  return (
    <Section tone="white" className="overflow-x-clip border-y border-mk-line">
      <SectionHeading
        eyebrow={eyebrow}
        title={heading}
        description="Screenshots customers sent us on WhatsApp after their service."
        className="mb-10 sm:mb-12"
      />
      <Reveal delay={0.08}>
        <TestimonialsCarousel testimonials={items} />
      </Reveal>
    </Section>
  );
}
