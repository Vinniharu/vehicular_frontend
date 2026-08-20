"use client";

import { createContext, useCallback, useContext, useState } from "react";
import Link from "next/link";
import { MessageCircle, X } from "lucide-react";

const ToastContext = createContext(null);

let toastIdCounter = 0;

/**
 * Portal-wide toast, deliberately scoped to just what chat notifications
 * need (title/body, an optional href or onClick, auto-dismiss) — not a
 * replacement for the ~9 existing per-page hand-rolled toasts elsewhere in
 * the app. Mounted once at the root layout so any page can call useToast()
 * without its own provider.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((toast) => {
    const id = `toast_${++toastIdCounter}`;
    setToasts((prev) => [...prev, { id, ...toast }].slice(-3));
    setTimeout(() => dismiss(id), 6000);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-full max-w-sm flex-col gap-2.5">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx.push;
}

function ToastCard({ toast, onDismiss }) {
  const content = (
    <div className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-xl">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#28A745]/10 text-[#28A745]">
        <MessageCircle className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        {toast.title && <p className="text-[13px] font-bold text-slate-900">{toast.title}</p>}
        {toast.body && <p className="mt-0.5 text-[12.5px] text-slate-600">{toast.body}</p>}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDismiss();
        }}
        className="pointer-events-auto shrink-0 text-slate-400 hover:text-slate-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  if (toast.href) {
    return (
      <Link href={toast.href} onClick={onDismiss} className="pointer-events-auto block">
        {content}
      </Link>
    );
  }
  if (toast.onClick) {
    return (
      <button
        type="button"
        onClick={() => {
          toast.onClick();
          onDismiss();
        }}
        className="pointer-events-auto block w-full text-left"
      >
        {content}
      </button>
    );
  }
  return content;
}
