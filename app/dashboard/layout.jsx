"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  X,
  FileText,
  Sun,
  Hash,
  Wallet,
  Gift,
  FileCheck2,
  Settings,
  ChevronRight,
  Bell,
  Search,
} from "lucide-react";
import { getToken, removeToken, getCachedUser, authGetMe } from "@/lib/api";
import { useAutoLogout } from "@/lib/hooks/useAutoLogout";
import { colors } from "@/lib/design-tokens";
import MobileDrawer from "@/app/dashboard/_shared/MobileDrawer";
import ChatWidget from "@/app/dashboard/_shared/ChatWidget";
import SidebarNavItem, { isActive, isChildActive } from "@/app/dashboard/_shared/SidebarNavItem";

const BRAND = colors.primary.DEFAULT;

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
    desc: "Overview & profile",
  },
  {
    label: "Services",
    href: "/dashboard/services",
    icon: LayoutGrid,
    exact: true,
    desc: "Browse all services",
  },
  {
    label: "Applications",
    icon: FileText,
    desc: "Browse all applications",
    children: [
      { label: "Driver's Licence", href: "/dashboard/apply", icon: FileText },
      { label: "Tinted Permit", href: "/dashboard/apply/tinted-permit", icon: Sun },
      { label: "Number Plate", href: "/dashboard/apply/number-plate", icon: Hash },
      { label: "Vehicle Particulars", href: "/dashboard/apply/vehicle-particulars", icon: FileText },
    ],
  },
  {
    label: "My Documents",
    href: "/dashboard/documents",
    icon: FileCheck2,
    exact: true,
    desc: "All your approved licences & documents",
  },
  {
    label: "Wallet",
    href: "/dashboard/wallet",
    icon: Wallet,
    exact: true,
    desc: "Balance & payments",
  },
  {
    label: "Refer & earn",
    href: "/dashboard/refer",
    icon: Gift,
    exact: true,
    desc: "Invite friends & earn rewards",
  },
];

