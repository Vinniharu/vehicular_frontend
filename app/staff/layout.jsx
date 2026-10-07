"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, MapPin, Settings, ShieldCheck, Timer } from "lucide-react";
import { authGetMe, getCachedUser, getToken, removeToken } from "@/lib/api";
import { useAutoLogout } from "@/lib/hooks/useAutoLogout";
import PortalShell, { PortalLoading } from "@/app/components/portal/PortalShell";
import PasswordGate from "@/app/components/portal/PasswordGate";

const STAFF_NAV = [
  { section: "Overview", items: [{ label: "Dashboard", href: "/staff", icon: LayoutDashboard }] },
  {
    section: "Applications",
    items: [
      { label: "Review queue", href: "/staff/applications", icon: ShieldCheck },
      { label: "SLA countdown", href: "/staff/countdown", icon: Timer },
      { label: "RWX day queue", href: "/staff/rwx/queue", icon: MapPin },
    ],
  },
  { section: "Account", items: [{ label: "Settings", href: "/staff/settings", icon: Settings }] },
];

const ALLOWED = ["staff", "admin"];

export default function StaffLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname() || "/staff";
  const isLoginRoute = pathname === "/staff/login";
  useAutoLogout();
  const [user, setUser] = useState(() => getCachedUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // The login page manages its own auth state (see app/admin/layout.jsx).
    if (isLoginRoute) return;

    const token = getToken();
    if (!token) {
      router.push("/staff/login");
      return;
    }

    const cached = getCachedUser();
    if (cached) {
      if (!ALLOWED.includes(cached.role)) {
        router.push("/staff/login");
        return;
      }
      setUser(cached);
      setLoading(false);
    }

    authGetMe().then((res) => {
      if (res.error && res.status === 401) {
        removeToken();
        router.push("/staff/login");
      } else if (res.data) {
        if (!ALLOWED.includes(res.data.role)) {
          router.push("/staff/login");
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
    router.push("/staff/login");
  };

  if (isLoginRoute) return children;
  if (loading) return <PortalLoading />;

  return (
    <PortalShell
      nav={STAFF_NAV}
      homeHref="/staff"
      subtitle="Staff"
      user={user}
      onLogout={handleLogout}
      collapseKey="vh_staff_sidebar_collapsed"
      fallbackName="Staff member"
    >
      {children}
      {user?.must_change_password ? <PasswordGate user={user} onDone={setUser} minLength={8} /> : null}
    </PortalShell>
  );
}
