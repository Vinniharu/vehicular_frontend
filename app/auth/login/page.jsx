"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, CheckCircle2, KeyRound, X, Loader2 } from "lucide-react";
import { authLogin, authGetMe, getCachedUser, authForgotPassword, authGoogleLogin } from "@/lib/api";
import { GoogleLogin } from "@react-oauth/google";

function LoginForm() {
  const router = useRouter();
  let searchParams = null;
  try {
    searchParams = useSearchParams();
  } catch {
    // static / outside Suspense fallback
  }

  const rawRedirect = searchParams?.get("redirect");
  const isSafeRedirect = typeof rawRedirect === "string" && rawRedirect.startsWith("/") && rawRedirect !== "/";
  const targetRedirect = isSafeRedirect ? rawRedirect : null;
  const sessionExpired = searchParams?.get("reason") === "session_expired";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requestId, setRequestId] = useState(null);
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
    // Always show the generic confirmation on any non-network-error response
    // — the backend deliberately returns the same message whether or not
    // the email is registered, so the UI shouldn't leak that either.
    if (result.error && result.status === 0) {
      setForgotError(result.error);
    } else {
      setForgotSent(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setRequestId(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    const result = await authLogin({ email: email.trim(), password });
    if (result.data?.access_token) {
      const meRes = await authGetMe();
      const userRole = meRes.data?.role || result.data?.user?.role || getCachedUser()?.role || "customer";
      setLoading(false);

      if (userRole === "admin") {
        const dest = targetRedirect && targetRedirect.startsWith("/admin") ? targetRedirect : "/admin";
        setSuccessMsg("Login successful.");
        setTimeout(() => {
          router.push(dest);
        }, 500);
      } else if (userRole === "staff") {
        const dest = targetRedirect && targetRedirect.startsWith("/staff") ? targetRedirect : "/staff";
        setSuccessMsg("Login successful.");
        setTimeout(() => {
          router.push(dest);
        }, 500);
      } else if (userRole === "agent") {
        const dest = targetRedirect && targetRedirect.startsWith("/agent") ? targetRedirect : "/agent";
        setSuccessMsg("Login successful.");
        setTimeout(() => {
          router.push(dest);
        }, 500);
      } else {
        const dest = targetRedirect && !targetRedirect.startsWith("/admin") && !targetRedirect.startsWith("/staff") ? targetRedirect : "/dashboard";
        setSuccessMsg("Login successful.");
        setTimeout(() => {
          router.push(dest);
        }, 500);
      }
    } else {
      setLoading(false);
      if (result.error) {
        setError(result.error);
        setRequestId(result.requestId);
      } else {
        setError("Unexpected response from authentication endpoint.");
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError(null);
    setLoading(true);
    setSuccessMsg("Authenticating with Google...");
    
    const result = await authGoogleLogin({ token: credentialResponse.credential });
    
    if (result.data?.access_token) {
      const meRes = await authGetMe();
      const userRole = meRes.data?.role || result.data?.user?.role || getCachedUser()?.role || "customer";
      setLoading(false);

      if (userRole === "admin") {
        const dest = targetRedirect && targetRedirect.startsWith("/admin") ? targetRedirect : "/admin";
        setSuccessMsg("Login successful.");
        setTimeout(() => {
          router.push(dest);
        }, 500);
      } else if (userRole === "staff") {
        const dest = targetRedirect && targetRedirect.startsWith("/staff") ? targetRedirect : "/staff";
        setSuccessMsg("Login successful.");
        setTimeout(() => {
          router.push(dest);
        }, 500);
      } else if (userRole === "agent") {
        const dest = targetRedirect && targetRedirect.startsWith("/agent") ? targetRedirect : "/agent";
        setSuccessMsg("Login successful.");
        setTimeout(() => {
          router.push(dest);
        }, 500);
      } else {
        const dest = targetRedirect && !targetRedirect.startsWith("/admin") && !targetRedirect.startsWith("/staff") ? targetRedirect : "/dashboard";
        setSuccessMsg("Login successful.");
        setTimeout(() => {
          router.push(dest);
        }, 500);
      }
    } else {
      setLoading(false);
      setError(result.error || "Google authentication failed on the server.");
      setSuccessMsg(null);
    }
  };

  const handleGoogleError = () => {
    setError("Google Sign-In failed. Please try again.");
  };


  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-white">
          Sign in to Vehiculars
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-white/55">
          Access your vehicle dashboard, compliance documents, and active renewals.
        </p>
      </div>

      {/* Session expired notice */}
      {sessionExpired && !error && (
        <div
          className="mb-6 rounded-xl p-4 flex items-start gap-3 text-[13px] leading-relaxed"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)" }}
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-white/50" />
          <span>Your session expired after 60 minutes. Please sign in again.</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          className="mb-6 rounded-xl p-4 flex items-start gap-3 text-[13px] leading-relaxed"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
          <div className="flex-1">
            <p className="font-medium">{error}</p>
            {requestId && (
              <p className="mt-1 font-mono text-[11px] text-red-300/70">
                X-Request-ID: {requestId}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Success Alert */}
      {successMsg && (
        <div
          className="mb-6 rounded-xl p-4 flex items-center gap-3 text-[13px] font-medium"
          style={{ background: "rgba(40, 167, 69,0.12)", border: "1px solid rgba(40, 167, 69,0.3)", color: "#34d399" }}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#28A745]" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[13px] font-medium text-white/85 mb-1.5" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-xl px-4 py-3 text-[14px] text-white placeholder-white/25 focus:outline-none transition-all"
            style={{
              background: "rgba(17, 17, 17, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[13px] font-medium text-white/85" htmlFor="password">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-[12px] font-medium text-[#28A745] hover:underline"
            >
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
              className="w-full rounded-xl pl-4 pr-11 py-3 text-[14px] text-white placeholder-white/25 focus:outline-none transition-all"
              style={{
                background: "rgba(17, 17, 17, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || successMsg}
            className="w-full h-12 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2.5 transition-all duration-150 active:scale-[0.99]"
            style={{
              background: loading ? "#28A745/70" : "#28A745",
              color: "#f0ede6",
            }}
          >
            {loading ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <span>Sign in</span>
            )}
          </button>
        </div>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/[0.08]"></div>
        </div>
        <div className="relative flex justify-center text-[13px]">
          <span className="px-3 text-white/50" style={{ background: "#0a0a0a" }}>Or continue with</span>
        </div>
      </div>

      <div className="flex justify-center w-full">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          theme="filled_black"
          shape="rectangular"
          text="continue_with"
          size="large"
          width="320"
        />
      </div>

      {/* Footer Navigation */}
      <div className="mt-8 pt-6 border-t border-white/[0.08] text-center">
        <p className="text-[14px] text-white/60">
          Don&apos;t have an account?{" "}
          <Link
            href={`/auth/signup?redirect=${encodeURIComponent(targetRedirect || "/dashboard")}`}
            className="font-semibold text-[#28A745] hover:underline ml-1"
          >
            Create customer account
          </Link>
        </p>
      </div>

      {/* ── Forgot Password Modal ── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center space-y-4 relative"
            style={{
              background: "#111111",
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            <button
              type="button"
              onClick={closeForgotModal}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#28A745]/15 text-[#28A745] border border-[#28A745]/30">
              <KeyRound className="h-7 w-7" />
            </div>

            {forgotSent ? (
              <>
                <div>
                  <h3 className="text-[18px] font-bold text-white tracking-tight">Check your email</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/70 max-w-sm mx-auto">
                    If that email is registered, you'll receive password reset instructions shortly.
                  </p>
                </div>
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={closeForgotModal}
                    className="w-full inline-flex items-center justify-center rounded-xl px-5 py-3 text-[14px] font-semibold text-white transition-all active:scale-[0.98]"
                    style={{ background: "#28A745" }}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-[18px] font-bold text-white tracking-tight">Reset your password</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/70 max-w-sm mx-auto">
                    Enter your account email and we'll send you a link to reset your password.
                  </p>
                </div>

                {forgotError && (
                  <div
                    className="rounded-xl p-3 flex items-start gap-2.5 text-left text-[12.5px] leading-relaxed"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <form onSubmit={handleForgotSubmit} className="space-y-3 text-left">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl px-4 py-3 text-[14px] text-white placeholder-white/25 focus:outline-none transition-all"
                    style={{
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-white/50 font-mono text-sm py-12">Loading portal...</div>}>
      <LoginForm />
    </Suspense>
  );
}
