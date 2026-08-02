"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { resolveMediaUrl } from "@/lib/api/core/client";
import DocumentPreviewModal from "./DocumentPreviewModal";

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp)$/i;

export default function ChatBubble({ message, isOwn }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const attachmentUrl = message.attachment_url ? resolveMediaUrl(message.attachment_url) : null;
  const isImage = attachmentUrl && IMAGE_EXT.test(attachmentUrl);

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug ${
          isOwn ? "bg-[#28A745] text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm"
        }`}
      >
        {attachmentUrl &&
          (isImage ? (
            <button type="button" onClick={() => setPreviewOpen(true)} className="mb-1.5 block">
              <img
                src={attachmentUrl}
                alt="Attachment"
                className="max-h-40 rounded-lg border border-black/5 object-cover"
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className={`mb-1.5 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold ${
                isOwn ? "bg-white/15 text-white" : "border border-slate-200 bg-white text-slate-700"
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> Document
            </button>
          ))}
        {message.body && <p className="whitespace-pre-wrap">{message.body}</p>}
        <p className={`mt-1 text-[10px] ${isOwn ? "text-white/70" : "text-slate-400"}`}>
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
