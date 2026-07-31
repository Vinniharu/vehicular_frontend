import { statusMeta, TONE_CLASSES, TONE_DOT } from "./status-config";

// Replaces the three near-identical status badge/pill components previously
// duplicated in dashboard/page.jsx (StatusPill), apply/page.jsx (StatusBadge),
// and apply/[id]/page.jsx (StatusBadge).
export default function StatusBadge({ status, size = "md" }) {
  const meta = statusMeta(status);
  const pad = size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-[12px]";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset ${pad} ${TONE_CLASSES[meta.tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${TONE_DOT[meta.tone]}`} />
      {meta.label}
    </span>
  );
}
