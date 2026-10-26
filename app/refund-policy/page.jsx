"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  RotateCcw,
  FileText,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  Wallet,
  Mail,
  Building2,
  ChevronDown,
  Info,
} from "lucide-react";

import Nav from "@/app/components/landing/sections/Nav";
import Footer from "@/app/components/landing/sections/Footer";
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

export default function RefundPolicyPage() {
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
    { id: "overview", label: "1. Overview" },
    { id: "full-refund", label: "2. When you get a full refund" },
    { id: "no-refund", label: "3. When a refund is not available" },
    { id: "how-to-request", label: "4. How to request a refund" },
    { id: "timelines", label: "5. Timelines" },
    { id: "wallet-earn", label: "6. Wallet balance and Earn credit" },
    { id: "contact", label: "7. Contact" },
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
        redirectTo="/refund-policy"
      />

      {/* Header Banner */}
      <section className="relative overflow-hidden border-b border-mk-line bg-mk-surface">
        <div aria-hidden className="mk-grid-bg pointer-events-none absolute inset-0" />
        <div aria-hidden className="mk-glow pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] max-w-[180vw] -translate-x-1/2" />
        <Container className="relative py-14 sm:py-20">
          <Stagger animateOnMount className="mx-auto max-w-4xl text-center">
            <StaggerItem>
              <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-cx-brand/20 bg-cx-brand-soft px-3.5 py-1.5 text-[12px] font-semibold text-cx-brand-deep">
                <RotateCcw className="h-4 w-4 shrink-0" />
                <span>Vehiculars Technology Limited &bull; RC 8994192</span>
              </span>
            </StaggerItem>

            <StaggerItem>
              <h1
                className="mt-5 font-semibold tracking-[-0.03em] text-mk-ink text-balance"
                style={{ fontSize: "clamp(1.85rem, 2.4vw + 1rem, 3rem)", lineHeight: 1.08 }}
              >
                Refund{" "}
                <span className="font-display font-normal italic text-cx-brand">Policy</span>
              </h1>
            </StaggerItem>
            <StaggerItem>
              <p className="mx-auto mt-4 max-w-2xl text-[16px] sm:text-[17px] leading-relaxed text-mk-muted text-pretty">
                When you get your money back, when you don&apos;t, and how to ask for a refund from{" "}
                <strong className="font-semibold text-mk-ink">Vehiculars</strong>.
              </p>
            </StaggerItem>

            <StaggerItem className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[12.5px] text-mk-muted">
              <span className="rounded-full border border-mk-line bg-mk-bg px-3 py-1">Last updated: <strong className="font-semibold text-mk-ink">{LAST_UPDATED}</strong></span>
              <Link href="/terms" className="rounded-full border border-mk-line bg-mk-bg px-3 py-1 font-semibold text-cx-brand-deep hover:text-mk-ink">Terms of Service</Link>
              <Link href="/privacy-policy" className="rounded-full border border-mk-line bg-mk-bg px-3 py-1 font-semibold text-cx-brand-deep hover:text-mk-ink">Privacy Policy</Link>
            </StaggerItem>
          </Stagger>

          {/* At-a-glance summary */}
          <Reveal delay={0.15} className="mx-auto mt-10 max-w-4xl">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <div className="min-w-0 rounded-mk-lg border border-mk-line bg-mk-bg p-4 sm:p-5 shadow-mk-sm">
                <CheckCircle2 className="h-5 w-5 text-cx-brand" />
                <p className="mt-2 text-[14px] font-semibold text-mk-ink">100% refund</p>
                <p className="mt-1 text-[13px] leading-relaxed text-mk-muted">If the authority rejects your application for reasons outside your control, or we can&apos;t deliver.</p>
              </div>
              <div className="min-w-0 rounded-mk-lg border border-mk-line bg-mk-bg p-4 sm:p-5 shadow-mk-sm">
                <Wallet className="h-5 w-5 text-cx-brand" />
                <p className="mt-2 text-[14px] font-semibold text-mk-ink">Within 5 working days</p>
                <p className="mt-1 text-[13px] leading-relaxed text-mk-muted">Refunds go to your Vehiculars wallet, or to your bank account on request.</p>
              </div>
              <div className="min-w-0 rounded-mk-lg border border-mk-line bg-mk-bg p-4 sm:p-5 shadow-mk-sm">
                <MessageSquare className="h-5 w-5 text-cx-brand" />
                <p className="mt-2 text-[14px] font-semibold text-mk-ink">Easy to request</p>
                <p className="mt-1 text-[13px] leading-relaxed text-mk-muted">Use in-app support chat or email support@vehiculars.com with your application ID.</p>
              </div>
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
                <nav className="mt-3 max-h-[calc(100vh-20rem)] space-y-0.5 overflow-y-auto text-[13px]" aria-label="Refund policy contents">
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
                  <p className="font-semibold text-mk-ink">Need a refund?</p>
                  <p className="mt-1">Email us with your application ID:</p>
                  <a href="mailto:support@vehiculars.com" className="mt-2 inline-flex items-center gap-1 font-bold text-cx-brand-deep underline underline-offset-2">
                    support@vehiculars.com
                  </a>
                  <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                    <Link href="/terms" className="font-semibold text-cx-brand-deep underline underline-offset-2">Terms of Service</Link>
                    <Link href="/privacy-policy" className="font-semibold text-cx-brand-deep underline underline-offset-2">Privacy Policy</Link>
                  </p>
                </div>
              </div>
            </aside>

            {/* Policy Body */}
            <main className="min-w-0 lg:col-span-8">
              {/* Contents - mobile / tablet */}
              <details className="group mb-5 rounded-mk-lg border border-mk-line bg-mk-surface shadow-mk-sm lg:hidden">
                <summary className="mk-focus flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 rounded-mk-lg px-5 text-[14px] font-semibold text-mk-ink [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex items-center gap-2">
                    <FileText className="h-4 w-4 text-cx-brand" /> Contents
                  </span>
                  <ChevronDown className="h-4 w-4 text-mk-muted transition-transform duration-300 group-open:rotate-180" aria-hidden />
                </summary>
                <nav className="border-t border-mk-line px-3 py-2 text-[14px]" aria-label="Refund policy contents">
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
              <PolicySection id="overview" number="01" title="Overview" icon={Info}>
                <p>
                  This Refund Policy explains when <strong>Vehiculars Technology Limited</strong> (RC 8994192) refunds
                  payments made for our services, and how. It forms part of our{" "}
                  <Link href="/terms" className={linkCls}>Terms of Service</Link>.
                </p>
                <p>
                  Vehiculars is a private service provider. We prepare, submit and follow up on vehicle-document
                  applications with the relevant authority on your behalf. We are not affiliated with FRSC, VIO, the
                  Nigeria Police Force or any government agency, and the authority makes the final decision on every
                  application.
                </p>
              </PolicySection>

              {/* Section 2 */}
              <PolicySection id="full-refund" number="02" title="When you get a full refund" icon={CheckCircle2}>
                <p>We refund <strong>100% of what you paid for that service</strong> if:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>The authority rejects your application for reasons outside your control; or</li>
                  <li>Vehiculars cannot deliver the service you paid for.</li>
                </ul>
                <p>
                  The refund is paid to your <strong>Vehiculars wallet within 5 working days</strong>. If you prefer, ask
                  us and we will send it to your bank account instead.
                </p>
              </PolicySection>

              {/* Section 3 */}
              <PolicySection id="no-refund" number="03" title="When a refund is not available" icon={XCircle}>
                <p>A refund is not available:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Once the document has been issued or delivered to you.</li>
                  <li>
                    If the rejection was caused by false, incomplete or forged information or documents that you
                    supplied.
                  </li>
                  <li>If you cancel after processing with the authority has begun.</li>
                </ul>
                <div className="rounded-xl border border-mk-line bg-mk-bg p-4 text-[14px] text-mk-ink-2">
                  <p>
                    <strong className="text-mk-ink">Cancelling?</strong> You can cancel for a full refund at any time
                    before we start processing with the authority. We will tell you in the app before we reach that
                    point, so you know when cancellation stops being refundable.
                  </p>
                </div>
              </PolicySection>

              {/* Section 4 */}
              <PolicySection id="how-to-request" number="04" title="How to request a refund" icon={MessageSquare}>
                <p>You can request a refund in either of these ways:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Open the <strong>support chat</strong> in the Vehiculars app; or</li>
                  <li>
                    Email{" "}
                    <a href="mailto:support@vehiculars.com" className={linkCls}>support@vehiculars.com</a>.
                  </li>
                </ul>
                <p>
                  Please include your <strong>application ID</strong> and a short reason. If you want the refund sent to
                  your bank account rather than your wallet, include the account details. We will confirm whether the
                  refund is approved.
                </p>
              </PolicySection>

              {/* Section 5 */}
              <PolicySection id="timelines" number="05" title="Timelines" icon={Clock}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="min-w-0 rounded-xl border border-mk-line bg-white p-4">
                    <p className="font-bold text-mk-ink">To your Vehiculars wallet</p>
                    <p className="mt-1 text-[13.5px] text-mk-ink-2">Within 5 working days of the refund being approved.</p>
                  </div>
                  <div className="min-w-0 rounded-xl border border-mk-line bg-white p-4">
                    <p className="font-bold text-mk-ink">To your bank account</p>
                    <p className="mt-1 text-[13.5px] text-mk-ink-2">Typically 5 to 10 working days after your request, depending on your bank.</p>
                  </div>
                </div>
              </PolicySection>

              {/* Section 6 */}
              <PolicySection id="wallet-earn" number="06" title="Wallet balance and Earn credit" icon={Wallet}>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Refunds paid to your wallet can be used for any Vehiculars service.</li>
                  <li>
                    Credit from <Link href="/earn" className={linkCls}>Vehiculars Earn</Link> or referrals is usable for
                    Vehiculars services only. It is not refundable as cash and cannot be withdrawn.
                  </li>
                </ul>
              </PolicySection>

              {/* Section 7 */}
              <PolicySection id="contact" number="07" title="Contact" icon={Mail}>
                <p>If you have a question about a refund, contact us:</p>
                <div className="rounded-mk-lg border border-mk-line bg-white p-5 sm:p-6 shadow-mk-sm space-y-4 text-[13.5px]">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 shrink-0 text-mk-ink-2 mt-0.5" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-mk-ink">VEHICULARS TECHNOLOGY LIMITED</h4>
                      <p className="text-[13px] text-mk-muted font-mono">RC 8994192</p>
                      <p className="mt-2 text-mk-ink-2 leading-relaxed">
                        Lagos: 38 Opebi Road, Adebola House (Suite 100, Rear Car Park Wing), Ikeja, Lagos
                      </p>
                      <p className="mt-1 text-mk-ink-2 leading-relaxed">
                        Abuja: No. 50 Ebitu Ukiwe Street, Jabi, Abuja
                      </p>
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
                  See also our <Link href="/terms" className={linkCls}>Terms of Service</Link> and{" "}
                  <Link href="/privacy-policy" className={linkCls}>Privacy Policy</Link>.
                </p>
              </PolicySection>

              </div>
            </main>
          </div>
        </Container>
      </section>

      <Footer redirectTo="/refund-policy" />
    </div>
  );
}
