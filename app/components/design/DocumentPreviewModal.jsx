"use client";

import { useEffect } from "react";
import { X, ExternalLink, Download } from "lucide-react";

export default function DocumentPreviewModal({ isOpen, onClose, fileUrl }) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !fileUrl) return null;

  const lowerUrl = fileUrl.toLowerCase();
  const isPdf = lowerUrl.includes(".pdf");
  const isVideo = [".mp4", ".mov", ".webm", ".m4v"].some((ext) => lowerUrl.includes(ext));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm sm:p-6 lg:p-8">
      <div className="relative flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3 sm:px-6">
          <h3 className="text-sm font-semibold text-slate-800">Document Preview</h3>
          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
              title="Open in new tab / Download"
            >
              <Download className="h-4 w-4" />
            </a>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-slate-100/50 p-4 sm:p-6">
          <div className="mx-auto flex h-full w-full items-center justify-center">
            {isPdf ? (
              <iframe
                src={fileUrl}
                title="Document Viewer"
                className="h-full w-full rounded-xl border border-slate-200 bg-white shadow-sm"
              />
            ) : isVideo ? (
              <video
                src={fileUrl}
                controls
                className="max-h-full max-w-full rounded-xl border border-slate-200 bg-black shadow-sm"
              />
            ) : (
              <img
                src={fileUrl}
                alt="Document Preview"
                className="max-h-full max-w-full rounded-xl border border-slate-200 bg-white object-contain shadow-sm"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
