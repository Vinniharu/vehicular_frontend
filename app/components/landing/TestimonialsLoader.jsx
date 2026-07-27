"use client";

import React, { useEffect, useState } from "react";
import { TestimonialsCarousel } from "./TestimonialsCarousel";

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
    testimonial_text: "The pre-purchase inspection saved me from buying a Lexus RX350 with hidden transmission issues. Highly thorough mechanic notes with 40+ photos.",
    service_completed: "Pre-Purchase Inspection",
    verified: true,
  },
  {
    id: "3",
    customer_name: "Tomiwa Adeyemi",
    customer_location: "Abuja FCT",
    customer_photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    testimonial_text: "Ordered genuine front brake pads and filters for my Camry. VIN fitment check was spot on and delivery arrived next morning.",
    service_completed: "Spare Parts",
    verified: true,
  },
  {
    id: "4",
    customer_name: "Blessing K.",
    customer_location: "Victoria Island, Lagos",
    customer_photo_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    testimonial_text: "Roadworthiness express is the real deal. Inspector came to our driveway, tested everything cleanly, and soft copy was in my app same day.",
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
    <section className="vh-card vh-card-light px-4 sm:px-6 md:px-10 py-[40px] sm:py-[56px] lg:py-[64px]">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl mb-10">
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#28A745]">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-display font-medium tracking-[-0.02em] leading-[1.05] text-[clamp(1.75rem,2.4vw+1rem,2.5rem)] text-[#111111]">
            {heading}
          </h2>
        </div>
        <TestimonialsCarousel testimonials={items} />
      </div>
    </section>
  );
}
