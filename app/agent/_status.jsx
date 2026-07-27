/**
 * Shared status metadata for the agent portal — single source of truth for
 * the status label/tone dictionary and the StatusBadge it renders, used by
 * both the jobs list (`applications/page.jsx`) and the detail page
 * (`applications/[id]/page.jsx`), which previously each hand-carried their
 * own copy of this exact dictionary.
 */
export const AGENT_STATUS = {
  agent_assigned: { label: "Assigned", tone: "info" },
  agent_accepted: { label: "Accepted — schedule capture", tone: "warning" },
  capture_scheduled: { label: "Capture scheduled", tone: "indigo" },
  capturing_scheduled: { label: "Capture scheduled", tone: "indigo" },
  captured: { label: "Captured — upload proof", tone: "teal" },
  capturing_completed: { label: "Captured — upload proof", tone: "teal" },
  needs_correction: { label: "Needs customer correction", tone: "warning" },
  temp_licence_pending_review: { label: "Temp licence — awaiting staff review", tone: "warning" },
  temp_licence_issued: { label: "Temp licence issued", tone: "indigo" },
  agent_completed: { label: "Permanent card uploaded", tone: "success" },
  staff_final_review: { label: "In staff final review", tone: "warning" },
  ready_for_pickup: { label: "Ready for pickup", tone: "indigo" },
  awaiting_customer: { label: "Awaiting customer confirmation", tone: "success" },
  completed: { label: "Completed", tone: "success" },
  expired: { label: "Licence expired", tone: "danger" },
};

export const TONE_CLASSES = {
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  teal: "bg-teal-50 text-teal-700 ring-teal-200",
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
};

export const TONE_DOT = {
  info: "bg-sky-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  success: "bg-emerald-500",
  indigo: "bg-indigo-500",
  teal: "bg-teal-500",
  neutral: "bg-slate-400",
};

export function statusMeta(status) {
  return AGENT_STATUS[status] || { label: (status || "Unknown").replace(/_/g, " "), tone: "neutral" };
}

const SIZE_CLASSES = {
  sm: "px-2.5 py-1 text-[11.5px]",
  md: "px-3 py-1 text-[12px]",
};

export function StatusBadge({ status, size = "md" }) {
  const meta = statusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset ${SIZE_CLASSES[size]} ${TONE_CLASSES[meta.tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[meta.tone]}`} />
      {meta.label}
    </span>
  );
}
