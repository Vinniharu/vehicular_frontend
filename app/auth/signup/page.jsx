"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { authRegister, authLogin, authGoogleLogin } from "@/lib/api";
import { GoogleLogin } from "@react-oauth/google";

function SignupForm() {
  const router = useRouter();
  let searchParams = null;
  try {
    searchParams = useSearchParams();
  } catch {
    // static / outside Suspense fallback
  }

  const rawRedirect = searchParams?.get("redirect");
  const isSafeRedirect = typeof rawRedirect === "string" && rawRedirect.startsWith("/") && rawRedirect !== "/";
  const targetRedirect = isSafeRedirect ? rawRedirect : "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+234 ");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    if (!name.trim() || !email.trim() || !password) {
      setError("Please complete all required fields.");
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

    setLoading(true);
    const cleanPhone = phone.trim() === "+234" ? "+2348000000000" : phone.trim();

    // Step 1: Register per ENDPOINTS.md Section 3 (POST /auth/register)
    const regResult = await authRegister({
      name: name.trim(),
      email: email.trim(),
      phone: cleanPhone,
      password,
      role: "customer",
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
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-white">
          Create your customer account
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-white/55">
          Register to manage driver&apos;s licences, roadworthiness renewals, and compliance nationwide.
        </p>
      </div>

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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-white/85 mb-1.5" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Obi"
            required
            className="w-full rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-white/25 focus:outline-none transition-all"
            style={{
              background: "rgba(17, 17, 17, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              className="w-full rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-white/25 focus:outline-none transition-all"
              style={{
                background: "rgba(17, 17, 17, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
              }}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-white/85 mb-1.5" htmlFor="phone">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+2348011112222"
              required
              className="w-full rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-white/25 focus:outline-none font-mono transition-all"
              style={{
                background: "rgba(17, 17, 17, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-medium text-white/85 mb-1.5" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
                className="w-full rounded-xl pl-4 pr-10 py-2.5 text-[14px] text-white placeholder-white/25 focus:outline-none transition-all"
                style={{
                  background: "rgba(17, 17, 17, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-white/85 mb-1.5" htmlFor="confirmPassword">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              className="w-full rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-white/25 focus:outline-none transition-all"
              style={{
                background: "rgba(17, 17, 17, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
              }}
            />
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
                <span>Registering account...</span>
              </>
            ) : (
              <span>Create account &amp; continue</span>
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
          Already have an account?{" "}
          <Link
            href={`/auth/login?redirect=${encodeURIComponent(targetRedirect)}`}
            className="font-semibold text-[#28A745] hover:underline ml-1"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="text-center text-white/50 font-mono text-sm py-12">Loading portal...</div>}>
      <SignupForm />
    </Suspense>
  );
}
