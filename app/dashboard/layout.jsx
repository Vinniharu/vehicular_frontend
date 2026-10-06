"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileCheck2,
  FilePlus2,
  FileText,
  Gift,
  Home,
  LifeBuoy,
  LogOut,
  NotebookPen,
  Settings,
  UserRound,
  Wallet,
} from "lucide-react";
import { authGetMe, getCachedUser, getToken, removeToken } from "@/lib/api";
import { useAutoLogout } from "@/lib/hooks/useAutoLogout";
import ChatWidget, { SUPPORT_UNREAD_EVENT, openSupportChat } from "@/app/dashboard/_shared/ChatWidget";
import { useToast } from "@/app/components/shared/ToastProvider";

// Staff-side roles each have their own portal; the customer portal is for
// customers only.
const ROLE_HOME = {
  admin: "/admin",
  staff: "/staff",
  agent: "/agent",
  super_admin: "/super-admin",
  support: "/support",
};

// /dashboard/apply/<number> is an existing application; everything else
// under /dashboard/apply is the "apply for a service" flow.
const isApplicationDetail = (path) => /^\/dashboard\/apply\/(app_)?\d+/.test(path);

const TABS = [
  { label: "Home", href: "/dashboard", icon: Home, match: (p) => p === "/dashboard" },
  {
    label: "Apply",
    href: "/dashboard/services",
    icon: FilePlus2,
    match: (p) => p.startsWith("/dashboard/services") || (p.startsWith("/dashboard/apply") && !isApplicationDetail(p)),
  },
  {
    label: "Applications",
    href: "/dashboard/applications",
    icon: FileText,
    match: (p) => p.startsWith("/dashboard/applications") || isApplicationDetail(p) || p.startsWith("/dashboard/payment"),
  },
  { label: "Wallet", href: "/dashboard/wallet", icon: Wallet, match: (p) => p.startsWith("/dashboard/wallet") },
  {
    label: "Account",
    href: "/dashboard/account",
    icon: UserRound,
    match: (p) => ["/dashboard/account", "/dashboard/settings", "/dashboard/documents", "/dashboard/drafts", "/dashboard/refer"].some((x) => p.startsWith(x)),
  },
];

// Desktop sidebar: the tab destinations plus the pages that live under
// Account on a phone.
const SIDEBAR = [
  { label: "Home", href: "/dashboard", icon: Home, match: TABS[0].match },
  { label: "Apply for a service", href: "/dashboard/services", icon: FilePlus2, match: TABS[1].match },
  { label: "My applications", href: "/dashboard/applications", icon: FileText, match: TABS[2].match },
  { label: "My documents", href: "/dashboard/documents", icon: FileCheck2, match: (p) => p.startsWith("/dashboard/documents") },
  { label: "Saved drafts", href: "/dashboard/drafts", icon: NotebookPen, match: (p) => p.startsWith("/dashboard/drafts") },
  { label: "Wallet", href: "/dashboard/wallet", icon: Wallet, match: TABS[3].match },
  { label: "Refer & earn", href: "/dashboard/refer", icon: Gift, match: (p) => p.startsWith("/dashboard/refer") },
];

function initialsOf(name) {
  return name ? name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "U";
}

