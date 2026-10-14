"use client";

import { useState, Suspense } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, KeyRound, X, Loader2, ArrowRight } from "lucide-react";
import { authLogin, authGetMe, getCachedUser, authForgotPassword, authGoogleLogin } from "@/lib/api";
import { GoogleLogin } from "@react-oauth/google";
import { safeRedirectPath } from "@/lib/utils/safe-redirect";
import {
  AuthHeader,
  AuthAlert,
  AuthDivider,
  AuthFooterNote,
  AuthLoading,
  GoogleButtonSlot,
  authInput,
  authLabel,
  authLink,
  authEyeButton,
  authPrimaryButton,
  authSpinner,
} from "../_components/auth-ui";

function LoginForm() {
  const router = useRouter();
  let searchParams = null;
  try {
    searchParams = useSearchParams();
  } catch {
    // static / outside Suspense fallback
  }

  const rawRedirect = searchParams?.get("redirect");
  const targetRedirect = safeRedirectPath(rawRedirect);
  const sessionExpired = searchParams?.get("reason") === "session_expired";
  const accountDeleted = searchParams?.get("reason") === "account_deleted";

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
    if (result.error && result.status === 429) {
      // Rate limited: saying "check your email" here would be untrue.
      setForgotError("Too many requests. Wait a few minutes, then try again.");
    } else if (result.error && result.status === 0) {
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
      <AuthHeader
        title="Sign in to Vehiculars"
        description="Access your vehicle dashboard, compliance documents, and active renewals."
      />

      {/* Session expired notice */}
      {sessionExpired && !error && (
        <AuthAlert tone="info">
          <span>Your session expired after 60 minutes. Please sign in again.</span>
        </AuthAlert>
      )}

      {/* Account deleted notice */}
      {accountDeleted && !error && (
        <AuthAlert tone="success">
          <span>Your account has been deleted successfully.</span>
        </AuthAlert>
      )}


      {/* Error Alert */}
      {error && (
        <AuthAlert tone="error">
          <p className="font-medium">{error}</p>
          {requestId && (
            <p className="mt-1 font-mono text-[11px] text-red-700/70">
              X-Request-ID: {requestId}
            </p>
          )}
        </AuthAlert>
      )}

      {/* Success Alert */}
      {successMsg && (
        <AuthAlert tone="success" className="font-medium">
          <span>{successMsg}</span>
        </AuthAlert>
      )}

      <GoogleButtonSlot>
        {(googleWidth) => (
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="outline"
            shape="rectangular"
            text="continue_with"
            size="large"
            width={googleWidth}
          />
        )}
      </GoogleButtonSlot>

      <AuthDivider label="Or continue with email" />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={authLabel} htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            autoComplete="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className={authInput}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-[13.5px] font-medium text-mk-ink" htmlFor="password">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="mk-focus -my-2 -mr-2 inline-flex min-h-[44px] items-center rounded-lg px-2 text-[13px] font-semibold text-cx-brand-deep hover:underline underline-offset-4"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              id="password"
              autoComplete="current-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className={`${authInput} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className={authEyeButton}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || successMsg}
            className={authPrimaryButton}
          >
            {loading ? (
              <>
                <span className={authSpinner} />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Footer Navigation */}
      <AuthFooterNote>
        Don&apos;t have an account?{" "}
        <Link
          href={`/auth/signup?redirect=${encodeURIComponent(targetRedirect || "/dashboard")}`}
          className={`${authLink} ml-1 inline-flex min-h-[44px] items-center`}
        >
          Create customer account
        </Link>
      </AuthFooterNote>

      {/* ── Forgot Password Modal ── */}
      {showForgotModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-mk-ink/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-title"
            className="relative w-full max-w-md overflow-hidden rounded-mk-lg border border-mk-line bg-mk-surface p-6 text-center shadow-mk-lg space-y-4 animate-in zoom-in-95 duration-200 sm:p-8"
          >
            <button
              type="button"
              onClick={closeForgotModal}
              aria-label="Close"
              className="mk-focus absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-mk-muted transition-colors hover:bg-mk-ink/[0.05] hover:text-mk-ink"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cx-brand-soft text-cx-brand ring-1 ring-inset ring-cx-brand/20">
              <KeyRound className="h-7 w-7" />
            </div>

            {forgotSent ? (
              <>
                <div>
                  <h3 id="forgot-title" className="text-[19px] font-semibold tracking-[-0.02em] text-mk-ink">Check your email</h3>
                  <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-mk-muted">
                    If that email is registered, you will receive password reset instructions shortly.
                  </p>
                </div>
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={closeForgotModal}
                    className={authPrimaryButton}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 id="forgot-title" className="text-[19px] font-semibold tracking-[-0.02em] text-mk-ink">Reset your password</h3>
                  <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-mk-muted">
                    Enter your account email and we'll send you a link to reset your password.
                  </p>
                </div>

                {forgotError && (
                  <AuthAlert tone="error" flush className="text-left text-[13px]">
                    <span>{forgotError}</span>
                  </AuthAlert>
                )}

                <form onSubmit={handleForgotSubmit} className="space-y-3 text-left">
                  <input
                    type="email"
                    autoComplete="email"
                    aria-label="Email address"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className={authInput}
                  />
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className={authPrimaryButton}
                  >
                    {forgotLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {forgotLoading ? "Sending..." : "Send reset link"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLoading label="Loading portal..." />}>
      <LoginForm />
    </Suspense>
  );
}
