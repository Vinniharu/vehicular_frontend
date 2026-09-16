"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  Lock,
  FileText,
  UserCheck,
  Server,
  Mail,
  MapPin,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  Database,
  Eye,
  Key,
} from "lucide-react";

import Nav from "@/app/components/landing/sections/Nav";
import Footer from "@/app/components/landing/sections/Footer";
import { GREEN, INK, INK_SOFT, PAPER, GOLD, INK_CARD } from "@/app/components/landing/theme";

const EFFECTIVE_DATE = "12 November 2025";
const LAST_UPDATED = "16 September 2026";

function PolicySection({ id, number, title, icon: Icon, children }) {
  return (
    <section
      id={id}
      className="scroll-mt-28 py-8 sm:py-10"
      style={{ borderBottom: "1px solid rgba(17,17,17,0.08)" }}
    >
      <div className="flex items-start gap-3.5">
        {Icon && (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "rgba(40, 167, 69, 0.12)", color: GREEN }}
          >
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {number && (
              <span className="font-mono text-[12px] font-semibold tracking-wider text-slate-400">
                {number}
              </span>
            )}
            <h2 className="font-display text-[20px] sm:text-[22px] font-semibold text-[#111111]">
              {title}
            </h2>
          </div>
          <div className="mt-4 space-y-4 text-[14.5px] leading-relaxed text-[#111111]/75">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("customer");

  useEffect(() => {
    try {
      const token = localStorage.getItem("vh_access_token");
      setIsLoggedIn(!!token);
      const storedUser = localStorage.getItem("vh_user");
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u?.role) setUserRole(u.role);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const dashboardHref =
    userRole === "admin" ? "/admin" : userRole === "staff" ? "/staff" : "/dashboard";
  const dashboardLabel =
    userRole === "admin"
      ? "Admin Portal"
      : userRole === "staff"
      ? "Staff Portal"
      : "Go to Dashboard";

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 8);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toc = [
    { id: "corporate-identity", label: "1. Corporate Identity & Registration" },
    { id: "scope", label: "2. Scope of this Policy" },
    { id: "lawful-bases", label: "3. Lawful Bases for Processing (NDPA 2023)" },
    { id: "data-we-collect", label: "4. Information We Collect" },
    { id: "how-we-collect", label: "5. How We Collect Personal Data" },
    { id: "purposes", label: "6. Purpose of Processing" },
    { id: "third-party-sharing", label: "7. Data Sharing & Third Parties" },
    { id: "data-retention", label: "8. Data Retention & Archival" },
    { id: "security-measures", label: "9. Data Security Architecture" },
    { id: "your-rights", label: "10. Your Rights as a Data Subject" },
    { id: "cookies-tracking", label: "11. Cookies, Storage & Push Notifications" },
    { id: "children-privacy", label: "12. Children's Privacy" },
    { id: "breach-protocol", label: "13. Incident & Breach Protocols" },
    { id: "policy-updates", label: "14. Amendments to this Policy" },
    { id: "contact-dpo", label: "15. Contact Us & Data Protection Officer" },
  ];

  return (
    <div className="min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: `body { background: ${INK}; }` }} />
      <Nav
        logoUrl="/logo.png"
        scrolled={scrolled}
        isLoggedIn={isLoggedIn}
        dashboardHref={dashboardHref}
        dashboardLabel={dashboardLabel}
        redirectTo="/privacy-policy"
      />

      {/* Header Banner */}
      <section className="relative px-5 pb-12 pt-28 md:px-8 overflow-hidden">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-semibold backdrop-blur-md" style={{ background: "rgba(40, 167, 69, 0.15)", color: GREEN }}>
            <ShieldCheck className="h-4 w-4" />
            <span>NDPA 2023 Compliant &bull; Corporate Affairs Commission Verified</span>
          </div>

          <h1 className="mt-4 font-display text-[32px] font-medium leading-tight text-white sm:text-[46px]">
            Privacy Policy & Data Protection Notice
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed" style={{ color: INK_SOFT }}>
            This Privacy Policy sets out how <strong className="text-white">Vehiculars Technology Limited</strong> collects,
            processes, protects, and stores personal data when you use our digital platform, mobile applications,
            and vehicular documentation services across the Federal Republic of Nigeria.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12.5px] text-white/60">
            <span>Incorporated: <strong className="text-white">{EFFECTIVE_DATE}</strong></span>
            <span>&bull;</span>
            <span>Last Updated: <strong className="text-white">{LAST_UPDATED}</strong></span>
            <span>&bull;</span>
            <span>Regulated by: <strong className="text-white">Nigeria Data Protection Commission (NDPC)</strong></span>
          </div>
        </div>

        {/* Official CAC Certificate Credential Card */}
        <div className="mx-auto mt-10 max-w-4xl">
          <div
            className="relative overflow-hidden rounded-2xl p-6 sm:p-8 backdrop-blur-xl transition-all"
            style={{
              background: `linear-gradient(135deg, ${INK_CARD} 0%, rgba(19, 34, 27, 0.85) 100%)`,
              border: "1px solid rgba(40, 167, 69, 0.3)",
              boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.5)",
            }}
          >
            {/* Top Seal Accent */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: "rgba(201, 162, 39, 0.15)", color: GOLD }}
                >
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: GOLD }}>
                    Federal Republic of Nigeria &bull; CAC Certified
                  </span>
                  <h3 className="text-[18px] sm:text-[20px] font-bold tracking-tight text-white">
                    VEHICULARS TECHNOLOGY LIMITED
                  </h3>
                </div>
              </div>
              <span className="inline-flex self-start sm:self-center items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-500/30">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Active & Legally Incorporated
              </span>
            </div>

            {/* Corporate Attributes Grid */}
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 text-[13px]">
              <div className="rounded-xl bg-white/[0.03] p-3.5 border border-white/5">
                <span className="text-[11px] uppercase tracking-wider text-white/40 block">RC Registration No.</span>
                <span className="mt-1 font-mono font-bold text-white text-[15px]">8994192</span>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3.5 border border-white/5">
                <span className="text-[11px] uppercase tracking-wider text-white/40 block">Tax ID (TIN)</span>
                <span className="mt-1 font-mono font-bold text-white text-[15px]">33691933-0001</span>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3.5 border border-white/5">
                <span className="text-[11px] uppercase tracking-wider text-white/40 block">Governing Act</span>
                <span className="mt-1 font-semibold text-white">CAMA 2020</span>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3.5 border border-white/5">
                <span className="text-[11px] uppercase tracking-wider text-white/40 block">Corporate Structure</span>
                <span className="mt-1 font-semibold text-white">Private Co. Ltd by Shares</span>
              </div>
            </div>

            <p className="mt-4 text-[12px] leading-relaxed text-white/50 italic">
              Certified by the Registrar-General of the Corporate Affairs Commission (CAC) under the Companies and Allied Matters Act 2020 at Abuja, Nigeria, on the 12th day of November 2025.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <section className="px-5 pb-24 md:px-8" style={{ background: PAPER }}>
        <div className="mx-auto max-w-6xl pt-12">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            
            {/* Table of Contents - Desktop Sticky Sidebar */}
            <aside className="hidden lg:block lg:col-span-4">
              <div className="sticky top-28 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileText className="h-4 w-4" style={{ color: GREEN }} />
                  <h4 className="text-[13px] font-bold uppercase tracking-wider text-slate-800">
                    Policy Contents
                  </h4>
                </div>
                <nav className="mt-3 space-y-1 text-[13px]">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block rounded-lg px-2.5 py-1.5 font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>

                <div className="mt-6 rounded-xl bg-slate-50 p-3.5 border border-slate-200/60 text-[12px] text-slate-600">
                  <p className="font-semibold text-slate-800">Need immediate help with your data?</p>
                  <p className="mt-1">Contact our Data Protection Office directly:</p>
                  <a
                    href="mailto:privacy@vehiculars.com"
                    className="mt-2 inline-flex items-center gap-1 font-bold underline"
                    style={{ color: GREEN }}
                  >
                    privacy@vehiculars.com
                  </a>
                </div>
              </div>
            </aside>

            {/* Policy Clauses Body */}
            <main className="lg:col-span-8 divide-y divide-slate-200/80">
              
              {/* Section 1 */}
              <PolicySection
                id="corporate-identity"
                number="01"
                title="Corporate Identity & Legal Framework"
                icon={Building2}
              >
                <p>
                  This Privacy Policy is issued by <strong>VEHICULARS TECHNOLOGY LIMITED</strong> ("Vehiculars",
                  "Company", "we", "us", or "our"), a private company limited by shares incorporated under the
                  laws of the Federal Republic of Nigeria with <strong>Company Registration Number (RC) 8994192</strong> and
                  <strong> Tax Identification Number (TIN) 33691933-0001</strong>. The company was duly registered by the
                  Registrar-General of the Corporate Affairs Commission (CAC) under the Companies and Allied Matters Act 2020 (CAMA 2020)
                  at Abuja on the 12th day of November 2025.
                </p>
                <p>
                  Vehiculars operates digital automotive convenience services, fleet administration systems,
                  and vehicle documentation platforms accessible through our website (
                  <a href="https://vehiculars.com" className="font-semibold underline" style={{ color: GREEN }}>
                    vehiculars.com
                  </a>
                  ), our web portal, client dashboard, staff/agent execution tools, and iOS/Android mobile applications.
                </p>
                <p>
                  Under the <strong>Nigeria Data Protection Act 2023 (NDPA)</strong>, Vehiculars Technology Limited acts as
                  the <strong>Data Controller</strong> in respect of your personal data collected when creating an account,
                  ordering services, or engaging with our platform, and in specified workflows, as a <strong>Data Processor</strong>
                  acting under statutory mandates on behalf of our corporate partners and regulatory authorities.
                </p>
              </PolicySection>

              {/* Section 2 */}
              <PolicySection
                id="scope"
                number="02"
                title="Scope of this Privacy Policy"
                icon={FileCheck}
              >
                <p>
                  This policy applies to all prospective and registered users, including individual vehicle owners, commercial
                  drivers, enterprise fleet managers, field agents, partner mechanics, and platform visitors who interact with:
                </p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li><strong>Driver's Licence Services:</strong> Fresh driver's licence applications, driving school 26-working-day legal enrollment, licence renewals, re-issuance (for lost or defaced cards), and International Driving Permits (IDP).</li>
                  <li><strong>Vehicle Particulars & Registration:</strong> Vehicle licence renewals, roadworthiness certificate processing, third-party and comprehensive motor insurance renewals, Central Motor Registry (CMRIS) documentation, and hackney carriage permits.</li>
                  <li><strong>Number Plate Services:</strong> Standard private number plates, commercial number plates, customized plates, and plate re-allocation.</li>
                  <li><strong>Vehicle Verification & Condition Inspection:</strong> Pre-purchase condition inspections (PCI), mechanical defect audits, and roadworthiness express bay tests.</li>
                  <li><strong>Customer & Agent Portals:</strong> Client dashboard, wallet services, notification pipelines, customer support ticketing, and logistics delivery coordination.</li>
                </ul>
              </PolicySection>

              {/* Section 3 */}
              <PolicySection
                id="lawful-bases"
                number="03"
                title="Lawful Bases for Data Processing"
                icon={Key}
              >
                <p>
                  In strict adherence to Section 25 of the Nigeria Data Protection Act 2023 (NDPA), we only collect, process,
                  and share your personal data where at least one of the following lawful bases applies:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="font-bold text-slate-900">1. Contractual Necessity</p>
                    <p className="mt-1 text-[13px] text-slate-600">
                      Processing is required to fulfill the vehicle documentation, verification, inspection, or delivery services you expressly order from us.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="font-bold text-slate-900">2. Statutory & Legal Obligations</p>
                    <p className="mt-1 text-[13px] text-slate-600">
                      Compliance with Nigerian road traffic statutes, National Road Traffic Regulations (NRTR), FRSC directives, VIO inspection rules, and tax compliance.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="font-bold text-slate-900">3. Legitimate Interests</p>
                    <p className="mt-1 text-[13px] text-slate-600">
                      Detecting fraud, verifying vehicle ownership authenticity, preventing stolen vehicle documentation, and maintaining enterprise system security.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="font-bold text-slate-900">4. Explicit Consent</p>
                    <p className="mt-1 text-[13px] text-slate-600">
                      Provided by you for optional features such as marketing communications, camera access for instant document capture, and mobile push notifications.
                    </p>
                  </div>
                </div>
              </PolicySection>

              {/* Section 4 */}
              <PolicySection
                id="data-we-collect"
                number="04"
                title="Categories of Personal Data We Collect"
                icon={Database}
              >
                <p>
                  To successfully deliver government-recognized vehicle documents and thorough inspections, we collect only
                  the minimum necessary personal information:
                </p>
                
                <div className="space-y-3 pt-2">
                  <div className="rounded-xl border border-slate-200/80 bg-white p-4">
                    <h4 className="font-semibold text-slate-900">A. Personal Identification & Contact Details</h4>
                    <p className="mt-1 text-[13.5px] text-slate-600">
                      Full legal name (first, middle, last), date of birth, gender, marital status, nationality, residential
                      address, Local Government Area (LGA), State of origin and residence, active telephone number, email address,
                      and next of kin / emergency contact details.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white p-4">
                    <h4 className="font-semibold text-slate-900">B. Government Identifiers & Statutory Records</h4>
                    <p className="mt-1 text-[13.5px] text-slate-600">
                      National Identification Number (NIN), existing Driver’s Licence Number, Taxpayer Identification Number (TIN)
                      where relevant, International Passport bio-data page (for International Driving Permits), and FRSC learner’s
                      permit references.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white p-4">
                    <h4 className="font-semibold text-slate-900">C. Biometric Schedule & Physical Attributes</h4>
                    <p className="mt-1 text-[13.5px] text-slate-600">
                      Facial passport photographs, height, blood group, facial marks / disability declarations, and preferred
                      biometric capture appointment centre and time slots.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white p-4">
                    <h4 className="font-semibold text-slate-900">D. Vehicle Ownership & Technical Specification Data</h4>
                    <p className="mt-1 text-[13.5px] text-slate-600">
                      Vehicle Make, Model, Year of Manufacture, Vehicle Identification Number (VIN / Chassis Number), Engine Number,
                      License Plate Number, Vehicle Color, Fuel Type, Body Type, Odometer Mileage, Proof of Ownership Certificate,
                      Customs Duty Papers, and Vehicle Allocation Receipts.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white p-4">
                    <h4 className="font-semibold text-slate-900">E. Vehicle Inspection & Diagnostic Telemetry</h4>
                    <p className="mt-1 text-[13.5px] text-slate-600">
                      Mechanical condition photographs, brake testing records, suspension and tire condition evaluations, engine
                      fault diagnostic logs, chassis integrity ratings, and inspector verdict notes recorded during Physical Condition
                      Inspections (PCI) or Roadworthiness Express bay checks.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white p-4">
                    <h4 className="font-semibold text-slate-900">F. Financial & Transaction Logs</h4>
                    <p className="mt-1 text-[13.5px] text-slate-600">
                      Transaction references, payment method identifiers, wallet credit/debit balances, service invoices, and payout
                      account bank details (for verified field agents). <em>Note: Vehiculars does NOT collect, process, or store full
                      credit or debit card primary account numbers (PAN) or CVVs. All electronic payments are processed through
                      CBN-licensed, PCI-DSS compliant payment gateways (Monnify / Moniepoint MFB).</em>
                    </p>
                  </div>
                </div>
              </PolicySection>

              {/* Section 5 */}
              <PolicySection
                id="how-we-collect"
                number="05"
                title="How We Collect Your Information"
                icon={Eye}
              >
                <p>We collect personal information through the following channels:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li><strong>Direct Submission by You:</strong> When you register an account, fill out service application questionnaires, upload documents, communicate with support, or fund your in-app wallet.</li>
                  <li><strong>Field Inspections & Testing Bays:</strong> When an accredited Vehiculars field agent, mobile technician, or partner roadworthiness bay inspects your vehicle and logs photos and mechanical readings.</li>
                  <li><strong>Government & Accredited Partner Verification:</strong> When verifying vehicle particulars or driver identity against official registry records (e.g. FRSC portal, NIID insurance registry, CMRIS police database, or accredited partner driving schools).</li>
                  <li><strong>Automated Platform Logs:</strong> Technical log data generated when you access our web portal or mobile applications, including device identifiers, IP addresses, and session duration.</li>
                </ul>
              </PolicySection>

              {/* Section 6 */}
              <PolicySection
                id="purposes"
                number="06"
                title="Purpose of Personal Data Processing"
                icon={Server}
              >
                <p>Vehiculars Technology Limited processes your data strictly for legitimate operational purposes:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/60">
                    <p className="font-semibold text-slate-800 text-[13.5px]">Statutory Document Processing</p>
                    <p className="mt-1 text-[12.5px] text-slate-600">Filing applications with FRSC, VIO, Police (CMRIS), and Motor Vehicle Administration Agencies.</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/60">
                    <p className="font-semibold text-slate-800 text-[13.5px]">Biometric Capture & Driving School</p>
                    <p className="mt-1 text-[12.5px] text-slate-600">Enrolling candidates in statutory 26-working-day accredited driving school programs and scheduling capture appointments in your LGA.</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/60">
                    <p className="font-semibold text-slate-800 text-[13.5px]">Inspection Report Generation</p>
                    <p className="mt-1 text-[12.5px] text-slate-600">Compiling comprehensive, photo-verified mechanical inspection audit reports for vehicle buyers and fleet owners.</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/60">
                    <p className="font-semibold text-slate-800 text-[13.5px]">Physical Logistics & Dispatch</p>
                    <p className="mt-1 text-[12.5px] text-slate-600">Assigning vetted dispatch riders to deliver physical driver's licence cards, vehicle stickers, and number plates straight to your doorstep.</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/60">
                    <p className="font-semibold text-slate-800 text-[13.5px]">Transactional Alerts & Updates</p>
                    <p className="mt-1 text-[12.5px] text-slate-600">Sending SMS, email, and push notifications concerning application status, countdown timers, and expiry reminders.</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/60">
                    <p className="font-semibold text-slate-800 text-[13.5px]">Fraud Prevention & Audit Security</p>
                    <p className="mt-1 text-[12.5px] text-slate-600">Verifying document validity, preventing vehicle identity cloning, and preserving tamper-proof audit trails.</p>
                  </div>
                </div>
              </PolicySection>

              {/* Section 7 */}
              <PolicySection
                id="third-party-sharing"
                number="07"
                title="Third-Party Disclosures & Data Sharing"
                icon={UserCheck}
              >
                <p>
                  We share your data only on a strict need-to-know basis with vetted third parties who are bound by contractual
                  and regulatory data confidentiality duties under NDPA 2023:
                </p>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-slate-50 text-[11.5px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Recipient Category</th>
                        <th className="px-4 py-3">Parties Involved</th>
                        <th className="px-4 py-3">Purpose & Transferred Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-900">Government Authorities</td>
                        <td className="px-4 py-3">FRSC, VIO, State MVAA, Nigeria Police Force (CMRIS)</td>
                        <td className="px-4 py-3">Filing statutory applications, issuance of driver's licences, roadworthiness certificates, and number plates.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-900">Accredited Driving Schools</td>
                        <td className="px-4 py-3">FRSC-certified partner driving academies</td>
                        <td className="px-4 py-3">Statutory candidate enrollment (26 working days mandatory period) and certificate issuance for fresh licence applicants.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-900">Payment Gateway</td>
                        <td className="px-4 py-3">Monnify (TeamApt / Moniepoint MFB)</td>
                        <td className="px-4 py-3">Payment processing, transaction settlements, and customer wallet funding. PCI-DSS compliant.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-900">Communication Vendors</td>
                        <td className="px-4 py-3">Termii (SMS & OTP), Resend (Transactional Email)</td>
                        <td className="px-4 py-3">Delivering time-sensitive application updates, verification codes, payment receipts, and deadline reminders.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-900">Vetted Field Agents & Riders</td>
                        <td className="px-4 py-3">Accredited Vehiculars local logistics network</td>
                        <td className="px-4 py-3">Conducting physical vehicle inspections, handling physical submission, and doorstep delivery of completed cards.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-[13.5px] text-emerald-900">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Zero Data Commercialization Guarantee
                  </p>
                  <p className="mt-1">
                    Vehiculars Technology Limited does <strong>NEVER</strong> sell, lease, rent, or trade your personal data,
                    telephone numbers, vehicle records, or application history to commercial advertisers or data brokers.
                  </p>
                </div>
              </PolicySection>

              {/* Section 8 */}
              <PolicySection
                id="data-retention"
                number="08"
                title="Data Retention & Archival Policy"
                icon={Database}
              >
                <p>
                  Personal data is retained only for the duration necessary to satisfy the purposes for which it was gathered,
                  or as mandated by legal, taxation, and statutory road traffic regulations in Nigeria:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li><strong>Active Customer Profile:</strong> Maintained for the entire duration your account remains active.</li>
                  <li><strong>Statutory Transaction Records:</strong> In compliance with the Companies and Allied Matters Act 2020 (CAMA) and Nigerian financial regulations, completed application documents, payment receipts, and vehicle verification logs are retained for a minimum of <strong>six (6) years</strong> following service completion.</li>
                  <li><strong>Incomplete Drafts:</strong> Application forms abandoned or unsubmitted are automatically purged after <strong>90 days</strong> of user inactivity.</li>
                  <li><strong>Biometric Slips & Inspection Media:</strong> Inspection photos and capture slips are permanently archived in encrypted cloud storage to protect against fraudulent document claims.</li>
                </ul>
              </PolicySection>

              {/* Section 9 */}
              <PolicySection
                id="security-measures"
                number="09"
                title="Data Security & Storage Architecture"
                icon={Lock}
              >
                <p>
                  Vehiculars Technology Limited implements comprehensive administrative, technical, and physical safeguards
                  to guarantee confidentiality and protect against unauthorized access, loss, or alteration:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="font-bold text-slate-900">End-to-End Encryption</p>
                    <p className="mt-1 text-[13px] text-slate-600">
                      All data in transit is protected using TLS 1.3 encryption. Sensitive database fields, documents, and backups are encrypted at rest using AES-256.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="font-bold text-slate-900">Role-Based Access Controls (RBAC)</p>
                    <p className="mt-1 text-[13px] text-slate-600">
                      Access to candidate documents is restricted exclusively to authorized staff and assigned field agents strictly processing that stage.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="font-bold text-slate-900">Tamper-Proof Audit Logging</p>
                    <p className="mt-1 text-[13px] text-slate-600">
                      Every administrative view, file download, status transition, or document verification is immutably recorded with actor timestamp and IP.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="font-bold text-slate-900">Regular Security Audits</p>
                    <p className="mt-1 text-[13px] text-slate-600">
                      Continuous vulnerability scanning, regular penetration testing, and automated disaster-recovery backup redundancies.
                    </p>
                  </div>
                </div>
              </PolicySection>

              {/* Section 10 */}
              <PolicySection
                id="your-rights"
                number="10"
                title="Your Rights as a Data Subject"
                icon={UserCheck}
              >
                <p>
                  Under Part VI of the Nigeria Data Protection Act 2023 (NDPA), you enjoy comprehensive legal rights regarding
                  your personal data:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li><strong>Right to be Informed:</strong> The right to know clearly what data we collect, why, and who we share it with.</li>
                  <li><strong>Right of Access:</strong> You may request a complete digital copy of all personal records held about you.</li>
                  <li><strong>Right to Rectification:</strong> You may correct or update any inaccurate or outdated information in your profile at any time.</li>
                  <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> You may request the deletion of your account and personal data, provided retention is not required by statutory road traffic or tax regulations.</li>
                  <li><strong>Right to Restrict Processing:</strong> You may ask us to suspend processing of your data while an objection or accuracy dispute is verified.</li>
                  <li><strong>Right to Data Portability:</strong> You may request your personal data in a structured, commonly used, and machine-readable format.</li>
                  <li><strong>Right to Object:</strong> You can object at any time to receiving non-essential marketing notifications.</li>
                </ul>

                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 text-[13px] text-slate-700">
                  <p className="font-semibold text-slate-900">How to exercise your rights:</p>
                  <p className="mt-1">
                    Send a formal request from your registered email address to{" "}
                    <a href="mailto:privacy@vehiculars.com" className="font-semibold underline" style={{ color: GREEN }}>
                      privacy@vehiculars.com
                    </a>
                    . We will verify your identity and respond comprehensively within <strong>thirty (30) days</strong> at zero charge.
                  </p>
                  <p className="mt-2 text-[12px] text-slate-500">
                    If you believe your data protection rights have been infringed, you also have the statutory right to lodge a
                    complaint with the <strong>Nigeria Data Protection Commission (NDPC)</strong> at{" "}
                    <a href="https://ndpc.gov.ng" target="_blank" rel="noreferrer" className="underline font-medium">
                      ndpc.gov.ng
                    </a>
                    .
                  </p>
                </div>
              </PolicySection>

              {/* Section 11 */}
              <PolicySection
                id="cookies-tracking"
                number="11"
                title="Cookies, Local Storage & Mobile Permissions"
                icon={FileText}
              >
                <p>
                  Our web application uses essential browser storage (localStorage, secure cookies) solely to keep you signed in,
                  protect your session against CSRF attacks, and remember your dashboard settings.
                </p>
                <p>
                  <strong>Mobile Application Permissions:</strong> When using the Vehiculars mobile app, we may request permission for:
                </p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li><strong>Camera & Photo Gallery:</strong> Solely to allow you to photograph or upload driver's licences, vehicle documents, and inspection photos.</li>
                  <li><strong>Push Notifications:</strong> To provide instant notifications when your application progresses (e.g. driving school completed, biometric date confirmed, card dispatched).</li>
                  <li><strong>Location Services (Optional):</strong> To suggest the closest accredited capture centre or inspection bay in your Local Government Area.</li>
                </ul>
              </PolicySection>

              {/* Section 12 */}
              <PolicySection
                id="children-privacy"
                number="12"
                title="Children's Privacy Protection"
                icon={AlertCircle}
              >
                <p>
                  Vehiculars Technology Limited strictly provides services intended for individuals who have reached the legal
                  age of vehicle ownership and driver licensing in Nigeria (18 years and above).
                </p>
                <p>
                  We do not intentionally or knowingly solicit or collect personal information from children under 18 years. If we
                  discover that an individual under the legal age has provided personal data without parental or guardian consent,
                  we will immediately delete such data and terminate the associated account.
                </p>
              </PolicySection>

              {/* Section 13 */}
              <PolicySection
                id="breach-protocol"
                number="13"
                title="Incident & Data Breach Protocols"
                icon={ShieldCheck}
              >
                <p>
                  In the unlikely event of a security incident resulting in unauthorized access, exposure, or breach of your
                  personal data:
                </p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>We will notify the <strong>Nigeria Data Protection Commission (NDPC)</strong> within <strong>72 hours</strong> of becoming aware of the incident, in compliance with the NDPA 2023.</li>
                  <li>Where the breach poses a high risk to your rights, we will notify you directly via email and SMS with remediation advice and protective actions taken.</li>
                </ul>
              </PolicySection>

              {/* Section 14 */}
              <PolicySection
                id="policy-updates"
                number="14"
                title="Amendments to this Policy"
                icon={FileCheck}
              >
                <p>
                  We may review and update this Privacy Policy from time to time to mirror changes in statutory automotive
                  regulations, NDPA compliance directives, or platform enhancements.
                </p>
                <p>
                  Whenever updates are published, the "Last Updated" timestamp at the top of this policy will be revised. For
                  material changes impacting how we process your personal data, we will provide prominent notice via in-app banners
                  or email communications prior to the changes taking effect.
                </p>
              </PolicySection>

              {/* Section 15 */}
              <PolicySection
                id="contact-dpo"
                number="15"
                title="Corporate Contact & Data Protection Officer"
                icon={Mail}
              >
                <p>
                  If you have questions, inquiries, requests, or concerns regarding this Privacy Policy or our data management
                  practices, please reach our Data Protection Office:
                </p>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-slate-600 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900">VEHICULARS TECHNOLOGY LIMITED</h4>
                      <p className="text-[13px] text-slate-500 font-mono">RC No: 8994192 &bull; TIN: 33691933-0001</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13.5px]">
                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/60">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" style={{ color: GREEN }} /> Lagos Corporate Office
                      </p>
                      <p className="mt-2 text-slate-600 leading-relaxed">
                        38 Opebi Road, Adebola House<br />
                        Suite 100 (Rear Car Park Wing), Ikeja,<br />
                        Lagos State, Nigeria
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/60">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" style={{ color: GREEN }} /> Abuja Liaison Office
                      </p>
                      <p className="mt-2 text-slate-600 leading-relaxed">
                        No. 50 Ebitu Ukiwe Street,<br />
                        Jabi District,<br />
                        Abuja, FCT, Nigeria
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-4 text-[13px]">
                    <div>
                      <span className="text-slate-500 block">Data Protection Officer:</span>
                      <a href="mailto:privacy@vehiculars.com" className="font-bold text-emerald-700 underline">
                        privacy@vehiculars.com
                      </a>
                    </div>
                    <div>
                      <span className="text-slate-500 block">General Customer Support:</span>
                      <a href="mailto:support@vehiculars.com" className="font-bold text-slate-800 underline">
                        support@vehiculars.com
                      </a>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Customer Helpline:</span>
                      <span className="font-bold text-slate-800 font-mono">+234 813 470 5676</span>
                    </div>
                  </div>
                </div>
              </PolicySection>

            </main>
          </div>
        </div>
      </section>

      <Footer redirectTo="/privacy-policy" />
    </div>
  );
}
