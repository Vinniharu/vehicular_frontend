"use client";

import { Hourglass } from "lucide-react";

function hoursText(h) {
  if (!h || h < 1) return "under 1h";
  if (h < 48) return `${Math.floor(h)}h`;
  return `${Math.floor(h / 24)}d`;
}

/**
 * A job released to agents that nobody has accepted yet (from the
 * waiting_for_agent / waiting_hours / no_agent_matched list fields), and for a
 * vehicle particulars bundle how many of its documents have an agent.
 */
export function WaitingForAgentBadge({ app }) {
  if (!app?.waiting_for_agent) return null;
  const late = (app.waiting_hours || 0) >= 2;
  return (
    <span
      className={`inline-flex max-w-full flex-wrap items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-semibold ${
        late ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"
      }`}
      title={app.no_agent_matched ? "No agent currently has an offer for this job" : `${app.open_offers || 0} agent(s) offered`}
    >
      <Hourglass className="h-3.5 w-3.5" aria-hidden />
      {app.no_agent_matched ? "No agent offered" : "No agent yet"} · {hoursText(app.waiting_hours)}
    </span>
  );
}

/** "2 of 4 documents accepted" for a vehicle particulars bundle. */
export function DocumentsAccepted({ app }) {
  if (app?.items_total == null || !app.items_total) return null;
  const all = app.items_accepted >= app.items_total;
  return (
    <span className={`text-[12.5px] ${all ? "text-cx-muted" : "font-semibold text-amber-800"}`}>
      {app.items_accepted} of {app.items_total} documents accepted
    </span>
  );
}
