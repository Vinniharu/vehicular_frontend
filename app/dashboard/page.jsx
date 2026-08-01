"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Wallet, Plus } from "lucide-react";
import { getWallet, getCachedUser } from "@/lib/api";
import { colors } from "@/lib/design-tokens";
import ServicesList from "./_shared/ServicesList";

const BRAND = colors.primary.DEFAULT;
const INK = colors.ink.DEFAULT;

function koboToNaira(kobo) {
  return (kobo / 100).toLocaleString("en-NG", { style: "currency", currency: "NGN" });
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const [user, setUser] = useState(() => getCachedUser());
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWallet().then((res) => {
      if (res.data) setWalletBalance(res.data.balance_kobo || 0);
      setLoading(false);
    });
  }, []);

  const firstName = user?.name?.split(" ")[0] || "there";

  if (loading && !user) {
    return (
      <div className="space-y-5 pb-12 max-w-5xl">
        <div className="h-48 animate-pulse rounded-3xl bg-[#F5F5F5]" />
        <div className="h-72 animate-pulse rounded-2xl bg-[#F5F5F5]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-5xl">
      {/* ══════════════════════════════════════
          GREETING
      ══════════════════════════════════════ */}
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: BRAND }}>
          {greeting()}
        </p>
        <h1
          className="mt-1 text-[30px] sm:text-[36px] leading-tight tracking-tight"
          style={{ color: INK, fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
        >
          {firstName}
        </h1>
      </div>

      {/* ══════════════════════════════════════
          WALLET CARD
      ══════════════════════════════════════ */}
      <div
        className="relative overflow-hidden rounded-[22px] p-6 sm:p-8 text-white shadow-lg"
        style={{ background: "linear-gradient(155deg, #111111 0%, #0A6B4C 62%, #28A745 100%)" }}
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-[0.08]"
          style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }}
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.12)" }}>
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-emerald-200/60">Wallet balance</p>
              <p className="mt-0.5 font-mono text-[26px] sm:text-[30px] font-bold tracking-tight">
                {koboToNaira(walletBalance)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/dashboard/apply"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[13px] font-bold text-emerald-800 shadow-sm transition-all hover:bg-emerald-50 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              New application
            </Link>
            <Link
              href="/dashboard/wallet"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-[13px] font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.98]"
            >
              <Wallet className="h-4 w-4" />
              Fund wallet
            </Link>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          SERVICES
      ══════════════════════════════════════ */}
      <div>
        <h2 className="text-[16px] font-bold tracking-tight mb-4" style={{ color: INK, fontFamily: "var(--font-display-serif)" }}>
          Services
        </h2>
        <ServicesList />
      </div>
    </div>
  );
}
