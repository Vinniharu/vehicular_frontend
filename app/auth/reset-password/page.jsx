"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, KeyRound, Link2Off as LinkIcon } from "lucide-react";
import { authResetPassword } from "@/lib/api";
import {
  AuthHeader,
  AuthAlert,
  AuthFooterNote,
  AuthLoading,
  authInput,
  authLabel,
  authLink,
  authEyeButton,
  authPrimaryButton,
  authSpinner,
} from "../_components/auth-ui";

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
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 ring-1 ring-inset ring-red-200">
          <LinkIcon className="h-5 w-5" aria-hidden />
        </div>
        <AuthHeader
          title="Invalid reset link"
          description="This link is invalid or missing its token. Please request a new password reset from the sign-in page."
        />
        <Link
          href="/auth/login"
          className={authPrimaryButton}
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-cx-brand-soft text-cx-brand ring-1 ring-inset ring-cx-brand/20">
        <KeyRound className="h-5 w-5" aria-hidden />
      </div>
      <AuthHeader
        title="Set a new password"
        description="Choose a new password for your Vehiculars account."
      />

      {error && (
        <AuthAlert tone="error">
          <span>{error}</span>
        </AuthAlert>
      )}

      {successMsg && (
        <AuthAlert tone="success" className="font-medium">
          <span>{successMsg}</span>
        </AuthAlert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={authLabel} htmlFor="password">
            New password
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
            Confirm new password
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

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || successMsg}
            className={authPrimaryButton}
          >
            {loading ? (
              <>
                <span className={authSpinner} />
                <span>Resetting password...</span>
              </>
            ) : (
              <span>Reset password</span>
            )}
          </button>
        </div>
      </form>

      <AuthFooterNote>
        Remembered your password?{" "}
        <Link href="/auth/login" className={`${authLink} ml-1 inline-flex min-h-[44px] items-center`}>
          Sign in
        </Link>
      </AuthFooterNote>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthLoading label="Loading..." />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
