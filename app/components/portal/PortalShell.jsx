"use client";

// Shared shell for the internal portals (admin, staff): a light sidebar that
// is always visible on desktop (collapsible to icons) and slides in from the
// left on phones and tablets. Auth stays in each portal's layout.

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";

const cx = (...parts) => parts.filter(Boolean).join(" ");

function initialsOf(name) {
  return name ? name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "?";
}

function NavList({ nav, isActive, collapsed, onNavigate, label }) {
  return (
    <nav aria-label={label} className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
      {nav.map((group) => (
        <div key={group.section}>
          {collapsed ? (
            <div className="mx-3 mb-2 border-t border-cx-line" aria-hidden />
          ) : (
            <p className="mb-1 px-3 text-[13px] font-semibold text-cx-muted">{group.section}</p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
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

function UserFooter({ user, collapsed, onLogout, fallbackName }) {
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
          <p className="truncate text-sm font-semibold text-cx-ink">{user?.name || fallbackName}</p>
          <p className="truncate text-[13px] text-cx-muted">{user?.email}</p>
        </div>
        {signOut}
      </div>
    </div>
  );
}

function Brand({ href, subtitle, collapsed }) {
  return (
    <Link href={href} className={cx("cx-focus inline-flex items-center gap-2.5 rounded-cx", collapsed && "justify-center")}>
      <img src="/logo.png" alt="" className="h-8 w-auto object-contain" />
      {collapsed ? (
        <span className="sr-only">Vehiculars {subtitle}</span>
      ) : (
        <span>
          <span className="block font-display text-xl leading-none text-cx-ink">Vehiculars</span>
          <span className="mt-1 block text-xs font-semibold text-cx-brand-deep">{subtitle}</span>
        </span>
      )}
    </Link>
  );
}

/**
 * nav: [{ section, items: [{ label, href, icon }] }]
 * homeHref: the portal's root (matched exactly; other items match by prefix)
 */
export default function PortalShell({ nav, homeHref, subtitle, user, onLogout, collapseKey, fallbackName = "Signed in", children }) {
  const pathname = usePathname() || homeHref;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(collapseKey) === "1");
    } catch {
      /* storage unavailable */
    }
  }, [collapseKey]);

  const toggleCollapsed = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(collapseKey, c ? "0" : "1");
      } catch {
        /* storage unavailable */
      }
      return !c;
    });

  // Close the drawer whenever the route changes.
  useEffect(() => setDrawerOpen(false), [pathname]);

  const isActive = (href) => (href === homeHref ? pathname === homeHref : pathname === href || pathname.startsWith(`${href}/`));
  const current = nav
    .flatMap((g) => g.items)
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => isActive(i.href));

  return (
    <div className="cx-root min-h-dvh bg-cx-paper text-cx-ink selection:bg-cx-brand/20">
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-cx-line bg-cx-surface transition-[width] duration-200 lg:flex",
          collapsed ? "w-[76px]" : "w-64"
        )}
      >
        <div className={cx("flex items-center gap-2 pb-3 pt-5", collapsed ? "flex-col px-2" : "justify-between pl-5 pr-3")}>
          <Brand href={homeHref} subtitle={subtitle} collapsed={collapsed} />
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
        <NavList nav={nav} isActive={isActive} collapsed={collapsed} label={subtitle} />
        <UserFooter user={user} collapsed={collapsed} onLogout={onLogout} fallbackName={fallbackName} />
      </aside>

      <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-cx-ink/50 lg:hidden" />
          <Dialog.Content className="cx-root fixed inset-y-0 left-0 z-[61] flex w-[min(85vw,300px)] flex-col bg-cx-surface shadow-cx-raised outline-none lg:hidden">
            <Dialog.Title className="sr-only">{subtitle} menu</Dialog.Title>
            <Dialog.Description className="sr-only">Navigate the {subtitle.toLowerCase()} portal</Dialog.Description>
            <div className="flex items-center justify-between px-5 pb-3 pt-5">
              <Brand href={homeHref} subtitle={subtitle} />
              <Dialog.Close asChild>
                <button type="button" aria-label="Close menu" className="cx-focus -mr-2 flex h-11 w-11 items-center justify-center rounded-cx text-cx-ink-2 hover:bg-cx-sunken">
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </Dialog.Close>
            </div>
            <NavList nav={nav} isActive={isActive} onNavigate={() => setDrawerOpen(false)} label={subtitle} />
            <div className="cx-safe-bottom">
              <UserFooter user={user} onLogout={onLogout} fallbackName={fallbackName} />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

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
            <span className="hidden sm:inline">{subtitle}</span>
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

export function PortalLoading({ label = "Signing you in…" }) {
  return (
    <div className="cx-root flex min-h-dvh flex-col items-center justify-center gap-3 bg-cx-paper" role="status">
      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-cx-brand-soft border-t-cx-brand" />
      <p className="text-sm text-cx-muted">{label}</p>
    </div>
  );
}
