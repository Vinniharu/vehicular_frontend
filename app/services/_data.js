/**
 * Single source of truth for every Vehiculars service page — parent
 * services (some with child sub-services), transcribed from the services
 * breakdown doc. Drives the hub page, the [slug] parent template, and the
 * [slug]/[child] template via generateStaticParams.
 *
 * `status` (parent AND child level) replaces the old `cta` object and is
 * the single thing every consumer (this file's pages, ServicesList.jsx,
 * landing-data.js, admin/pricing/page.jsx) reads to decide what to render:
 *   - "live"         real backend + wizard behind it (applyHref set)
 *   - "coming_soon"  no backend at all yet
 *   - "off_sale"     backend/marketing description exists but deliberately
 *                     not purchasable right now
 *   - "dark"         see DARK_SERVICES below — not exported in SERVICES at
 *                     all, so it's genuinely unreachable, not just hidden
 */
import {
  CreditCard,
  Hash,
  FileText,
  BadgeCheck,
  ShieldCheck,
  Sun,
  Ship,
  Wrench,
  UserCheck,
  Gift,
  GraduationCap,
} from "lucide-react";

export const SERVICES = [
  {
    slug: "drivers-licence",
    icon: CreditCard,
    category: "Other documents",
    status: "live",
    applyHref: "/dashboard/apply",
    feeScheduleType: "drivers_licence",
    title: "Driver's Licence Services",
    tagline:
      "Fresh DL, renewal, re-issue, learner's permit, and international permit — all processed nationwide without the FRSC queue.",
    intro:
      "Whether you're getting your first licence or replacing a lost one, we handle the FRSC and VIO end of it so you only show up for biometrics. Pick the option that fits your situation below.",
    whatsIncluded: [
      "End-to-end FRSC / VIO processing",
      "Biometric capture slot at the nearest accredited centre",
      "Status updates at every stage in your dashboard",
      "Physical licence delivered to you nationwide",
    ],
    whatYouBring: [
      "Valid NIN",
      "Recent passport photograph",
      "Existing licence (for renewal / re-issue)",
      "Theory test pass (fresh DL applicants only — free trial inside the app)",
    ],
    pricingNote: null,
    howItWorks: [
      { title: "Pick your DL option", desc: "Fresh, renewal, re-issue, learner's, or IDP." },
      { title: "Book and pay", desc: "Pay in full or use Easy Installment." },
      { title: "Submit your details", desc: "NIN, photo, and ID upload — all in the app." },
      { title: "Biometric capture", desc: "We schedule your visit to the nearest centre." },
      { title: "Get your licence", desc: "Delivered to you and tracked in the app." },
    ],
    children: [
      {
        slug: "fresh",
        status: "live",
        title: "New Driver's Licence (Fresh)",
        blurb:
          "Getting your first licence? We book your biometric slot at the nearest accredited capture centre, handle FRSC and VIO processing, and deliver the physical licence. Fresh applicants need a theory pass — take it free inside the app.",
      },
      {
        slug: "renewal",
        status: "live",
        title: "Driver's Licence Renewal",
        blurb:
          "Existing DL holders only — submit your current licence and NIN, we book your biometric refresh, and deliver the renewed licence in about two weeks.",
      },
      {
        slug: "re-issue",
        status: "live",
        title: "Lost / Damaged DL Re-issue",
        blurb:
          "We handle the affidavit, FRSC application, and biometrics so you walk away with a fresh card without standing in a single queue.",
      },
      {
        slug: "learners-permit",
        status: "coming_soon",
        title: "Learner's Permit",
        blurb:
          "Apply for the official VIO learner's permit so you can practise legally while you prepare for your full DL. This is on our roadmap — not bookable yet.",
      },
      {
        slug: "international-permit",
        status: "live",
        title: "International Driver's Permit (IDP)",
        blurb:
          "If you're travelling, hiring a car, or relocating temporarily, the IDP translates your Nigerian DL for use in over 150 countries. We process it via FRSC and deliver it to you.",
      },
    ],
  },
  {
    slug: "number-plate",
    icon: Hash,
    category: "Number plates",
    status: "live",
    applyHref: "/dashboard/apply/number-plate",
    feeScheduleType: "number_plate",
    title: "Number Plate Services",
    tagline:
      "New plates, replacements, and change of ownership — processed by VIO without the queue.",
    intro:
      "Number plate jobs are routed to our VIO desk so you don't spend a day at the licensing office. Pick the option that matches what you need.",
    whatsIncluded: [
      "VIO processing and plate allocation",
      "Plate production",
      "Delivered to you nationwide",
      "Status tracking in your dashboard",
    ],
    whatYouBring: [
      "Vehicle particulars (or proof of ownership)",
      "Valid ID (NIN slip or DL)",
      "For change of ownership: signed transfer documents",
    ],
    pricingNote: null,
    howItWorks: [
      { title: "Choose your plate type", desc: "Standard, replacement, or with change of ownership." },
      { title: "Pay and submit", desc: "Upload vehicle papers and ID." },
      { title: "We process at VIO", desc: "Allocation and production handled by our team." },
      { title: "Delivered to you", desc: "Notification sent the moment your plate ships." },
    ],
    children: [
      {
        slug: "new-registration",
        status: "live",
        title: "New Number Plate Registration",
        blurb:
          "Newly bought or imported vehicle? We allocate and produce your standard plate via VIO, then deliver it to you nationwide.",
      },
      {
        slug: "replacement",
        status: "live",
        title: "Plate Replacement",
        blurb:
          "If your plates are illegible or one has gone missing, we replace them through VIO so you stay compliant with traffic and law-enforcement checks.",
      },
      {
        slug: "fancy-custom",
        status: "off_sale",
        title: "Fancy / Custom Number Plate",
        blurb:
          "Personalised plates that fit your name, business, or anniversary — currently off sale while we finalise the allocation process with VIO.",
      },
      {
        slug: "change-of-ownership",
        status: "live",
        title: "Change of Ownership + New Plate",
        blurb:
          "Just bought a used vehicle? We handle the ownership transfer at VIO and produce a fresh plate in your name — fully road-legal in your hands.",
      },
    ],
  },
  {
    slug: "vehicle-particulars",
    icon: FileText,
    category: "Vehicle particulars",
    status: "live",
    applyHref: "/dashboard/apply/vehicle-particulars",
    feeScheduleType: "vehicle_particulars",
    title: "Vehicle Particulars & Renewals",
    tagline:
      "Vehicle licence, road worthiness, hackney permit, third-party insurance, and proof of ownership — renewed without queueing.",
    intro:
      "Keep your vehicle papers current without leaving home. Pick any combination of documents in one request, pay once, and we process each with the right MDA — soft copy uploaded to your dashboard, each with its own expiry date.",
    whatsIncluded: [
      "Direct processing with the issuing authority",
      "Soft copy of each renewed document uploaded to your dashboard",
      "Independent tracking per document — one running late never holds up the others",
      "Staff review before your request is released to a field agent",
    ],
    whatYouBring: [
      "Current vehicle particulars (for renewals)",
      "Valid ID",
      "Commercial registration evidence (for the hackney permit only)",
    ],
    pricingNote: "Pay only for the documents you select — priced individually and summed at checkout.",
    howItWorks: [
      { title: "Pick your documents", desc: "Any combination of vehicle licence, road worthiness, hackney permit, third-party insurance, or proof of ownership." },
      { title: "Upload evidence & pay", desc: "One payment covers everything you selected." },
      { title: "Staff review, then processing", desc: "Verified before release to a field agent, then processed per document." },
      { title: "Receive your documents", desc: "Each renewed document delivered independently, with its own expiry date." },
    ],
    children: [
      {
        slug: "vehicle-licence",
        status: "live",
        title: "Vehicle Licence",
        blurb:
          "Your vehicle licence is the basic compliance document every vehicle on the road needs. We renew it directly with the MDA and deliver soft + hard copies.",
      },
      {
        slug: "road-worthiness",
        status: "live",
        title: "Road Worthiness Certificate",
        blurb:
          "Required for every commercial and private vehicle. We schedule the inspection and produce the certificate in about five working days. Need it same-day? See Roadworthiness Express.",
      },
      {
        slug: "hackney-permit",
        status: "live",
        title: "Hackney Permit",
        blurb:
          "If your vehicle is used commercially, the hackney permit is mandatory. We process it via the MDA and deliver alongside other commercial-required papers.",
      },
      {
        slug: "third-party-insurance",
        status: "live",
        title: "Third-Party Insurance",
        blurb:
          "Third-party is the minimum legal cover for every vehicle in Nigeria. It pays for damage you cause to others — not your own vehicle. We arrange it with a vetted underwriter and deliver the certificate.",
        note: "Need comprehensive cover instead? It's available on request, quoted separately — comprehensive isn't part of the standard bundle above.",
      },
      {
        slug: "proof-of-ownership",
        status: "live",
        title: "Proof of Ownership",
        blurb:
          "We process the proof-of-ownership certificate through the issuing MDA so your records match your vehicle. Essential whenever you sell, insure, or transfer the vehicle.",
      },
    ],
  },
  {
    slug: "vehicle-verification",
    icon: BadgeCheck,
    category: "Other documents",
    status: "coming_soon",
    title: "Vehicle Verification & Inspection",
    tagline: "Bumper-to-bumper vehicle inspection — before you buy, or whenever a dispute needs an independent answer.",
    intro:
      "Whether you're about to buy a used car or need an independent answer during a dispute, our inspectors and records checks cover the vehicle end to end: mechanical condition, body and chassis integrity, mileage authenticity, plus a VIO and police records cross-check against the plate, chassis (VIN), and engine number — ownership trace and any outstanding liens included. You get a clear, written report: pass, flagged, or needs further investigation.",
    whatsIncluded: [
      "Mechanical and electrical check",
      "Body, paintwork, and chassis integrity",
      "Mileage and VIN authentication",
      "VIO records check (plate, chassis, engine)",
      "Police records check (stolen / wanted)",
      "Ownership trace and any outstanding liens",
      "Written report with photos in your dashboard",
    ],
    whatYouBring: [
      "Vehicle plate number (optional if pre-purchase)",
      "Chassis (VIN) — compulsory",
      "Make, model, and year",
      "Address where the vehicle is available for inspection",
    ],
    pricingNote: null,
    howItWorks: [
      { title: "Submit vehicle details", desc: "Plate (if known), VIN, make, model, year, and where the car is." },
      { title: "We dispatch an inspector", desc: "The nearest available specialist is routed automatically." },
      { title: "Inspection + records check", desc: "On-site inspection alongside a VIO and police records cross-check." },
      { title: "Receive your report", desc: "Photos, findings, and a clear pass/flagged recommendation." },
    ],
    children: null,
  },
  {
    slug: "roadworthiness-express",
    icon: ShieldCheck,
    category: "Fast-track & logistics",
    status: "coming_soon",
    title: "Roadworthiness Express (RWX)",
    tagline: "Same-day roadworthiness certificate at a Vehiculars bay — distinct from the standard road worthiness renewal in Vehicle Particulars.",
    intro:
      "When you need road worthiness fast — fleet renewal, expired papers, or you've just been pulled over — RWX moves you to the front of the queue and turns it around the same day at our own inspection bay, rather than the ~5 working day standard renewal under Vehicle Particulars.",
    whatsIncluded: [
      "Same-day vehicle inspection at a Vehiculars bay",
      "Roadworthiness certificate (12 months)",
      "Soft copy uploaded immediately, hard copy delivered",
    ],
    whatYouBring: ["Current vehicle particulars", "Valid ID", "The vehicle (for the inspection slot)"],
    pricingNote: null,
    howItWorks: [
      { title: "Book the RWX slot", desc: "Pay and pick a same-day window." },
      { title: "Bring the vehicle in", desc: "Drive to our RWX bay at your booked slot — the inspection is done there." },
      { title: "Inspection + certificate", desc: "Done in one visit — you leave with paperwork." },
    ],
    children: null,
  },
  {
    slug: "tinted-permit",
    icon: Sun,
    category: "Other documents",
    status: "live",
    applyHref: "/dashboard/apply/tinted-permit",
    feeScheduleType: "tinted_permit",
    title: "Tinted Glass Permit",
    tagline: "Police-issued tinted glass permit, processed without the back-and-forth.",
    intro:
      "If your vehicle has factory or aftermarket tinted glass, you need a police permit to avoid stops and fines. We process it with the appropriate police authority and deliver the permit to you.",
    whatsIncluded: ["Police tinted glass permit", "Soft copy in your dashboard", "Hard copy delivered to your address"],
    whatYouBring: ["Vehicle particulars", "Valid ID (NIN or DL)", "Recent photo of the vehicle showing the tint"],
    pricingNote: null,
    howItWorks: [
      { title: "Submit details", desc: "Vehicle info, ID, and tint photo." },
      { title: "We process at the police authority", desc: "Application, vetting, and approval." },
      { title: "Receive your permit", desc: "Soft copy first, hard copy within a few days." },
    ],
    children: null,
  },
  {
    slug: "port-clearing",
    icon: Ship,
    category: "Fast-track & logistics",
    status: "off_sale",
    title: "Port Clearing & Customs",
    tagline: "Customs clearing for imported vehicles — quote-based, currently off sale.",
    intro:
      "Port clearing varies massively by vehicle, port, and current customs duty, which is why it's always been a quote-based service — it's currently off sale while we finalise our clearing operations.",
    whatsIncluded: [
      "Customs duty processing",
      "Terminal handling and release",
      "Documentation and final receipts",
      "Movement to your address (optional add-on)",
    ],
    whatYouBring: ["Bill of Lading", "Vehicle / cargo details (make, model, year, VIN)", "Port of arrival", "Importer KYC documents"],
    pricingNote: "Quote-based — currently off sale.",
    howItWorks: [
      { title: "Submit your details", desc: "BL, cargo info, and port." },
      { title: "We come back with a quote", desc: "Itemised — duty, terminal, our facilitation fee." },
      { title: "You approve and pay", desc: "Pay in full or use Easy Installment." },
      { title: "We clear and release", desc: "Tracked in your dashboard, end to end." },
    ],
    children: null,
  },
  {
    slug: "sponsor-a-service",
    icon: Gift,
    category: "Marketplace",
    status: "coming_soon",
    title: "Sponsor a Service",
    tagline: "Pay for a friend or family member's vehicle service — without exchanging passwords or money.",
    intro:
      "Help someone you care about renew their papers or fix their car without asking awkward money questions. You pay; they get the service; everyone keeps their dignity.",
    whatsIncluded: ["Anonymity if you want it", "Direct booking on the beneficiary's behalf", "Receipts and status updates to you, the sponsor"],
    whatYouBring: ["Beneficiary's name and phone number", "Which service you're sponsoring", "The relevant vehicle / document details"],
    pricingNote: null,
    howItWorks: [
      { title: "Pick the service", desc: "Any Vehiculars service is sponsorable." },
      { title: "Add the beneficiary", desc: "Name, phone, and details for the service." },
      { title: "Pay", desc: "Full payment or Easy Installment." },
      { title: "We deliver to the beneficiary", desc: "You get all the receipts; they get the service." },
    ],
    children: null,
  },
  {
    slug: "driveconnect",
    icon: GraduationCap,
    category: "Other documents",
    status: "coming_soon",
    title: "DriveConnect — Learn to Drive",
    tagline: "Vetted instructors, structured lessons, and your fresh driver's licence — all in one package, nationwide.",
    intro:
      "DriveConnect pairs you with a certified instructor near you, walks you through the FRSC theory test, and processes your fresh licence at the end. Pick a package, book your first lesson, and we handle the rest.",
    whatsIncluded: [
      "Background-checked instructor matched to your location",
      "Structured lesson plan (theory + practical)",
      "Free in-app theory test practice (FRSC standard)",
      "Fresh driver's licence processed at completion",
    ],
    whatYouBring: ["Valid NIN", "Recent passport photograph", "Willingness to show up for scheduled lessons"],
    pricingNote: null,
    howItWorks: [
      { title: "Pick a package", desc: "Choose lesson count and schedule." },
      { title: "Get matched", desc: "We pair you with an instructor nearby." },
      { title: "Learn and practise", desc: "Lessons logged in the app; theory test included." },
      { title: "Get your licence", desc: "Fresh DL processed once you've completed the course." },
    ],
    children: null,
  },
];

