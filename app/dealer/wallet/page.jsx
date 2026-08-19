"use client";

import { useState, useEffect } from "react";
import { Loader2, Wallet as WalletIcon, ArrowDownLeft, TrendingUp, AlertCircle } from "lucide-react";
import { dealerGetWallet, dealerWithdrawWallet, koboToNaira } from "@/lib/api";

const BRAND = "#28A745";
const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60";

export default function DealerWalletPage() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await dealerGetWallet();
    if (res.error) setError(res.error);
    else setWallet(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleWithdraw = async () => {
    if (!wallet?.balance_kobo) return;
    if (!window.confirm(`Withdraw ${koboToNaira(wallet.balance_kobo)} to your bank account?`)) return;
    setWithdrawing(true);
    const res = await dealerWithdrawWallet({ amount_kobo: wallet.balance_kobo });
    setWithdrawing(false);
    if (res.error) {
      alert(res.error);
      return;
    }
    alert(res.data.message || "Withdrawal initiated.");
    load();
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: BRAND }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
        <p className="mt-3 text-[13.5px] font-semibold text-red-700">{error}</p>
        {error.toLowerCase().includes("approved") && (
          <p className="mt-1 text-[12.5px] text-red-600">Your dealer wallet is created once staff approve your application.</p>
        )}
      </div>
    );
  }

  const transactions = wallet?.transactions || [];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Wallet</h1>
        <p className="mt-1 text-[13.5px] text-slate-500">Funds released from escrow after each confirmed delivery.</p>
      </div>

      <div className="rounded-3xl p-7 text-white" style={{ background: "linear-gradient(135deg, #065f46 0%, #0a7a58 40%, #28A745 100%)" }}>
        <p className="text-[12px] font-semibold uppercase tracking-widest text-emerald-200/70">Available Balance</p>
        <div className="flex items-center justify-between mt-2">
          <p className="font-mono text-[32px] font-bold tracking-tight">{koboToNaira(wallet?.balance_kobo || 0)}</p>
          <button onClick={handleWithdraw} disabled={withdrawing || !wallet?.balance_kobo}
            className="rounded-full bg-white px-5 py-2.5 text-[13px] font-bold text-[#065f46] disabled:opacity-50 flex items-center gap-2">
            {withdrawing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
            Withdraw
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-500">Transaction History</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="p-10 text-center">
            <WalletIcon className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-[13px] text-slate-400">No transactions yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.type === "credit" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                    <ArrowDownLeft className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-800">{t.source}</p>
                    <p className="text-[11.5px] text-slate-400">{t.created_at ? new Date(t.created_at).toLocaleString("en-NG") : "—"}</p>
                  </div>
                </div>
                <p className={`font-mono text-[13.5px] font-bold ${t.type === "credit" ? "text-emerald-700" : "text-red-600"}`}>
                  {t.type === "credit" ? "+" : "–"}{koboToNaira(t.amount_kobo)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
