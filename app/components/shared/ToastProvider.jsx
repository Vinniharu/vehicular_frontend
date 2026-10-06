"use client";

import { createContext, useCallback, useContext, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, MessageCircle, X } from "lucide-react";

const ToastContext = createContext(null);

let toastIdCounter = 0;

/**
 * Portal-wide toast, mounted once at the root layout so any page can call
 * useToast(). push({ title, body, tone, href, onClick }) — tone is
 * "info" (default), "success" or "error". On phones it sits above the
 * customer portal's bottom tab bar.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast) => {
      const id = `toast_${++toastIdCounter}`;
      setToasts((prev) => [...prev, { id, ...toast }].slice(-3));
      setTimeout(() => dismiss(id), toast.tone === "error" ? 9000 : 6000);
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-[calc(80px+env(safe-area-inset-bottom))] z-[100] flex flex-col gap-2.5 sm:inset-x-auto sm:right-6 sm:w-full sm:max-w-sm md:bottom-6"
      >
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

const TONE = {
  info: { icon: MessageCircle, ring: "bg-[#e8f5eb] text-[#1f7a35]" },
  success: { icon: CheckCircle2, ring: "bg-[#e8f5eb] text-[#1f7a35]" },
  error: { icon: AlertCircle, ring: "bg-[#fbf1ee] text-[#b3452f]" },
};

function ToastCard({ toast, onDismiss }) {
  const tone = TONE[toast.tone] || TONE.info;
  const Icon = tone.icon;
  const body = (
    <>
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone.ring}`}>
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        {toast.title && <p className="text-sm font-semibold text-[#14201a]">{toast.title}</p>}
        {toast.body && <p className="mt-0.5 text-[13px] text-[#5b6660]">{toast.body}</p>}
      </div>
    </>
  );

  const wrapperClass = "flex min-w-0 flex-1 items-start gap-3 text-left";
  let main = <div className={wrapperClass}>{body}</div>;
  if (toast.href) {
    main = (
      <Link href={toast.href} onClick={onDismiss} className={wrapperClass}>
        {body}
      </Link>
    );
  } else if (toast.onClick) {
    main = (
      <button
        type="button"
        onClick={() => {
          toast.onClick();
          onDismiss();
        }}
        className={wrapperClass}
      >
        {body}
      </button>
    );
  }

  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className="pointer-events-auto flex items-start gap-2 rounded-[14px] border border-[#e3e7e4] bg-white py-3 pl-4 pr-2 shadow-[0_8px_24px_-8px_rgba(20,32,26,0.25)]"
    >
      {main}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="-my-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[#5b6660] hover:bg-[#eef1ee]"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
