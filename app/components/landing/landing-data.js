import {
  ShoppingCart,
  ShieldCheck,
  Wrench,
  GraduationCap,
  Building2,
  FileText,
  CreditCard,
  Hash,
  Sun,
  Search,
  Zap,
  BadgeCheck,
  Ship,
  UserCheck,
  Gift,
  CheckCircle2,
} from "lucide-react";

// Single source of truth for the 12 real Vehiculars services — content is
// unchanged from the previous landing page, just relocated out of the
// monolith so each section can import only what it needs.
export const SERVICE_ITEMS = [
  { slug: "vehicle-particulars", label: "Vehicle particulars", benefit: "Full papers renewed and delivered.", icon: FileText, featured: true },
  { slug: "drivers-licence", label: "Driver's licence", benefit: "Fresh, renew, or reissue — end-to-end.", icon: CreditCard, featured: true },
  { slug: "number-plate", label: "Number plates", benefit: "Order and receive your plate at home.", icon: Hash },
  { slug: "roadworthiness-express", label: "Roadworthiness express", benefit: "Certified in 48 hours, no queues.", icon: ShieldCheck },
  { slug: "tinted-permit", label: "Tinted permit", benefit: "Police-approved permit on your phone.", icon: Sun },
  { slug: "pre-purchase-inspection", label: "Pre-purchase inspection", benefit: "150-point check before you pay.", icon: Search },
  { slug: "driveconnect", label: "DriveConnect lessons", benefit: "Learn to drive with vetted instructors.", icon: GraduationCap },
  { slug: "spare-parts", label: "Spare parts", benefit: "Genuine parts, fitment-checked, delivered.", icon: Wrench },
  { slug: "vehicle-verification", label: "Vehicle verification", benefit: "Confirm papers and ownership are clean.", icon: BadgeCheck },
  { slug: "port-clearing", label: "Port clearing", benefit: "Firm, all-in customs clearing quote.", icon: Ship },
  { slug: "find-a-technician", label: "Find a technician", benefit: "Vetted mechanics, recommended by real customers.", icon: UserCheck },
  { slug: "sponsor-a-service", label: "Sponsor a service", benefit: "Pay for someone else's vehicle service.", icon: Gift },
];

// Nav/footer only need slug+label — derive from SERVICE_ITEMS instead of
// hand-duplicating the same 12 entries a second time.
export const SERVICE_LINKS = SERVICE_ITEMS.map(({ slug, label }) => ({ slug, label }));

// Only 8 of the 12 services have a live in-app showcase configured
// (see showcase-configs.js) — this asymmetry is real, not a bug.
export const SHOWCASE_TABS = [
  { id: "vehicle_particulars", label: "Particulars Renewal" },
  { id: "drivers_licence", label: "Driver's Licence" },
  { id: "number_plate", label: "Number Plates" },
  { id: "rwx_lagos", label: "Roadworthiness" },
  { id: "tinted_permit", label: "Tinted Permit" },
  { id: "pre_purchase_inspection", label: "Pre-Purchase Check" },
  { id: "driveconnect", label: "DriveConnect" },
  { id: "spare_parts", label: "Spare Parts" },
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

export const LIFECYCLE_STAGES = [
  {
    stage: "01", icon: ShoppingCart, title: "Buy right",
    blurb: "Don't inherit someone else's problem. Verify before you pay.",
    items: [
      { href: "/services/pre-purchase-inspection", label: "Pre-purchase inspection" },
      { href: "/services/vehicle-verification", label: "Vehicle verification" },
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
    stage: "03", icon: Wrench, title: "Stay running",
    blurb: "Genuine parts and vetted technicians, dispatched to wherever your car is.",
    items: [
      { href: "/services/spare-parts", label: "Spare parts" },
      { href: "/services/find-a-technician", label: "Find a technician" },
    ],
  },
  {
    stage: "04", icon: GraduationCap, title: "Get better",
    blurb: "Learn to drive, get licensed, sharpen your theory — properly.",
    items: [
      { href: "/services/drivers-licence", label: "Driver's licence" },
      { href: "/services/driveconnect", label: "DriveConnect lessons" },
    ],
  },
  {
    stage: "05", icon: Building2, title: "Scale up",
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
