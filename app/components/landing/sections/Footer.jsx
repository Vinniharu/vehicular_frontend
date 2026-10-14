"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin } from "lucide-react";
import { Container } from "@/app/components/marketing/ui";
import { SERVICE_LINKS } from "../landing-data";

const linkCls = "mk-focus rounded text-[14px] text-white/60 transition-colors duration-200 hover:text-white";

export default function Footer({ redirectTo }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const howHref = isHome ? "#how" : "/#how";
  const showcasesHref = isHome ? "#showcases" : "/#showcases";
  return (
    <footer id="contact" className="relative z-[1] overflow-hidden bg-mk-dark text-white pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0">
      <div aria-hidden className="mk-grid-bg-dark pointer-events-none absolute inset-0 opacity-60" />
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(40,167,69,0.18),transparent)]" />
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cx-brand/50 to-transparent" />

      <Container className="relative pt-16 sm:pt-20">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-12">
          <div className="col-span-2 md:col-span-4">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="" className="h-8 w-auto object-contain" loading="lazy" />
              <span className="text-[17px] font-semibold tracking-[-0.02em]">Vehiculars</span>
            </div>
            <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-white/55">
              Everything your car needs — handled end-to-end, delivered nationwide. Vehiculars is a startup and subsidiary under MIMHEL ENGINEERING AND CONTRUCTION LTD.
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-cx-brand/30 bg-cx-brand/10 px-3 py-1 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-[#5fd17a]">
              A Mimhel Subsidiary
            </span>
          </div>

          <div className="md:col-span-2">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">Company</p>
            <ul className="space-y-3">
              <li><a href={howHref} className={linkCls}>How it works</a></li>
              <li><a href={showcasesHref} className={linkCls}>App preview</a></li>
              <li><Link href="/pricing" className={linkCls}>Pricing</Link></li>
              <li><a href="https://spare.vehiculars.com" className={linkCls}>Spare Parts</a></li>
              <li><Link href="/earn" className={linkCls}>Earn</Link></li>
              <li><a href="#contact" className={linkCls}>Contact</a></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">Services</p>
            <ul className="space-y-3">
              {SERVICE_LINKS.slice(0, 6).map((s) => (
                <li key={s.slug}>
                  <Link href={`/services/${s.slug}`} className={linkCls}>{s.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">Account &amp; legal</p>
            <ul className="space-y-3">
              <li><Link href="/privacy-policy" className={linkCls}>Privacy Policy</Link></li>
              <li><Link href={`/auth/login?redirect=${encodeURIComponent(redirectTo)}`} className={linkCls}>Sign in</Link></li>
              <li><Link href={`/auth/signup?redirect=${encodeURIComponent(redirectTo)}`} className={linkCls}>Create account</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {[
            { city: "Lagos Office", address: "38 Opebi Road, Adebola House (Suite 100, Rear Car Park Wing), Ikeja, Lagos" },
            { city: "Abuja Office", address: "No. 50 Ebitu Ukiwe Street, Jabi, Abuja" },
          ].map((o) => (
            <div key={o.city} className="flex gap-3 rounded-mk border border-white/10 bg-white/[0.03] p-4">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cx-brand" aria-hidden />
              <div>
                <p className="text-[14px] font-medium text-white/90">{o.city}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-white/55">{o.address}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/[0.08] py-8 text-center md:flex-row md:text-left">
          <p className="text-[12.5px] text-white/40">
            &copy; {new Date().getFullYear()} Vehiculars. All rights reserved. Vehiculars is a subsidiary under MIMHEL ENGINEERING AND CONTRUCTION LTD.
          </p>
          <p className="inline-flex items-center gap-2 text-[12.5px] text-white/40">
            <span className="h-1.5 w-1.5 rounded-full bg-cx-brand" aria-hidden />
            Made in Nigeria
          </p>
        </div>
      </Container>
    </footer>
  );
}
