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
  LayoutDashboard,
  UserCog,
  Briefcase,
  Shield,
} from "lucide-react";
import { getToken, removeToken, getCachedUser, authGetMe } from "@/lib/api";
import { useAutoLogout } from "@/lib/hooks/useAutoLogout";

const SUPER_ADMIN_NAV = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", href: "/super-admin", icon: LayoutDashboard, desc: "Account stats across the whole platform" },
    ],
  },
  {
    section: "Accounts",
    items: [
      { label: "Customers", href: "/super-admin/customers", icon: Users, desc: "Every customer account" },
      { label: "Staff", href: "/super-admin/staff", icon: UserCog, desc: "Verification staff accounts" },
      { label: "Agents", href: "/super-admin/agents", icon: Briefcase, desc: "VIO field agent accounts" },
      { label: "Admins", href: "/super-admin/admins", icon: Shield, desc: "Admin accounts" },
    ],
  },
];

export default function SuperAdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginRoute = pathname === "/super-admin/login";
  useAutoLogout();
  const [user, setUser] = useState(() => getCachedUser());
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // The login page manages its own auth state — this guard has no
    // business running on it (see app/admin/layout.jsx for the full
    // rationale, identical here).
    if (isLoginRoute) return;

    const token = getToken();
    if (!token) {
      router.push("/super-admin/login");
      return;
    }

    const cached = getCachedUser();
    if (cached) {
      if (cached.role !== "super_admin") {
        router.push("/super-admin/login");
        return;
      }
      setUser(cached);
      setLoading(false);
    }

    authGetMe().then((res) => {
      if (res.error && res.status === 401) {
        removeToken();
        router.push("/super-admin/login");
      } else if (res.data) {
        if (res.data.role !== "super_admin") {
          router.push("/super-admin/login");
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
    router.push("/super-admin/login");
  };

  if (isLoginRoute) {
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
    : "SA";

  const currentNavItem = SUPER_ADMIN_NAV.flatMap((g) => g.items).find((i) => i.href === pathname);

  return (
    <div className="min-h-screen flex bg-[#f5f5f7]" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-[#111111] fixed h-full z-30 border-r border-white/[0.04]">
        <div className="px-5 py-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Vehiculars" className="h-8 w-8 object-contain rounded-lg" />
            <div>
              <p className="text-[15px] font-semibold text-white tracking-tight leading-none">Vehiculars</p>
              <p className="text-[10px] text-[#28A745] font-semibold uppercase tracking-[0.08em] mt-[3px]">Super Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
          {SUPER_ADMIN_NAV.map((group) => (
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

        <div className="px-3 py-4 border-t border-white/[0.06] bg-[#0d1014]">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div
              className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #28A745, #0a7a56)" }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate leading-tight">{user?.name || "Super Admin"}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email || "super admin"}</p>
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
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#28A745]">Super Admin</span>
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
            {SUPER_ADMIN_NAV.map((group) => (
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
        <div className="hidden lg:flex items-center justify-between px-8 h-[60px] bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 font-medium">Super Admin</span>
            {currentNavItem && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                <span className="text-slate-800 font-semibold">{currentNavItem.label}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#28A745] bg-[#28A745]/8 px-3 py-1.5 rounded-full border border-[#28A745]/20">
              <ShieldCheck className="h-3 w-3" />
              <span>Super Admin Session</span>
            </div>
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: "linear-gradient(135deg, #28A745, #0a7a56)" }}>
              {initials}
            </div>
          </div>
        </div>

        <main className="flex-1 pt-[57px] lg:pt-0 px-5 sm:px-8 py-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
