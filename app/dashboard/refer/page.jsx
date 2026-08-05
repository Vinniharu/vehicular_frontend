"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Users, Loader2 } from "lucide-react";
import { getReferralDashboard } from "@/lib/api";
import { inputBase, btnSecondary } from "@/app/dashboard/_shared/ui";
import { koboToNaira } from "@/app/dashboard/_shared/apply-helpers";
import { colors } from "@/lib/design-tokens";

const BRAND = colors.primary.DEFAULT;

export default function ReferPage() {
  const [referralData, setReferralData] = useState(null);
  const [loadingReferral, setLoadingReferral] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  useEffect(() => {
    async function loadReferrals() {
      setLoadingReferral(true);
      const res = await getReferralDashboard();
      if (res.data) setReferralData(res.data);
      setLoadingReferral(false);
    }
    loadReferrals();
  }, []);

  const referralLink =
    referralData?.referral_code && typeof window !== "undefined"
      ? `${window.location.origin}/auth/signup?ref=${referralData.referral_code}`
      : "";

  const handleCopyReferralLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopyError(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-6 pb-20">
      <div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: BRAND }} />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Referrals</span>
        </div>
        <h1
          className="mt-1.5 text-[30px] tracking-tight text-[#111111]"
          style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
        >
          Refer &amp; earn
        </h1>
        <p className="mt-1 text-[13.5px] text-slate-500">
          Share your code — earn a reward every time someone you referred pays for a service.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
        {loadingReferral ? (
          <div className="px-6 sm:px-8 py-10 flex items-center justify-center gap-2.5 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: BRAND }} /> Loading your referral details...
          </div>
        ) : !referralData ? (
          <p className="px-6 sm:px-8 py-6 text-sm text-slate-400">Referral details are unavailable right now.</p>
        ) : (
          <div className="px-6 sm:px-8 py-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#E5E5E5] bg-slate-50 p-4">
                <p className="text-[12px] text-slate-400 font-medium uppercase tracking-wide mb-1.5">Your referral code</p>
                <p className="text-lg font-mono font-bold tracking-wider text-[#111111]">{referralData.referral_code || "—"}</p>
              </div>
              <div className="rounded-xl border border-[#E5E5E5] bg-slate-50 p-4">
                <p className="text-[12px] text-slate-400 font-medium uppercase tracking-wide mb-1.5">Total rewards earned</p>
                <p className="text-lg font-bold text-[#28A745]">{koboToNaira(referralData.total_rewards_kobo)}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Shareable signup link</label>
              <div className="flex items-center gap-2">
                <input type="text" readOnly value={referralLink} className={`${inputBase} font-mono text-[13px]`} />
                <button
                  type="button"
                  onClick={handleCopyReferralLink}
                  className={`${btnSecondary} shrink-0`}
                >
                  {copied ? <Check className="h-4 w-4 text-[#28A745]" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              {copyError && <p className="mt-1.5 text-[12px] font-medium text-red-600">Could not copy the link. Please copy it manually.</p>}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-[#111111]">People you've referred ({referralData.referred_users.length})</h3>
              </div>
              {referralData.referred_users.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No one has signed up with your code yet.</p>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="space-y-3 sm:hidden">
                    {referralData.referred_users.map((r) => (
                      <div key={r.id} className="rounded-xl border border-[#E5E5E5] p-4">
                        <p className="text-sm font-semibold text-[#111111]">{r.name}</p>
                        <p className="text-[12.5px] text-slate-500">{r.email}</p>
                        <div className="mt-2 flex items-center justify-between text-[12.5px]">
                          <span className="text-slate-500">{r.applications_count} application{r.applications_count === 1 ? "" : "s"}</span>
                          <span className="font-semibold text-[#28A745]">{koboToNaira(r.total_reward_kobo)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto rounded-xl border border-[#E5E5E5]">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/60">
                          <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Name</th>
                          <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Email</th>
                          <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Signed up</th>
                          <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Applications</th>
                          <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Reward earned</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {referralData.referred_users.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3.5 text-[13px] font-semibold text-slate-800">{r.name}</td>
                            <td className="px-4 py-3.5 text-[12.5px] text-slate-500">{r.email}</td>
                            <td className="px-4 py-3.5 text-[12px] text-slate-400">
                              {r.created_at ? new Date(r.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" }) : "—"}
                            </td>
                            <td className="px-4 py-3.5 text-[12.5px] text-slate-600">{r.applications_count}</td>
                            <td className="px-4 py-3.5 text-[13px] font-semibold text-[#28A745]">{koboToNaira(r.total_reward_kobo)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
