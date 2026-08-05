"use client";

import Link from "next/link";
import { GREEN, INK } from "../theme";

export default function Footer({ redirectTo }) {
  return (
    <footer id="contact" style={{ background: INK, borderTop: `1px solid ${GREEN}14` }} className="relative z-[1] px-5 md:px-8 py-14 pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <span className="font-display text-[18px] font-medium text-white">Vehiculars</span>
            <p className="mt-4 text-[13px] leading-relaxed text-white/45 max-w-xs">
              Everything your car needs — handled end-to-end, delivered nationwide.
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-white/40 mb-4">Company</p>
            <ul className="space-y-2.5 text-[13px] text-white/60">
              <li><a href="#how" className="hover:text-white transition-colors duration-150">How it works</a></li>
              <li><a href="#showcases" className="hover:text-white transition-colors duration-150">App preview</a></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors duration-150">Pricing</Link></li>
              <li><a href="#contact" className="hover:text-white transition-colors duration-150">Contact</a></li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-white/40 mb-4">Legal</p>
            <ul className="space-y-2.5 text-[13px] text-white/60">
              <li><Link href="/privacy" className="hover:text-white transition-colors duration-150">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors duration-150">Terms</Link></li>
              <li><Link href={`/auth/login?redirect=${encodeURIComponent(redirectTo)}`} className="hover:text-white transition-colors duration-150">Sign in</Link></li>
              <li><Link href={`/auth/signup?redirect=${encodeURIComponent(redirectTo)}`} className="hover:text-white transition-colors duration-150">Create account</Link></li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className="text-[11px] uppercase tracking-widest text-white/40 mb-4">Our Offices</p>
            <div className="space-y-4 text-[13px] text-white/60">
              <div>
                <p className="font-medium text-white/80">Lagos Office</p>
                <p className="mt-1 leading-relaxed">
                  38 Opebi Road, Adebola House (Suite 100, Rear Car Park Wing), Ikeja, Lagos
                </p>
              </div>
              <div>
                <p className="font-medium text-white/80">Abuja Office</p>
                <p className="mt-1 leading-relaxed">
                  No. 50 Ebitu Ukiwe Street, Jabi, Abuja
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-8 md:flex-row" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-[12px] text-white/35">&copy; {new Date().getFullYear()} Vehiculars. All rights reserved.</p>
          <p className="text-[12px] text-white/35">Made in Nigeria</p>
        </div>
      </div>
    </footer>
  );
}
