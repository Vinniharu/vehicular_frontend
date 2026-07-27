"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { authResetPassword } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  let searchParams = null;
  try {
    searchParams = useSearchParams();
  } catch {
    // static / outside Suspense fallback
  }

  const token = searchParams?.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!token) {
      setError("This reset link is missing its token. Please request a new one.");
      return;
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);
    const result = await authResetPassword({ token, new_password: password });
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccessMsg("Password reset successfully. Redirecting to sign in...");
      setTimeout(() => {
        router.push("/auth/login");
      }, 1200);
    }
  };

  if (!token) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-white">
            Invalid reset link
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-white/55">
            This link is invalid or missing its token. Please request a new password reset from the sign-in page.
          </p>
        </div>
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center w-full h-12 rounded-xl font-semibold text-[14px] transition-all duration-150 active:scale-[0.99]"
          style={{ background: "#28A745", color: "#f0ede6" }}
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-white">
          Set a new password
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-white/55">
          Choose a new password for your Vehiculars account.
        </p>
      </div>

      {error && (
        <div
          className="mb-6 rounded-xl p-4 flex items-start gap-3 text-[13px] leading-relaxed"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div
          className="mb-6 rounded-xl p-4 flex items-center gap-3 text-[13px] font-medium"
          style={{ background: "rgba(40, 167, 69,0.12)", border: "1px solid rgba(40, 167, 69,0.3)", color: "#34d399" }}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#28A745]" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[13px] font-medium text-white/85 mb-1.5" htmlFor="password">
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
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

        <div>
          <label className="block text-[13px] font-medium text-white/85 mb-1.5" htmlFor="confirmPassword">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            required
            className="w-full rounded-xl px-4 py-3 text-[14px] text-white placeholder-white/25 focus:outline-none transition-all"
            style={{
              background: "rgba(17, 17, 17, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          />
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
                <span>Resetting password...</span>
              </>
            ) : (
              <span>Reset password</span>
            )}
          </button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-white/[0.08] text-center">
        <p className="text-[14px] text-white/60">
          Remembered your password?{" "}
          <Link href="/auth/login" className="font-semibold text-[#28A745] hover:underline ml-1">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center text-white/50 font-mono text-sm py-12">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
