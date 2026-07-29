"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck, KeyRound, X, Loader2 } from "lucide-react";
import { authLogin, authGetMe, getCachedUser, authForgotPassword } from "@/lib/api";

/**
 * Shared simple email+password login for every non-customer portal
 * (admin/agent/staff/super-admin) — no marketing chrome, just a centered
 * card. The customer-facing login (app/auth/login/page.jsx) keeps its own
 * separate branded page; this component is deliberately not shared with it.
 */
export default function PortalLoginForm({ portalName, expectedRole, homePath }) {
  const allowedRoles = Array.isArray(expectedRole) ? expectedRole : [expectedRole];
  const router = useRouter();
  let searchParams = null;
  try {
    searchParams = useSearchParams();
  } catch {
    // static / outside Suspense fallback
  }
  const sessionExpired = searchParams?.get("reason") === "session_expired";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState(null);

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotEmail("");
    setForgotLoading(false);
    setForgotSent(false);
    setForgotError(null);
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotEmail.trim()) {
      setForgotError("Enter your email address.");
      return;
    }
    setForgotLoading(true);
    const result = await authForgotPassword({ email: forgotEmail.trim() });
    setForgotLoading(false);
    if (result.error && result.status === 0) {
      setForgotError(result.error);
    } else {
      setForgotSent(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    const result = await authLogin({ email: email.trim(), password });
    if (result.data?.access_token) {
      const meRes = await authGetMe();
      const userRole = meRes.data?.role || result.data?.user?.role || getCachedUser()?.role || null;
      setLoading(false);

      if (!allowedRoles.includes(userRole)) {
        setError(`This login is for ${portalName.toLowerCase()} accounts only.`);
        return;
      }

      setSuccessMsg("Login successful.");
      setTimeout(() => {
        router.push(homePath);
      }, 400);
    } else {
      setLoading(false);
      setError(result.error || "Unexpected response from authentication endpoint.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] px-4" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4" style={{ background: "linear-gradient(135deg, #28A745, #0a7a56)" }}>
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-[19px] font-bold text-[#111111] tracking-tight">{portalName} Sign In</h1>
          <p className="mt-1 text-[13px] text-slate-500">Vehiculars {portalName.toLowerCase()} portal</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {sessionExpired && !error && (
            <div className="mb-5 rounded-xl p-3.5 flex items-start gap-2.5 text-[12.5px] leading-relaxed bg-amber-50 border border-amber-200 text-amber-800">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <span>Your session expired after 60 minutes. Please sign in again.</span>
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-xl p-3.5 flex items-start gap-2.5 text-[12.5px] leading-relaxed bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 rounded-xl p-3.5 flex items-center gap-2.5 text-[12.5px] font-medium bg-emerald-50 border border-emerald-200 text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#28A745]" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@vehiculars.com"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-[13.5px] text-[#111111] placeholder:text-slate-400 outline-none transition-all focus:border-[#28A745] focus:bg-white focus:ring-2 focus:ring-[#28A745]/15"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[12.5px] font-semibold text-slate-700" htmlFor="password">
                  Password
                </label>
                <button type="button" onClick={() => setShowForgotModal(true)} className="text-[11.5px] font-semibold text-[#28A745] hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-3.5 pr-10 py-2.5 text-[13.5px] text-[#111111] placeholder:text-slate-400 outline-none transition-all focus:border-[#28A745] focus:bg-white focus:ring-2 focus:ring-[#28A745]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!successMsg}
              className="w-full h-11 rounded-xl font-semibold text-[13.5px] flex items-center justify-center gap-2 text-white transition-all active:scale-[0.99] disabled:opacity-60"
              style={{ background: "#28A745" }}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl relative">
            <button type="button" onClick={closeForgotModal} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <X className="h-4.5 w-4.5" />
            </button>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#28A745]/10 text-[#28A745] mb-4">
              <KeyRound className="h-6 w-6" />
            </div>
            {forgotSent ? (
              <>
                <h3 className="text-[15px] font-bold text-[#111111] text-center">Check your email</h3>
                <p className="mt-2 text-[12.5px] text-slate-500 text-center leading-relaxed">
                  If that email is registered, you&apos;ll receive password reset instructions shortly.
                </p>
                <button type="button" onClick={closeForgotModal} className="mt-5 w-full rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white" style={{ background: "#28A745" }}>
                  Close
                </button>
              </>
            ) : (
              <>
                <h3 className="text-[15px] font-bold text-[#111111] text-center">Reset your password</h3>
                <p className="mt-2 text-[12.5px] text-slate-500 text-center leading-relaxed">
                  Enter your account email and we&apos;ll send you a link to reset your password.
                </p>
                {forgotError && (
                  <div className="mt-3 rounded-xl p-3 flex items-start gap-2 text-left text-[12px] bg-red-50 border border-red-200 text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{forgotError}</span>
                  </div>
                )}
                <form onSubmit={handleForgotSubmit} className="mt-4 space-y-3">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@vehiculars.com"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#28A745] focus:bg-white focus:ring-2 focus:ring-[#28A745]/15"
                  />
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
                    style={{ background: "#28A745" }}
                  >
                    {forgotLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {forgotLoading ? "Sending..." : "Send reset link"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
