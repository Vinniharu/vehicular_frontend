"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, Loader2, X } from "lucide-react";
import { listApplicationDrafts, deleteApplicationDraft } from "@/lib/api";
import { getWizardKeyMeta } from "@/lib/draft-registry";

const BRAND = "#28A745";

// See ContinueApplicationCard.jsx's parseServerDate comment — the backend
// serializes updated_at without a timezone suffix even though it's UTC.
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

export default function DraftsListPage() {
  const [drafts, setDrafts] = useState(null);

  useEffect(() => {
    listApplicationDrafts().then((res) => setDrafts(res.data || []));
  }, []);

  const handleDismiss = async (wizardKey) => {
    setDrafts((prev) => (prev || []).filter((d) => d.wizard_key !== wizardKey));
    await deleteApplicationDraft(wizardKey);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6 pb-20">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <h1
        className="text-[26px] tracking-tight text-[#111111]"
        style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
      >
        Unfinished applications
      </h1>

      {drafts === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
        </div>
      ) : drafts.length === 0 ? (
        <p className="py-16 text-center text-[13.5px] text-slate-500">You don't have any unfinished applications.</p>
      ) : (
        <div className="space-y-2.5">
          {drafts.map((draft) => {
            const meta = getWizardKeyMeta(draft.wizard_key);
            return (
              <div
                key={draft.wizard_key}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#E5E5E5] bg-white px-5 py-4"
              >
                <div>
                  <p className="text-[14px] font-semibold text-[#111111]">{meta.label}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-slate-500">
                    {draft.step_label && <span>{draft.step_label} · </span>}
                    <Clock className="h-3 w-3" />
                    {relativeTime(draft.updated_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={meta.resumeUrl}
                    className="inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold text-white"
                    style={{ background: BRAND }}
                  >
                    Resume
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDismiss(draft.wizard_key)}
                    aria-label="Discard draft"
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
