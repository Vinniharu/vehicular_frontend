"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, ShieldAlert, Trash2, Smartphone, Globe, Mail, CheckCircle2 } from "lucide-react";
import Nav from "@/app/components/landing/sections/Nav";
import Footer from "@/app/components/landing/sections/Footer";
import { GREEN, INK, INK_SOFT, PAPER } from "@/app/components/landing/theme";

function Section({ title, children }) {
  return (
    <section className="py-6" style={{ borderBottom: "1px solid rgba(17,17,17,0.08)" }}>
      <h2 className="font-display text-[18px] font-semibold text-[#111111]">{title}</h2>
      <div className="mt-3 space-y-3 text-[14.5px] leading-relaxed text-[#111111]/70">{children}</div>
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
    <div>
      <style dangerouslySetInnerHTML={{ __html: `body { background: ${INK}; }` }} />
      <Nav
        logoUrl="/logo.png"
        scrolled={scrolled}
        isLoggedIn={isLoggedIn}
        dashboardHref={dashboardHref}
        dashboardLabel={dashboardLabel}
        redirectTo="/delete-account"
      />

      <section className="px-5 pb-10 pt-28 md:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{ background: "rgba(220, 53, 69, 0.15)", color: "#DC3545" }}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Account Deletion
          </span>
          <h1 className="mt-4 font-display text-[32px] font-medium leading-tight text-white sm:text-[42px]">
            Delete Your Vehiculars Account
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed" style={{ color: INK_SOFT }}>
            Information on how to permanently delete your account, what data is removed, and consequences of deletion.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard/settings#danger-zone"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm text-sm"
              >
                <Trash2 className="w-4 h-4" /> Go to Account Settings to Delete
              </Link>
            ) : (
              <Link
                href="/auth/login?redirect=/dashboard/settings%23danger-zone"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm text-sm"
              >
                <Trash2 className="w-4 h-4" /> Sign In to Delete Account
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 md:px-8" style={{ background: PAPER }}>
        <div className="mx-auto max-w-2xl pt-12 space-y-2">
          {/* Warning Banner */}
          <div className="rounded-2xl border border-red-200 bg-red-50/70 p-5 text-red-950 flex items-start gap-3.5 mb-6">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm leading-relaxed">
              <strong className="font-semibold block text-red-950 mb-1">Warning: Account Deletion is Permanent</strong>
              Deleting your account is irreversible. All your active vehicle applications, document vault files, and wallet balance will be permanently forfeited.
            </div>
          </div>

          <Section title="How to Delete Your Account">
            <p>You can delete your account directly through either our mobile app or our web dashboard:</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Web Instructions */}
              <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-2xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
                  <Globe className="w-4 h-4 text-emerald-600" /> Web Dashboard
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-600">
                  <li>Log in to your account.</li>
                  <li>
                    Go to{" "}
                    <Link href="/dashboard/settings#danger-zone" className="text-emerald-600 underline font-medium">
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
              <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-2xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
                  <Smartphone className="w-4 h-4 text-emerald-600" /> Mobile App (iOS / Android)
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-600">
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

          <Section title="Assisted Deletion Requests">
            <p>
              If you cannot access your account or need assistance deleting your account, you can contact our support team from your registered email address:
            </p>
            <div className="mt-3 p-4 rounded-xl border border-slate-200 bg-white flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-900">Email Support</p>
                <a href="mailto:support@vehiculars.com?subject=Account%20Deletion%20Request" className="text-emerald-600 hover:underline">
                  support@vehiculars.com
                </a>
              </div>
            </div>
          </Section>
        </div>
      </section>

      <Footer />
    </div>
  );
}
