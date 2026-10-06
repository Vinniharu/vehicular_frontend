"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FileText, Mail, Phone, UserCheck } from "lucide-react";
import { getSupportTicket, getSupportTicketMessages } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/api/core/client";
import DocumentPreviewModal from "@/app/components/design/DocumentPreviewModal";
import { Badge, Card, ErrorState, PageHeader, Skeleton } from "@/app/dashboard/_kit";

const cx = (...parts) => parts.filter(Boolean).join(" ");
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp)$/i;

function StatusBadge({ status }) {
  return (
    <Badge tone={status === "closed" ? "neutral" : "brand"} className="capitalize">
      {status}
    </Badge>
  );
}

// Same content as the shared ChatBubble (text, attachment preview, time),
// drawn with cx tokens. Support messages sit on the right.
function MessageBubble({ message, isOwn }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const attachmentUrl = message.attachment_url ? resolveMediaUrl(message.attachment_url) : null;
  const isImage = attachmentUrl && IMAGE_EXT.test(attachmentUrl);

  return (
    <div className={cx("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cx(
          "max-w-[85%] rounded-cx-lg px-3.5 py-2.5 text-[15px] leading-snug sm:max-w-[75%]",
          isOwn ? "rounded-br-cx-sm bg-cx-brand-soft text-cx-ink" : "rounded-bl-cx-sm border border-cx-line bg-cx-surface text-cx-ink"
        )}
      >
        {attachmentUrl &&
          (isImage ? (
            <button type="button" onClick={() => setPreviewOpen(true)} className="cx-focus mb-1.5 block rounded-cx">
              <img src={attachmentUrl} alt="Attachment" className="max-h-40 rounded-cx border border-cx-line object-cover" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="cx-focus mb-1.5 inline-flex min-h-11 items-center gap-1.5 rounded-cx border border-cx-line bg-cx-surface px-3 text-sm font-medium text-cx-ink-2"
            >
              <FileText className="h-4 w-4" aria-hidden /> Document
            </button>
          ))}
        {message.body && <p className="whitespace-pre-wrap break-words">{message.body}</p>}
        <p className="mt-1 text-[13px] text-cx-muted">
          {message.created_at
            ? new Date(message.created_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })
            : ""}
        </p>
      </div>
      {attachmentUrl && (
        <DocumentPreviewModal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} fileUrl={attachmentUrl} />
      )}
    </div>
  );
}

export default function AdminTicketThreadPage() {
  const params = useParams();
  const ticketId = params.id;

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const [ticketRes, messagesRes] = await Promise.all([
        getSupportTicket(ticketId),
        getSupportTicketMessages(ticketId),
      ]);
      if (ticketRes.error) {
        setError(ticketRes.error);
      } else {
        setTicket(ticketRes.data);
        if (messagesRes.data) setMessages(messagesRes.data.items || []);
      }
      setLoading(false);
    })();
  }, [ticketId]);

  if (loading) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading ticket">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full rounded-cx-lg" />
        <Skeleton className="h-72 w-full rounded-cx-lg" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div>
        <PageHeader title="Ticket" backHref="/admin/tickets" backLabel="Back to tickets" />
        <ErrorState title="Couldn't open this ticket" message={error || "Ticket not found."} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title={<span className="break-words">{ticket.subject}</span>} backHref="/admin/tickets" backLabel="Back to tickets" />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <Link
              href={`/support/customers/${ticket.customer_id}`}
              className="cx-focus inline-flex min-h-11 items-center rounded-cx-sm text-[15px] font-semibold text-cx-ink hover:underline"
            >
              {ticket.customer_name}
            </Link>
            <p className="flex min-w-0 items-center gap-1.5 text-sm text-cx-ink-2">
              <Mail className="h-4 w-4 shrink-0 text-cx-muted" aria-hidden />
              <span className="break-all">{ticket.customer_email}</span>
            </p>
            {ticket.customer_phone && (
              <p className="flex items-center gap-1.5 text-sm text-cx-ink-2">
                <Phone className="h-4 w-4 shrink-0 text-cx-muted" aria-hidden /> {ticket.customer_phone}
              </p>
            )}
            {ticket.application_id && (
              <p className="text-sm text-cx-muted">
                Re:{" "}
                <Link
                  href={`/support/applications/${ticket.application_id}`}
                  className="cx-focus inline-flex min-h-11 items-center rounded-cx-sm font-semibold text-cx-brand-deep hover:underline"
                >
                  Application #{ticket.application_id}
                </Link>
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            <Badge tone={ticket.claimed_by_name ? "neutral" : "amber"}>
              <UserCheck className="h-3.5 w-3.5" aria-hidden />
              {ticket.claimed_by_name || "Unclaimed"}
            </Badge>
          </div>
        </div>
      </Card>

      <Card padded={false} className="overflow-hidden">
        <div className="max-h-[65dvh] min-h-[240px] space-y-3 overflow-y-auto bg-cx-sunken/50 p-4 sm:p-5">
          {messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-cx-muted">No messages yet.</p>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} isOwn={m.sender_role === "support"} />)
          )}
        </div>
        <div className="border-t border-cx-line p-4">
          <p className="text-center text-[13px] text-cx-muted">Read-only. Replying stays a support-agent action.</p>
        </div>
      </Card>
    </div>
  );
}