// A parent with children renders "Parent › Child" once its active child is
// found; a flat item renders just its own label.
function breadcrumbLabel(pathname) {
  for (const item of NAV_ITEMS) {
    if (item.children) {
      const activeChild = item.children.find((c) => isChildActive(pathname, c));
      if (activeChild) return `${item.label} › ${activeChild.label}`;
    } else if (isActive(pathname, item)) {
      return item.label;
    }
  }
  return "Dashboard";
}

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  useAutoLogout();
  const [user, setUser] = useState(() => getCachedUser());
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/auth/login?redirect=/dashboard");
      return;
    }

    const cached = getCachedUser();
    if (cached) {
      if (cached.role === "admin") { router.push("/admin"); return; }
      if (cached.role === "staff") { router.push("/staff"); return; }
      if (cached.role === "agent") { router.push("/agent"); return; }
      if (cached.role === "super_admin") { router.push("/super-admin"); return; }
      setUser(cached);
      setLoading(false);
    }

    authGetMe().then((res) => {
      if (res.error && res.status === 401) {
        removeToken();
        router.push("/auth/login?redirect=/dashboard");
      } else if (res.data) {
        if (res.data.role === "admin") { router.push("/admin"); return; }
        if (res.data.role === "staff") { router.push("/staff"); return; }
        if (res.data.role === "agent") { router.push("/agent"); return; }
        if (res.data.role === "super_admin") { router.push("/super-admin"); return; }
        setUser(res.data);
        setLoading(false);
      } else if (!cached) {
        setLoading(false);
      }
    });
  }, [router]);

  const handleLogout = () => {
    removeToken();
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#F7F7F7]">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-100" />
          <div className="absolute inset-0 rounded-full border-2 border-t-[#28A745] animate-spin" />
        </div>
        <p className="text-[13px] font-medium text-[#7A7A7A]">Loading your account…</p>
      </div>
    );
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen flex bg-[#F7F7F7] text-[#111111] selection:bg-[#28A745]/20">

      {/* ══════════════════════════════════════
          SIDEBAR — Desktop
      ══════════════════════════════════════ */}
      <aside className="hidden md:flex flex-col w-[248px] shrink-0 bg-[#111111] fixed h-full text-white z-30">

        {/* Logo */}
        <div className="px-6 pt-7 pb-5 border-b border-white/[0.06]">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: BRAND }}>
              <span className="text-[14px] font-black text-white">V</span>
            </div>
            <span className="text-[18px] tracking-tight text-white" style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}>Vehiculars</span>
          </Link>
          <p className="mt-2 text-[11px] text-white/30 leading-snug">Driver's Licence Management Portal</p>
        </div>

        {/* Nav label */}
        <div className="px-6 pt-5 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Menu</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem key={item.href || item.label} item={item} pathname={pathname} variant="desktop" />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-4 border-t border-white/[0.06] space-y-0.5">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
              <Settings className="h-4 w-4" />
            </div>
            <span>Settings</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
              <LogOut className="h-4 w-4" />
            </div>
            <span>Sign out</span>
          </button>

          {/* User info at bottom */}
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #065f46, #28A745)" }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-semibold text-white/80">{user?.name || "User"}</p>
              <p className="truncate text-[10.5px] text-white/30">{user?.email}</p>
            </div>
          </div>

          <p className="mt-3 px-3 text-[10px] text-white/20 leading-relaxed">
            © Vehiculars 2026. All rights reserved.
          </p>
        </div>
      </aside>

      {/* ══════════════════════════════════════
          MOBILE HEADER
      ══════════════════════════════════════ */}
      <header className="md:hidden flex items-center justify-between px-4 py-3.5 bg-[#111111] text-white fixed top-0 inset-x-0 z-40 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: BRAND }}>
            <span className="text-[12px] font-black text-white">V</span>
          </div>
          <span className="text-[16px] font-bold text-white">Vehiculars</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #065f46, #28A745)" }}
          >
            {initials}
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════
          MOBILE DRAWER
      ══════════════════════════════════════ */}
      <MobileDrawer
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        title="Navigation menu"
        side="left"
        panelClassName="inset-x-0 top-[57px] bottom-0 md:hidden bg-[#111111] text-white flex flex-col overflow-y-auto"
      >
        {/* User card */}
        <div className="flex items-center gap-3.5 mx-4 mt-4 mb-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] p-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #065f46, #28A745)" }}
          >
            {initials}
          </div>
          <div>
            <p className="text-[14px] font-bold text-white">{user?.name}</p>
            <p className="text-[12px] text-white/50">{user?.email}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.href || item.label}
              item={item}
              pathname={pathname}
              variant="mobile"
              onNavigate={() => setMobileMenuOpen(false)}
            />
          ))}
        </nav>

        <div className="px-4 pb-6 pt-3 space-y-1 border-t border-white/[0.06] mt-3">
          <Link href="/dashboard/settings" onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[14px] font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-all">
            <Settings className="h-5 w-5" /> Settings
          </Link>
          <button type="button" onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[14px] font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="h-5 w-5" /> Sign out
          </button>
        </div>
      </MobileDrawer>

      {/* ══════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════ */}
      <div className="min-w-0 flex-1 md:pl-[248px] flex flex-col min-h-screen">

        {/* Desktop top bar */}
        <div className="hidden md:flex items-center justify-between px-8 py-3.5 bg-white/80 backdrop-blur-sm border-b border-[#E5E5E5] sticky top-0 z-20">
          <div className="flex items-center gap-2 text-[13px] text-[#7A7A7A]">
            <Link href="/" className="hover:text-[#28A745] transition-colors font-medium">Vehiculars</Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#D4D4D4]" />
            <span className="font-semibold text-[#111111]">
              {breadcrumbLabel(pathname)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="text-[12.5px] font-medium text-[#7A7A7A] hover:text-[#111111] transition-colors">
              ← Back to website
            </Link>
            <div className="h-4 w-px bg-[#E5E5E5]" />
            <Link href="/dashboard/settings" className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-[#3A3A3A] hover:bg-[#F4F1E9] transition-colors">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #065f46, #28A745)" }}
              >
                {initials}
              </div>
              {firstName}
            </Link>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 pt-[57px] md:pt-0 px-4 py-6 sm:px-6 sm:py-8 md:px-8 max-w-[1100px] w-full mx-auto">
          {children}
        </div>
      </div>

      <ChatWidget />
    </div>
  );
}
