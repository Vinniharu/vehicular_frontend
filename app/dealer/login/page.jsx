"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, CheckCircle2, Handshake, ShieldCheck, Wallet } from "lucide-react";
import { authLogin, authGetMe, getCachedUser } from "@/lib/api";
import BrandedAuthLayout from "@/app/components/auth/BrandedAuthLayout";

const FEATURES = [
  { icon: Handshake, title: "Matched Demand", desc: "Only requests that match your categories and market reach you." },
  { icon: ShieldCheck, title: "Escrow-Backed", desc: "Customer payment is held in escrow the moment a bid is selected." },
  { icon: Wallet, title: "Paid On Confirmation", desc: "Funds release to your wallet once the customer confirms delivery." },
];

function DealerLoginForm() {
  const router = useRouter();
  let searchParams = null;
  try {
    searchParams = useSearchParams();
  } catch {
    // static / outside Suspense fallback
  }
  const sessionExpired = searchParams?.get("reason") === "session_expired";

  const [alreadySignedIn] = useState(() => {
    if (typeof window === "undefined") return false;
    const cached = getCachedUser();
    return !!cached && cached.role === "dealer";
  });

  useEffect(() => {
    if (alreadySignedIn) {
      router.replace("/dealer");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

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
      const userRole = meRes.data?.role || getCachedUser()?.role || null;
      setLoading(false);

      if (userRole !== "dealer") {
        setError("This login is for dealer accounts only.");
        return;
      }

      setSuccessMsg("Login successful.");
      setTimeout(() => {
        router.push("/dealer");
      }, 400);
    } else {
      setLoading(false);
      setError(result.error || "Unexpected response from authentication endpoint.");
    }
  };

  if (alreadySignedIn) {
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-white">
          Sign in to your dealer account
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-white/55">
          Access matched requests, submit bids, and manage your escrow-backed orders.
        </p>
      </div>

      {sessionExpired && !error && (
        <div
          className="mb-6 rounded-xl p-4 flex items-start gap-3 text-[13px] leading-relaxed"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)" }}
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-white/50" />
          <span>Your session expired after 60 minutes. Please sign in again.</span>
        </div>
      )}

      {error && (
        <div
          className="mb-6 rounded-xl p-4 flex items-start gap-3 text-[13px] leading-relaxed"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
          <p className="font-medium">{error}</p>
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
          <label className="block text-[13px] font-medium text-white/85 mb-1.5" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourbusiness.com"
            required
            className="w-full rounded-xl px-4 py-3 text-[14px] text-white placeholder-white/25 focus:outline-none transition-all"
            style={{ background: "rgba(17, 17, 17, 0.6)", border: "1px solid rgba(255, 255, 255, 0.12)" }}
          />
        </div>

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
              placeholder="Enter your password"
              required
              className="w-full rounded-xl pl-4 pr-11 py-3 text-[14px] text-white placeholder-white/25 focus:outline-none transition-all"
              style={{ background: "rgba(17, 17, 17, 0.6)", border: "1px solid rgba(255, 255, 255, 0.12)" }}
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
            style={{ background: "#28A745", color: "#f0ede6" }}
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

      <div className="mt-8 pt-6 border-t border-white/[0.08] text-center">
        <p className="text-[14px] text-white/60">
          New dealer?{" "}
          <Link href="/dealer/apply" className="font-semibold text-[#28A745] hover:underline ml-1">
            Apply to sell on Vehiculars
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function DealerLoginPage() {
  return (
    <BrandedAuthLayout
      badge="Vehiculars Dealer Network"
      headline="Sell parts to customers who"
      headlineAccent="actually need them."
      description="Bid on matched spare-part requests, ship on your own terms, and get paid straight to your wallet once the customer confirms delivery — no logistics handled by Vehiculars, just discovery, trust, and escrow."
      features={FEATURES}
    >
      <DealerLoginForm />
    </BrandedAuthLayout>
  );
}
