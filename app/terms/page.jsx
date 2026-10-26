"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Briefcase,
  UserCheck,
  ClipboardCheck,
  Wallet,
  Clock,
  RotateCcw,
  Gift,
  Ban,
  Copyright,
  Scale,
  FileCheck,
  Landmark,
  Mail,
  MapPin,
  FileText,
  ChevronDown,
  Info,
} from "lucide-react";

import Nav from "@/app/components/landing/sections/Nav";
import Footer from "@/app/components/landing/sections/Footer";
import { GOLD } from "@/app/components/landing/theme";
import { Container } from "@/app/components/marketing/ui";
import { Reveal, Stagger, StaggerItem } from "@/app/components/marketing/motion";

const LAST_UPDATED = "26 October 2026";

const linkCls = "font-semibold text-cx-brand-deep underline underline-offset-2";

function PolicySection({ id, number, title, icon: Icon, children }) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-mk-line py-8 last:border-b-0 sm:py-10">
      <div className="flex items-start gap-3.5 sm:gap-4">
        {Icon && (
          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cx-brand-soft text-cx-brand-deep ring-1 ring-inset ring-cx-brand/15 sm:flex">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2.5">
            {number && (
              <span className="font-mono text-[12px] font-medium tracking-wider text-cx-brand-deep">
                {number}
              </span>
            )}
            <h2 className="text-[20px] sm:text-[22px] font-semibold tracking-[-0.02em] text-mk-ink text-balance">
              {title}
            </h2>
          </div>
          <div className="mt-4 space-y-4 text-[15px] leading-[1.75] text-mk-ink-2">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function TermsPage() {
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
    { id: "who-we-are", label: "1. Who we are" },
    { id: "what-we-do", label: "2. What we do" },
    { id: "accounts", label: "3. Accounts and eligibility" },
    { id: "your-responsibilities", label: "4. Your responsibilities" },
    { id: "fees-payment", label: "5. Fees and payment" },
    { id: "processing-times", label: "6. Processing times" },
    { id: "refunds", label: "7. Refunds" },
    { id: "earn-referrals", label: "8. Vehiculars Earn and referral credit" },
    { id: "prohibited-use", label: "9. Prohibited use" },
    { id: "intellectual-property", label: "10. Intellectual property" },
    { id: "liability", label: "11. Limitation of liability" },
    { id: "changes", label: "12. Changes to these terms" },
    { id: "governing-law", label: "13. Governing law" },
    { id: "contact", label: "14. Contact" },
  ];

  // Highlight the section currently in view in the desktop contents list.
  const [activeId, setActiveId] = useState(toc[0].id);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const els = toc.map((t) => document.getElementById(t.id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -65% 0px", threshold: 0 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mk-root min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: `body { background: var(--mk-bg); }` }} />
      <Nav
        logoUrl="/logo.png"
        scrolled={scrolled}
        isLoggedIn={isLoggedIn}
        dashboardHref={dashboardHref}
        dashboardLabel={dashboardLabel}
        redirectTo="/terms"
      />

      {/* Header Banner */}
      <section className="relative overflow-hidden border-b border-mk-line bg-mk-surface">
        <div aria-hidden className="mk-grid-bg pointer-events-none absolute inset-0" />
        <div aria-hidden className="mk-glow pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] max-w-[180vw] -translate-x-1/2" />
        <Container className="relative py-14 sm:py-20">
          <Stagger animateOnMount className="mx-auto max-w-4xl text-center">
            <StaggerItem>
              <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-cx-brand/20 bg-cx-brand-soft px-3.5 py-1.5 text-[12px] font-semibold text-cx-brand-deep">
                <Scale className="h-4 w-4 shrink-0" />
                <span>Private service provider &bull; RC 8994192</span>
              </span>
            </StaggerItem>

            <StaggerItem>
              <h1
                className="mt-5 font-semibold tracking-[-0.03em] text-mk-ink text-balance"
                style={{ fontSize: "clamp(1.85rem, 2.4vw + 1rem, 3rem)", lineHeight: 1.08 }}
              >
                Terms of{" "}
                <span className="font-display font-normal italic text-cx-brand">Service</span>
              </h1>
            </StaggerItem>
            <StaggerItem>
              <p className="mx-auto mt-4 max-w-2xl text-[16px] sm:text-[17px] leading-relaxed text-mk-muted text-pretty">
                These terms apply when you use the website, web app and mobile apps of{" "}
                <strong className="font-semibold text-mk-ink">Vehiculars Technology Limited</strong>. Please read them
                before you place an order. By creating an account or paying for a service, you agree to them.
              </p>
            </StaggerItem>

            <StaggerItem className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[12.5px] text-mk-muted">
              <span className="rounded-full border border-mk-line bg-mk-bg px-3 py-1">Last updated: <strong className="font-semibold text-mk-ink">{LAST_UPDATED}</strong></span>
              <Link href="/refund-policy" className="rounded-full border border-mk-line bg-mk-bg px-3 py-1 font-semibold text-cx-brand-deep hover:text-mk-ink">Refund Policy</Link>
              <Link href="/privacy-policy" className="rounded-full border border-mk-line bg-mk-bg px-3 py-1 font-semibold text-cx-brand-deep hover:text-mk-ink">Privacy Policy</Link>
            </StaggerItem>
          </Stagger>

          {/* Company identity card */}
          <Reveal delay={0.15} className="mx-auto mt-10 max-w-4xl">
            <div className="relative overflow-hidden rounded-mk-lg border border-white/10 bg-mk-dark p-5 text-white shadow-mk-lg sm:p-8">
              <div aria-hidden className="mk-grid-bg-dark pointer-events-none absolute inset-0 opacity-60" />
              <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,rgba(201,162,39,0.18),transparent)]" />
              <div className="relative flex items-center gap-3 border-b border-white/10 pb-5">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "rgba(201, 162, 39, 0.15)", color: GOLD }}
                >
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: GOLD }}>
                    The company behind Vehiculars
                  </span>
                  <h3 className="text-[17px] sm:text-[20px] font-bold tracking-tight text-white">
                    VEHICULARS TECHNOLOGY LIMITED
                  </h3>
                </div>
              </div>

              <div className="relative mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 text-[13px]">
                <div className="min-w-0 rounded-xl bg-white/[0.04] p-3.5 border border-white/[0.07]">
                  <span className="text-[11px] uppercase tracking-wider text-white/45 block">CAC registration</span>
                  <span className="mt-1 block font-mono font-bold text-white text-[15px]">RC 8994192</span>
                </div>
                <div className="min-w-0 rounded-xl bg-white/[0.04] p-3.5 border border-white/[0.07]">
                  <span className="text-[11px] uppercase tracking-wider text-white/45 block">Lagos office</span>
                  <span className="mt-1 block font-semibold text-white">38 Opebi Road, Ikeja</span>
                </div>
                <div className="min-w-0 rounded-xl bg-white/[0.04] p-3.5 border border-white/[0.07]">
                  <span className="text-[11px] uppercase tracking-wider text-white/45 block">Abuja office</span>
                  <span className="mt-1 block font-semibold text-white">50 Ebitu Ukiwe Street, Jabi</span>
                </div>
              </div>

              <p className="relative mt-4 text-[12.5px] leading-relaxed text-white/60">
                Vehiculars is a private service provider. We are not affiliated with FRSC, VIO, the Nigeria Police Force
                or any government agency.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Main Content Body */}
      <section className="bg-mk-bg py-10 sm:py-16">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">

            {/* Table of Contents - Desktop Sticky Sidebar */}
            <aside className="hidden lg:block lg:col-span-4">
              <div className="sticky top-24 rounded-mk-lg border border-mk-line bg-mk-surface p-5 shadow-mk-sm">
                <div className="flex items-center gap-2 border-b border-mk-line pb-3">
                  <FileText className="h-4 w-4 text-cx-brand" />
                  <h4 className="font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] text-mk-ink">
                    Contents
                  </h4>
                </div>
                <nav className="mt-3 max-h-[calc(100vh-20rem)] space-y-0.5 overflow-y-auto text-[13px]" aria-label="Terms contents">
                  {toc.map((item) => {
                    const active = activeId === item.id;
                    return (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        aria-current={active ? "location" : undefined}
                        className={`mk-focus relative block rounded-lg py-1.5 pl-3.5 pr-2.5 font-medium transition-colors ${
                          active ? "bg-cx-brand-soft text-cx-brand-deep" : "text-mk-muted hover:bg-mk-bg hover:text-mk-ink"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`absolute left-1 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-cx-brand transition-opacity ${active ? "opacity-100" : "opacity-0"}`}
                        />
                        {item.label}
                      </a>
                    );
                  })}
                </nav>

                <div className="mt-5 rounded-mk border border-mk-line bg-mk-bg p-3.5 text-[12.5px] text-mk-muted">
                  <p className="font-semibold text-mk-ink">Questions about these terms?</p>
                  <p className="mt-1">Write to our support team:</p>
                  <a href="mailto:support@vehiculars.com" className="mt-2 inline-flex items-center gap-1 font-bold text-cx-brand-deep underline underline-offset-2">
                    support@vehiculars.com
                  </a>
                  <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                    <Link href="/refund-policy" className="font-semibold text-cx-brand-deep underline underline-offset-2">Refund Policy</Link>
                    <Link href="/privacy-policy" className="font-semibold text-cx-brand-deep underline underline-offset-2">Privacy Policy</Link>
                  </p>
                </div>
              </div>
            </aside>

            {/* Terms Body */}
            <main className="min-w-0 lg:col-span-8">
              {/* Contents - mobile / tablet */}
              <details className="group mb-5 rounded-mk-lg border border-mk-line bg-mk-surface shadow-mk-sm lg:hidden">
                <summary className="mk-focus flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 rounded-mk-lg px-5 text-[14px] font-semibold text-mk-ink [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex items-center gap-2">
                    <FileText className="h-4 w-4 text-cx-brand" /> Contents
                  </span>
                  <ChevronDown className="h-4 w-4 text-mk-muted transition-transform duration-300 group-open:rotate-180" aria-hidden />
                </summary>
                <nav className="border-t border-mk-line px-3 py-2 text-[14px]" aria-label="Terms contents">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="flex min-h-[44px] items-center rounded-lg px-2.5 font-medium text-mk-ink-2 hover:bg-mk-bg hover:text-mk-ink"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </details>

              <div className="rounded-mk-lg border border-mk-line bg-mk-surface px-5 shadow-mk sm:px-8 lg:px-10">

              {/* Section 1 */}
              <PolicySection id="who-we-are" number="01" title="Who we are" icon={Building2}>
                <p>
                  Vehiculars is run by <strong>Vehiculars Technology Limited</strong> ("Vehiculars", "we", "us" or "our"),
                  a private company registered with the Corporate Affairs Commission (CAC) under{" "}
                  <strong>RC 8994192</strong>. In these terms, "you" means the person using our website, web app or
                  mobile apps, or ordering a service from us.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[13.5px]">
                  <div className="min-w-0 rounded-xl bg-mk-bg p-4 border border-mk-line">
                    <p className="font-bold text-mk-ink flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 shrink-0 text-cx-brand" /> Lagos office
                    </p>
                    <p className="mt-2 text-mk-ink-2 leading-relaxed">
                      38 Opebi Road, Adebola House<br />
                      Suite 100, Rear Car Park Wing<br />
                      Ikeja, Lagos
                    </p>
                  </div>
                  <div className="min-w-0 rounded-xl bg-mk-bg p-4 border border-mk-line">
                    <p className="font-bold text-mk-ink flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 shrink-0 text-cx-brand" /> Abuja office
                    </p>
                    <p className="mt-2 text-mk-ink-2 leading-relaxed">
                      No. 50 Ebitu Ukiwe Street<br />
                      Jabi, Abuja
                    </p>
                  </div>
                </div>
                <p>
                  You can reach us at{" "}
                  <a href="mailto:support@vehiculars.com" className={linkCls}>support@vehiculars.com</a>.
                </p>
              </PolicySection>

              {/* Section 2 */}
              <PolicySection id="what-we-do" number="02" title="What we do" icon={Briefcase}>
                <p>
                  Vehiculars acts as your private agent for vehicle-document applications. When you place an order, we
                  prepare your application, submit it to the relevant authority on your behalf and follow it up until it
                  is completed. Services we handle include:
                </p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>Driver&apos;s licence applications and renewals</li>
                  <li>Number plates</li>
                  <li>Vehicle particulars and renewals</li>
                  <li>Tinted glass permits</li>
                  <li>Roadworthiness</li>
                  <li>Vehicle verification</li>
                  <li>Physical condition inspection</li>
                  <li>ECMR registration</li>
                </ul>
                <p>
                  The relevant authority makes the final decision on every application. We cannot control or promise any
                  authority&apos;s decision, and we do not issue licences, plates or permits ourselves.
                </p>
                <div className="rounded-xl border border-mk-line bg-mk-bg p-4 text-[14px] text-mk-ink">
                  <p className="flex items-start gap-2 font-semibold">
                    <Info className="mt-1 h-4 w-4 shrink-0 text-cx-brand" />
                    <span>
                      Vehiculars is a private service provider. We are not affiliated with FRSC, VIO, the Nigeria Police
                      Force or any government agency.
                    </span>
                  </p>
                </div>
              </PolicySection>

              {/* Section 3 */}
              <PolicySection id="accounts" number="03" title="Accounts and eligibility" icon={UserCheck}>
                <ul className="list-disc space-y-2 pl-5">
                  <li>You must be at least <strong>18 years old</strong> to create an account or order a service.</li>
                  <li>The information you give us when you sign up must be accurate and kept up to date.</li>
                  <li>
                    You are responsible for keeping your login details secure and for activity on your account. Tell us
                    straight away at{" "}
                    <a href="mailto:support@vehiculars.com" className={linkCls}>support@vehiculars.com</a> if you think
                    someone else has accessed it.
                  </li>
                </ul>
              </PolicySection>

              {/* Section 4 */}
              <PolicySection id="your-responsibilities" number="04" title="Your responsibilities" icon={ClipboardCheck}>
                <p>To let us handle your application properly, you agree to:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Give us accurate, complete and truthful information.</li>
                  <li>Provide only genuine documents that belong to you or that you are authorised to use.</li>
                  <li>Respond promptly when we ask for more information, documents or confirmations.</li>
                  <li>
                    Attend biometric capture or any in-person appointment in person where the authority requires it, at
                    the time and place agreed.
                  </li>
                </ul>
                <p>
                  Delays or rejections caused by missing, late or inaccurate information from you are not our
                  responsibility.
                </p>
              </PolicySection>

              {/* Section 5 */}
              <PolicySection id="fees-payment" number="05" title="Fees and payment" icon={Wallet}>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    The price of each service is shown before you pay, on our{" "}
                    <Link href="/pricing" className={linkCls}>pricing page</Link> and in the app.
                  </li>
                  <li>
                    You can pay in full, from your Vehiculars wallet, or by instalment or deposit where the app offers
                    that option for the service.
                  </li>
                  <li>
                    Where a price says it includes authority fees (for example, licence or plate fees), we pay those fees
                    to the authority on your behalf from what you paid us.
                  </li>
                  <li>Payments are processed by licensed third-party payment providers. We do not store your full card details.</li>
                </ul>
                <p>If you pay by instalment or deposit, we may hold your application until the remaining balance is paid.</p>
              </PolicySection>

              {/* Section 6 */}
              <PolicySection id="processing-times" number="06" title="Processing times" icon={Clock}>
                <p>
                  Any processing time we show is an estimate based on our experience. Actual times depend on the
                  relevant authority, appointment availability and how quickly you respond to our requests. Processing
                  times are not promised, and we are not responsible for delays caused by an authority or by events
                  outside our control. We will keep you updated in the app as your application moves forward.
                </p>
              </PolicySection>

              {/* Section 7 */}
              <PolicySection id="refunds" number="07" title="Refunds" icon={RotateCcw}>
                <p>
                  If the authority rejects your application for reasons outside your control, or we cannot deliver the
                  service you paid for, we refund what you paid for that service. Refunds are not available once a
                  document has been issued or delivered, if the rejection was caused by false, incomplete or forged
                  information or documents you supplied, or if you cancel after processing with the authority has
                  begun.
                </p>
                <p>
                  Full details are in our <Link href="/refund-policy" className={linkCls}>Refund Policy</Link>, which
                  forms part of these terms.
                </p>
              </PolicySection>

              {/* Section 8 */}
              <PolicySection id="earn-referrals" number="08" title="Vehiculars Earn and referral credit" icon={Gift}>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    Credit earned through <Link href="/earn" className={linkCls}>Vehiculars Earn</Link> or referrals can
                    only be used to pay for Vehiculars services. It is not cash and cannot be withdrawn or transferred.
                  </li>
                  <li>
                    Earn credit depends on jobs actually completed by the expert you recommended, once that expert has
                    been verified by us. We do not promise any level of earnings.
                  </li>
                  <li>
                    We may suspend or remove credit, or close an Earn or referral account, if we find abuse such as fake
                    accounts, self-referrals or false job records.
                  </li>
                </ul>
              </PolicySection>

              {/* Section 9 */}
              <PolicySection id="prohibited-use" number="09" title="Prohibited use" icon={Ban}>
                <p>You must not use Vehiculars to:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Submit forged, altered or stolen documents.</li>
                  <li>Impersonate another person or apply in someone else&apos;s name without their authority.</li>
                  <li>Commit or attempt fraud, including payment fraud or chargeback abuse.</li>
                  <li>Interfere with, copy or misuse our platform, systems or other users&apos; accounts.</li>
                </ul>
                <p>
                  We may refuse or stop a service, suspend or close your account, and report unlawful activity to the
                  appropriate law enforcement authorities.
                </p>
              </PolicySection>

              {/* Section 10 */}
              <PolicySection id="intellectual-property" number="10" title="Intellectual property" icon={Copyright}>
                <p>
                  The Vehiculars name, logo, website, apps, text, graphics and software belong to Vehiculars Technology
                  Limited or its licensors. You may use them only to access our services for your own personal or
                  business needs. You may not copy, resell or reproduce them without our written permission.
                </p>
              </PolicySection>

              {/* Section 11 */}
              <PolicySection id="liability" number="11" title="Limitation of liability" icon={Scale}>
                <p>To the extent permitted by Nigerian law:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>We are not liable for decisions made by any authority, including rejections or requests for more documents.</li>
                  <li>
                    We are not liable for delays or failures caused by events outside our reasonable control, such as
                    authority system outages, policy changes, strikes, public holidays or network failures.
                  </li>
                  <li>
                    Our total liability to you for any claim about a service is limited to the fees you paid us for
                    that affected service.
                  </li>
                </ul>
                <p>Nothing in these terms limits any right you have that cannot be limited under Nigerian law.</p>
              </PolicySection>

              {/* Section 12 */}
              <PolicySection id="changes" number="12" title="Changes to these terms" icon={FileCheck}>
                <p>
                  We may update these terms from time to time. When we do, we will change the "Last updated" date at the
                  top of this page, and for significant changes we will let you know in the app or by email. If you keep
                  using Vehiculars after a change takes effect, you accept the updated terms.
                </p>
              </PolicySection>

              {/* Section 13 */}
              <PolicySection id="governing-law" number="13" title="Governing law" icon={Landmark}>
                <p>
                  These terms are governed by the laws of the <strong>Federal Republic of Nigeria</strong>. We will try to
                  resolve any dispute with you informally first; if we cannot, it will be handled by the courts of
                  Nigeria.
                </p>
              </PolicySection>

              {/* Section 14 */}
              <PolicySection id="contact" number="14" title="Contact" icon={Mail}>
                <p>If you have a question about these terms, contact us:</p>
                <div className="rounded-mk-lg border border-mk-line bg-white p-5 sm:p-6 shadow-mk-sm space-y-4 text-[13.5px]">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 shrink-0 text-mk-ink-2 mt-0.5" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-mk-ink">VEHICULARS TECHNOLOGY LIMITED</h4>
                      <p className="text-[13px] text-mk-muted font-mono">RC 8994192</p>
                    </div>
                  </div>
                  <div className="border-t border-mk-line pt-4 flex flex-wrap items-center gap-x-8 gap-y-4">
                    <div className="min-w-0">
                      <span className="text-mk-muted block">Customer support</span>
                      <a href="mailto:support@vehiculars.com" className="font-bold text-cx-brand-deep underline break-all">
                        support@vehiculars.com
                      </a>
                    </div>
                    <div className="min-w-0">
                      <span className="text-mk-muted block">Privacy questions</span>
                      <a href="mailto:privacy@vehiculars.com" className="font-bold text-mk-ink underline break-all">
                        privacy@vehiculars.com
                      </a>
                    </div>
                  </div>
                </div>
                <p>
                  See also our <Link href="/refund-policy" className={linkCls}>Refund Policy</Link> and{" "}
                  <Link href="/privacy-policy" className={linkCls}>Privacy Policy</Link>.
                </p>
              </PolicySection>

              </div>
            </main>
          </div>
        </Container>
      </section>

      <Footer redirectTo="/terms" />
    </div>
  );
}
