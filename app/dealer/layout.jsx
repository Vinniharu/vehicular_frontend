"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LogOut,
  Menu,
  X,
  ChevronRight,
  Loader2,
  LayoutDashboard,
  ClipboardList,
  Package,
  Wallet,
  Landmark,
} from "lucide-react";
import { getToken, removeToken, getCachedUser, authGetMe } from "@/lib/api";
import { useAutoLogout } from "@/lib/hooks/useAutoLogout";

const BRAND = "#28A745";

const DEALER_NAV = [
  {
    section: "Overview",
    items: [
      { label: "Matched Requests", href: "/dealer", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    section: "Work",
    items: [
      { label: "My Bids & Orders", href: "/dealer/orders", icon: Package, exact: false },
    ],
  },
  {
    section: "Payouts",
    items: [
      { label: "Wallet", href: "/dealer/wallet", icon: Wallet, exact: false },
      { label: "Bank Account", href: "/dealer/bank-account", icon: Landmark, exact: false },
    ],
  },
];

// Routes a not-yet-authenticated dealer must be able to reach: the login
// page itself and the public application form.
const PUBLIC_ROUTES = ["/dealer/login", "/dealer/apply"];

export default function DealerLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  useAutoLogout();
  const [user, setUser] = useState(() => getCachedUser());
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isPublicRoute) return;

    const token = getToken();
    if (!token) {
      router.push("/dealer/login");
      return;
    }

    const cached = getCachedUser();
    if (cached) {
      if (cached.role !== "dealer") {
        router.push("/dealer/login");
        return;
      }
      setUser(cached);
      setLoading(false);
    }

    authGetMe().then((res) => {
      if (res.error && res.status === 401) {
        removeToken();
        router.push("/dealer/login");
      } else if (res.data) {
        if (res.data.role !== "dealer") {
          router.push("/dealer/login");
          return;
        }
        setUser(res.data);
        setLoading(false);
      } else if (!cached) {
        setLoading(false);
      }
    });
  }, [router, isPublicRoute]);

  const handleLogout = () => {
    removeToken();
    router.push("/dealer/login");
  };

  if (isPublicRoute) {
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
    : "DL";

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
                Dealer
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {DEALER_NAV.map((group) => (
            <div key={group.section}>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.section}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
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
              <p className="truncate text-[13px] font-bold leading-tight text-white">{user?.name || "Dealer"}</p>
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
          <span className="text-[15px] font-bold tracking-tight text-white">Vehiculars Dealer</span>
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
            {DEALER_NAV.flatMap((g) => g.items).map((item) => {
              const Icon = item.icon;
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
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
                  <p className="truncate text-[13px] font-bold text-white">{user?.name || "Dealer"}</p>
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
    </div>
  );
}
