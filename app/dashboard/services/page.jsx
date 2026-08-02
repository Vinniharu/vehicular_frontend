"use client";

import { colors } from "@/lib/design-tokens";
import ServicesList from "../_shared/ServicesList";

const BRAND = colors.primary.DEFAULT;
const INK = colors.ink.DEFAULT;

export default function DashboardServicesPage() {
  return (
    <div className="space-y-6 pb-16 max-w-5xl">
      {/* Hero */}
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: BRAND }}>
          What we handle
        </p>
        <h1
          className="mt-1 text-[30px] sm:text-[36px] leading-tight tracking-tight"
          style={{ color: INK, fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
        >
          Everything your car needs
        </h1>
        <p className="mt-1.5 inline-flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wide" style={{ color: BRAND }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: BRAND }} />
          Available nationwide
        </p>
      </div>

      <ServicesList />
    </div>
  );
}
