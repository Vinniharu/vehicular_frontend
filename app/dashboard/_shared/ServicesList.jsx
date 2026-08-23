"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { SERVICES } from "@/app/services/_data";
import { getDriverLicenceFeeSchedule, getServicePricing, getParticularsItemPricing, getVehicleCategoryPricing } from "@/lib/api";
import { colors } from "@/lib/design-tokens";

const BRAND = colors.primary.DEFAULT;
const INK = colors.ink.DEFAULT;
const PAPER_BORDER = colors.paper.border;

// Matches the category taxonomy assigned to each entry in
// app/services/_data.js — order here controls section/chip order on screen.
export const CATEGORIES = ["Vehicle particulars", "Other documents", "Number plates", "Fast-track & logistics"];

export function koboToNaira(kobo) {
  return (kobo / 100).toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
}

export default function ServicesList({ showSearch = true }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [feeSchedule, setFeeSchedule] = useState(null);
  const [servicePrices, setServicePrices] = useState(null);
  const [particularsPrices, setParticularsPrices] = useState(null);
  const [vehicleCategoryPrices, setVehicleCategoryPrices] = useState(null);

  useEffect(() => {
    getDriverLicenceFeeSchedule().then((res) => {
      if (res.data?.prices) setFeeSchedule(res.data.prices);
    });
    // Admin-set prices for the marketing-only services (RWX, DriveConnect,
    // etc.) — separate endpoint from the driver-licence/tinted-permit fee
    // schedule above, since those two drive real checkout amounts and these
    // are purely informational until an admin sets one via /admin/pricing.
    getServicePricing().then((res) => {
      if (res.data?.prices) setServicePrices(res.data.prices);
    });
    // vehicle_particulars has its own per-document pricing table (5 rows,
    // each independently nullable) — doesn't fit either shape above.
    getParticularsItemPricing().then((res) => {
      if (res.data?.prices) setParticularsPrices(res.data.prices);
    });
    // Roadworthiness Express prices per vehicle category x use (see
    // VEHICLE_CATEGORY_PRICED_SERVICE_KEYS, app/core/payment_helpers.py) —
    // the public 108-cell grid, filtered client-side to just the RWX rows.
    getVehicleCategoryPricing().then((res) => {
      if (res.data?.prices) setVehicleCategoryPrices(res.data.prices);
    });
  }, []);

  // "From ₦X" on the Driver's Licence card resolves to the cheapest live DL
  // tier. tinted_permit and number_plate_* are excluded here — they're
  // flat-fee/other services returned in the same schedule, and including
  // them would make the DL card show a wrong "From ₦X" price borrowed from
  // a different service entirely.
  const driversLicenceMinKobo = useMemo(() => {
    if (!feeSchedule || feeSchedule.length === 0) return null;
    const dlPrices = feeSchedule.filter((p) => p.application_type !== "tinted_permit" && !p.application_type?.startsWith("number_plate_"));
    if (dlPrices.length === 0) return null;
    return Math.min(...dlPrices.map((p) => p.amount_kobo));
  }, [feeSchedule]);

  const tintedPermitFeeKobo = useMemo(() => {
    if (!feeSchedule) return null;
    return feeSchedule.find((p) => p.application_type === "tinted_permit")?.amount_kobo ?? null;
  }, [feeSchedule]);

  // "From ₦X" on the Number Plate card resolves to the cheapest of the 3
  // plate-service types (new/replacement/change_of_ownership) — mirrors how
  // the Driver's Licence card resolves to its cheapest tier.
  const numberPlateMinKobo = useMemo(() => {
    if (!feeSchedule) return null;
    const numberPlatePrices = feeSchedule.filter((p) => p.application_type?.startsWith("number_plate_"));
    if (numberPlatePrices.length === 0) return null;
    return Math.min(...numberPlatePrices.map((p) => p.amount_kobo));
  }, [feeSchedule]);

  // "From ₦X" on the Vehicle Particulars card resolves to the cheapest of
  // the 5 individually-priced document types — the same "cheapest tier"
  // pattern as Driver's Licence/Number Plate above, and null (falls back to
  // "Coming soon") until an admin has priced at least one document type.
  const particularsMinKobo = useMemo(() => {
    if (!particularsPrices) return null;
    const priced = particularsPrices.filter((p) => p.amount_kobo != null);
    if (priced.length === 0) return null;
    return Math.min(...priced.map((p) => p.amount_kobo));
  }, [particularsPrices]);

  // "From ₦X" on the RWX card resolves to the cheapest of the 12 category
  // cells — same "cheapest tier" pattern as the cards above, null (falls
  // back to a plain "Book now" CTA with no price) until an admin has
  // priced at least one category.
  const rwxMinKobo = useMemo(() => {
    if (!vehicleCategoryPrices) return null;
    const priced = vehicleCategoryPrices.filter((p) => p.service_key === "roadworthiness_express" && p.amount_kobo != null);
    if (priced.length === 0) return null;
    return Math.min(...priced.map((p) => p.amount_kobo));
  }, [vehicleCategoryPrices]);

  // "From ₦X" on the Vehicle Verification card resolves to the cheapest of
  // its 2 check-type combos (registration_history / customs_duty) — same
  // "cheapest tier" pattern as the cards above. Unlike RWX, the backend
  // always has a fallback figure for these two (see _FALLBACK_FEE_SCHEDULE,
  // app/core/payment_helpers.py), so once feeSchedule has loaded this
  // should never legitimately stay null.
  const vvMinKobo = useMemo(() => {
    if (!feeSchedule) return null;
    const vvPrices = feeSchedule.filter((p) => p.application_type?.startsWith("vehicle_verification_"));
    if (vvPrices.length === 0) return null;
    return Math.min(...vvPrices.map((p) => p.amount_kobo));
  }, [feeSchedule]);

  const feeByScheduleType = {
    drivers_licence: driversLicenceMinKobo,
    tinted_permit: tintedPermitFeeKobo,
    number_plate: numberPlateMinKobo,
    vehicle_particulars: particularsMinKobo,
    roadworthiness_express: rwxMinKobo,
    vehicle_verification_registration_history: vvMinKobo,
  };

  // Whether the underlying fetch for a given feeScheduleType has resolved
  // yet — feeKobo alone can't distinguish "still loading" from "loaded,
  // genuinely nothing priced" (RWX/particulars can legitimately have no
  // price yet), so CtaBadge needs both to show accurate copy instead of a
  // permanent "Loading…" for a price that will never arrive.
  const feeLoadedByScheduleType = {
    drivers_licence: feeSchedule !== null,
    tinted_permit: feeSchedule !== null,
    number_plate: feeSchedule !== null,
    vehicle_particulars: particularsPrices !== null,
    roadworthiness_express: vehicleCategoryPrices !== null,
    vehicle_verification_registration_history: feeSchedule !== null,
  };

  const servicePriceBySlug = useMemo(() => {
    if (!servicePrices) return {};
    return Object.fromEntries(servicePrices.map((p) => [p.slug, p.amount_kobo]));
  }, [servicePrices]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const s of SERVICES) counts[s.category] = (counts[s.category] || 0) + 1;
    return counts;
  }, []);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = SERVICES.filter((s) => {
      const matchesCategory = activeCategory === "All" || s.category === activeCategory;
      const matchesQuery = !q || s.title.toLowerCase().includes(q) || s.tagline.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
    const byCategory = {};
    for (const s of filtered) {
      (byCategory[s.category] ||= []).push(s);
    }
    return byCategory;
  }, [activeCategory, query]);

  const visibleCategories = CATEGORIES.filter((c) => grouped[c]?.length);

  return (
    <div className="space-y-6">
      {showSearch && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A7A7A]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you need? Renewal, part, repair…"
            className="w-full rounded-2xl border bg-white py-3.5 pl-11 pr-4 text-[13.5px] outline-none transition-colors focus:border-emerald-300"
            style={{ borderColor: PAPER_BORDER }}
          />
        </div>
      )}

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        <CategoryChip label="All" count={SERVICES.length} active={activeCategory === "All"} onClick={() => setActiveCategory("All")} />
        {CATEGORIES.map((c) => (
          <CategoryChip key={c} label={c} count={categoryCounts[c] || 0} active={activeCategory === c} onClick={() => setActiveCategory(c)} />
        ))}
      </div>

      {/* Grouped service cards */}
      {visibleCategories.length === 0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center" style={{ borderColor: PAPER_BORDER }}>
          <p className="text-[13.5px] text-[#7A7A7A]">No services match &ldquo;{query}&rdquo;.</p>
        </div>
      ) : (
        visibleCategories.map((category) => (
          <div key={category} className="space-y-3">
            <h2 className="text-[16px] font-bold tracking-tight" style={{ color: INK, fontFamily: "var(--font-display-serif)" }}>
              {category}
            </h2>
            <div className="space-y-3">
              {grouped[category].map((service) => (
                <ServiceCard
                  key={service.slug}
                  service={service}
                  feeKobo={
                    service.feeScheduleType
                      ? feeByScheduleType[service.feeScheduleType] ?? null
                      : servicePriceBySlug[service.slug] ?? null
                  }
                  loaded={service.feeScheduleType ? feeLoadedByScheduleType[service.feeScheduleType] ?? true : servicePrices !== null}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function CategoryChip({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12.5px] font-semibold transition-all"
      style={{
        borderColor: active ? BRAND : PAPER_BORDER,
        background: active ? BRAND : "#fff",
        color: active ? "#fff" : "#3A3A3A",
      }}
    >
      {label}
      <span
        className="rounded-full px-1.5 py-0.5 text-[10.5px] font-bold"
        style={{ background: active ? "rgba(255,255,255,0.25)" : "#F4F1E9", color: active ? "#fff" : "#7A7A7A" }}
      >
        {count}
      </span>
    </button>
  );
}

export function CtaBadge({ service, feeKobo, loaded = true }) {
  // Only a "live" service's price display can resolve to a real "From ₦X" —
  // an admin-set service_prices row for a "coming_soon"/"off_sale" entry is
  // informational at most and must never imply that entry is purchasable
  // (that would silently contradict the deliberate off-sale/coming-soon
  // status). Status is the source of truth here, not price presence.
  if (service.status === "live") {
    if (feeKobo != null) {
      return (
        <span className="rounded-full px-3 py-1.5 text-[12px] font-bold whitespace-nowrap" style={{ background: "#F0FDF4", color: BRAND }}>
          From {koboToNaira(feeKobo)}
        </span>
      );
    }
    // feeKobo is null for two genuinely different reasons: the fetch just
    // hasn't resolved yet (show "Loading…", which will clear), or it
    // resolved and nothing's priced yet (RWX with no category priced) —
    // showing "Loading…" forever for the latter is exactly the reported
    // "stuck on loading" bug, so it must not render the same text.
    if (!loaded) {
      return <span className="text-[11px] font-semibold text-[#7A7A7A]">Loading…</span>;
    }
    return <span className="text-[11px] font-semibold text-[#7A7A7A]">Book now</span>;
  }

  if (service.status === "off_sale") {
    return (
      <span
        className="rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap"
        style={{ background: "#FFF7ED", color: "#C2410C" }}
      >
        Off sale
      </span>
    );
  }

  return (
    <span
      className="rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap"
      style={{ background: "#F4F1E9", color: "#7A7A7A" }}
    >
      Coming soon
    </span>
  );
}

export function ServiceCard({ service, feeKobo, loaded = true }) {
  const Icon = service.icon;
  // Services with a real apply flow set applyHref explicitly; everything
  // else is informational for now and links to its public marketing page.
  const href = service.applyHref || `/services/${service.slug}`;

  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
      style={{ borderColor: PAPER_BORDER }}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: "#F4F1E9", color: INK }}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[13.5px] font-bold text-[#111111]">{service.title}</p>
          <p className="mt-0.5 truncate text-[12px] text-[#7A7A7A]">{service.tagline}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <CtaBadge service={service} feeKobo={feeKobo} loaded={loaded} />
        <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-500" />
      </div>
    </Link>
  );
}
