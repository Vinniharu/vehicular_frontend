"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertTriangle,
  Camera,
  ClipboardList,
  Clock,
  HandCoins,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  Settings,
  Tag,
  Timer,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { authGetMe, getCachedUser, getToken, removeToken } from "@/lib/api";
import { useAutoLogout } from "@/lib/hooks/useAutoLogout";

const cx = (...parts) => parts.filter(Boolean).join(" ");

const ADMIN_NAV = [
  { section: "Overview", items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }] },
  {
    section: "Operations",
    items: [
      { label: "Applications", href: "/admin/applications", icon: ClipboardList },
      { label: "SLA countdown", href: "/admin/countdown", icon: Timer },
      { label: "Deadlines & SLA", href: "/admin/deadlines", icon: Clock },
      { label: "Tickets", href: "/admin/tickets", icon: MessageCircle },
      { label: "Inspection bays", href: "/admin/rwx/bays", icon: MapPin },
      { label: "PCI reference photos", href: "/admin/pci-reference-images", icon: Camera },
      { label: "Activity log", href: "/admin/activity-log", icon: AlertTriangle },
    ],
  },
  { section: "People", items: [{ label: "Staff & agents", href: "/admin/people", icon: Users }] },
  {
    section: "Finance",
    items: [
      { label: "Revenue", href: "/admin/revenue", icon: Wallet },
      { label: "Disbursements", href: "/admin/disbursements", icon: Send },
      { label: "Pricing", href: "/admin/pricing", icon: Tag },
      { label: "Agent pay", href: "/admin/compensation", icon: HandCoins },
    ],
  },
  { section: "Account", items: [{ label: "Settings", href: "/admin/settings", icon: Settings }] },
];

const ALL_ITEMS = ADMIN_NAV.flatMap((g) => g.items);
const isActive = (pathname, href) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));
const COLLAPSE_KEY = "vh_admin_sidebar_collapsed";

function initialsOf(name) {
  return name ? name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "AD";
}

