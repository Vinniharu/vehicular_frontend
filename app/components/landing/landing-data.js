import {
  ShoppingCart,
  ShieldCheck,
  GraduationCap,
  FileText,
  CreditCard,
  Hash,
  Sun,
  Zap,
  BadgeCheck,
  CheckCircle2,
  Wrench,
  Landmark,
} from "lucide-react";
import { SERVICES } from "@/app/services/_data";

// Homepage-specific copy (label/benefit/icon/featured) per service — kept
// separate from app/services/_data.js's own title/tagline because the
// homepage voice is deliberately punchier. The service LIST itself (which
// slugs appear, in what order) is derived from SERVICES below rather than
// hand-duplicated, so a service going live/coming_soon/off_sale/dark in
// _data.js is automatically reflected here too — no second edit, no drift.
const HOMEPAGE_COPY_BY_SLUG = {
  "vehicle-particulars": { label: "Vehicle particulars", benefit: "Full papers renewed and delivered.", icon: FileText, featured: true },
  "drivers-licence": { label: "Driver's licence", benefit: "Fresh, renew, or reissue — end-to-end.", icon: CreditCard, featured: true },
  "number-plate": { label: "Number plates", benefit: "Order and receive your plate at home.", icon: Hash },
  "roadworthiness-express": { label: "Roadworthiness express", benefit: "Certified in 48 hours, no queues.", icon: ShieldCheck },
  "tinted-permit": { label: "Tinted permit", benefit: "Police-approved permit on your phone.", icon: Sun },
  "vehicle-verification": { label: "Vehicle verification & inspection", benefit: "Confirm papers, ownership, and condition are clean.", icon: BadgeCheck },
  "physical-condition-inspection": { label: "Physical condition inspection", benefit: "A mechanic's full report before you buy.", icon: Wrench },
  "central-motor-registry": { label: "ECMR registration", benefit: "Register on the national motor registry.", icon: Landmark },
};

export const SERVICE_ITEMS = Object.entries(HOMEPAGE_COPY_BY_SLUG)
  .map(([slug, copy]) => (SERVICES.some((s) => s.slug === slug) ? { slug, ...copy } : null))
  .filter(Boolean);

// Nav/footer only need slug+label — derive from SERVICE_ITEMS instead of
// hand-duplicating the same 12 entries a second time.
export const SERVICE_LINKS = SERVICE_ITEMS.map(({ slug, label }) => ({ slug, label }));

// Only a subset of services have a live in-app showcase configured (see
// showcase-configs.js) — this asymmetry is real, not a bug. pre_purchase_
// inspection was dropped (merged into vehicle-verification — no distinct
// target anymore); spare_parts and driveconnect were removed from the
// project entirely (driveconnect spun out to its own standalone project).
export const SHOWCASE_TABS = [
  { id: "vehicle_particulars", label: "Particulars Renewal" },
  { id: "drivers_licence", label: "Driver's Licence" },
  { id: "number_plate", label: "Number Plates" },
  { id: "rwx_lagos", label: "Roadworthiness" },
  { id: "tinted_permit", label: "Tinted Permit" },
  { id: "physical_condition_inspection", label: "Condition Inspection" },
];

// Single source of truth for the two homepage trust-stat strips (Hero +
// FinalCta) — previously hardcoded twice with drifting numbers. These are
// placeholder figures with no real business metrics wired up yet — confirm
// real numbers with the business before launch.
export const TRUST_STATS = [
  ["40,000+", "Drivers served"],
  ["Nationwide", "Every state"],
  ["48 hrs", "Avg. turnaround"],
];

export const HOW_STEPS = [
  {
    title: "Submit online",
    blurb: "Pick a service and upload what's needed — no paperwork handover.",
    icon: FileText,
  },
  {
    title: "We handle the processing",
    blurb: "We deal with the authority or vendor and update you via SMS.",
    icon: Zap,
  },
  {
    title: "Delivered back to you",
    blurb: "Soft copies land in your dashboard; physical items are delivered where they apply.",
    icon: CheckCircle2,
  },
];

// Stage 03 ("Stay running" — spare parts + find a technician) is dropped:
// both were removed from the project entirely, so a stage pointing at
// unreachable pages would be worse than no stage at all.
export const LIFECYCLE_STAGES = [
  {
    stage: "01", icon: ShoppingCart, title: "Buy right",
    blurb: "Don't inherit someone else's problem. Verify before you pay.",
    items: [
      { href: "/services/vehicle-verification", label: "Vehicle verification & inspection" },
    ],
  },
  {
    stage: "02", icon: ShieldCheck, title: "Stay legal",
    blurb: "Every document tracked, renewed before it lapses. No VIO surprises.",
    items: [
      { href: "/services/vehicle-particulars", label: "Vehicle particulars" },
      { href: "/services/roadworthiness-express", label: "Roadworthiness" },
      { href: "/services/tinted-permit", label: "Tinted permit" },
      { href: "/services/number-plate", label: "Number plate" },
    ],
  },
  {
    stage: "03", icon: GraduationCap, title: "Get better",
    blurb: "Learn to drive, get licensed, sharpen your theory — properly.",
    items: [
      { href: "/services/drivers-licence", label: "Driver's licence" },
    ],
  },
];

export const FAQ_ITEMS = [
  { q: "What does Vehiculars actually do?", a: "We handle everything your car needs — renewals, inspections, driver's licence, number plates, tinted permits, and pre-purchase verification. One app, one team, from the day you buy to the day you sell." },
  { q: "Where do you operate?", a: "Nationwide — every state in Nigeria. Requests are submitted online from anywhere, and physical items (like plates, licences and permits) are delivered back to you." },
  { q: "How long does a renewal take?", a: "Most vehicle particulars and roadworthiness renewals are completed within 48 hours of submission. Driver's licence depends on biometrics scheduling." },
  { q: "Is my information safe?", a: "Yes. Documents are handled by vetted agents, encrypted in transit, and never shared with third parties. We're FRSC and NPF compliant." },
  { q: "Can I pay in instalments?", a: "Yes. Easy Installment is available on every service — pay any amount from the minimum deposit today, settle the rest before we deliver." },
  { q: "What if my application is rejected?", a: "If your application is rejected for reasons outside your control, we refund the full processing fee. You will always know why upfront." },
  { q: "Do you handle fleets?", a: "Every vehicle you add lives in the same account, and renewals for each one are tracked independently. If you're managing several vehicles and want to talk about it, reach out via the contact details below." },
];
