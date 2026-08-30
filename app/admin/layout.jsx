"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Users,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  Bell,
  Wallet,
  LayoutDashboard,
  ClipboardList,
  Settings,
  Tag,
  HandCoins,
  MessageCircle,
  MapPin,
  AlertTriangle,
  Camera,
} from "lucide-react";
import { getToken, removeToken, getCachedUser, authGetMe } from "@/lib/api";
import { useAutoLogout } from "@/lib/hooks/useAutoLogout";

const ADMIN_NAV = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, desc: "Platform-wide overview" },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "Applications", href: "/admin/applications", icon: ClipboardList, desc: "Every application in the system and who's handling it" },
      { label: "Tickets", href: "/admin/tickets", icon: MessageCircle, desc: "Every support conversation and who's handling it" },
      { label: "RWX Bays", href: "/admin/rwx/bays", icon: MapPin, desc: "Inspection bay locations, slot capacity, and assigned agents" },
      { label: "PCI Reference Photos", href: "/admin/pci-reference-images", icon: Camera, desc: "\"What good looks like\" comparison photos for the field mechanic's checklist" },
      { label: "Activity Log", href: "/admin/activity-log", icon: AlertTriangle, desc: "Real-time feed of customer-facing errors and failures" },
    ],
  },
  {
    section: "People",
    items: [
      { label: "Staff & Agent Directory", href: "/admin/people", icon: Users, desc: "Manage verification staff and field agents" },
    ],
  },
  {
    section: "Finance",
    items: [
      { label: "Revenue", href: "/admin/revenue", icon: Wallet, desc: "Inflow, platform profit, agent payouts, and transactions" },
      { label: "Pricing", href: "/admin/pricing", icon: Tag, desc: "Set prices for every service in the catalogue" },
      { label: "Compensation", href: "/admin/compensation", icon: HandCoins, desc: "Set agent compensation, globally or per agent" },
    ],
  },
  {
    section: "Account",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings, desc: "Your name, phone, and password" },
    ],
  },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginRoute = pathname === "/admin/login";
  useAutoLogout();
  const [user, setUser] = useState(() => getCachedUser());
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // The login page manages its own auth state (PortalLoginForm bounces an
    // already-signed-in visitor back to /admin itself) — this guard has no
    // business running on it. Without this check, a logged-out visitor
    // landing directly on /admin/login (e.g. via the subdomain root
    // redirect) would hit the "no token" branch below, which pushes to
    // /admin/login — a no-op since we're already there — and returns
    // without ever calling setLoading(false), leaving the spinner stuck
    // forever instead of ever showing the login form.
    if (isLoginRoute) return;

    const token = getToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }

    const cached = getCachedUser();
    if (cached) {
      if (cached.role !== "admin") {
        router.push("/admin/login");
        return;
      }
      setUser(cached);
      setLoading(false);
    }

    authGetMe().then((res) => {
      if (res.error && res.status === 401) {
        removeToken();
        router.push("/admin/login");
      } else if (res.data) {
        if (res.data.role !== "admin") {
          router.push("/admin/login");
          return;
        }
        setUser(res.data);
        setLoading(false);
      } else if (!cached) {
        setLoading(false);
      }
    });
  }, [router, isLoginRoute]);

  const handleLogout = () => {
    removeToken();
    router.push("/admin/login");
  };

  if (isLoginRoute) {
    // No sidebar/topbar shell on the login route — otherwise navigating
    // here from an already-mounted authenticated layout (e.g. clicking
    // "Sign out") leaves this component's stale loading/user state in
    // place across the client-side route change, and the login form ends
    // up rendered inside the still-visible admin sidebar shell.
    return children;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0e1117]">
        <div className="h-7 w-7 border-2 border-[#28A745]/30 border-t-[#28A745] rounded-full animate-spin" />
        <p className="text-[13px] text-slate-500 tracking-wide">Authenticating session&hellip;</p>
      </div>
    );
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "AD";

  const currentNavItem = ADMIN_NAV.flatMap((g) => g.items).find((i) => i.href === pathname);

  return (
    <div className="min-h-screen flex bg-[#f5f5f7]" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-[#111111] fixed h-full z-30 border-r border-white/[0.04]">

        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Vehiculars" className="h-8 w-8 object-contain rounded-lg" />
            <div>
              <p className="text-[15px] font-semibold text-white tracking-tight leading-none">Vehiculars</p>
              <p className="text-[10px] text-[#28A745] font-semibold uppercase tracking-[0.08em] mt-[3px]">Administration</p>
            </div>
          </div>
        </div>

        {/* Nav Sections */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
          {ADMIN_NAV.map((group) => (
            <div key={group.section}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">
                {group.section}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                      style={{
                        background: active ? "rgba(40, 167, 69,0.15)" : "transparent",
                        color: active ? "#28A745" : "#94a3b8",
                      }}
                    >
                      <Icon className="h-[15px] w-[15px] shrink-0" />
                      <span className="truncate">{item.label}</span>
                      {active && <ChevronRight className="h-3 w-3 ml-auto opacity-60" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Footer */}
        <div className="px-3 py-4 border-t border-white/[0.06] bg-[#0d1014]">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div
              className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #28A745, #0a7a56)" }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate leading-tight">{user?.name || "System Admin"}</p>
              <p className="text-[11px] text-slate-500 truncate capitalize">{user?.email || "admin"}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className="shrink-0 p-1.5 rounded-md text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Mobile Header ─── */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3.5 bg-[#111111] border-b border-white/[0.06] fixed top-0 inset-x-0 z-40">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Vehiculars" className="h-7 w-7 object-contain rounded-md" />
          <div>
            <span className="text-[15px] font-semibold text-white block leading-tight">Vehiculars</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#28A745]">Administration</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* ─── Mobile Drawer ─── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[57px] bottom-0 z-50 bg-[#111111] border-t border-white/[0.06] flex flex-col overflow-y-auto">
          <nav className="flex-1 p-4 space-y-5">
            {ADMIN_NAV.map((group) => (
              <div key={group.section}>
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">{group.section}</p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: active ? "rgba(40, 167, 69,0.15)" : "transparent",
                        color: active ? "#28A745" : "#94a3b8",
                      }}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
          <div className="p-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-[#28A745]">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/15 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── Main Content ─── */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">

        {/* Top Bar */}
        <div className="hidden lg:flex items-center justify-between px-8 h-[60px] bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 font-medium">Administration</span>
            {currentNavItem && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                <span className="text-slate-800 font-semibold">{currentNavItem.label}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#28A745] bg-[#28A745]/8 px-3 py-1.5 rounded-full border border-[#28A745]/20">
              <span className="h-1.5 w-1.5 rounded-full bg-[#28A745] animate-pulse" />
              <span>Active Admin Session</span>
            </div>
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: "linear-gradient(135deg, #28A745, #0a7a56)" }}>
              {initials}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 pt-[57px] lg:pt-0 px-5 sm:px-8 py-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
