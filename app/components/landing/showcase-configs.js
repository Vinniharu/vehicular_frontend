/**
 * Per-service ShowcaseConfig for every /services/:slug landing page.
 */

export const SHOWCASES = {
  /* ─────────────────────── Drivers Licence ─────────────────────── */
  drivers_licence: {
    screens: [
      {
        kind: "status_ring",
        eyebrow: "Driver's Licence",
        title: "Apply in minutes",
        sub: "Fresh, renewal, or re-issue.",
        ringValue: 100,
        ringLabel: "Ready",
        tiles: ["Fresh DL", "Renewal", "Re-issue", "Status"],
      },
      {
        kind: "tracker",
        title: "Driver's Licence — Renewal",
        meta: "SR-2412 · 3-year licence",
        stages: ["Paid", "Assigned", "Capture", "Done", "Ready"],
        currentStage: 2,
        progressPct: 60,
        agent: { initial: "F", line1: "Capture slot booked", line2: "FRSC centre · Tomorrow, 10:30 AM" },
        doc: { line1: "Theory passed", line2: "Score 92% · valid for application" },
      },
      {
        kind: "certificate",
        eyebrow: "Delivered",
        title: "Your licence is ready",
        docTitle: "Driver's Licence",
        docMeta: "Expires Aug 2029 · 3-year class",
        footer: "Federal Road Safety Corps",
        bigStat: { value: "0 trips", label: "to the FRSC office" },
      },
    ],
    cards: [
      { kind: "check", title: "Theory test passed", sub: "Auto-enrolled the moment you apply" },
      { kind: "ring", label: "Application progress", value: 80, big: "80%" },
      { kind: "bell", title: "Capture slot confirmed", sub: "Nearest accredited centre" },
    ],
  },

  /* ─────────────────────── Vehicle Particulars ─────────────────────── */
  vehicle_particulars: {
    screens: [
      {
        kind: "status_ring",
        eyebrow: "Particulars renewal",
        title: "All papers, one tap",
        sub: "Road Worthiness, Insurance, Hackney, Proof of Ownership.",
        ringValue: 94,
        ringLabel: "Compliant",
        tiles: ["Licence", "Roadworthy", "Insurance", "Hackney", "Proof", "Delivery"],
      },
      {
        kind: "tracker",
        title: "Particulars Renewal — Toyota Camry",
        meta: "SR-2406 · LSD-284-AB",
        stages: ["Paid", "Assigned", "MVAA", "Done", "Delivered"],
        currentStage: 2,
        progressPct: 60,
        agent: { initial: "A", line1: "Agent AGT-A047 is sorting your papers", line2: "Renewal in progress at MVAA" },
      },
      {
        kind: "certificate",
        eyebrow: "Completed",
        title: "Papers delivered",
        docTitle: "Vehicle Particulars Bundle",
        docMeta: "3 documents renewed · Valid 1 year",
        footer: "MVAA / FRSC / NAICOM",
        bigStat: { value: "100%", label: "compliance score" },
      },
    ],
    cards: [
      { kind: "check", title: "Papers renewed", sub: "Vehicle Licence, Road Worthiness, Insurance" },
      { kind: "ring", label: "Compliance score", value: 94, big: "94%" },
      { kind: "bell", title: "Rider dispatched", sub: "Originals en route to your address" },
    ],
  },

  /* ─────────────────────── Number Plate ─────────────────────── */
  number_plate: {
    screens: [
      {
        kind: "status_ring",
        eyebrow: "Number plates",
        title: "Plates delivered",
        sub: "Standard private, commercial, fancy/custom or replacement.",
        ringValue: 100,
        ringLabel: "Ready",
        tiles: ["Private", "Commercial", "Custom/Fancy", "Replacement", "Out of state", "Status"],
      },
      {
        kind: "tracker",
        title: "New Private Number Plate",
        meta: "SR-2418 · Standard pair",
        stages: ["Paid", "Assigned", "Stamping", "Ready", "Delivered"],
        currentStage: 2,
        progressPct: 60,
        agent: { initial: "P", line1: "At the plate shop", line2: "MLAS issuing your code now" },
      },
      {
        kind: "certificate",
        eyebrow: "Delivered",
        title: "Plates handed over",
        docTitle: "Number Plate Pair",
        docMeta: "LAG-842-KJA · Private vehicle",
        footer: "Motor Vehicle Administration Agency",
        bigStat: { value: "2 plates", label: "front & rear + mounting kit" },
      },
    ],
    cards: [
      { kind: "check", title: "Plate number allocated", sub: "LAG-842-KJA · registered against VIN" },
      { kind: "ring", label: "Stamping complete", value: 100, big: "100%" },
      { kind: "bell", title: "Out for delivery", sub: "Rider arriving by 3:00 PM today" },
    ],
  },

  /* ─────────────────────── Roadworthiness Express ─────────────────────── */
  rwx_lagos: {
    screens: [
      {
        kind: "status_ring",
        eyebrow: "Roadworthiness Express",
        title: "Inspection at home",
        sub: "We bring the inspection to your driveway. No LACVIS lines.",
        ringValue: 100,
        ringLabel: "Passed",
        tiles: ["Home visit", "Office visit", "Pre-check", "Certificate", "Re-test", "Help"],
      },
      {
        kind: "tracker",
        title: "Home Inspection — Toyota Corolla",
        meta: "SR-2430 · 14 Admiralty Way, Lekki",
        stages: ["Booked", "Inspector out", "Inspection", "Passed", "Issued"],
        currentStage: 1,
        progressPct: 40,
        agent: { initial: "K", line1: "Inspector Kelvin · 12 mins away", line2: "Live location shared" },
      },
      {
        kind: "certificate",
        eyebrow: "Certified",
        title: "Roadworthiness active",
        docTitle: "Roadworthiness Certificate",
        docMeta: "Valid 1 year · All checks passed",
        footer: "Lagos State LACVIS / VIO",
        bigStat: { value: "0 mins", label: "spent waiting in line" },
      },
    ],
    cards: [
      { kind: "check", title: "Inspection passed", sub: "Brakes, lights, suspension & emissions OK" },
      { kind: "ring", label: "Vehicle health", value: 96, big: "96%" },
      { kind: "bell", title: "Inspector arriving", sub: "Kelvin is 12 mins out — track live" },
    ],
  },

  /* ─────────────────────── Tinted Permit ─────────────────────── */
  tinted_permit: {
    screens: [
      {
        kind: "status_ring",
        eyebrow: "Tinted Permit",
        title: "NPF approved",
        sub: "Factory or medical tint approval without leaving your desk.",
        ringValue: 100,
        ringLabel: "Approved",
        tiles: ["Factory tint", "Medical tint", "Verification", "Replacement", "Fleet", "Status"],
      },
      {
        kind: "tracker",
        title: "Factory Tint Permit Application",
        meta: "SR-2441 · Mercedes C300",
        stages: ["Submitted", "Vetting", "NPF Review", "Approved", "Delivered"],
        currentStage: 2,
        progressPct: 60,
        agent: { initial: "P", line1: "Application under NPF review", line2: "Vetting passed · awaiting approval" },
      },
      {
        kind: "certificate",
        eyebrow: "Issued",
        title: "Permit delivered",
        docTitle: "NPF Tinted Glass Permit",
        docMeta: "Registration: KJA-918-CF · Factory Glass",
        footer: "Nigeria Police Force Headquarters",
        bigStat: { value: "QR coded", label: "instant police check verification" },
      },
    ],
    cards: [
      { kind: "check", title: "NPF approval granted", sub: "Official QR code generated against chassis" },
      { kind: "ring", label: "Processing done", value: 100, big: "100%" },
      { kind: "bell", title: "Permit ready", sub: "Soft copy in app + hard copy en route" },
    ],
  },

  /* ─────────────────────── Pre-purchase Inspection ─────────────────────── */
  pre_purchase_inspection: {
    screens: [
      {
        kind: "list",
        eyebrow: "Pre-purchase inspection",
        title: "Know before you buy",
        rows: [
          { title: "Engine & transmission", sub: "Oil analysis, scan codes, compression check", positive: true },
          { title: "Body & accident checks", sub: "Paint depth gauge, frame alignment, flood check", positive: true },
          { title: "Suspension & brakes", sub: "Road test, bushings, shocks & pad thickness", positive: true },
          { title: "Paperwork & database verification", sub: "VIN cross-check, Interpol, Customs PAAR", positive: true },
        ],
      },
      {
        kind: "tracker",
        title: "150-Point Inspection — 2019 Lexus RX350",
        meta: "SR-2455 · Seller location: Ikeja GRA",
        stages: ["Booked", "On site", "Inspecting", "Report ready", "Consultation"],
        currentStage: 2,
        progressPct: 60,
        agent: { initial: "M", line1: "Mechanic Musa on site", line2: "Capturing checklist evidence" },
      },
      {
        kind: "certificate",
        eyebrow: "Report delivered",
        title: "Inspection grade: A−",
        docTitle: "150-Point Vehicle Health Report",
        docMeta: "Recommended to BUY with minor notes",
        footer: "Vehiculars Certified Inspection",
        bigStat: { value: "48 photos", label: "+ 12-min video walkthrough included" },
      },
    ],
    cards: [
      { kind: "check", title: "No flood damage found", sub: "Carpet inspection & ECU contacts clean" },
      { kind: "ring", label: "Overall condition", value: 88, big: "88/100" },
      { kind: "bell", title: "Report uploaded", sub: "View full PDF with mechanic commentary" },
    ],
  },

};
