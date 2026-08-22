"use client";

import { useEffect, useState } from "react";

import Nav from "@/app/components/landing/sections/Nav";
import Footer from "@/app/components/landing/sections/Footer";
import { GREEN, INK, INK_SOFT, PAPER } from "@/app/components/landing/theme";

const EFFECTIVE_DATE = "21 August 2026";

function Section({ title, children }) {
  return (
    <section className="py-6" style={{ borderBottom: "1px solid rgba(17,17,17,0.08)" }}>
      <h2 className="font-display text-[18px] font-medium text-[#111111]">{title}</h2>
      <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-[#111111]/70">{children}</div>
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
      <Nav logoUrl="/logo.png" scrolled={scrolled} isLoggedIn={isLoggedIn} dashboardHref={dashboardHref} dashboardLabel={dashboardLabel} redirectTo="/privacy" />

      <section className="px-5 pb-10 pt-28 md:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: "rgba(40, 167, 69,0.15)", color: GREEN }}>
            Privacy
          </span>
          <h1 className="mt-4 font-display text-[32px] font-medium leading-tight text-white sm:text-[42px]">
            Privacy Policy
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed" style={{ color: INK_SOFT }}>
            What we collect, why we collect it, and who we share it with. Effective {EFFECTIVE_DATE}.
          </p>
        </div>
      </section>

      <section className="px-5 pb-20 md:px-8" style={{ background: PAPER }}>
        <div className="mx-auto max-w-2xl pt-12">
          <Section title="Who we are">
            <p>
              Vehiculars ("Vehiculars", "we", "us") provides driver's licence, vehicle particulars, number
              plate, roadworthiness, and related vehicle-document services in Nigeria, delivered through our
              website and mobile app. This policy explains what personal data we collect when you use either,
              and how we handle it.
            </p>
          </Section>

          <Section title="Information we collect">
            <p><strong>Account information:</strong> your name, email address, and phone number when you register.</p>
            <p>
              <strong>Application details:</strong> vehicle information (make, model, plate number, chassis
              number, etc.), state/LGA of residence, and any other details you submit when applying for a
              service.
            </p>
            <p>
              <strong>Documents and photos:</strong> images and files you upload for a given application —
              for example an existing licence, proof of ownership, or a vehicle photo.
            </p>
            <p>
              <strong>Payment information:</strong> when you pay for a service, your payment is processed by
              our payment partner, Monnify. We receive confirmation that a payment succeeded and its amount —
              we do not receive or store your card or bank account details ourselves.
            </p>
            <p>
              <strong>Device push token (mobile app only):</strong> if you allow notifications, we register a
              push token with your device so we can notify you about your application's status.
            </p>
            <p>
              <strong>Google account information:</strong> if you choose to sign in with Google, we receive
              your name, email address, and profile photo from Google to create or log you into your account.
            </p>
          </Section>

          <Section title="How we use your information">
            <ul className="list-disc space-y-2 pl-5">
              <li>To process your applications with the relevant authority (FRSC, VIO, police, or customs) or vendor.</li>
              <li>To process payments and refunds via Monnify.</li>
              <li>To send you SMS updates (via our SMS provider, Termii) and email updates (via our email provider, Resend) about your applications and account.</li>
              <li>To send push notifications about application status changes, where enabled on the mobile app.</li>
              <li>To respond to support requests and prevent fraud or abuse of our services.</li>
            </ul>
          </Section>

          <Section title="Who we share it with">
            <p>
              We share the minimum information necessary with the following categories of third parties, and
              only for the purposes described above: <strong>Monnify</strong> (payment processing),{" "}
              <strong>Termii</strong> (SMS delivery), <strong>Resend</strong> (email delivery), and{" "}
              <strong>Google</strong> (if you sign in with your Google account). We also share the relevant
              application details with the government authority (FRSC, VIO, police, or customs) your
              application is being processed with — that is the core of the service you're requesting. We do
              not sell your personal information to anyone.
            </p>
          </Section>

          <Section title="Data retention">
            <p>
              We keep your account and application data for as long as your account is active, and for a
              reasonable period afterward to meet legal, tax, and record-keeping obligations. You can request
              deletion of your account and associated data at any time — see "Your rights" below.
            </p>
          </Section>

          <Section title="Security">
            <p>
              We use industry-standard measures — encrypted connections, access controls, and secure storage
              on your device (for saved sign-in sessions on the mobile app) — to protect your information. No
              method of transmission or storage is completely secure, but we work to protect your data
              appropriately for its sensitivity.
            </p>
          </Section>

          <Section title="Your rights">
            <p>
              You can ask us to access, correct, or delete your personal information, or ask us to stop
              processing it, by contacting us at the email address below. We'll respond within a reasonable
              time.
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              Our website uses essential cookies/local storage to keep you signed in and remember your
              preferences. We don't use third-party advertising or tracking cookies.
            </p>
          </Section>

          <Section title="Children's privacy">
            <p>
              Our services are intended for users who are able to legally hold a driver's licence or own a
              vehicle in Nigeria, and are not directed at children. We do not knowingly collect personal
              information from children.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              We may update this policy from time to time. If we make material changes, we'll update the
              effective date above and, where appropriate, notify you directly.
            </p>
          </Section>

          <Section title="Contact us">
            <p>
              Questions about this policy or your data? Email us at{" "}
              <a href="mailto:noreply@vehiculars.com" className="font-semibold" style={{ color: GREEN }}>
                noreply@vehiculars.com
              </a>
              , or reach us at one of our offices:
            </p>
            <div className="mt-2 space-y-3">
              <div>
                <p className="font-semibold text-[#111111]">Lagos Office</p>
                <p>38 Opebi Road, Adebola House (Suite 100, Rear Car Park Wing), Ikeja, Lagos</p>
              </div>
              <div>
                <p className="font-semibold text-[#111111]">Abuja Office</p>
                <p>No. 50 Ebitu Ukiwe Street, Jabi, Abuja</p>
              </div>
            </div>
          </Section>
        </div>
      </section>

      <Footer redirectTo="/privacy" />
    </div>
  );
}
