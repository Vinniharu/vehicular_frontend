"use client";

// Schedule, reschedule or reopen a physical condition inspection visit.

import { useEffect, useState } from "react";
import { Copy, Send } from "lucide-react";
import { schedulePciVisit } from "@/lib/api";
import { Button, Field, Input, Notice, Sheet, Textarea } from "@/app/dashboard/_kit";
import { Switch } from "@/app/admin/_kit";

export default function PciScheduleSheet({ open, application, onClose, onDone }) {
  const isReschedule = application.status === "visit_scheduled";
  const isReopen = application.status === "awaiting_mechanic_verdict";
  const detail = application.pci_detail || {};

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [regenerate, setRegenerate] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [link, setLink] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate((detail.confirmed_visit_date || detail.preferred_date || "").slice(0, 10));
    setTime(detail.confirmed_visit_time || detail.preferred_time || "");
    setRegenerate(false);
    setNote("");
    setError(null);
    setLink(null);
    setCopied(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    if (!date) return setError("Pick a visit date.");
    setSaving(true);
    setError(null);
    const res = await schedulePciVisit(application.id, {
      confirmed_date: date,
      confirmed_time: time || undefined,
      regenerate_link: regenerate,
      note: note.trim() || undefined,
    });
    setSaving(false);
    if (res.error) return setError(res.error);
    // The backend builds a full URL from FRONTEND_BASE_URL.
    if (res.data?.mechanic_link_path) return setLink(res.data.mechanic_link_path);
    onDone();
  };

  const title = isReopen ? "Reopen for more evidence" : isReschedule ? "Reschedule visit" : "Schedule visit";

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && !saving && (link ? onDone() : onClose())}
      title={link ? "Visit confirmed" : title}
      description={link ? "Send this link to the field mechanic on WhatsApp." : isReopen ? "Clears the completeness check and reopens the mechanic's link." : "You'll get a link to send to the field mechanic."}
      footer={
        link ? (
          <Button block onClick={onDone}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button block icon={Send} loading={saving} onClick={submit}>{isReopen ? "Reopen visit" : isReschedule ? "Save new date" : "Confirm and get link"}</Button>
          </>
        )
      }
    >
      {link ? (
        <div className="space-y-3">
          <p className="break-all rounded-cx bg-cx-sunken p-3 font-mono text-sm text-cx-ink">{link}</p>
          <Button
            variant="secondary"
            icon={Copy}
            onClick={() => {
              navigator.clipboard?.writeText(link);
              setCopied(true);
            }}
          >
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {error ? <Notice tone="red">{error}</Notice> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Visit date" required>{(p) => <Input {...p} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
            <Field label="Visit time" optional>{(p) => <Input {...p} type="time" value={time} onChange={(e) => setTime(e.target.value)} />}</Field>
          </div>
          {!isReopen ? (
            <div className="rounded-cx border border-cx-line p-3.5">
              <Switch
                checked={regenerate}
                onChange={setRegenerate}
                label="Generate a new link"
                description={isReschedule ? "Otherwise the mechanic's current link keeps working." : undefined}
              />
            </div>
          ) : null}
          <Field label="Note" optional>
            {(p) => <Textarea {...p} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={isReopen ? "e.g. Engine bay photos are too dark, need re-shoots." : "e.g. Customer confirmed this date by phone."} />}
          </Field>
        </div>
      )}
    </Sheet>
  );
}
