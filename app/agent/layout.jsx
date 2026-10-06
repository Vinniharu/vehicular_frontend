"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Inbox, KeyRound, LogOut, UserRound, Wallet } from "lucide-react";
import { authGetMe, authSetPassword, getCachedUser, getToken, removeToken, setCachedUser } from "@/lib/api";
import { useAutoLogout } from "@/lib/hooks/useAutoLogout";
import { Button, Field, Input, Notice } from "@/app/dashboard/_kit";

const isJobPath = (p) => p.startsWith("/agent/applications") || p.startsWith("/agent/rwx") || p.startsWith("/agent/particulars");

const TABS = [
  { label: "Jobs", long: "My jobs", href: "/agent/applications", icon: ClipboardList, match: isJobPath },
  { label: "Offers", long: "Job offers", href: "/agent", icon: Inbox, match: (p) => p === "/agent" || p.startsWith("/agent/particulars-offers") },
  { label: "Wallet", long: "Earnings wallet", href: "/agent/wallet", icon: Wallet, match: (p) => ["/agent/wallet", "/agent/bank-account", "/agent/transfers"].some((x) => p.startsWith(x)) },
  { label: "Account", long: "Account & settings", href: "/agent/settings", icon: UserRound, match: (p) => p.startsWith("/agent/settings") },
];

function initialsOf(name) {
  return name ? name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "AG";
}

function PasswordGate({ user, onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError("Use at least 6 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setSaving(true);
    const res = await authSetPassword({ new_password: password });
    setSaving(false);
    if (res.error) return setError(res.error);
    const updated = { ...user, must_change_password: false };
    setCachedUser(updated);
    onDone(updated);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-cx-ink/50 md:items-center md:p-6" role="dialog" aria-modal="true" aria-labelledby="pw-title">
      <form onSubmit={submit} className="cx-safe-bottom w-full space-y-4 rounded-t-[22px] bg-cx-surface p-5 shadow-cx-raised md:max-w-md md:rounded-cx-lg">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cx-amber-soft text-cx-amber">
            <KeyRound className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 id="pw-title" className="text-lg font-semibold text-cx-ink">Set your own password</h2>
            <p className="mt-0.5 text-sm text-cx-muted">Your account was set up with a temporary password. Choose a new one to continue.</p>
          </div>
        </div>
        {error ? <Notice tone="red">{error}</Notice> : null}
        <Field label="New password" hint="At least 6 characters">
          {(p) => <Input {...p} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />}
        </Field>
        <Field label="Type it again">
          {(p) => <Input {...p} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />}
        </Field>
        <Button type="submit" size="lg" block loading={saving}>
          {saving ? "Saving…" : "Save password"}
        </Button>
      </form>
    </div>
  );
}

export default function AgentLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname() || "/agent";
  const isLoginRoute = pathname === "/agent/login";
  useAutoLogout();
  const [user, setUser] = useState(() => getCachedUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // The login page manages its own auth state.
    if (isLoginRoute) return;

    const token = getToken();
    if (!token) {
      router.push("/agent/login");
      return;
    }

    const cached = getCachedUser();
    if (cached) {
      if (cached.role !== "agent") {
        router.push("/agent/login");
        return;
      }
      setUser(cached);
      setLoading(false);
    }

    authGetMe().then((res) => {
      if (res.error && res.status === 401) {
        removeToken();
        router.push("/agent/login");
      } else if (res.data) {
        if (res.data.role !== "agent") {
          router.push("/agent/login");
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
    router.push("/agent/login");
  };

  if (isLoginRoute) return children;

  if (loading) {
    return (
      <div className="cx-root flex min-h-dvh flex-col items-center justify-center gap-3 bg-cx-paper" role="status">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-cx-brand-soft border-t-cx-brand" />
        <p className="text-sm text-cx-muted">Signing you in…</p>
      </div>
    );
  }

  const initials = initialsOf(user?.name);

  return (
    <div className="cx-root min-h-dvh bg-cx-paper text-cx-ink selection:bg-cx-brand/20">
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-cx-line bg-cx-surface md:flex">
        <div className="px-5 pb-4 pt-6">
          <Link href="/agent/applications" className="cx-focus inline-flex items-center gap-2.5 rounded-cx">
            <img src="/logo.png" alt="" className="h-8 w-auto object-contain" />
            <span>
              <span className="block font-display text-xl leading-none text-cx-ink">Vehiculars</span>
              <span className="mt-1 block text-xs font-semibold text-cx-brand-deep">Agent portal</span>
            </span>
          </Link>
        </div>

        <nav aria-label="Main" className="flex-1 space-y-0.5 overflow-y-auto px-3">
          {TABS.map((item) => {
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
                {item.long}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-0.5 border-t border-cx-line px-3 py-3">
          <button
            type="button"
            onClick={handleLogout}
            className="cx-focus flex min-h-11 w-full items-center gap-3 rounded-cx px-3 text-[15px] text-cx-ink-2 hover:bg-cx-red-soft hover:text-cx-red"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden />
            Sign out
          </button>
          <div className="mt-2 flex items-center gap-3 rounded-cx bg-cx-sunken px-3 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cx-brand text-sm font-semibold text-white">{initials}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-cx-ink">{user?.name || "Agent"}</p>
              <p className="truncate text-[13px] text-cx-muted">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-cx-line bg-cx-surface/95 px-4 backdrop-blur md:hidden">
        <Link href="/agent/applications" className="cx-focus inline-flex items-center gap-2 rounded-cx">
          <img src="/logo.png" alt="" className="h-7 w-auto object-contain" />
          <span className="font-display text-lg text-cx-ink">Vehiculars</span>
          <span className="rounded-full bg-cx-brand-soft px-2 py-0.5 text-xs font-semibold text-cx-brand-deep">Agent</span>
        </Link>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cx-brand text-[13px] font-semibold text-white" aria-hidden>
          {initials}
        </span>
      </header>

      {/* ── Page content ────────────────────────────────────────────── */}
      <div className="md:pl-64">
        <main className="cx-scroll-pad mx-auto w-full max-w-5xl px-4 pt-5 sm:px-6 md:px-10 md:pt-10">{children}</main>
      </div>

      {/* ── Mobile bottom tab bar ───────────────────────────────────── */}
      <nav aria-label="Main" className="cx-safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-cx-line bg-cx-surface/95 backdrop-blur md:hidden">
        <ul className="grid h-16 grid-cols-4">
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            const Icon = tab.icon;
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
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {user?.must_change_password ? <PasswordGate user={user} onDone={setUser} /> : null}
    </div>
  );
}
