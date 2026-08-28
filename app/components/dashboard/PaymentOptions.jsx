"use client";

import { useState } from "react";
import { CreditCard, Loader2, Wallet } from "lucide-react";
import { koboToNaira } from "@/lib/api";

const BRAND = "#28A745";

// ₦10,000 — mirrors app/core/payment_helpers.py MIN_PARTIAL_PAYMENT_KOBO on
// the backend ("pay small small" minimum contribution). Only enforced on a
// customer's very first contribution — see minPayableKobo below.
export const MIN_PARTIAL_PAYMENT_KOBO = 1000000;

function minPayableKobo(remainingKobo, amountPaidKobo) {
  if (amountPaidKobo > 0) return 1;
  return Math.min(MIN_PARTIAL_PAYMENT_KOBO, remainingKobo);
}

const btnPrimary =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-semibold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";

const segBtn = (active) =>
  `flex-1 rounded-lg px-3 py-2 text-center text-[12.5px] font-semibold transition-all ${
    active ? "bg-white text-[#111111] shadow-sm" : "text-slate-500 hover:text-slate-700"
  }`;

/* Two-axis payment picker: Method (Wallet / Monnify) x Amount (Full / Part).
   One amount input (shown only for "Pay a part"), one CTA reflecting the
   current combination — replaces the old side-by-side wallet/card buttons
   plus a separate always-full-balance "Pay with card" link, which let a
   customer type a partial amount and then click a control that silently
   ignored it and charged the full balance instead. Mirrors the mobile app's
   proven PaymentSheet (components/payment-sheet.tsx in the mobile repo). */
export default function PaymentOptions({
  remainingKobo,
  walletBalanceKobo,
  amountPaidKobo = 0,
  payingWallet,
  payingCard,
  onPayWallet,
  onPayCard,
  partialAllowed = true,
}) {
  const [method, setMethod] = useState("card");
  const [choice, setChoice] = useState("full");
  const [amountNaira, setAmountNaira] = useState("");

  const minKobo = minPayableKobo(remainingKobo, amountPaidKobo);
  const effectiveChoice = partialAllowed ? choice : "full";
  const amountKobo = effectiveChoice === "full" ? remainingKobo : Math.round((parseFloat(amountNaira) || 0) * 100);

  const tooLow = effectiveChoice === "part" && amountKobo > 0 && amountKobo < minKobo;
  const tooHigh = amountKobo > remainingKobo;
  const overBalance = method === "wallet" && amountKobo > walletBalanceKobo;
  const invalid = amountKobo <= 0 || tooLow || tooHigh;
  const busy = payingWallet || payingCard;

  const quickAmounts = [
    ...(amountPaidKobo > 0 ? [] : [minKobo]),
    Math.round(remainingKobo / 2),
    remainingKobo,
  ].filter((value, index, all) => value > 0 && all.indexOf(value) === index);

  const pay = () => {
    if (invalid || (method === "wallet" && overBalance) || busy) return;
    if (method === "wallet") onPayWallet(amountKobo);
    else onPayCard(amountKobo);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-[11.5px] font-semibold text-slate-600">How would you like to pay?</p>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          <button type="button" onClick={() => setMethod("card")} className={segBtn(method === "card")}>
            Pay with Monnify
          </button>
          <button type="button" onClick={() => setMethod("wallet")} className={segBtn(method === "wallet")}>
            Wallet
          </button>
        </div>
      </div>

      {method === "wallet" && (
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5">
          <Wallet className="h-4 w-4 text-slate-400" />
          <span className="flex-1 text-[12.5px] text-slate-500">Wallet balance</span>
          <span className="font-mono text-[13px] font-semibold text-[#111111]">{koboToNaira(walletBalanceKobo)}</span>
        </div>
      )}

      {partialAllowed && (
        <div>
          <p className="mb-1.5 text-[11.5px] font-semibold text-slate-600">How much?</p>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            <button type="button" onClick={() => setChoice("full")} className={segBtn(choice === "full")}>
              Pay in full
            </button>
            <button type="button" onClick={() => setChoice("part")} className={segBtn(choice === "part")}>
              Pay a part
            </button>
          </div>
        </div>
      )}

      {effectiveChoice === "part" && (
        <div>
          <div className="flex min-w-[140px] items-center rounded-xl border border-[#E5E5E5] bg-white px-3.5 py-2.5 focus-within:border-[#28A745] focus-within:ring-2 focus-within:ring-[#28A745]/15">
            <span className="mr-1 text-[13.5px] font-semibold text-slate-500">₦</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={amountNaira}
              onChange={(e) => setAmountNaira(e.target.value)}
              placeholder={amountPaidKobo > 0 ? "Any amount" : koboToNaira(minKobo).replace(/[^0-9.,]/g, "")}
              className="w-full bg-transparent text-[13.5px] font-mono text-[#111111] outline-none"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {quickAmounts.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmountNaira(String(value / 100))}
                className="rounded-full bg-emerald-50 px-3 py-1 text-[11.5px] font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                {koboToNaira(value)}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">
            {amountPaidKobo > 0 ? "Any amount" : `Minimum ${koboToNaira(minKobo)}`} · {koboToNaira(remainingKobo)} outstanding
          </p>
          {tooLow && <p className="mt-1 text-[11.5px] font-medium text-red-600">Minimum payment is {koboToNaira(minKobo)}.</p>}
          {!tooLow && tooHigh && <p className="mt-1 text-[11.5px] font-medium text-red-600">Amount exceeds the remaining balance of {koboToNaira(remainingKobo)}.</p>}
        </div>
      )}

      {method === "wallet" && overBalance && !tooLow && !tooHigh && (
        <p className="text-[12px] text-amber-700">
          Amount exceeds your wallet balance of {koboToNaira(walletBalanceKobo)} — top up, or switch to Monnify.
        </p>
      )}

      <button
        type="button"
        onClick={pay}
        disabled={invalid || (method === "wallet" && overBalance) || busy}
        className={btnPrimary}
        style={{ background: BRAND }}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : method === "wallet" ? (
          <Wallet className="h-4 w-4" />
        ) : (
          <CreditCard className="h-4 w-4" />
        )}
        {busy
          ? "Processing…"
          : method === "wallet"
          ? `Pay ${koboToNaira(amountKobo || 0)} from wallet`
          : `Pay ${koboToNaira(amountKobo || 0)} with Monnify`}
      </button>
    </div>
  );
}
