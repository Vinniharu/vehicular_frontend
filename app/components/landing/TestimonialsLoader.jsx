"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TestimonialsCarousel } from "./TestimonialsCarousel";
import { GREEN, PAPER, INK } from "./theme";

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
    title: "Licence Document Collected",
    alt: "Customer WhatsApp confirmation of collecting driver's licence document",
  },
  {
    id: "4",
    image: "/testimony/tes4.jpeg",
    title: "Temporary Licence Received",
    alt: "Customer photo confirming collection of temporary driver licence",
  },
  {
    id: "5",
    image: "/testimony/tes5.jpeg",
    title: "100% Customer Trust",
    alt: "Customer chat expressing 100% trust in Vehicular service",
  },
  {
    id: "6",
    image: "/testimony/tes6.jpeg",
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
  const [items, setItems] = useState(WHATSAPP_TESTIMONIALS);

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
    <section className="relative px-4 sm:px-6 md:px-10 py-[64px] sm:py-[80px] lg:py-[96px]" style={{ background: PAPER }}>
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mb-10"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: GREEN }}>
            {eyebrow}
          </p>
          <h2 className="mt-3 font-display font-medium tracking-[-0.02em] leading-[1.05] text-[clamp(1.75rem,2.4vw+1rem,2.5rem)]" style={{ color: INK }}>
            {heading}
          </h2>
        </motion.div>
        <TestimonialsCarousel testimonials={items} />
      </div>
    </section>
  );
}
