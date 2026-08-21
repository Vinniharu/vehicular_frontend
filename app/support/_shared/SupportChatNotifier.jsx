"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getSupportTickets, getCachedUser } from "@/lib/api";
import { useToast } from "@/app/components/shared/ToastProvider";

const ACTIVE_POLL_MS = 8000;
const IDLE_POLL_MS = 30000;

function lastSeenKey(userId, ticketId) {
  return `support_ticket_last_seen_${userId}_${ticketId}`;
}

/**
 * Portal-wide "new customer message" signal for the support/admin nav —
 * polls the caller's own open queue independently of whatever page is
 * mounted (mirrors the customer-side ChatWidget's always-on poll), and
 * pushes a toast the first time a ticket flips from read to unread.
 *
 * Unread is computed client-side (no new aggregate backend field): a
 * ticket counts as unread when its last_message_at is newer than this
 * browser's locally-stored "last seen" timestamp for that ticket AND the
 * last message was from the customer — the second check is why
 * last_message_sender_role exists on the ticket, otherwise a support
 * agent's own outgoing reply would flip their own badge on.
 *
 * The ticket detail page (app/support/tickets/[id]/page.jsx) writes its
 * own last-seen key on every successful poll tick while mounted, so by the
 * time this hook's independent poll runs, a ticket the agent is actively
 * viewing already reads as caught up — no cross-component coordination
 * needed beyond that shared localStorage key format.
 */
export function useSupportChatNotifications() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const pushToast = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const documentVisibleRef = useRef(true);
  const prevUnreadIdsRef = useRef(new Set());

  useEffect(() => {
    const track = () => {
      documentVisibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", track);
    return () => document.removeEventListener("visibilitychange", track);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timeoutId;

    const tick = async () => {
      const user = getCachedUser();
      if (user && (user.role === "support" || user.role === "admin")) {
        // No `scope` param — the backend's default (omitted scope) is
        // already "unclaimed + my own claimed tickets", i.e. "my queue".
        // `scope` only accepts "unassigned"/"all" server-side; there is no
        // "mine" literal value.
        const res = await getSupportTickets({ status: "open", page_size: 50 });
        if (!cancelled && res.data) {
          const unreadIds = new Set();
          for (const ticket of res.data.items || []) {
            if (ticket.last_message_sender_role !== "customer" || !ticket.last_message_at) continue;
            const seenRaw = localStorage.getItem(lastSeenKey(user.id, ticket.id));
            const seenAt = seenRaw ? Number(seenRaw) : 0;
            const lastMsgAt = new Date(ticket.last_message_at).getTime();
            if (lastMsgAt > seenAt) {
              unreadIds.add(ticket.id);
              const onThisTicket = pathnameRef.current === `/support/tickets/${ticket.id}`;
              if (!prevUnreadIdsRef.current.has(ticket.id) && !onThisTicket) {
                pushToast({
                  title: "New message",
                  body: ticket.subject,
                  href: `/support/tickets/${ticket.id}`,
                });
              }
            }
          }
          prevUnreadIdsRef.current = unreadIds;
          if (!cancelled) setUnreadCount(unreadIds.size);
        }
      }

      timeoutId = setTimeout(tick, documentVisibleRef.current ? ACTIVE_POLL_MS : IDLE_POLL_MS);
    };

    timeoutId = setTimeout(tick, 0);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return unreadCount;
}
