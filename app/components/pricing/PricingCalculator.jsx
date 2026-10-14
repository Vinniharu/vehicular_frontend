"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VEHICLE_CATEGORY_OPTIONS, isCommercialCategory } from "@/lib/constants/vehicleCategories";

function koboToNaira(kobo) {
  if (kobo == null) return null;
  return (kobo / 100).toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
}

// Mirrors the current app/services/_data.js child status for each variant —
// these are the same 3 "not really live yet" catalog entries the rest of
// the site already shows as disabled/coming-soon/off-sale (Learner's
// Permit, Fancy/Custom plates). If a status ever flips in _data.js, this
// list needs the matching one-line update — same precedent as the DL apply
// wizard's own hardcoded APPLICATION_TYPES / the number-plate wizard's
// PLATE_TYPES, neither of which derive from _data.js either.
const DL_VARIANTS = [
  { value: "fresh", label: "Fresh", hasTier: true },
  { value: "renewal", label: "Renewal", hasTier: true },
  { value: "reissue", label: "Re-issue", hasTier: true },
  { value: "learners_permit", label: "Learner's Permit", disabled: true, disabledLabel: "Coming soon" },
  { value: "international_permit", label: "International Driver's Permit (IDP)", hasTier: false },
];
const DL_TIERS = ["3 years", "5 years"];

const NUMBER_PLATE_VARIANTS = [
  { value: "number_plate_new", label: "New Registration" },
  { value: "number_plate_replacement", label: "Replacement" },
  { value: "number_plate_fancy", label: "Fancy / Custom Plate" },
  { value: "number_plate_change_of_ownership", label: "Change of Ownership" },
  { value: "number_plate_dealership", label: "Dealership Plate" },
];

const PARTICULARS_DOC_TYPES = [
  { value: "vehicle_licence", label: "Vehicle Licence" },
  { value: "road_worthiness", label: "Road Worthiness Certificate" },
  { value: "proof_of_ownership", label: "Proof of Ownership" },
  { value: "insurance_third_party", label: "Third-Party Insurance" },
  { value: "hackney_permit", label: "Hackney Permit" },
];

const inputCls =
  "mk-focus h-11 w-full rounded-xl border border-mk-line-strong bg-mk-surface px-3.5 text-[16px] text-mk-ink shadow-mk-sm outline-none transition-colors hover:border-mk-ink/30 focus:border-cx-brand sm:text-[14px]";
const labelCls = "mb-1.5 block text-[12.5px] font-semibold text-mk-ink-2";

function PriceLine({ label, value, muted }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-mk-line-strong bg-mk-surface px-3.5 py-2.5 text-[13.5px]">
      <span className="text-mk-muted">{label}</span>
      <span className={`text-right font-semibold ${value == null ? "" : "font-mono"} ${muted ? "text-mk-muted" : "text-mk-ink"}`}>
        {value == null ? "Contact us for a price" : koboToNaira(value)}
      </span>
    </div>
  );
}

