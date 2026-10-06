"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, FileCheck2, Gift, LifeBuoy, LogOut, NotebookPen, Settings } from "lucide-react";
import { getCachedUser, removeToken } from "@/lib/api";
import { Card, PageHeader } from "@/app/dashboard/_kit";
import { SUPPORT_UNREAD_EVENT, openSupportChat } from "@/app/dashboard/_shared/ChatWidget";

const LINKS = [
  { href: "/dashboard/documents", icon: FileCheck2, title: "My documents", body: "Licences, permits and certificates you've been issued" },
  { href: "/dashboard/drafts", icon: NotebookPen, title: "Saved drafts", body: "Pick up an application where you left off" },
  { href: "/dashboard/refer", icon: Gift, title: "Refer & earn", body: "Share your link and earn when friends sign up" },
  { href: "/dashboard/settings", icon: Settings, title: "Profile & settings", body: "Your details, password and account" },
];

function Row({ icon: Icon, title, body, trailing, ...props }) {
  const Tag = props.href ? Link : "button";
  return (
    <Tag
      {...(props.href ? {} : { type: "button" })}
      {...props}
      className="cx-focus flex min-h-16 w-full items-center gap-3.5 px-4 py-3 text-left transition-colors hover:bg-cx-sunken"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-cx bg-cx-brand-soft text-cx-brand-deep">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-cx-ink">{title}</span>
        {body ? <span className="block text-[13px] text-cx-muted">{body}</span> : null}
      </span>
      {trailing ?? <ChevronRight className="h-5 w-5 shrink-0 text-cx-muted" aria-hidden />}
    </Tag>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    setUser(getCachedUser());
    const onUnread = (e) => setUnread(Number(e.detail) || 0);
    window.addEventListener(SUPPORT_UNREAD_EVENT, onUnread);
    return () => window.removeEventListener(SUPPORT_UNREAD_EVENT, onUnread);
  }, []);

  const signOut = () => {
    removeToken();
    router.push("/auth/login");
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Account" />

      <Card className="mb-4 flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cx-brand text-base font-semibold text-white">
          {(user?.name || "U").split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-cx-ink">{user?.name || "Your account"}</p>
          <p className="truncate text-sm text-cx-muted">{user?.email}</p>
        </div>
      </Card>

      <Card padded={false} className="divide-y divide-cx-line overflow-hidden">
        {LINKS.map((link) => (
          <Row key={link.href} {...link} />
        ))}
      </Card>

      <Card padded={false} className="mt-4 divide-y divide-cx-line overflow-hidden">
        <Row
          icon={LifeBuoy}
          title="Get help"
          body="Chat with our support team"
          onClick={openSupportChat}
          trailing={
            unread > 0 ? (
              <span className="rounded-full bg-cx-brand px-2 py-0.5 text-xs font-semibold text-white">{unread} new</span>
            ) : undefined
          }
        />
        <button
          type="button"
          onClick={signOut}
          className="cx-focus flex min-h-14 w-full items-center gap-3.5 px-4 text-left text-[15px] font-medium text-cx-red hover:bg-cx-red-soft"
        >
          <span className="flex h-10 w-10 items-center justify-center">
            <LogOut className="h-5 w-5" aria-hidden />
          </span>
          Sign out
        </button>
      </Card>

      <p className="mt-6 px-1 text-[13px] leading-relaxed text-cx-muted">
        © Vehiculars {new Date().getFullYear()}. A subsidiary of MIMHEL Engineering and Construction Ltd.
      </p>
    </div>
  );
}
