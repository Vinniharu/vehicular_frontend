"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VEHICLE_CATEGORY_OPTIONS, isCommercialCategory } from "@/lib/constants/vehicleCategories";
import { GREEN, INK, INK_SOFT, PAPER } from "@/app/components/landing/theme";

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
  { value: "fancy_custom", label: "Fancy / Custom Plate", disabled: true, disabledLabel: "Off sale" },
  { value: "number_plate_change_of_ownership", label: "Change of Ownership" },
];

const PARTICULARS_DOC_TYPES = [
  { value: "vehicle_licence", label: "Vehicle Licence" },
  { value: "road_worthiness", label: "Road Worthiness Certificate" },
  { value: "proof_of_ownership", label: "Proof of Ownership" },
  { value: "insurance_third_party", label: "Third-Party Insurance" },
  { value: "hackney_permit", label: "Hackney Permit" },
];

const inputCls =
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-[13.5px] outline-none transition-colors focus:border-emerald-400";

function PriceLine({ label, value, muted }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-[13.5px]">
      <span style={{ color: INK_SOFT }}>{label}</span>
      <span className="font-semibold" style={{ color: muted ? INK_SOFT : INK }}>
        {value == null ? "Contact us for a price" : koboToNaira(value)}
      </span>
    </div>
  );
}

function TotalBar({ total, note }) {
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between" style={{ background: PAPER }}>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: INK_SOFT }}>Estimated total</p>
        <p className="text-[22px] font-bold" style={{ color: INK }}>{total == null ? "Contact us for a price" : koboToNaira(total)}</p>
        {note && <p className="mt-1 text-[12px]" style={{ color: INK_SOFT }}>{note}</p>}
      </div>
      <Link
        href="/auth/signup"
        className="inline-flex items-center justify-center gap-2 rounded-xl text-[13.5px] font-semibold text-white"
        style={{ background: GREEN, padding: "10px 20px" }}
      >
        Get started
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function VehicleCountField({ value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold" style={{ color: INK_SOFT }}>
        How many vehicles of this category?
      </label>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
        className={inputCls}
      />
      <p className="mt-1 text-[11.5px]" style={{ color: INK_SOFT }}>
        One category applies to every vehicle counted here — for a mix of categories, run the calculator once per category.
      </p>
    </div>
  );
}

function CategorySelect({ value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold" style={{ color: INK_SOFT }}>Vehicle category</label>
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
        <label className="mb-1.5 block text-[12px] font-semibold" style={{ color: INK_SOFT }}>Application type</label>
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
          <label className="mb-1.5 block text-[12px] font-semibold" style={{ color: INK_SOFT }}>Validity period</label>
          <div className="flex gap-2">
            {DL_TIERS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTier(t)}
                className="flex-1 rounded-xl border py-2.5 text-[13px] font-semibold transition-colors"
                style={{ borderColor: tier === t ? GREEN : "#e2e8f0", background: tier === t ? "#F0FDF4" : "#fff", color: tier === t ? GREEN : INK }}
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

function NumberPlateCalculator({ vehicleCategoryPrices }) {
  const [variant, setVariant] = useState("number_plate_new");
  const [category, setCategory] = useState("");
  const [vehicleCount, setVehicleCount] = useState(1);

  const perVehicle = useMemo(() => {
    if (!category) return undefined; // undefined = "pick a category", distinct from null = "no price configured"
    const row = vehicleCategoryPrices.find((p) => p.service_key === variant && p.vehicle_category === category);
    return row ? row.amount_kobo : null;
  }, [vehicleCategoryPrices, variant, category]);

  const total = category && perVehicle != null ? perVehicle * vehicleCount : null;

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-[12px] font-semibold" style={{ color: INK_SOFT }}>Plate type</label>
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
      <CategorySelect value={category} onChange={setCategory} />
      {category && <PriceLine label="Price per vehicle" value={perVehicle} />}
      <VehicleCountField value={vehicleCount} onChange={setVehicleCount} />
      <TotalBar total={total} note={!category ? "Select a vehicle category to see a price." : null} />
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
        <label className="mb-1.5 block text-[12px] font-semibold" style={{ color: INK_SOFT }}>Documents to renew</label>
        <div className="space-y-2">
          {PARTICULARS_DOC_TYPES.map((doc) => {
            const isHackney = doc.value === "hackney_permit";
            const disabled = isHackney && !hackneyEligible;
            const checked = selectedDocTypes.includes(doc.value) && !disabled;
            return (
              <label
                key={doc.value}
                className="flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5"
                style={{ borderColor: checked ? GREEN : "#e2e8f0", background: checked ? "#F0FDF4" : "#fff", opacity: disabled ? 0.5 : 1 }}
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleDocType(doc.value)}
                    className="h-4 w-4"
                    style={{ accentColor: GREEN }}
                  />
                  <span className="text-[13px] font-semibold" style={{ color: INK }}>
                    {doc.label}
                    {isHackney && !hackneyEligible && (
                      <span className="ml-1.5 text-[11px] font-normal" style={{ color: INK_SOFT }}>
                        (commercial vehicles only)
                      </span>
                    )}
                  </span>
                </span>
                {category && (
                  <span className="text-[12.5px] font-semibold" style={{ color: INK_SOFT }}>
                    {priceByDocType[doc.value] == null ? "Contact us" : koboToNaira(priceByDocType[doc.value])}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>
      <CategorySelect value={category} onChange={setCategory} />
      <VehicleCountField value={vehicleCount} onChange={setVehicleCount} />
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