function TotalBar({ total, note }) {
  return (
    <div className="mk-gradient-border mt-5 flex flex-col gap-4 rounded-mk p-4 shadow-mk sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="min-w-0" aria-live="polite">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-cx-brand-deep">Estimated total</p>
        <p
          className={`mt-1 font-semibold tracking-[-0.02em] text-mk-ink ${
            total == null ? "text-[18px]" : "font-mono text-[26px] sm:text-[28px]"
          }`}
        >
          {total == null ? "Contact us for a price" : koboToNaira(total)}
        </p>
        {note && <p className="mt-1 text-[12.5px] leading-relaxed text-mk-muted">{note}</p>}
      </div>
      <Link
        href="/auth/signup"
        className="mk-focus mk-shine group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-cx-brand px-6 text-[14px] font-semibold text-white shadow-mk-brand transition-colors hover:bg-cx-brand-deep active:scale-[0.98]"
      >
        Get started
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

function VehicleCountField({ value, onChange, label = "How many vehicles?", hint }) {
  return (
    <div>
      <label className={labelCls}>
        {label}
      </label>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
        className={inputCls}
      />
      {hint && (
        <p className="mt-1.5 text-[12px] leading-relaxed text-mk-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

function CategorySelect({ value, onChange }) {
  return (
    <div>
      <label className={labelCls}>Vehicle category</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        <option value="">Select category</option>
        {VEHICLE_CATEGORY_OPTIONS.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
    </div>
  );
}

function DriversLicenceCalculator({ feeSchedule }) {
  const [variant, setVariant] = useState("fresh");
  const [tier, setTier] = useState("3 years");
  const selected = DL_VARIANTS.find((v) => v.value === variant);

  const amountKobo = useMemo(() => {
    const row = feeSchedule.find(
      (p) => p.application_type === variant && (selected?.hasTier ? p.validity_period === tier : p.validity_period == null)
    );
    return row ? row.amount_kobo : null;
  }, [feeSchedule, variant, tier, selected]);

  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Application type</label>
        <select
          value={variant}
          onChange={(e) => {
            const next = DL_VARIANTS.find((v) => v.value === e.target.value);
            if (next?.disabled) return;
            setVariant(e.target.value);
          }}
          className={inputCls}
        >
          {DL_VARIANTS.map((v) => (
            <option key={v.value} value={v.value} disabled={v.disabled}>
              {v.label}{v.disabled ? ` — ${v.disabledLabel}` : ""}
            </option>
          ))}
        </select>
      </div>
      {selected?.hasTier && (
        <div>
          <p className={labelCls}>Validity period</p>
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-mk-line bg-mk-surface p-1 shadow-mk-sm" role="group" aria-label="Validity period">
            {DL_TIERS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTier(t)}
                aria-pressed={tier === t}
                className={`mk-focus h-11 rounded-lg text-[14px] font-semibold transition-colors ${
                  tier === t ? "bg-cx-brand-soft text-cx-brand-deep shadow-[inset_0_0_0_1px_rgba(40,167,69,0.35)]" : "text-mk-ink-2 hover:bg-mk-ink/[0.04]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
      <TotalBar total={amountKobo} />
    </div>
  );
}

function TintedPermitCalculator({ feeSchedule }) {
  const [vehicleCount, setVehicleCount] = useState(1);
  const perVehicle = useMemo(() => {
    const row = feeSchedule.find((p) => p.application_type === "tinted_permit");
    return row ? row.amount_kobo : null;
  }, [feeSchedule]);
  const total = perVehicle != null ? perVehicle * vehicleCount : null;

  return (
    <div className="space-y-4">
      <PriceLine label="Price per vehicle" value={perVehicle} />
      <VehicleCountField value={vehicleCount} onChange={setVehicleCount} />
      <TotalBar total={total} />
    </div>
  );
}

function NumberPlateCalculator({ feeSchedule, vehicleCategoryPrices = [] }) {
  const [variant, setVariant] = useState("number_plate_new");
  const [category, setCategory] = useState("saloon_private");
  const [vehicleCount, setVehicleCount] = useState(1);
  const isDealership = variant === "number_plate_dealership";
  const isCategoryPriced = variant === "number_plate_new" || variant === "number_plate_change_of_ownership";

  const perVehicle = useMemo(() => {
    if (isCategoryPriced && category) {
      const catRow = vehicleCategoryPrices.find(
        (p) => p.service_key === variant && p.vehicle_category === category
      );
      if (catRow && catRow.amount_kobo != null) return catRow.amount_kobo;
    }
    const row = feeSchedule.find((p) => p.application_type === variant && p.validity_period == null);
    return row ? row.amount_kobo : null;
  }, [feeSchedule, vehicleCategoryPrices, variant, category, isCategoryPriced]);

  const total = perVehicle != null ? perVehicle * (isDealership ? 1 : vehicleCount) : null;

  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Plate type</label>
        <select
          value={variant}
          onChange={(e) => {
            const next = NUMBER_PLATE_VARIANTS.find((v) => v.value === e.target.value);
            if (next?.disabled) return;
            setVariant(e.target.value);
          }}
          className={inputCls}
        >
          {NUMBER_PLATE_VARIANTS.map((v) => (
            <option key={v.value} value={v.value} disabled={v.disabled}>
              {v.label}{v.disabled ? ` — ${v.disabledLabel}` : ""}
            </option>
          ))}
        </select>
      </div>
      {isCategoryPriced && <CategorySelect value={category} onChange={setCategory} />}
      <PriceLine label={isDealership ? "Price" : "Price per vehicle"} value={perVehicle} />
      {!isDealership && <VehicleCountField value={vehicleCount} onChange={setVehicleCount} />}
      <TotalBar total={total} note={isDealership ? "No vehicle required — a plate issued against your dealership's identity." : null} />
    </div>
  );
}

function VehicleParticularsCalculator({ vehicleCategoryPrices }) {
  const [selectedDocTypes, setSelectedDocTypes] = useState(["vehicle_licence"]);
  const [category, setCategory] = useState("");
  const [vehicleCount, setVehicleCount] = useState(1);

  const hackneyEligible = category ? isCommercialCategory(category) : false;

  const priceByDocType = useMemo(() => {
    if (!category) return {};
    const map = {};
    for (const doc of PARTICULARS_DOC_TYPES) {
      const row = vehicleCategoryPrices.find((p) => p.service_key === doc.value && p.vehicle_category === category);
      map[doc.value] = row ? row.amount_kobo : null;
    }
    return map;
  }, [vehicleCategoryPrices, category]);

  const toggleDocType = (value) => {
    setSelectedDocTypes((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const perVehicleSum = useMemo(() => {
    if (!category || selectedDocTypes.length === 0) return null;
    let sum = 0;
    let anyPriced = false;
    for (const dt of selectedDocTypes) {
      const amount = priceByDocType[dt];
      if (amount != null) {
        sum += amount;
        anyPriced = true;
      }
    }
    return anyPriced ? sum : null;
  }, [category, selectedDocTypes, priceByDocType]);

  const total = perVehicleSum != null ? perVehicleSum * vehicleCount : null;

  return (
    <div className="space-y-4">
      <div>
        <p className={labelCls}>Documents to renew</p>
        <div className="space-y-2">
          {PARTICULARS_DOC_TYPES.map((doc) => {
            const isHackney = doc.value === "hackney_permit";
            const disabled = isHackney && !hackneyEligible;
            const checked = selectedDocTypes.includes(doc.value) && !disabled;
            return (
              <label
                key={doc.value}
                className={`flex min-h-[44px] items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${
                  checked ? "border-cx-brand/50 bg-cx-brand-soft" : "border-mk-line bg-mk-surface"
                } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-mk-line-strong"}`}
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleDocType(doc.value)}
                    className="h-4 w-4 shrink-0 accent-cx-brand"
                  />
                  <span className="text-[13.5px] font-semibold text-mk-ink">
                    {doc.label}
                    {isHackney && !hackneyEligible && (
                      <span className="ml-1.5 text-[11.5px] font-normal text-mk-muted">
                        (commercial vehicles only)
                      </span>
                    )}
                  </span>
                </span>
                {category && (
                  <span className={`shrink-0 text-[12.5px] font-semibold text-mk-ink-2 ${priceByDocType[doc.value] == null ? "" : "font-mono"}`}>
                    {priceByDocType[doc.value] == null ? "Contact us" : koboToNaira(priceByDocType[doc.value])}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>
      <CategorySelect value={category} onChange={setCategory} />
      <VehicleCountField
        value={vehicleCount}
        onChange={setVehicleCount}
        label="How many vehicles of this category?"
        hint="One category applies to every vehicle counted here — for a mix of categories, run the calculator once per category."
      />
      <TotalBar total={total} note={!category ? "Select a vehicle category to see prices." : null} />
    </div>
  );
}

const CALCULATORS = {
  "drivers-licence": DriversLicenceCalculator,
  "number-plate": NumberPlateCalculator,
  "vehicle-particulars": VehicleParticularsCalculator,
  "tinted-permit": TintedPermitCalculator,
};

export default function PricingCalculator({ serviceSlug, feeSchedule, vehicleCategoryPrices }) {
  const Calculator = CALCULATORS[serviceSlug];
  if (!Calculator) return null;
  return <Calculator feeSchedule={feeSchedule} vehicleCategoryPrices={vehicleCategoryPrices} />;
}
