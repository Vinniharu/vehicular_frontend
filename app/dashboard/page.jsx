"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet, FileText, Clock, ArrowRight, Plus,
  User, Phone, MapPin, Shield, AlertTriangle,
  CheckCircle2, ChevronRight, Activity, Fingerprint,
  Settings, BadgeCheck, XCircle, Calendar, Star,
  TrendingUp, Zap, AlertCircle, Eye, RefreshCw,
} from "lucide-react";
import { authGetMe, getWallet, getMyApplications, getCachedUser, getReferenceStates } from "@/lib/api";
import { statusMeta, TONE_HEX, getStageProgress } from "@/app/dashboard/_shared/status-config";
import StatusBadge from "@/app/dashboard/_shared/StatusBadge";

const BRAND = "#28A745";
const BRAND_TINT = "rgba(40, 167, 69,0.08)";
const BRAND_GLOW = "rgba(40, 167, 69,0.15)";
const INK = "#111111";
const PAPER_BORDER = "#E5E5E5";

function koboToNaira(kobo) {
  return (kobo / 100).toLocaleString("en-NG", { style: "currency", currency: "NGN" });
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function MiniProgressRing({ status, applicationType, size = 36 }) {
  const progress = getStageProgress(status, applicationType);
  const isRejected = status === "staff_rejected" || status === "failed";
  const isDone = status === "completed";
  const meta = statusMeta(status);
  const color = TONE_HEX[meta.tone] || TONE_HEX.neutral;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} stroke="#f1f5f9" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" strokeLinecap="round"
          stroke={isRejected ? "#ef4444" : color}
          strokeDasharray={c} strokeDashoffset={c * (1 - progress)}
          style={{ transition: "stroke-dashoffset 0.7s ease-out" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {isDone ? (
          <CheckCircle2 className="h-3.5 w-3.5" style={{ color: BRAND }} />
        ) : isRejected ? (
          <XCircle className="h-3.5 w-3.5 text-red-400" />
        ) : (
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
        )}
      </div>
    </div>
  );
}

function computeProfileCompleteness(user) {
  if (!user) return { score: 0, missing: [], filled: [] };
  const bd = user.biodata || {};
  const checks = [
    { key: "name", label: "Full name", filled: !!user.name?.trim() },
    { key: "email", label: "Email", filled: !!user.email?.trim() },
    { key: "phone", label: "Phone number", filled: !!user.phone?.trim() },
    { key: "state", label: "State of residence", filled: !!user.state_id },
    { key: "lga", label: "Local govt. area", filled: !!user.lga_id },
    { key: "surname", label: "Surname", filled: !!bd.surname?.trim() },
    { key: "first_name", label: "First name (biodata)", filled: !!bd.first_name?.trim() },
    { key: "dob", label: "Date of birth", filled: !!bd.date_of_birth },
    { key: "gender", label: "Gender", filled: !!bd.gender },
    { key: "nationality", label: "Nationality", filled: !!bd.nationality },
    { key: "nin", label: "NIN", filled: !!bd.nin?.trim() },
    { key: "blood_group", label: "Blood group", filled: !!bd.blood_group },
    { key: "nok_name", label: "Next of kin name", filled: !!bd.next_of_kin_name?.trim() },
    { key: "nok_phone", label: "Next of kin phone", filled: !!bd.next_of_kin_phone?.trim() },
  ];
  const filled = checks.filter((c) => c.filled);
  const missing = checks.filter((c) => !c.filled);
  return { score: Math.round((filled.length / checks.length) * 100), missing, filled };
}

function CompletenessArc({ score, size = 80 }) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = score >= 80 ? BRAND : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} stroke="#f1f5f9" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" strokeLinecap="round"
          stroke={color} strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[16px] font-bold text-[#111111]">{score}%</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState(() => getCachedUser());
  const [walletBalance, setWalletBalance] = useState(0);
  const [applications, setApplications] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    const [meRes, walletRes, appRes, statesRes] = await Promise.all([
      authGetMe(), getWallet(), getMyApplications(), getReferenceStates(),
    ]);
    if (meRes.data) setUser(meRes.data);
    if (walletRes.data) setWalletBalance(walletRes.data.balance_kobo || 0);
    if (appRes.data && Array.isArray(appRes.data)) {
      setApplications([...appRes.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    }
    if (statesRes.data) setStates(statesRes.data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, []);

  const firstName = user?.name?.split(" ")[0] || "there";
  const totalApps = applications.length;
  const inProgress = applications.filter((a) => !["completed", "staff_rejected", "failed"].includes(a.status)).length;
  const completed = applications.filter((a) => a.status === "completed").length;
  const needsAttention = applications.filter((a) =>
    ["needs_correction", "awaiting_customer", "staff_rejected"].includes(a.status)
  ).length;

  const bd = user?.biodata || {};
  const resolvedState = states.find((s) => s.id === user?.state_id);
  const { score, missing } = computeProfileCompleteness(user);
  const profileComplete = score >= 100;
  const mostRecentApp = applications[0];

  /* ── Skeleton loader ── */
  if (loading && !user) {
    return (
      <div className="space-y-5 pb-12 max-w-5xl">
        <div className="h-48 animate-pulse rounded-3xl bg-[#F5F5F5]" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-[#F5F5F5]" />)}
        </div>
        <div className="h-72 animate-pulse rounded-2xl bg-[#F5F5F5]" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-16 max-w-5xl">

      {/* ══════════════════════════════════════
          GREETING
      ══════════════════════════════════════ */}
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: BRAND }}>
          {greeting()}
        </p>
        <h1
          className="mt-1 text-[30px] sm:text-[36px] leading-tight tracking-tight"
          style={{ color: INK, fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
        >
          {firstName}
        </h1>
        <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed" style={{ color: "#3A3A3A" }}>
          {needsAttention > 0
            ? `${needsAttention} application${needsAttention > 1 ? "s need" : " needs"} your attention today.`
            : totalApps === 0
            ? "Welcome to Vehiculars — start your first driver's licence application."
            : inProgress > 0
            ? `${inProgress} application${inProgress > 1 ? "s are" : " is"} currently in progress.`
            : "All your applications are up to date. Great work!"}
        </p>
      </div>

      {/* ══════════════════════════════════════
          SIGNATURE — digital member file, styled
          after the credential this product produces
      ══════════════════════════════════════ */}
      <div
        className="relative overflow-hidden rounded-[22px] p-6 sm:p-8 text-white shadow-lg"
        style={{ background: "linear-gradient(155deg, #111111 0%, #0A6B4C 62%, #28A745 100%)" }}
      >
        {/* Guilloché-style security texture — pure CSS, no image asset */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, transparent, transparent 5px, #fff 5px, #fff 6px), repeating-linear-gradient(25deg, transparent, transparent 5px, #fff 5px, #fff 6px)",
          }}
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-[0.08]"
          style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }}
        />

        <div className="relative">
          {/* Card header strip */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-emerald-200/70">
                Vehiculars
              </p>
              <p className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-emerald-100/50">
                Digital member file
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white ring-1 ring-inset ring-white/20 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              {needsAttention > 0 ? "Action needed" : "Active"}
            </span>
          </div>

          {/* Photo slot + holder details */}
          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-[24px] font-bold text-white ring-2 ring-white/25"
                style={{ background: "rgba(255,255,255,0.12)", fontFamily: "var(--font-display-serif)" }}
              >
                {(user?.name || "?")[0].toUpperCase()}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/60">Holder</p>
                <p className="text-[21px] leading-tight tracking-tight" style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}>
                  {user?.name || "—"}
                </p>
                <p className="mt-0.5 text-[12px] text-emerald-100/70">{user?.email || ""}</p>
              </div>
            </div>

            <div className="flex gap-6 sm:gap-8">
              <div>
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-emerald-200/60">State</p>
                <p className="mt-0.5 font-mono text-[13px] font-semibold">{resolvedState?.name || "—"}</p>
              </div>
              <div>
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-emerald-200/60">File No.</p>
                <p className="mt-0.5 font-mono text-[13px] font-semibold">
                  VHC-{String(user?.id ?? 0).padStart(6, "0")}
                </p>
              </div>
            </div>
          </div>

          {/* Perforated divider */}
          <div
            className="my-6"
            style={{ borderTop: "1px dashed rgba(255,255,255,0.25)" }}
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-emerald-200/60">Wallet balance</p>
              <p className="mt-0.5 font-mono text-[24px] sm:text-[28px] font-bold tracking-tight">
                {koboToNaira(walletBalance)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/dashboard/apply"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[13px] font-bold text-emerald-800 shadow-sm transition-all hover:bg-emerald-50 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                New application
              </Link>
              <Link
                href="/dashboard/wallet"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-[13px] font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.98]"
              >
                <Wallet className="h-4 w-4" />
                Fund wallet
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          STAT CARDS
      ══════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total applications */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: PAPER_BORDER }}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#7A7A7A]">Total</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "#F4F1E9" }}>
              <FileText className="h-4 w-4" style={{ color: INK }} />
            </div>
          </div>
          <p className="mt-3 font-mono text-[32px] font-bold leading-none" style={{ color: INK }}>{totalApps}</p>
          <p className="mt-1 text-[12px] text-[#7A7A7A]">Applications</p>
        </div>

        {/* In progress */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: PAPER_BORDER }}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#7A7A7A]">Active</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: BRAND_TINT }}>
              <Activity className="h-4 w-4" style={{ color: BRAND }} />
            </div>
          </div>
          <p className="mt-3 font-mono text-[32px] font-bold leading-none" style={{ color: BRAND }}>{inProgress}</p>
          <p className="mt-1 text-[12px] text-[#7A7A7A]">In progress</p>
        </div>

        {/* Needs attention */}
        <div
          className="rounded-2xl border p-5 shadow-sm"
          style={{ borderColor: needsAttention > 0 ? "#E8C4B8" : PAPER_BORDER, background: needsAttention > 0 ? "#FBF1EE" : "#fff" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: needsAttention > 0 ? "#B3452F" : "#7A7A7A" }}>Attention</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: needsAttention > 0 ? "#F3DCD3" : "#F4F1E9" }}>
              <AlertTriangle className="h-4 w-4" style={{ color: needsAttention > 0 ? "#B3452F" : "#7A7A7A" }} />
            </div>
          </div>
          <p className="mt-3 font-mono text-[32px] font-bold leading-none" style={{ color: needsAttention > 0 ? "#8A3320" : INK }}>{needsAttention}</p>
          <p className="mt-1 text-[12px]" style={{ color: needsAttention > 0 ? "#B3452F" : "#7A7A7A" }}>Need{needsAttention !== 1 ? "" : "s"} attention</p>
        </div>

        {/* Completed */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: PAPER_BORDER }}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#7A7A7A]">Done</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <p className="mt-3 font-mono text-[32px] font-bold leading-none text-emerald-700">{completed}</p>
          <p className="mt-1 text-[12px] text-[#7A7A7A]">Completed</p>
        </div>
      </div>

      {/* ══════════════════════════════════════
          MAIN GRID — Profile + Applications
      ══════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">

        {/* ── LEFT: Profile card ── */}
        <div className="space-y-4 lg:col-span-4">

          {/* Profile card */}
          <div className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-sm">
            {/* Card top */}
            <div className="relative h-20 overflow-hidden" style={{ background: "linear-gradient(135deg, #065f46, #28A745)" }}>
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
            </div>

            {/* Avatar + name */}
            <div className="relative -mt-8 px-5 pb-5">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-[22px] font-bold text-white shadow-lg ring-4 ring-white"
                style={{ background: "linear-gradient(135deg, #0a7a58, #28A745)" }}
              >
                {(user?.name || "?")[0].toUpperCase()}
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[16px] font-bold text-[#111111]">{user?.name || "—"}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    <BadgeCheck className="h-3 w-3" /> Verified
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[12.5px] text-[#7A7A7A]">{user?.email || "—"}</p>
              </div>

              {/* Quick info */}
              <div className="mt-4 space-y-2.5">
                <QuickInfoRow icon={Phone} label="Phone" value={user?.phone} mono />
                <QuickInfoRow icon={MapPin} label="State" value={resolvedState?.name} />
                <QuickInfoRow icon={Calendar} label="Date of birth" value={bd.date_of_birth} mono />
                <QuickInfoRow icon={Fingerprint} label="NIN" value={bd.nin} mono />
                <QuickInfoRow icon={Shield} label="Blood / Genotype"
                  value={bd.blood_group && bd.genotype ? `${bd.blood_group} · ${bd.genotype}` : (bd.blood_group || bd.genotype || null)} />
                {bd.next_of_kin_name && (
                  <QuickInfoRow icon={User} label="Next of kin" value={`${bd.next_of_kin_name}${bd.next_of_kin_relationship ? ` (${bd.next_of_kin_relationship})` : ""}`} />
                )}
              </div>
            </div>

            {/* Settings link */}
            <div className="border-t border-slate-100">
              <Link href="/dashboard/settings" className="flex w-full items-center justify-between px-5 py-3.5 text-[12.5px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#111111]">
                <span className="flex items-center gap-2">
                  <Settings className="h-3.5 w-3.5" />
                  Edit profile & biodata
                </span>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </Link>
            </div>
          </div>

          {/* Profile completeness card */}
          <div className={`overflow-hidden rounded-2xl border shadow-sm ${profileComplete ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60"}`}>
            <div className="flex items-center gap-4 p-5">
              <CompletenessArc score={score} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-[#111111]">Profile Completeness</p>
                {profileComplete ? (
                  <p className="mt-0.5 flex items-center gap-1 text-[12px] font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> All fields filled in
                  </p>
                ) : (
                  <>
                    <p className="mt-0.5 text-[12px] text-amber-700 font-semibold">{missing.length} field{missing.length > 1 ? "s" : ""} missing</p>
                    <p className="mt-1.5 text-[11.5px] text-slate-500">Complete your profile to speed up licence applications.</p>
                  </>
                )}
              </div>
            </div>

            {!profileComplete && missing.length > 0 && (
              <>
                <div className="flex flex-wrap gap-1.5 border-t border-amber-100 bg-amber-50 px-5 py-3">
                  {missing.slice(0, 5).map((f) => (
                    <span key={f.key} className="inline-flex items-center gap-1 rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                      <XCircle className="h-3 w-3" /> {f.label}
                    </span>
                  ))}
                  {missing.length > 5 && (
                    <span className="inline-flex items-center rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-amber-600 ring-1 ring-amber-200">
                      +{missing.length - 5} more
                    </span>
                  )}
                </div>
                <div className="border-t border-amber-100 px-5 py-3">
                  <Link href="/dashboard/settings"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[12.5px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: "#f59e0b" }}>
                    <Settings className="h-3.5 w-3.5" /> Complete my profile
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT: Applications ── */}
        <div className="space-y-5 lg:col-span-8">

          {/* Attention banner */}
          {needsAttention > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50/80 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[13.5px] font-bold text-red-900">
                    {needsAttention} application{needsAttention > 1 ? "s need" : " needs"} your attention
                  </p>
                  <p className="text-[12px] text-red-700">
                    Review rejected or action-required applications below.
                  </p>
                </div>
              </div>
              <Link href="/dashboard/apply" className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2 text-[12.5px] font-bold text-red-700 hover:bg-red-50 transition-colors">
                View <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {/* Applications table */}
          <div className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-[15px] font-bold text-[#111111]">My Applications</h2>
                <p className="mt-0.5 text-[12px] text-[#7A7A7A]">
                  {totalApps === 0 ? "No applications yet." : `${totalApps} total · ${inProgress} in progress`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => loadData(true)} className="rounded-lg p-1.5 text-[#7A7A7A] hover:bg-slate-100 hover:text-slate-600 transition-colors">
                  {refreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </button>
                <Link href="/dashboard/apply" className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E5E5] bg-slate-50 px-3.5 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
                  <Plus className="h-3.5 w-3.5" /> New
                </Link>
              </div>
            </div>

            {applications.length === 0 ? (
              <div className="flex flex-col items-center py-16 px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
                  <FileText className="h-8 w-8 text-slate-300" />
                </div>
                <p className="mt-4 text-[14px] font-bold text-slate-800">No applications yet</p>
                <p className="mt-1 max-w-xs text-[12.5px] text-[#7A7A7A] leading-relaxed">
                  Apply for a fresh, renewal, or reissue driver's licence to get started.
                </p>
                <Link href="/dashboard/apply"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: BRAND }}>
                  <Plus className="h-4 w-4" /> Start Application
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {applications.slice(0, 6).map((app) => {
                  const isNeedsAction = ["needs_correction", "awaiting_customer", "staff_rejected"].includes(app.status);
                  const isPaid = ["paid", "success"].includes(app.payment_status) || ["paid", "success"].includes(app.payment_options?.payment_status);
                  return (
                    <Link
                      key={app.id}
                      href={`/dashboard/apply/${app.id}`}
                      className={`group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50/70 ${isNeedsAction ? "bg-red-50/20" : ""}`}
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <MiniProgressRing status={app.status} applicationType={app.application_type} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13.5px] font-bold capitalize text-[#111111]">
                              {app.application_type || "Fresh"} Licence
                            </span>
                            <span className="font-mono text-[11px] text-[#7A7A7A]">#{app.id}</span>
                            {isNeedsAction && (
                              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-3 text-[11.5px] text-[#7A7A7A]">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(app.created_at)}
                            </span>
                            {!isPaid && app.status === "submitted" && (
                              <span className="font-semibold text-amber-600">· Payment pending</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2.5">
                        <StatusBadge status={app.status} size="sm" />
                        <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {applications.length > 6 && (
              <div className="border-t border-slate-100 px-6 py-3">
                <Link href="/dashboard/apply" className="flex items-center justify-center gap-1.5 text-[12.5px] font-semibold transition-colors hover:opacity-80" style={{ color: BRAND }}>
                  View all {totalApps} applications <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link href="/dashboard/wallet"
              className="group flex items-center justify-between gap-4 rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm" style={{ background: BRAND }}>
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[13.5px] font-bold text-[#111111]">Virtual Wallet</p>
                  <p className="mt-0.5 text-[12px] text-[#7A7A7A]">Fund &amp; track payments</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-500" />
            </Link>

            <Link href="/dashboard/apply"
              className="group flex items-center justify-between gap-4 rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[13.5px] font-bold text-[#111111]">Track Applications</p>
                  <p className="mt-0.5 text-[12px] text-[#7A7A7A]">Monitor progress &amp; status</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function QuickInfoRow({ icon: Icon, label, value, mono }) {
  const has = !!value;
  return (
    <div className="flex items-start gap-2.5">
      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${has ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-300"}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[#7A7A7A]">{label}</span>
        <p className={`mt-0.5 truncate text-[13px] font-semibold ${has ? "text-slate-800" : "text-slate-300 italic"} ${mono && has ? "font-mono text-[12.5px]" : ""}`}>
          {value || "Not set"}
        </p>
      </div>
    </div>
  );
}
