"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, X } from "lucide-react";
import { listApplicationDrafts, deleteApplicationDraft } from "@/lib/api";
import { getWizardKeyMeta } from "@/lib/draft-registry";

const BRAND = "#28A745";
const MAX_SHOWN = 3;

// The backend serializes updated_at without a timezone suffix (SQLite
// doesn't round-trip tzinfo) even though the value is UTC — parsed as-is,
// the browser would treat it as local time and silently skew "time ago" by
// the viewer's UTC offset. Append "Z" when no offset/zone is already
// present so it's always parsed as UTC.
function parseServerDate(iso) {
  const hasZone = /Z$|[+-]\d{2}:?\d{2}$/.test(iso);
  return new Date(hasZone ? iso : `${iso}Z`);
}

function relativeTime(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - parseServerDate(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

// Renders nothing when there are no drafts — matches this dashboard's
// existing minimal style (no empty-state placeholders elsewhere on it).
export default function ContinueApplicationCard() {
  const [drafts, setDrafts] = useState(null); // null = not loaded yet

  useEffect(() => {
    listApplicationDrafts().then((res) => {
      setDrafts(res.data || []);
    });
  }, []);

  const handleDismiss = async (wizardKey) => {
    setDrafts((prev) => (prev || []).filter((d) => d.wizard_key !== wizardKey));
    await deleteApplicationDraft(wizardKey);
  };

  if (!drafts || drafts.length === 0) return null;

  const shown = drafts.slice(0, MAX_SHOWN);
  const remaining = drafts.length - shown.length;

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5">
      <p className="mb-3 text-[13px] font-bold uppercase tracking-wide text-slate-500">Continue where you left off</p>
      <div className="space-y-2">
        {shown.map((draft) => {
          const meta = getWizardKeyMeta(draft.wizard_key);
          return (
            <div
              key={draft.wizard_key}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
            >
              <Link href={meta.resumeUrl} className="flex min-w-0 flex-1 items-center gap-3">
                <div>
                  <p className="text-[13.5px] font-semibold text-[#111111]">{meta.label}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-slate-500">
                    {draft.step_label && <span>{draft.step_label} · </span>}
                    <Clock className="h-3 w-3" />
                    {relativeTime(draft.updated_at)}
                  </p>
                </div>
              </Link>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={meta.resumeUrl}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white"
                  style={{ background: BRAND }}
                >
                  Resume
                  <ArrowRight className="h-3 w-3" />
                </Link>
                <button
                  type="button"
                  onClick={() => handleDismiss(draft.wizard_key)}
                  aria-label="Discard draft"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {remaining > 0 && (
        <Link href="/dashboard/drafts" className="mt-3 inline-block text-[12.5px] font-semibold" style={{ color: BRAND }}>
          +{remaining} more
        </Link>
      )}
    </div>
  );
}
