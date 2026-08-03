"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LogOut,
  Menu,
  X,
  ChevronRight,
  AlertCircle,
  Loader2,
  Key,
  ShieldCheck,
  LayoutDashboard,
  FileText,
  MapPinOff,
  MapPin,
  MessageCircle,
  Settings,
} from "lucide-react";
import { getToken, removeToken, getCachedUser, setCachedUser, authGetMe, authSetPassword } from "@/lib/api";
import { useAutoLogout } from "@/lib/hooks/useAutoLogout";

const BRAND = "#28A745";

const SUPPORT_NAV = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", href: "/support", icon: LayoutDashboard },
    ],
  },
  {
    section: "Applications",
    items: [
      { label: "All applications", href: "/support/applications", icon: FileText },
      { label: "Unassigned", href: "/support/unassigned", icon: MapPinOff },
      { label: "LGA coverage", href: "/support/lga-coverage", icon: MapPin },
    ],
  },
  {
    section: "Support",
    items: [
      { label: "Tickets", href: "/support/tickets", icon: MessageCircle },
    ],
  },
  {
    section: "Account",
    items: [
      { label: "Settings", href: "/support/settings", icon: Settings },
    ],
  },
];

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60";
const inputBase =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#28A745] focus:bg-white focus:ring-2 focus:ring-[#28A745]/15";
const fieldLabel = "block text-[11.5px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5";

export default function SupportLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginRoute = pathname === "/support/login";
  useAutoLogout();
  const [user, setUser] = useState(() => getCachedUser());
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [passError, setPassError] = useState(null);
  const [passSuccess, setPassSuccess] = useState(null);

  useEffect(() => {
    if (isLoginRoute) return;

    const token = getToken();
    if (!token) {
      router.push("/support/login");
      return;
    }

    const cached = getCachedUser();
    if (cached) {
      if (cached.role !== "support" && cached.role !== "admin") {
        router.push("/support/login");
        return;
      }
      setUser(cached);
      if (cached.must_change_password) setShowPasswordModal(true);
      setLoading(false);
    }

    authGetMe().then((res) => {
      if (res.error && res.status === 401) {
        removeToken();
        router.push("/support/login");
      } else if (res.data) {
        if (res.data.role !== "support" && res.data.role !== "admin") {
          router.push("/support/login");
          return;
        }
        setUser(res.data);
        setShowPasswordModal(!!res.data.must_change_password);
        setLoading(false);
      } else if (!cached) {
        setLoading(false);
      }
    });
  }, [router, isLoginRoute]);

  const handleLogout = () => {
    removeToken();
    router.push("/support/login");
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!newPassword || newPassword.length < 6) {
      setPassError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("Passwords don't match.");
      return;
    }

    setPassSubmitting(true);
    const res = await authSetPassword({ new_password: newPassword });
    setPassSubmitting(false);

    if (res.error) {
      setPassError(res.error);
      return;
    }

    setPassSuccess("Password updated.");
    if (user) {
      const updatedUser = { ...user, must_change_password: false };
      setUser(updatedUser);
      setCachedUser(updatedUser);
    }
    setTimeout(() => {
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
      setPassSuccess(null);
    }, 1000);
  };

  if (isLoginRoute) {
    return children;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f5f5f7]">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: BRAND }} />
        <p className="text-[13px] font-medium text-slate-500">Signing you in…</p>
      </div>
    );
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "CS";

  return (
    <div className="flex min-h-screen bg-[#f5f5f7]">
      {/* Desktop sidebar */}
      <aside className="fixed hidden h-full w-64 shrink-0 flex-col border-r border-white/[0.04] bg-[#111111] lg:flex">
        <div className="border-b border-white/[0.06] px-5 py-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Vehiculars" className="h-8 w-8 rounded-lg object-contain" />
            <div>
              <p className="text-[15px] font-bold leading-none tracking-tight text-white">Vehiculars</p>
              <p className="mt-[3px] text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: BRAND }}>
                Support
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {SUPPORT_NAV.map((group) => (
            <div key={group.section}>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.section}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = item.href === "/support" ? pathname === "/support" : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13.5px] font-semibold transition-all"
                      style={{
                        background: active ? "rgba(40, 167, 69,0.16)" : "transparent",
                        color: active ? "#34d399" : "#94a3b8",
                      }}
                    >
                      <Icon className="h-4 w-4 shrink-0" style={{ color: active ? "#34d399" : "#64748b" }} />
                      <span className="truncate">{item.label}</span>
                      {active && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-70" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/[0.06] bg-[#0c0d12] px-3 py-4">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${BRAND}, #0a7a56)` }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold leading-tight text-white">{user?.name || "Support"}</p>
              <p className="truncate text-[11px] text-slate-400">{user?.email || ""}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#111111] px-4 lg:hidden">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Vehiculars" className="h-7 w-7 object-contain" />
          <span className="text-[15px] font-bold tracking-tight text-white">Vehiculars Support</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-black/60 pt-16 backdrop-blur-sm lg:hidden">
          <div className="space-y-4 border-b border-white/10 bg-[#111111] p-5 shadow-2xl">
            {SUPPORT_NAV.flatMap((g) => g.items).map((item) => {
              const Icon = item.icon;
              const active = item.href === "/support" ? pathname === "/support" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl p-3 text-[13.5px] font-semibold"
                  style={{
                    background: active ? "rgba(40, 167, 69,0.18)" : "rgba(255,255,255,0.05)",
                    color: active ? "#34d399" : "#e2e8f0",
                  }}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: BRAND }}>
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-white">{user?.name || "Support"}</p>
                  <p className="truncate text-[11px] text-slate-400">{user?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-red-500/30 px-3 py-1.5 text-[12px] font-semibold text-red-400 transition-colors hover:bg-red-500/10"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex min-h-screen flex-1 flex-col pt-16 lg:pl-64 lg:pt-0">
        <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 sm:p-6 lg:p-8">{children}</div>
      </main>

      {/* Password change modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-slate-900">Set a new password</h3>
                <p className="mt-0.5 text-[12.5px] text-slate-500">
                  Your account was created with a temporary password. Set your own before continuing.
                </p>
              </div>
            </div>

            {passError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-[12.5px] text-red-700 ring-1 ring-inset ring-red-200">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {passError}
              </div>
            )}
            {passSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-[12.5px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                {passSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
              <div>
                <label className={fieldLabel}>New password (min. 6 characters)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter a new password"
                  required
                  disabled={passSubmitting || !!passSuccess}
                  className={inputBase}
                />
              </div>
              <div>
                <label className={fieldLabel}>Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter the new password"
                  required
                  disabled={passSubmitting || !!passSuccess}
                  className={inputBase}
                />
              </div>
              <button
                type="submit"
                disabled={passSubmitting || !!passSuccess}
                className={`${btnPrimary} w-full`}
                style={{ background: BRAND }}
              >
                {passSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {passSubmitting ? "Updating…" : "Update password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
