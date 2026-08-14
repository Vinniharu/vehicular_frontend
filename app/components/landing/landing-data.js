import {
  ShoppingCart,
  ShieldCheck,
  GraduationCap,
  Building2,
  FileText,
  CreditCard,
  Hash,
  Sun,
  Zap,
  BadgeCheck,
  Ship,
  Gift,
  CheckCircle2,
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
  "port-clearing": { label: "Port clearing", benefit: "Firm, all-in customs clearing quote.", icon: Ship },
  "driveconnect": { label: "DriveConnect lessons", benefit: "Learn to drive with vetted instructors.", icon: GraduationCap },
  "sponsor-a-service": { label: "Sponsor a service", benefit: "Pay for someone else's vehicle service.", icon: Gift },
};

export const SERVICE_ITEMS = Object.entries(HOMEPAGE_COPY_BY_SLUG)
  .map(([slug, copy]) => (SERVICES.some((s) => s.slug === slug) ? { slug, ...copy } : null))
  .filter(Boolean);

// Nav/footer only need slug+label — derive from SERVICE_ITEMS instead of
// hand-duplicating the same 12 entries a second time.
export const SERVICE_LINKS = SERVICE_ITEMS.map(({ slug, label }) => ({ slug, label }));

// Only a subset of services have a live in-app showcase configured (see
// showcase-configs.js) — this asymmetry is real, not a bug. pre_purchase_
// inspection and spare_parts were dropped: the former merged into vehicle-
// verification (no distinct target anymore), the latter is dark/hidden.
export const SHOWCASE_TABS = [
  { id: "vehicle_particulars", label: "Particulars Renewal" },
  { id: "drivers_licence", label: "Driver's Licence" },
  { id: "number_plate", label: "Number Plates" },
  { id: "rwx_lagos", label: "Roadworthiness" },
  { id: "tinted_permit", label: "Tinted Permit" },
  { id: "driveconnect", label: "DriveConnect" },
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

// Stage 03 ("Stay running" — spare parts + find a technician) is dropped
// for now: both services are dark/hidden while the core lines finish, so a
// stage entirely pointing at unreachable pages would be worse than no stage
// at all. Reinstate it (and renumber) alongside those two services going
// live again.
export const LIFECYCLE_STAGES = [
  {
    stage: "01", icon: ShoppingCart, title: "Buy right",
    blurb: "Don't inherit someone else's problem. Verify before you pay.",
    items: [
      { href: "/services/vehicle-verification", label: "Vehicle verification & inspection" },
      { href: "/services/port-clearing", label: "Port clearing" },
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
      { href: "/services/driveconnect", label: "DriveConnect lessons" },
    ],
  },
  {
    stage: "04", icon: Building2, title: "Scale up",
    blurb: "Run 3 vehicles or 300. Upload once — we watch every expiry, every driver.",
    items: [
      { href: "/fleet", label: "Fleet dashboard" },
      { href: "/services/sponsor-a-service", label: "Sponsor a service" },
    ],
  },
];

export const FAQ_ITEMS = [
  { q: "What does Vehiculars actually do?", a: "We handle everything your car needs — renewals, inspections, driver's licence, number plates, tinted permits, genuine spare parts, repairs, port clearing and pre-purchase verification. One app, one team, from the day you buy to the day you sell." },
  { q: "Where do you operate?", a: "Nationwide — every state in Nigeria. Requests are submitted online from anywhere, and physical items (like plates, licences and permits) are delivered back to you." },
  { q: "How long does a renewal take?", a: "Most vehicle particulars and roadworthiness renewals are completed within 48 hours of submission. Driver's licence depends on biometrics scheduling. Spare parts ship within 24–72 hours depending on the item." },
  { q: "Are the spare parts really genuine?", a: "Yes. We source from vetted vendors and check fitment against your VIN, make, model and year before shipping. If a part doesn't fit, we replace it free." },
  { q: "Is my information safe?", a: "Yes. Documents are handled by vetted agents, encrypted in transit, and never shared with third parties. We're FRSC and NPF compliant." },
  { q: "Can I pay in instalments?", a: "Yes. Easy Installment is available on every service — pay any amount from the minimum deposit today, settle the rest before we deliver." },
  { q: "What if my application is rejected?", a: "If your application is rejected for reasons outside your control, we refund the full processing fee. You'll always know why upfront." },
  { q: "Do you handle fleets?", a: "Yes. Fleet mode lets you bulk-renew, assign drivers, and track every car from one dashboard. Talk to us about volume pricing." },
];
