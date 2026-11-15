import { Clock } from "lucide-react";

const cx = (...parts) => parts.filter(Boolean).join(" ");

const fmtDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
};

/**
 * The application's target date, worked out on the server from the same
 * deadline settings the staff countdown uses, so customers and staff always
 * see the same figure. Hidden until the clock starts and once the work is done.
 */
export default function DeadlineCard({ sla }) {
  if (!sla || sla.is_completed) return null;
  const due = fmtDate(sla.target_deadline);
  const left = sla.days_remaining ?? 0;
  const tone = sla.is_breached ? "red" : sla.is_nearing ? "amber" : "green";
  const styles = {
    green: "border-emerald-200 bg-emerald-50/60 text-emerald-800",
    amber: "border-amber-200 bg-amber-50/70 text-amber-800",
    red: "border-red-200 bg-red-50/60 text-red-800",
  }[tone];

  let headline;
  let body;
  if (sla.is_breached) {
    headline = "Past its target date";
    body = "We're on it and will update you here as soon as it moves. You don't need to do anything.";
  } else if (left <= 0) {
    headline = due ? `Due today (${due})` : "Due today";
    body = "Your application is in its final stretch.";
  } else {
    headline = `${left} ${left === 1 ? "day" : "days"} left${due ? ` · due ${due}` : ""}`;
    body = sla.day_type === "calendar_days" ? "Counted in calendar days." : "Counted in working days, excluding weekends and public holidays.";
  }

  return (
    <div className={cx("flex items-start gap-3 rounded-cx-lg border p-4", styles)}>
      <Clock className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="text-[12px] font-bold uppercase tracking-wide opacity-80">Target date</p>
        <p className="mt-0.5 text-[15px] font-bold">{headline}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed opacity-90">{body}</p>
      </div>
    </div>
  );
}