/**
 * Intermediary services — Vehiculars connects, a third party delivers.
 * Both switched off ("dark") while the core lines above are finished:
 * deliberately excluded from SERVICES (and therefore from every
 * customer-facing listing AND from generateStaticParams, so their detail
 * pages 404) but kept here, fully defined, so re-enabling later is a
 * one-line move back into SERVICES rather than a rebuild. Admin pricing
 * still needs to see these — see OTHER_SERVICES in admin/pricing/page.jsx,
 * which reads [...SERVICES, ...DARK_SERVICES].
 */
export const DARK_SERVICES = [
  {
    slug: "spare-parts",
    icon: Wrench,
    category: "Marketplace",
    status: "dark",
    title: "Genuine Spare Parts",
    tagline: "Post the part you need. Verified dealers bid. You pick — and arrange collection directly with them.",
    intro:
      "Vehiculars is the technology that connects you to vetted spare-parts dealers nationwide. We verify every dealer, hold your money safely until you confirm the part, and mediate any dispute. Collection and any delivery are arranged directly between you and the dealer.",
    whatsIncluded: [
      "Blind bids from verified dealers nationwide",
      "Photo proof on every bid",
      "Escrow — your money is held until you confirm the part",
      "Dispute mediation if anything goes wrong",
    ],
    whatYouBring: ["Your vehicle's make, model, and year", "Chassis (VIN) — for accurate part matching", "Part name, photo, or part number if you have it"],
    pricingNote:
      "Quote depends on the specific part, brand, and origin (OEM vs aftermarket). Vehiculars does not handle logistics — collection or any delivery is between you and the dealer.",
    howItWorks: [
      { title: "Post the request", desc: "Part photo + vehicle details." },
      { title: "Dealers bid", desc: "Verified dealers send blind bids with photo proof." },
      { title: "You pick & pay", desc: "Choose the best bid — funds are held in escrow." },
      { title: "Collect & confirm", desc: "Arrange pick-up with the dealer, then confirm to release payment." },
    ],
    children: null,
  },
  {
    slug: "find-a-technician",
    icon: UserCheck,
    category: "Marketplace",
    status: "dark",
    title: "Find a Trusted Technician",
    tagline: "Connect with mechanics, auto-electricians, and panel beaters that real customers have recommended.",
    intro:
      "We don't dispatch random hands — we connect you to technicians who've been recommended by other customers. A small connection fee, and you get vetted contact details plus an introduction.",
    whatsIncluded: ["Vetted technician contact details", "Warm introduction and context", "Visibility into past customer reviews"],
    whatYouBring: ["What's wrong with the vehicle (or what you need fixed)", "Your location", "Your vehicle's make and model"],
    pricingNote: "Connection fee only — actual repair cost is settled directly with the technician.",
    howItWorks: [
      { title: "Describe what you need", desc: "Mechanic, AC, body work, electrical — whatever it is." },
      { title: "Pay the connection fee", desc: "One-time, regardless of how much the actual repair costs." },
      { title: "Get matched", desc: "We introduce you to a vetted technician near you." },
      { title: "Work with them directly", desc: "You negotiate and pay the technician separately." },
    ],
    children: null,
  },
];

export function getService(slug) {
  return SERVICES.find((s) => s.slug === slug) || null;
}

export function getChild(slug, childSlug) {
  const service = getService(slug);
  if (!service || !service.children) return null;
  const child = service.children.find((c) => c.slug === childSlug) || null;
  return child ? { service, child } : null;
}