function loginUrl() {
  const here = `${window.location.pathname}${window.location.search}`;
  return `/auth/login?redirect=${encodeURIComponent(here)}`;
}

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname() || "/dashboard";
  const pushToast = useToast();
  useAutoLogout({
    onWarn: () =>
      pushToast({
        tone: "error",
        title: "You'll be signed out in 2 minutes",
        body: "For your security, sessions end after an hour. Tap Continue on any form to save your progress, then sign in again.",
      }),
  });
  const [user, setUser] = useState(() => getCachedUser());
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace(loginUrl());
      return;
    }

    const routeFor = (u) => {
      const home = ROLE_HOME[u?.role];
      if (home) {
        router.replace(home);
        return true;
      }
      return false;
    };

    const cached = getCachedUser();
    if (cached) {
      if (routeFor(cached)) return;
      setUser(cached);
      setLoading(false);
    }

    authGetMe().then((res) => {
      if (res.error && res.status === 401) {
        removeToken();
        router.replace(loginUrl());
      } else if (res.data) {
        if (routeFor(res.data)) return;
        setUser(res.data);
        setLoading(false);
      } else if (!cached) {
        setLoading(false);
      }
    });
  }, [router]);

  useEffect(() => {
    const onUnread = (e) => setUnread(Number(e.detail) || 0);
    window.addEventListener(SUPPORT_UNREAD_EVENT, onUnread);
    return () => window.removeEventListener(SUPPORT_UNREAD_EVENT, onUnread);
  }, []);

  const handleLogout = () => {
    removeToken();
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <div className="cx-root flex min-h-dvh flex-col items-center justify-center gap-3 bg-cx-paper" role="status">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-cx-brand-soft border-t-cx-brand" />
        <p className="text-sm text-cx-muted">Loading your account…</p>
      </div>
    );
  }

  const initials = initialsOf(user?.name);

  return (
    <div className="cx-root min-h-dvh bg-cx-paper text-cx-ink selection:bg-cx-brand/20">
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-cx-line bg-cx-surface md:flex">
        <div className="px-5 pb-4 pt-6">
          <Link href="/" className="cx-focus inline-flex items-center gap-2.5 rounded-cx">
            <img src="/logo.png" alt="" className="h-8 w-auto object-contain" />
            <span className="font-display text-xl text-cx-ink">Vehiculars</span>
          </Link>
        </div>

        <nav aria-label="Main" className="flex-1 space-y-0.5 overflow-y-auto px-3">
          {SIDEBAR.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`cx-focus flex min-h-11 items-center gap-3 rounded-cx px-3 text-[15px] transition-colors ${
                  active ? "bg-cx-brand-soft font-semibold text-cx-brand-deep" : "text-cx-ink-2 hover:bg-cx-sunken"
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-0.5 border-t border-cx-line px-3 py-3">
          <Link
            href="/dashboard/settings"
            aria-current={pathname.startsWith("/dashboard/settings") ? "page" : undefined}
            className="cx-focus flex min-h-11 items-center gap-3 rounded-cx px-3 text-[15px] text-cx-ink-2 hover:bg-cx-sunken"
          >
            <Settings className="h-[18px] w-[18px]" aria-hidden />
            Settings
          </Link>
          <button
            type="button"
            onClick={openSupportChat}
            className="cx-focus flex min-h-11 w-full items-center gap-3 rounded-cx px-3 text-[15px] text-cx-ink-2 hover:bg-cx-sunken"
          >
            <LifeBuoy className="h-[18px] w-[18px]" aria-hidden />
            Get help
            {unread > 0 ? (
              <span className="ml-auto rounded-full bg-cx-brand px-2 py-0.5 text-xs font-semibold text-white">{unread}</span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="cx-focus flex min-h-11 w-full items-center gap-3 rounded-cx px-3 text-[15px] text-cx-ink-2 hover:bg-cx-red-soft hover:text-cx-red"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden />
            Sign out
          </button>
          <div className="mt-2 flex items-center gap-3 rounded-cx bg-cx-sunken px-3 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cx-brand text-sm font-semibold text-white">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-cx-ink">{user?.name || "Your account"}</p>
              <p className="truncate text-[13px] text-cx-muted">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-cx-line bg-cx-surface/95 px-4 backdrop-blur md:hidden">
        <Link href="/dashboard" className="cx-focus inline-flex items-center gap-2 rounded-cx">
          <img src="/logo.png" alt="" className="h-7 w-auto object-contain" />
          <span className="font-display text-lg text-cx-ink">Vehiculars</span>
        </Link>
        <button
          type="button"
          onClick={openSupportChat}
          aria-label={unread > 0 ? `Get help, ${unread} unread messages` : "Get help"}
          className="cx-focus relative flex h-11 w-11 items-center justify-center rounded-cx text-cx-ink-2 hover:bg-cx-sunken"
        >
          <LifeBuoy className="h-5 w-5" aria-hidden />
          {unread > 0 ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-cx-brand ring-2 ring-cx-surface" /> : null}
        </button>
      </header>

      {/* ── Page content ────────────────────────────────────────────── */}
      <div className="md:pl-64">
        <main className="cx-scroll-pad mx-auto w-full max-w-5xl px-4 pt-5 sm:px-6 md:px-10 md:pt-10">{children}</main>
      </div>

      {/* ── Mobile bottom tab bar ───────────────────────────────────── */}
      <nav
        aria-label="Main"
        className="cx-safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-cx-line bg-cx-surface/95 backdrop-blur md:hidden"
      >
        <ul className="grid h-16 grid-cols-5">
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            const Icon = tab.icon;
            const showDot = tab.label === "Account" && unread > 0;
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`cx-focus relative flex h-full flex-col items-center justify-center gap-1 text-xs ${
                    active ? "font-semibold text-cx-brand-deep" : "text-cx-muted"
                  }`}
                >
                  {active ? <span className="absolute top-0 h-0.5 w-8 rounded-full bg-cx-brand" aria-hidden /> : null}
                  <Icon className="h-[22px] w-[22px]" aria-hidden />
                  {tab.label}
                  {showDot ? <span className="absolute right-[30%] top-2.5 h-2 w-2 rounded-full bg-cx-brand" aria-hidden /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <ChatWidget />
    </div>
  );
}
