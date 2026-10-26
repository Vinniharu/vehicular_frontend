"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { authRegister, authLogin, authGoogleLogin } from "@/lib/api";
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

function SignupForm() {
  const router = useRouter();
  let searchParams = null;
  try {
    searchParams = useSearchParams();
  } catch {
    // static / outside Suspense fallback
  }

  const rawRedirect = searchParams?.get("redirect");
  const targetRedirect = safeRedirectPath(rawRedirect) || "/dashboard";

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState(searchParams?.get("ref") || "");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setRequestId(null);
    setSuccessMsg(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError("Please complete all required fields (First name, Surname, Email, and Password).");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    // A real number is required: it's used for SMS updates and pre-fills
    // every application. Accept 0801…, 801…, +234801… or 234801….
    const digits = phone.replace(/D/g, "");
    const national = digits.startsWith("234") ? digits.slice(3) : digits.startsWith("0") ? digits.slice(1) : digits;
    if (national.length !== 10) {
      setError("Enter a valid Nigerian phone number, for example 0801 234 5678.");
      return;
    }
    const cleanPhone = `+234${national}`;

    setLoading(true);

    const fn = firstName.trim();
    const mn = middleName.trim() || undefined;
    const ln = lastName.trim();
    const compositeName = [fn, mn, ln].filter(Boolean).join(" ");

    // Step 1: Register per ENDPOINTS.md Section 3 (POST /auth/register)
    const regResult = await authRegister({
      first_name: fn,
      middle_name: mn,
      last_name: ln,
      name: compositeName,
      email: email.trim(),
      phone: cleanPhone,
      password,
      role: "customer",
      referred_by_code: referralCode.trim() || undefined,
    });

    if (regResult.error) {
      setLoading(false);
      setError(regResult.error);
      setRequestId(regResult.requestId);
      return;
    }

    // Step 2: Auto-authenticate session
    setSuccessMsg("Account registered. Establishing session...");
    const loginResult = await authLogin({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (loginResult.error) {
      setError("Account created successfully, but automatic sign in failed. Please sign in manually.");
      setTimeout(() => {
        router.push(`/auth/login?redirect=${encodeURIComponent(targetRedirect)}`);
      }, 1500);
    } else {
      setSuccessMsg("Welcome to Vehiculars! Redirecting to your dashboard...");
      setTimeout(() => {
        router.push(targetRedirect);
      }, 600);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError(null);
    setLoading(true);
    setSuccessMsg("Authenticating with Google...");
    
    const result = await authGoogleLogin({ token: credentialResponse.credential });
    setLoading(false);

    if (result.error) {
      setError(result.error);
      setSuccessMsg(null);
    } else {
      setSuccessMsg("Welcome to Vehiculars! Redirecting to your dashboard...");
      setTimeout(() => {
        router.push(targetRedirect);
      }, 600);
    }
  };

  const handleGoogleError = () => {
    setError("Google Sign-In failed. Please try again.");
  };

  return (
    <div>
      <AuthHeader
        title="Create your customer account"
        description={<>Register to manage driver&apos;s licences, roadworthiness renewals, and compliance nationwide.</>}
      />

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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end sm:gap-3">
          <div>
            <label className={authLabel} htmlFor="firstName">
              First name *
            </label>
            <input
              id="firstName"
              autoComplete="given-name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ada"
              required
              className={authInput}
            />
          </div>
          <div>
            <label className={authLabel} htmlFor="middleName">
              Middle name <span className="text-mk-muted text-[11.5px] font-normal">(optional)</span>
            </label>
            <input
              id="middleName"
              autoComplete="additional-name"
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              placeholder="Chidinma"
              className={authInput}
            />
          </div>
          <div>
            <label className={authLabel} htmlFor="lastName">
              Surname *
            </label>
            <input
              id="lastName"
              autoComplete="family-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Obi"
              required
              className={authInput}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <label className={authLabel} htmlFor="phone">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0801 234 5678"
              required
              className={`${authInput} font-mono`}
            />
          </div>
        </div>

        <div>
          <label className={authLabel} htmlFor="referralCode">
            Referral code <span className="text-mk-muted font-normal">(optional)</span>
          </label>
          <input
            id="referralCode"
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            placeholder="e.g. HPG849ND"
            className={`${authInput} font-mono uppercase`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={authLabel} htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                autoComplete="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
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
          <div>
            <label className={authLabel} htmlFor="confirmPassword">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              autoComplete="new-password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              className={authInput}
            />
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
                <span>Registering account...</span>
              </>
            ) : (
              <>
                <span>Create account &amp; continue</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
              </>
            )}
          </button>
          <p className="mt-3 text-center text-[12.5px] leading-relaxed text-mk-muted">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="font-medium text-cx-brand-deep hover:underline">Terms of Service</Link>,{" "}
            <Link href="/refund-policy" className="font-medium text-cx-brand-deep hover:underline">Refund Policy</Link> and{" "}
            <Link href="/privacy-policy" className="font-medium text-cx-brand-deep hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </form>

      {/* Footer Navigation */}
      <AuthFooterNote>
        Already have an account?{" "}
        <Link
          href={`/auth/login?redirect=${encodeURIComponent(targetRedirect)}`}
          className={`${authLink} ml-1 inline-flex min-h-[44px] items-center`}
        >
          Sign in
        </Link>
      </AuthFooterNote>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthLoading label="Loading portal..." />}>
      <SignupForm />
    </Suspense>
  );
}