function NavList({ pathname, collapsed, onNavigate }) {
  return (
    <nav aria-label="Admin" className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
      {ADMIN_NAV.map((group) => (
        <div key={group.section}>
          {collapsed ? (
            <div className="mx-3 mb-2 border-t border-cx-line" aria-hidden />
          ) : (
            <p className="mb-1 px-3 text-[13px] font-semibold text-cx-muted">{group.section}</p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={cx(
                      "cx-focus flex min-h-11 items-center gap-3 rounded-cx px-3 text-[15px] transition-colors lg:min-h-10",
                      collapsed && "justify-center px-0",
                      active ? "bg-cx-brand-soft font-semibold text-cx-brand-deep" : "text-cx-ink-2 hover:bg-cx-sunken"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                    {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function UserFooter({ user, collapsed, onLogout }) {
  const signOut = (
    <button
      type="button"
      onClick={onLogout}
      aria-label="Sign out"
      title="Sign out"
      className="cx-focus flex h-10 w-10 shrink-0 items-center justify-center rounded-cx text-cx-ink-2 hover:bg-cx-red-soft hover:text-cx-red"
    >
      <LogOut className="h-[18px] w-[18px]" aria-hidden />
    </button>
  );
  if (collapsed) return <div className="flex justify-center border-t border-cx-line py-3">{signOut}</div>;
  return (
    <div className="border-t border-cx-line px-3 py-3">
      <div className="flex items-center gap-3 rounded-cx bg-cx-sunken py-2 pl-3 pr-1">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cx-brand text-sm font-semibold text-white">{initialsOf(user?.name)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-cx-ink">{user?.name || "Administrator"}</p>
          <p className="truncate text-[13px] text-cx-muted">{user?.email}</p>
        </div>
        {signOut}
      </div>
    </div>
  );
}

function Brand({ collapsed }) {
  return (
    <Link href="/admin" className={cx("cx-focus inline-flex items-center gap-2.5 rounded-cx", collapsed && "justify-center")}>
      <img src="/logo.png" alt="" className="h-8 w-auto object-contain" />
      {collapsed ? (
        <span className="sr-only">Vehiculars admin</span>
      ) : (
        <span>
          <span className="block font-display text-xl leading-none text-cx-ink">Vehiculars</span>
          <span className="mt-1 block text-xs font-semibold text-cx-brand-deep">Administration</span>
        </span>
      )}
    </Link>
  );
}

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname() || "/admin";
  const isLoginRoute = pathname === "/admin/login";
  useAutoLogout();
  const [user, setUser] = useState(() => getCachedUser());
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {
        /* storage unavailable */
      }
      return !c;
    });
  };

  // Close the drawer whenever the route changes.
  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    // The login page manages its own auth state; running this guard there
    // would leave the spinner stuck (it pushes to the page we're already on).
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

  // No shell on the login route, so stale layout state can't wrap the form.
  if (isLoginRoute) return children;

  if (loading) {
    return (
      <div className="cx-root flex min-h-dvh flex-col items-center justify-center gap-3 bg-cx-paper" role="status">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-cx-brand-soft border-t-cx-brand" />
        <p className="text-sm text-cx-muted">Signing you in…</p>
      </div>
    );
  }

  const current = [...ALL_ITEMS].sort((a, b) => b.href.length - a.href.length).find((i) => isActive(pathname, i.href));

  return (
    <div className="cx-root min-h-dvh bg-cx-paper text-cx-ink selection:bg-cx-brand/20">
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-cx-line bg-cx-surface transition-[width] duration-200 lg:flex",
          collapsed ? "w-[76px]" : "w-64"
        )}
      >
        <div className={cx("flex items-center gap-2 pb-3 pt-5", collapsed ? "flex-col px-2" : "justify-between pl-5 pr-3")}>
          <Brand collapsed={collapsed} />
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="cx-focus flex h-10 w-10 items-center justify-center rounded-cx text-cx-muted hover:bg-cx-sunken hover:text-cx-ink"
          >
            {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" aria-hidden /> : <PanelLeftClose className="h-[18px] w-[18px]" aria-hidden />}
          </button>
        </div>
        <NavList pathname={pathname} collapsed={collapsed} />
        <UserFooter user={user} collapsed={collapsed} onLogout={handleLogout} />
      </aside>

      {/* ── Phone / tablet drawer ───────────────────────────────────── */}
      <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-cx-ink/50 lg:hidden" />
          <Dialog.Content className="cx-root fixed inset-y-0 left-0 z-[61] flex w-[min(85vw,300px)] flex-col bg-cx-surface shadow-cx-raised outline-none lg:hidden">
            <Dialog.Title className="sr-only">Admin menu</Dialog.Title>
            <Dialog.Description className="sr-only">Navigate the admin portal</Dialog.Description>
            <div className="flex items-center justify-between px-5 pb-3 pt-5">
              <Brand />
              <Dialog.Close asChild>
                <button type="button" aria-label="Close menu" className="cx-focus -mr-2 flex h-11 w-11 items-center justify-center rounded-cx text-cx-ink-2 hover:bg-cx-sunken">
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </Dialog.Close>
            </div>
            <NavList pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
            <div className="cx-safe-bottom">
              <UserFooter user={user} onLogout={handleLogout} />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Main column ─────────────────────────────────────────────── */}
      <div className={cx("transition-[padding] duration-200", collapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-cx-line bg-cx-surface/95 px-4 backdrop-blur sm:px-6 lg:h-16 lg:px-10">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="cx-focus -ml-2 flex h-11 w-11 items-center justify-center rounded-cx text-cx-ink-2 hover:bg-cx-sunken lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <p className="min-w-0 flex-1 truncate text-[15px] text-cx-muted">
            <span className="hidden sm:inline">Administration</span>
            {current ? (
              <>
                <span className="hidden sm:inline"> / </span>
                <span className="font-semibold text-cx-ink">{current.label}</span>
              </>
            ) : null}
          </p>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cx-brand text-[13px] font-semibold text-white" title={user?.name} aria-hidden>
            {initialsOf(user?.name)}
          </span>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-5 sm:px-6 md:pt-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
