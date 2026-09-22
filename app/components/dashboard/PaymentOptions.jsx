"use client";

import { useState, useEffect } from "react";
import { CreditCard, Loader2, Wallet, ChevronDown, ChevronUp, Check } from "lucide-react";
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

const segBtn = (active) =>
  `flex-1 rounded-lg px-3 py-2 text-center text-[12.5px] font-semibold transition-all ${
    active ? "bg-white text-[#111111] shadow-sm" : "text-slate-500 hover:text-slate-700"
  }`;

export default function PaymentOptions({
  remainingKobo,
  walletBalanceKobo = 0,
  amountPaidKobo = 0,
  payingWallet = false,
  payingCard = false,
  onPayWallet,
  onPayCard,
  partialAllowed = true,
}) {
  const [method, setMethod] = useState("card");
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [customNaira, setCustomNaira] = useState("");
  const [activePayType, setActivePayType] = useState(null);

  const minKobo = minPayableKobo(remainingKobo, amountPaidKobo);
  const customKobo = Math.round((parseFloat(customNaira) || 0) * 100);

  const customTooLow = customKobo > 0 && customKobo < minKobo;
  const customTooHigh = customKobo > remainingKobo;
  const customInvalid = customKobo <= 0 || customTooLow || customTooHigh;
  const busy = payingWallet || payingCard;

  useEffect(() => {
    if (!busy) setActivePayType(null);
  }, [busy]);

  const quickAmounts = [
    ...(amountPaidKobo > 0 ? [] : [minKobo]),
    Math.round(remainingKobo / 2),
    remainingKobo,
  ].filter((value, index, all) => value > 0 && all.indexOf(value) === index);

  const handlePay = (amount, payType = null) => {
    if (!amount || busy) return;
    setActivePayType(payType);
    if (method === "wallet") {
      if (amount > walletBalanceKobo) return;
      onPayWallet?.(amount);
    } else {
      onPayCard?.(amount);
    }
  };

  const isFirstDeposit = partialAllowed && amountPaidKobo === 0;

  return (
    <div className="space-y-4">
      {/* ─── Method Picker ─── */}
      <div>
        <p className="mb-1.5 text-[11.5px] font-semibold text-slate-600">Select payment method</p>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMethod("card")}
            className={segBtn(method === "card")}
          >
            Pay with Card or Transfer (Monnify)
          </button>
          <button
            type="button"
            onClick={() => setMethod("wallet")}
            className={segBtn(method === "wallet")}
          >
            Vehicular Wallet
          </button>
        </div>
      </div>

      {/* ─── Wallet balance notification ─── */}
      {method === "wallet" && (
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 border border-slate-200/80">
          <Wallet className="h-4 w-4 text-slate-400" />
          <span className="flex-1 text-[12.5px] text-slate-500">Available wallet balance</span>
          <span className="font-mono text-[13px] font-bold text-[#111111]">
            {koboToNaira(walletBalanceKobo)}
          </span>
        </div>
      )}

      {/* ─── Scenario 1: Initial Deposit Mode (e.g. Fresh Driver's License) ─── */}
      {isFirstDeposit ? (
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Button 1: Pay ₦10,000 Minimum */}
            <div className="flex flex-col justify-between rounded-2xl border-2 border-[#28A745] bg-emerald-50/50 p-4.5 text-left shadow-xs transition-all hover:bg-emerald-50/80">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    <Check className="h-3 w-3 text-emerald-700" />
                    Minimum 10% Deposit
                  </span>
                  {method === "wallet" ? (
                    <Wallet className="h-4 w-4 text-emerald-700" />
                  ) : (
                    <CreditCard className="h-4 w-4 text-emerald-700" />
                  )}
                </div>
                <p className="mt-3 text-[12px] font-semibold text-slate-600">Start Processing</p>
                <p className="font-mono text-2xl font-black text-slate-900 tracking-tight">
                  {koboToNaira(minKobo)}
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-emerald-800 font-medium">
                  Enroll in accredited driving school immediately. Pay remainder before routing.
                </p>
              </div>

              {method === "wallet" && minKobo > walletBalanceKobo && (
                <p className="mt-3 text-[11.5px] text-amber-700 font-medium">
                  Exceeds wallet balance ({koboToNaira(walletBalanceKobo)})
                </p>
              )}

              <button
                type="button"
                onClick={() => handlePay(minKobo, "min")}
                disabled={busy || (method === "wallet" && minKobo > walletBalanceKobo)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13.5px] font-bold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: BRAND }}
              >
                {busy && activePayType === "min" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : method === "wallet" ? (
                  <Wallet className="h-4 w-4" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {busy && activePayType === "min"
                  ? "Opening Monnify…"
                  : `Pay ${koboToNaira(minKobo)} Minimum`}
              </button>
            </div>

            {/* Button 2: Pay in Full */}
            <div className="flex flex-col justify-between rounded-2xl border-2 border-slate-200 bg-white p-4.5 text-left shadow-xs transition-all hover:border-slate-300">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                    Full Clearance
                  </span>
                  {method === "wallet" ? (
                    <Wallet className="h-4 w-4 text-slate-600" />
                  ) : (
                    <CreditCard className="h-4 w-4 text-slate-600" />
                  )}
                </div>
                <p className="mt-3 text-[12px] font-semibold text-slate-600">Complete Fee</p>
                <p className="font-mono text-2xl font-black text-slate-900 tracking-tight">
                  {koboToNaira(remainingKobo)}
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500 font-medium">
                  Covers driving school, agent field processing, capture, and card dispatch.
                </p>
              </div>

              {method === "wallet" && remainingKobo > walletBalanceKobo && (
                <p className="mt-3 text-[11.5px] text-amber-700 font-medium">
                  Exceeds wallet balance ({koboToNaira(walletBalanceKobo)})
                </p>
              )}

              <button
                type="button"
                onClick={() => handlePay(remainingKobo, "full")}
                disabled={busy || (method === "wallet" && remainingKobo > walletBalanceKobo)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-[13.5px] font-bold text-white shadow-sm transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy && activePayType === "full" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : method === "wallet" ? (
                  <Wallet className="h-4 w-4" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {busy && activePayType === "full"
                  ? "Opening Monnify…"
                  : `Pay ${koboToNaira(remainingKobo)} in Full`}
              </button>
            </div>
          </div>

          {/* Custom Partial Amount Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowCustomAmount((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 hover:text-slate-900"
            >
              <span>{showCustomAmount ? "Hide custom amount" : "Want to pay a different deposit amount?"}</span>
              {showCustomAmount ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showCustomAmount && (
              <div className="mt-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <label className="block text-[12px] font-semibold text-slate-700">
                  Custom contribution amount (min {koboToNaira(minKobo)})
                </label>
                <div className="flex min-w-[140px] items-center rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 focus-within:border-[#28A745] focus-within:ring-2 focus-within:ring-[#28A745]/15">
                  <span className="mr-1 text-[13.5px] font-semibold text-slate-500">₦</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={customNaira}
                    onChange={(e) => setCustomNaira(e.target.value)}
                    placeholder={koboToNaira(minKobo).replace(/[^0-9.,]/g, "")}
                    className="w-full bg-transparent text-[13.5px] font-mono text-[#111111] outline-none"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {quickAmounts.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCustomNaira(String(value / 100))}
                      className="rounded-full bg-white border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      {koboToNaira(value)}
                    </button>
                  ))}
                </div>
                {customTooLow && (
                  <p className="text-[11.5px] font-medium text-red-600">
                    Minimum payment is {koboToNaira(minKobo)}.
                  </p>
                )}
                {!customTooLow && customTooHigh && (
                  <p className="text-[11.5px] font-medium text-red-600">
                    Amount exceeds the remaining balance of {koboToNaira(remainingKobo)}.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => handlePay(customKobo)}
                  disabled={customInvalid || (method === "wallet" && customKobo > walletBalanceKobo) || busy}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50"
                  style={{ background: BRAND }}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {busy ? "Processing…" : `Pay ${koboToNaira(customKobo || 0)}`}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : partialAllowed && amountPaidKobo > 0 ? (
        /* ─── Scenario 2: Subsequent Partial Payments (deposit already paid) ─── */
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-500">Remaining Balance:</span>
              <span className="font-mono font-bold text-slate-900">{koboToNaira(remainingKobo)}</span>
            </div>

            <button
              type="button"
              onClick={() => handlePay(remainingKobo)}
              disabled={busy || (method === "wallet" && remainingKobo > walletBalanceKobo)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13.5px] font-bold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50"
              style={{ background: BRAND }}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : method === "wallet" ? <Wallet className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
              {busy ? "Processing…" : `Pay Remaining ${koboToNaira(remainingKobo)} in Full`}
            </button>

            <div className="pt-2 border-t border-slate-100">
              <label className="block mb-1 text-[11.5px] font-semibold text-slate-600">Or contribute another partial amount</label>
              <div className="flex min-w-[140px] items-center rounded-xl border border-slate-300 bg-white px-3.5 py-2 focus-within:border-[#28A745] focus-within:ring-2 focus-within:ring-[#28A745]/15">
                <span className="mr-1 text-[13px] font-semibold text-slate-500">₦</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={customNaira}
                  onChange={(e) => setCustomNaira(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-transparent text-[13px] font-mono text-[#111111] outline-none"
                />
              </div>
              {customTooHigh && (
                <p className="mt-1 text-[11.5px] font-medium text-red-600">
                  Amount exceeds remaining {koboToNaira(remainingKobo)}.
                </p>
              )}
              {customKobo > 0 && !customTooHigh && (
                <button
                  type="button"
                  onClick={() => handlePay(customKobo)}
                  disabled={busy || (method === "wallet" && customKobo > walletBalanceKobo)}
                  className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Pay {koboToNaira(customKobo)}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ─── Scenario 3: Full Payment Only (Renewal, Reissue, Particulars, etc.) ─── */
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handlePay(remainingKobo)}
            disabled={busy || (method === "wallet" && remainingKobo > walletBalanceKobo)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-bold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
              ? "Preparing Checkout…"
              : method === "wallet"
              ? `Pay ${koboToNaira(remainingKobo)} from Wallet`
              : `Pay ${koboToNaira(remainingKobo)} with Card or Transfer`}
          </button>
          <p className="text-[11.5px] text-center text-slate-500">
            Full upfront payment is required for this service before processing begins.
          </p>
        </div>
      )}
    </div>
  );
}
