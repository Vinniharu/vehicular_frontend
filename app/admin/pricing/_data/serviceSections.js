// The admin pricing page's own catalog of every priced service, mirroring
// app/services/_data.js's structure and titles directly (not derived from
// it by filtering) — a service that needs no flat/service_prices row simply
// never has one declared here, so there's no exclusion list to fall out of
// sync. An entry with only a `categoryGrid` (no `rows`) can never produce a
// service_prices payload entry — that's what fixed a past
// "saved-through-the-flat-Other-Services-card 422s" bug for an entry that
// used to be category-only. physical-condition-inspection was that entry
// until the field-mechanic restructure moved it to flat/state pricing (see
// below) — it now carries `rows`, no `categoryGrid`.
//
// Shape:
//   { slug, title, subtitle, badge?,
//     subServices?: [{ key, label, rows?: [rowSpec], categoryGrid?: { service_key } }],
//     rows?: [rowSpec], categoryGrid?: { service_key } }
//
// rowSpec mechanisms:
//   { mechanism: "dl", key, application_type, validity_period, label, amountRequired }
//   { mechanism: "service", key /* = slug */, slug, label }
//   { mechanism: "particulars", key /* = document_type */, document_type, label }
//
// A card with `subServices` renders one sub-panel per entry. A card with no
// `subServices` renders its own `rows`/`categoryGrid` directly under its
// header. Vehicle Particulars' sub-services are the only entries that carry
// BOTH `rows` (their flat fallback price) and `categoryGrid` (their 12-cell
// grid) at once.
//
// Note: DARK_SERVICES (customer-hidden catalog entries) is currently empty
// — if a dark service is ever added back, it also needs its own entry here;
// nothing derives this list from the catalog automatically.
//
// Sub-service order within each entry is intentionally kept in sync with
// that service's `children` order in app/services/_data.js — check both
// when adding/reordering a sub-service.
export const SERVICE_SECTIONS = [
  {
    slug: "drivers-licence",
    title: "Driver's Licence Services",
    subtitle: "These prices drive real checkout charges and the agent commission split.",
    subServices: [
      {
        key: "fresh",
        label: "New Driver's Licence (Fresh)",
        rows: [
          { mechanism: "dl", key: "fresh:3 years", application_type: "fresh", validity_period: "3 years", label: "3 years", amountRequired: true },
          { mechanism: "dl", key: "fresh:5 years", application_type: "fresh", validity_period: "5 years", label: "5 years", amountRequired: true },
        ],
      },
      {
        key: "renewal",
        label: "Driver's Licence Renewal (Reissue uses this price too)",
        rows: [
          { mechanism: "dl", key: "renewal:3 years", application_type: "renewal", validity_period: "3 years", label: "3 years", amountRequired: true },
          { mechanism: "dl", key: "renewal:5 years", application_type: "renewal", validity_period: "5 years", label: "5 years", amountRequired: true },
        ],
      },
      {
        key: "international-permit",
        label: "International Driver's Permit (IDP)",
        rows: [
          { mechanism: "dl", key: "international_permit:null", application_type: "international_permit", validity_period: null, label: "Amount", amountRequired: true },
        ],
      },
      // learners-permit: catalog status "coming_soon" — no application_type,
      // no dl_fee_schedule row exists or is expected. Deliberately no entry.
    ],
  },
  {
    slug: "number-plate",
    title: "Number Plate Services",
    subtitle: "One flat, state-aware price per plate type — not a fallback under a category grid.",
    subServices: [
      {
        key: "new-registration",
        label: "New Number Plate Registration",
        rows: [{ mechanism: "dl", key: "number_plate_new:null", application_type: "number_plate_new", validity_period: null, label: "Amount", amountRequired: true }],
      },
      {
        key: "replacement",
        label: "Plate Replacement",
        rows: [{ mechanism: "dl", key: "number_plate_replacement:null", application_type: "number_plate_replacement", validity_period: null, label: "Amount", amountRequired: true }],
      },
      {
        key: "fancy-custom",
        label: "Fancy / Custom Number Plate",
        rows: [{ mechanism: "dl", key: "number_plate_fancy:null", application_type: "number_plate_fancy", validity_period: null, label: "Amount", amountRequired: true }],
      },
      {
        key: "change-of-ownership",
        label: "Change of Ownership + New Plate",
        rows: [{ mechanism: "dl", key: "number_plate_change_of_ownership:null", application_type: "number_plate_change_of_ownership", validity_period: null, label: "Amount", amountRequired: true }],
      },
    ],
  },
  {
    slug: "vehicle-particulars",
    title: "Vehicle Particulars & Renewals",
    subtitle: "Each document is priced by vehicle category, with a flat fallback used when a vehicle has no category, or that category has no price set.",
    subServices: [
      {
        key: "vehicle-licence",
        label: "Vehicle Licence",
        rows: [{ mechanism: "particulars", key: "vehicle_licence", document_type: "vehicle_licence", label: "Fallback price (all categories)" }],
        categoryGrid: { service_key: "vehicle_licence" },
      },
      {
        key: "road-worthiness",
        label: "Road Worthiness Certificate",
        rows: [{ mechanism: "particulars", key: "road_worthiness", document_type: "road_worthiness", label: "Fallback price (all categories)" }],
        categoryGrid: { service_key: "road_worthiness" },
      },
      {
        key: "hackney-permit",
        label: "Hackney Permit",
        rows: [{ mechanism: "particulars", key: "hackney_permit", document_type: "hackney_permit", label: "Fallback price (all categories)" }],
        categoryGrid: { service_key: "hackney_permit" },
      },
      {
        key: "third-party-insurance",
        label: "Third-Party Insurance",
        rows: [{ mechanism: "particulars", key: "insurance_third_party", document_type: "insurance_third_party", label: "Fallback price (all categories)" }],
        categoryGrid: { service_key: "insurance_third_party" },
      },
      {
        key: "proof-of-ownership",
        label: "Proof of Ownership",
        rows: [{ mechanism: "particulars", key: "proof_of_ownership", document_type: "proof_of_ownership", label: "Fallback price (all categories)" }],
        categoryGrid: { service_key: "proof_of_ownership" },
      },
    ],
  },
  {
    slug: "vehicle-verification",
    title: "Vehicle Verification & Inspection",
    subtitle: "Price depends on which check the customer chooses — both flat, no category dimension.",
    subServices: [
      {
        key: "registration-history",
        label: "Registration History",
        rows: [{ mechanism: "dl", key: "vehicle_verification_registration_history:null", application_type: "vehicle_verification_registration_history", validity_period: null, label: "Amount", amountRequired: true }],
      },
      {
        key: "customs-duty",
        label: "Customs Duty",
        rows: [{ mechanism: "dl", key: "vehicle_verification_customs_duty:null", application_type: "vehicle_verification_customs_duty", validity_period: null, label: "Amount", amountRequired: true }],
      },
    ],
  },
  {
    // Flat, state-tiered fee (not vehicle-category-based, as of the field-
    // mechanic restructure) — same mechanism as RWX/ECMR below.
    // vehicle_category is still collected on the booking form, but purely
    // informational (helps the mechanic know what to expect).
    slug: "physical-condition-inspection",
    title: "Physical Condition Inspection",
    subtitle: "One fee for every vehicle — you can still set a different price per state. This price is checkout-authoritative.",
    rows: [{ mechanism: "service", key: "physical-condition-inspection", slug: "physical-condition-inspection", label: "Amount" }],
  },
  {
    slug: "central-motor-registry",
    title: "ECMR",
    subtitle: "One flat fee for every vehicle. This price is checkout-authoritative.",
    rows: [{ mechanism: "service", key: "central-motor-registry", slug: "central-motor-registry", label: "Amount" }],
  },
  {
    slug: "roadworthiness-express",
    title: "Roadworthiness Express (RWX)",
    subtitle: "One flat, state-aware fee. This price is checkout-authoritative.",
    rows: [{ mechanism: "service", key: "roadworthiness-express", slug: "roadworthiness-express", label: "Amount" }],
  },
  {
    slug: "tinted-permit",
    title: "Tinted Glass Permit",
    subtitle: "Flat fee, state-aware.",
    rows: [{ mechanism: "dl", key: "tinted_permit:null", application_type: "tinted_permit", validity_period: null, label: "Amount", amountRequired: true }],
  },
];
