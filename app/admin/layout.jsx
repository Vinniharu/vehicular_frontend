"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Camera,
  ClipboardList,
  Clock,
  HandCoins,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  Send,
  Settings,
  Tag,
  Timer,
  Users,
  Wallet,
} from "lucide-react";
import { authGetMe, getCachedUser, getToken, removeToken } from "@/lib/api";
import { useAutoLogout } from "@/lib/hooks/useAutoLogout";
import PortalShell, { PortalLoading } from "@/app/components/portal/PortalShell";

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

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname() || "/admin";
  const isLoginRoute = pathname === "/admin/login";
  useAutoLogout();
  const [user, setUser] = useState(() => getCachedUser());
  const [loading, setLoading] = useState(true);

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
  if (loading) return <PortalLoading />;

  return (
    <PortalShell
      nav={ADMIN_NAV}
      homeHref="/admin"
      subtitle="Administration"
      user={user}
      onLogout={handleLogout}
      collapseKey="vh_admin_sidebar_collapsed"
      fallbackName="Administrator"
    >
      {children}
    </PortalShell>
  );
}
