"use client";

import { useEffect, useState } from "react";
import { ArrowRight, NotebookPen, Trash2 } from "lucide-react";
import { deleteApplicationDraft, listApplicationDrafts } from "@/lib/api";
import { getWizardKeyMeta } from "@/lib/draft-registry";
import { useToast } from "@/app/components/shared/ToastProvider";
import { Button, Card, EmptyState, ErrorState, IconButton, PageHeader, SkeletonList } from "@/app/dashboard/_kit";

// The backend serializes updated_at without a timezone suffix even though
// it's UTC — see ContinueApplicationCard.jsx.
function parseServerDate(iso) {
  const hasZone = /Z$|[+-]\d{2}:?\d{2}$/.test(iso);
  return new Date(hasZone ? iso : `${iso}Z`);
}

function relativeTime(iso) {
  if (!iso) return "";
  const mins = Math.round((Date.now() - parseServerDate(iso).getTime()) / 60000);
  if (mins < 1) return "Saved just now";
  if (mins < 60) return `Saved ${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `Saved ${hours} h ago`;
  const days = Math.round(hours / 24);
  return `Saved ${days} day${days === 1 ? "" : "s"} ago`;
}

export default function DraftsListPage() {
  const pushToast = useToast();
  const [drafts, setDrafts] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const load = () => {
    setLoadError(null);
    listApplicationDrafts().then((res) => {
      if (res.error) setLoadError(res.error);
      else setDrafts(res.data || []);
    });
  };

  useEffect(load, []);

  const discard = async (draft) => {
    const previous = drafts;
    setDrafts((prev) => (prev || []).filter((d) => d.wizard_key !== draft.wizard_key));
    const res = await deleteApplicationDraft(draft.wizard_key);
    if (res?.error) {
      setDrafts(previous);
      pushToast({ tone: "error", title: "Couldn't discard that draft", body: res.error });
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Saved drafts"
        description="Applications you started but haven't submitted. Pick up where you left off."
        backHref="/dashboard/account"
        backLabel="Account"
      />

      {loadError ? (
        <ErrorState title="Your drafts didn't load" message={loadError} onRetry={load} />
      ) : drafts === null ? (
        <SkeletonList rows={2} />
      ) : drafts.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="No saved drafts"
          description="When you leave an application part-way through, it's saved here automatically."
          action={<Button href="/dashboard/services">Apply for a service</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {drafts.map((draft) => {
            const meta = getWizardKeyMeta(draft.wizard_key);
            return (
              <li key={draft.wizard_key}>
                <Card className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-cx-ink">{meta.label}</p>
                    <p className="mt-0.5 text-sm text-cx-muted">
                      {draft.step_label ? `${draft.step_label}. ` : ""}
                      {relativeTime(draft.updated_at)}
                    </p>
                  </div>
                  <IconButton label={`Discard ${meta.label} draft`} icon={Trash2} onClick={() => discard(draft)} />
                  <Button href={meta.resumeUrl} size="md">
                    Resume
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
