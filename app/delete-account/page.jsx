"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, ShieldAlert, Trash2, Smartphone, Globe, Mail, CheckCircle2 } from "lucide-react";
import Nav from "@/app/components/landing/sections/Nav";
import Footer from "@/app/components/landing/sections/Footer";
import { Container } from "@/app/components/marketing/ui";
import { Reveal, Stagger, StaggerItem } from "@/app/components/marketing/motion";

function Section({ title, last = false, children }) {
  return (
    <section className={`py-8 ${last ? "" : "border-b border-mk-line"}`}>
      <h2 className="text-[19px] sm:text-[20px] font-semibold tracking-[-0.015em] text-mk-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-mk-ink-2">{children}</div>
    </section>
  );
}

export default function DeleteAccountPage() {
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

  const dashboardHref = userRole === "admin" ? "/admin" : userRole === "staff" ? "/staff" : "/dashboard";
  const dashboardLabel = userRole === "admin" ? "Admin Portal" : userRole === "staff" ? "Staff Portal" : "Go to Dashboard";

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

  return (
    <div className="mk-root min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: `body { background: var(--mk-bg); }` }} />
      <Nav
        logoUrl="/logo.png"
        scrolled={scrolled}
        isLoggedIn={isLoggedIn}
        dashboardHref={dashboardHref}
        dashboardLabel={dashboardLabel}
        redirectTo="/delete-account"
      />

      <section className="relative overflow-hidden border-b border-mk-line bg-mk-surface">
        <div aria-hidden className="mk-grid-bg pointer-events-none absolute inset-0" />
        <Container className="relative py-14 sm:py-20">
          <Stagger animateOnMount className="mx-auto max-w-3xl text-center">
            <StaggerItem>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[12.5px] font-semibold text-red-700">
                <ShieldAlert className="w-3.5 h-3.5" /> Account Deletion
              </span>
            </StaggerItem>
            <StaggerItem>
              <h1
                className="mt-5 font-semibold tracking-[-0.03em] text-mk-ink text-balance"
                style={{ fontSize: "clamp(1.85rem, 2.4vw + 1rem, 3rem)", lineHeight: 1.08 }}
              >
                Delete Your Vehiculars Account
              </h1>
            </StaggerItem>
            <StaggerItem>
              <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-mk-muted text-pretty">
                Information on how to permanently delete your account, what data is removed, and consequences of deletion.
              </p>
            </StaggerItem>

            <StaggerItem className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              {isLoggedIn ? (
                <Link
                  href="/dashboard/settings#danger-zone"
                  className="mk-focus inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-red-600 px-6 text-[14.5px] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(220,38,38,0.6)] transition-[background-color,transform] duration-200 hover:bg-red-700 active:scale-[0.98]"
                >
                  <Trash2 className="w-4 h-4" /> Go to Account Settings to Delete
                </Link>
              ) : (
                <Link
                  href="/auth/login?redirect=/dashboard/settings%23danger-zone"
                  className="mk-focus inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-red-600 px-6 text-[14.5px] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(220,38,38,0.6)] transition-[background-color,transform] duration-200 hover:bg-red-700 active:scale-[0.98]"
                >
                  <Trash2 className="w-4 h-4" /> Sign In to Delete Account
                </Link>
              )}
            </StaggerItem>
          </Stagger>
        </Container>
      </section>

      <section className="bg-mk-bg py-12 sm:py-16">
        <Container className="max-w-[800px]">
          {/* Warning Banner */}
          <Reveal className="mb-6 flex items-start gap-3.5 rounded-mk border border-red-200 bg-red-50 p-5 text-red-950">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-[14.5px] leading-relaxed">
              <strong className="font-semibold block text-red-950 mb-1">Warning: Account Deletion is Permanent</strong>
              Deleting your account is irreversible. All your active vehicle applications, document vault files, and wallet balance will be permanently forfeited.
            </div>
          </Reveal>

          <Reveal delay={0.05} className="rounded-mk-lg border border-mk-line bg-mk-surface px-5 shadow-mk sm:px-10">
            <Section title="How to Delete Your Account">
              <p>You can delete your account directly through either our mobile app or our web dashboard:</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Web Instructions */}
                <div className="rounded-mk border border-mk-line bg-mk-bg p-5 space-y-3">
                  <div className="flex items-center gap-2.5 font-semibold text-mk-ink text-[14.5px]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cx-brand-soft text-cx-brand-deep">
                      <Globe className="w-4 h-4" />
                    </span>
                    Web Dashboard
                  </div>
                  <ol className="list-decimal pl-4 space-y-1.5 text-[13.5px] text-mk-ink-2">
                    <li>Log in to your account.</li>
                    <li>
                      Go to{" "}
                      <Link href="/dashboard/settings#danger-zone" className="text-cx-brand-deep underline underline-offset-2 font-medium">
                        Dashboard Settings
                      </Link>
                      .
                    </li>
                    <li>Scroll down to the <strong>Danger Zone</strong>.</li>
                    <li>Click <strong>Delete Account</strong>.</li>
                    <li>Confirm with your password or type DELETE.</li>
                  </ol>
                </div>

                {/* Mobile Instructions */}
                <div className="rounded-mk border border-mk-line bg-mk-bg p-5 space-y-3">
                  <div className="flex items-center gap-2.5 font-semibold text-mk-ink text-[14.5px]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cx-brand-soft text-cx-brand-deep">
                      <Smartphone className="w-4 h-4" />
                    </span>
                    Mobile App (iOS / Android)
                  </div>
                  <ol className="list-decimal pl-4 space-y-1.5 text-[13.5px] text-mk-ink-2">
                    <li>Open the Vehiculars mobile app.</li>
                    <li>Tap the <strong>More</strong> tab on the bottom bar.</li>
                    <li>Scroll to the <strong>Danger Zone</strong> section.</li>
                    <li>Tap <strong>Delete account</strong>.</li>
                    <li>Review the consequences and confirm.</li>
                  </ol>
                </div>
              </div>
            </Section>

            <Section title="What Happens When You Delete Your Account">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Immediate Sign-Out &amp; Access Revocation:</strong> You are logged out immediately on all devices. You cannot sign back in using your previous email, phone number, or linked Google account.
                </li>
                <li>
                  <strong>Application Cancellation:</strong> Any in-flight driver’s licence, vehicle particulars renewal, number plate, or verification applications will be cancelled.
                </li>
                <li>
                  <strong>Document Vault:</strong> Digital copies of issued driver’s licences, vehicle licences, and roadworthiness certificates linked to the profile will become inaccessible.
                </li>
                <li>
                  <strong>Dedicated Monnify Virtual Account:</strong> Your assigned Monnify dedicated virtual account will be closed. Any remaining wallet balance is forfeited upon deletion.
                </li>
                <li>
                  <strong>Referral Code &amp; Rewards:</strong> Your referral link and any unredeemed rewards are permanently erased.
                </li>
              </ul>
            </Section>

            <Section title="Data Retention &amp; Anonymization">
              <p>
                In compliance with data protection laws (NDPR) and consumer privacy standards:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Your device push notification tokens and unsubmitted application drafts are immediately purged.</li>
                <li>Your account is deactivated and your email address is anonymized (freeing it for future registration if you ever choose to return).</li>
                <li>
                  Financial records and receipts of completed government statutory transactions are retained for the legally mandated period required by Nigerian financial and tax regulations.
                </li>
              </ul>
            </Section>

            <Section title="Assisted Deletion Requests" last>
              <p>
                If you cannot access your account or need assistance deleting your account, you can contact our support team from your registered email address:
              </p>
              <a
                href="mailto:support@vehiculars.com?subject=Account%20Deletion%20Request"
                className="mk-focus mk-lift mt-3 flex items-center gap-3 rounded-mk border border-mk-line bg-mk-bg p-4"
              >
                <div className="h-10 w-10 rounded-xl bg-cx-brand-soft text-cx-brand-deep flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1 text-[13.5px]">
                  <p className="font-semibold text-mk-ink">Email Support</p>
                  <span className="text-cx-brand-deep underline-offset-2 hover:underline">
                    support@vehiculars.com
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-mk-muted" aria-hidden />
              </a>
            </Section>
          </Reveal>
        </Container>
      </section>

      <Footer redirectTo="/delete-account" />
    </div>
  );
}
