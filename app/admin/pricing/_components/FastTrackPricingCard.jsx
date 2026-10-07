"use client";

// Fast Track surcharges: the extra fee a customer pays to have a service
// expedited. One line per service; each is edited and saved on its own.

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Zap } from "lucide-react";
import { getAdminFastTrackPricing, updateAdminFastTrackPricing } from "@/lib/api";
import { Badge, Button, Field, Notice, Sheet, SkeletonList } from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";
import { MoneyInput, Switch, formatNaira, moneyError, toKobo, toNaira } from "../../_kit";

const cx = (...parts) => parts.filter(Boolean).join(" ");

// The backend charges this when no surcharge is saved
// (DEFAULT_FAST_TRACK_PRICE_KOBO in app/core/fast_track_helpers.py).
const SYSTEM_DEFAULT_KOBO = 1_000_000;

// Matches the backend's FAST_TRACK_SERVICES keys. Driver's licence isn't
// listed: customers can't pick Fast Track for it at checkout.
const SERVICES = [
  { key: "vehicle_particulars", label: "Vehicle papers" },
  { key: "tinted_permit", label: "Tinted glass permit" },
  { key: "number_plate", label: "Number plates (all types)" },
  { key: "vehicle_verification", label: "Vehicle verification" },
  { key: "central_motor_registry", label: "Central Motor Registry (ECMR)" },
  { key: "roadworthiness_express", label: "Roadworthiness inspection" },
  { key: "physical_condition_inspection", label: "Physical condition inspection" },
];

export default function FastTrackPricingCard({ stateId, open, onToggle }) {
  const pushToast = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [amount, setAmount] = useState("");
  const [active, setActive] = useState(true);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await getAdminFastTrackPricing();
    if (res.error) setError(res.error);
    setItems(Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    load();
  }, []);

  // This scope's own row, else the general row, else the system default.
  const resolve = (key) => {
    const list = items || [];
    const own = list.find((it) => it.service_type === key && (stateId == null ? it.state_id == null : it.state_id === stateId));
    if (own) return { kobo: own.price_kobo, active: own.is_active !== false, source: stateId == null ? "general" : "state" };
    if (stateId != null) {
      const general = list.find((it) => it.service_type === key && it.state_id == null);
      if (general) return { kobo: general.price_kobo, active: general.is_active !== false, source: "inherited" };
    }
    return { kobo: SYSTEM_DEFAULT_KOBO, active: true, source: "default" };
  };

  const openEdit = (svc) => {
    const r = resolve(svc.key);
    setAmount(r.source === "default" ? "" : toNaira(r.kobo));
    setActive(r.active);
    setFormError(null);
    setEditing(svc);
  };

  const save = async () => {
    const err = moneyError(amount, { required: true });
    if (err) return setFormError(err);
    setSaving(true);
    const res = await updateAdminFastTrackPricing([{ service_type: editing.key, state_id: stateId ?? null, price_kobo: toKobo(amount), is_active: active }]);
    setSaving(false);
    if (res.error) return setFormError(res.error);
    if (Array.isArray(res.data?.items)) setItems(res.data.items);
    else await load();
    pushToast({ tone: "success", title: "Fast Track fee saved", body: editing.label });
    setEditing(null);
  };

  return (
    <section id="svc-fast-track" className="scroll-mt-28 rounded-cx-lg border border-cx-line bg-cx-surface shadow-cx">
      <button type="button" onClick={onToggle} aria-expanded={open} className="cx-focus flex w-full items-start gap-3 rounded-cx-lg px-4 py-4 text-left sm:px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cx-amber-soft text-cx-amber">
          <Zap className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold text-cx-ink">Fast Track fees</h2>
          <p className="mt-0.5 text-sm text-cx-muted">{SERVICES.length} fees · Extra charge for faster processing</p>
        </div>
        <ChevronDown className={cx("mt-1 h-5 w-5 shrink-0 text-cx-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open ? (
        <div className="border-t border-cx-line">
          {error && !items?.length ? <div className="p-4"><Notice tone="red">Couldn't load Fast Track fees.</Notice></div> : null}
          {!items ? (
            <div className="p-4"><SkeletonList rows={3} /></div>
          ) : (
            <ul className="divide-y divide-cx-line/70">
              {SERVICES.map((svc) => {
                const r = resolve(svc.key);
                return (
                  <li key={svc.key}>
                    <button type="button" onClick={() => openEdit(svc)} className="cx-focus group flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-cx-sunken/70 sm:px-5">
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-medium text-cx-ink">{svc.label}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {r.source === "default" ? <Badge tone="neutral">System default</Badge> : null}
                          {r.source === "inherited" ? <Badge tone="neutral">From general</Badge> : null}
                          {r.source === "state" ? <Badge tone="amber">This state's fee</Badge> : null}
                          {!r.active ? <Badge tone="red">Not offered</Badge> : null}
                        </div>
                      </div>
                      <span className="w-28 shrink-0 text-right text-[15px] font-semibold text-cx-ink">{formatNaira(r.kobo)}</span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-cx-muted group-hover:translate-x-0.5" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      <Sheet
        open={!!editing}
        onOpenChange={(o) => !o && !saving && setEditing(null)}
        title={editing ? `Fast Track — ${editing.label}` : ""}
        description={stateId == null ? "Applies to every state without its own fee." : "Applies to this state only."}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button block loading={saving} onClick={save}>Save fee</Button>
          </>
        }
      >
        <div className="space-y-5">
          {formError ? <Notice tone="red">{formError}</Notice> : null}
          <Field label="Extra fee" required hint={`If no fee is saved, customers are charged ${formatNaira(SYSTEM_DEFAULT_KOBO)}.`}>
            {(p) => <MoneyInput {...p} value={amount} onChange={setAmount} placeholder={toNaira(SYSTEM_DEFAULT_KOBO)} />}
          </Field>
          <div className="rounded-cx border border-cx-line p-3.5">
            <Switch
              checked={active}
              onChange={setActive}
              label="Offer Fast Track"
              description={
                active
                  ? "Customers can choose Fast Track and pay this fee."
                  : stateId == null
                  ? "Off — customers won't see Fast Track for this service (unless a state turns it on)."
                  : "Off — customers in this state won't see Fast Track for this service."
              }
            />
          </div>
        </div>
      </Sheet>
    </section>
  );
}
