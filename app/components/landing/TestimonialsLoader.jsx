"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TestimonialsCarousel } from "./TestimonialsCarousel";
import { GREEN, PAPER, INK } from "./theme";

const SAMPLE_TESTIMONIALS = [
  {
    id: "1",
    customer_name: "Chukwudi O.",
    customer_location: "Lekki Phase 1, Lagos",
    customer_photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    testimonial_text: "Renewed my vehicle particulars right from my office desk. The rider delivered all my physical documents to Lekki under 48 hours. Zero queues!",
    service_completed: "Vehicle Particulars",
    verified: true,
  },
  {
    id: "2",
    customer_name: "Amina Balogun",
    customer_location: "Ikeja GRA, Lagos",
    customer_photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    testimonial_text: "The physical condition inspection saved me from buying a Lexus RX350 with hidden transmission issues — the mechanic's report was thorough, with photos on every section.",
    service_completed: "Physical Condition Inspection",
    verified: true,
  },
  {
    id: "3",
    customer_name: "Tomiwa Adeyemi",
    customer_location: "Abuja FCT",
    customer_photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    testimonial_text: "Renewed my driver's licence without setting foot in an FRSC office — booked my biometric slot from the app, and the licence was delivered to my house in Abuja.",
    service_completed: "Driver's Licence",
    verified: true,
  },
  {
    id: "4",
    customer_name: "Blessing K.",
    customer_location: "Victoria Island, Lagos",
    customer_photo_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    testimonial_text: "Roadworthiness express is the real deal. Drove into their bay for my slot, got tested end-to-end, and the soft copy was in my app the same day.",
    service_completed: "Roadworthiness Express",
    verified: true,
  },
];

export function TestimonialsLoader({
  serviceId,
  eyebrow = "Trusted by drivers nationwide",
  heading = "What customers say",
}) {
  const [items, setItems] = useState(SAMPLE_TESTIMONIALS);

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
