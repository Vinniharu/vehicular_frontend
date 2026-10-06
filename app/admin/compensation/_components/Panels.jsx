"use client";

import { useEffect, useState } from "react";
import { ChevronRight, RefreshCw, Zap } from "lucide-react";
import {
  getAdminCompensation,
  updateAdminCompensation,
  getAdminSettings,
  updateAdminSettings,
  getAdminFastTrackBonus,
  updateAdminFastTrackBonus,
  syncAdminUndisbursedCompensation,
} from "@/lib/api";
import { Badge, Button, Card, ErrorState, Field, Notice, Sheet, SkeletonList } from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";
import { MoneyInput, Switch, formatNaira, moneyError, toKobo, toNaira } from "../../_kit";
import ServicePayGrid from "./ServicePayGrid";
import PayEditSheet from "./PayEditSheet";
import { DEFAULT_TYPES, cellId } from "./services";

const cx = (...parts) => parts.filter(Boolean).join(" ");

export function PayLine({ label, hint, amount, emptyText = "Not set", badge, onClick }) {
  return (
    <button type="button" onClick={onClick} className="cx-focus group flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-cx-sunken/70 sm:px-5">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-cx-ink">{label}</p>
        {hint ? <p className="text-[13px] text-cx-muted">{hint}</p> : null}
        {badge ? <div className="mt-1">{badge}</div> : null}
      </div>
      <span className={cx("w-28 shrink-0 text-right text-[15px] font-semibold", amount != null ? "text-cx-ink" : "text-cx-muted")}>{formatNaira(amount, emptyText)}</span>
      <ChevronRight className="h-5 w-5 shrink-0 text-cx-muted group-hover:translate-x-0.5" aria-hidden />
    </button>
  );
}

/* ── Pay by vehicle type (all agents) ───────────────────────────────── */

export function VehiclePayPanel() {
  const [map, setMap] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    setError(null);
    const res = await getAdminCompensation();
    if (res.error) return setError(res.error);
    setMap(Object.fromEntries((res.data?.items || []).map((i) => [cellId(i.service_key, i.vehicle_category), i.compensation_kobo])));
  };
  useEffect(() => {
    load();
  }, []);

  if (error && !map) return <ErrorState message={error} onRetry={load} />;
  if (!map) return <SkeletonList rows={3} />;

  const getCell = (sk, cat) => {
    const own = map[cellId(sk, cat)] ?? null;
    const any = map[cellId(sk, null)] ?? null;
    return { own, shown: cat == null ? own : own ?? any };
  };
  const fallbackText = (sk, cat) => {
    if (cat != null && map[cellId(sk, null)] != null) return `the "any vehicle type" amount (${formatNaira(map[cellId(sk, null)])}) is paid`;
    return "the agent's flat rate or the default pay for this service is used";
  };
  const saveCells = async (sk, cells) => {
    const res = await updateAdminCompensation(cells.map((c) => ({ service_key: sk, vehicle_category: c.vehicle_category, compensation_kobo: c.kobo, is_active: true })));
    if (res.error) return { ok: false, error: res.error };
    setMap((prev) => {
      const next = { ...prev };
      cells.forEach((c) => (next[cellId(sk, c.vehicle_category)] = c.kobo));
      (res.data?.items || []).filter((i) => i.service_key === sk).forEach((i) => (next[cellId(i.service_key, i.vehicle_category)] = i.compensation_kobo));
      return next;
    });
    return { ok: true };
  };

  return (
    <div>
      <p className="mb-4 text-[15px] text-cx-muted">What every agent is paid per job, by vehicle type. Individual agents can be given their own amounts.</p>
      <ServicePayGrid getCell={getCell} fallbackText={fallbackText} saveCells={saveCells} />
    </div>
  );
}

/* ── Default pay per service ────────────────────────────────────────── */

export function DefaultsPanel() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // { key, label } | "flat"

  const load = async () => {
    setError(null);
    const res = await getAdminSettings();
    if (res.error) return setError(res.error);
    setSettings(res.data);
  };
  useEffect(() => {
    load();
  }, []);

  if (error && !settings) return <ErrorState message={error} onRetry={load} />;
  if (!settings) return <SkeletonList rows={4} />;

  const byType = settings.default_commission_by_type || {};
  const flat = settings.default_agent_commission_kobo ?? null;

  const save = async (kobo) => {
    let body;
    if (editing === "flat") {
      // Backend: a negative value clears the flat default; null means "unchanged".
      body = { default_agent_commission_kobo: kobo == null ? -1 : kobo };
    } else {
      const nextMap = { ...byType };
      if (kobo == null) delete nextMap[editing.key];
      else nextMap[editing.key] = kobo;
      body = { default_commission_by_type: nextMap }; // replaced wholesale by the backend
    }
    const res = await updateAdminSettings(body);
    if (res.error) return { ok: false, error: res.error };
    setSettings(res.data);
    return { ok: true };
  };

  return (
    <div className="space-y-4">
      <p className="text-[15px] text-cx-muted">Used when there's no vehicle-type amount and no agent-specific amount for a job.</p>
      <Card padded={false}>
        <ul className="divide-y divide-cx-line/70">
          {DEFAULT_TYPES.map((t) => (
            <li key={t.key}>
              <PayLine label={t.label} amount={byType[t.key] ?? flat} hint={byType[t.key] == null ? "Uses the fallback below" : undefined} onClick={() => setEditing(t)} />
            </li>
          ))}
        </ul>
      </Card>
      <Card padded={false}>
        <PayLine label="Fallback for everything else" hint="Used when nothing else is set" amount={flat} emptyText="System default" onClick={() => setEditing("flat")} />
      </Card>

      <PayEditSheet
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing === "flat" ? "Fallback pay" : editing ? `Default pay — ${editing.label}` : ""}
        description="Applies to every agent without their own amount."
        kobo={editing === "flat" ? flat : editing ? byType[editing.key] ?? null : null}
        fallbackText={editing === "flat" ? "the system's built-in default is paid" : "the fallback amount is paid"}
        clearLabel={editing === "flat" ? "Use the system default" : "Use the fallback instead"}
        onSave={save}
      />
    </div>
  );
}

/* ── Fast Track bonus ───────────────────────────────────────────────── */

// Paid when no bonus is saved (DEFAULT_FAST_TRACK_BONUS_KOBO in the backend).
const DEFAULT_BONUS_KOBO = 200_000;
const BONUS_SERVICES = [
  { key: "vehicle_particulars", label: "Vehicle papers" },
  { key: "tinted_permit", label: "Tinted glass permit" },
  { key: "number_plate", label: "Number plates (all types)" },
  { key: "vehicle_verification", label: "Vehicle verification" },
  { key: "central_motor_registry", label: "Central Motor Registry (ECMR)" },
  { key: "roadworthiness_express", label: "Roadworthiness inspection" },
  { key: "physical_condition_inspection", label: "Physical condition inspection (mechanic)" },
  { key: "driver_licence", label: "Driver's licence (admin upgrades)" },
];

export function BonusPanel() {
  const pushToast = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [value, setValue] = useState("");
  const [active, setActive] = useState(true);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setError(null);
    const res = await getAdminFastTrackBonus();
    if (res.error) setError(res.error);
    setItems(Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : []);
  };
  useEffect(() => {
    load();
  }, []);

  const find = (k) => (items || []).find((i) => i.service_type === k);
  const open = (svc) => {
    const it = find(svc.key);
    setValue(it ? toNaira(it.bonus_kobo) : "");
    setActive(it ? it.is_active !== false : true);
    setFormError(null);
    setEditing(svc);
  };
  const save = async () => {
    const err = moneyError(value, { required: true });
    if (err) return setFormError(err);
    setSaving(true);
    const res = await updateAdminFastTrackBonus([{ service_type: editing.key, bonus_kobo: toKobo(value), is_active: active }]);
    setSaving(false);
    if (res.error) return setFormError(res.error);
    await load();
    pushToast({ tone: "success", title: "Bonus saved", body: editing.label });
    setEditing(null);
  };

  if (error && !items?.length) return <ErrorState message={error} onRetry={load} />;
  if (!items) return <SkeletonList rows={3} />;

  return (
    <div className="space-y-4">
      <p className="text-[15px] text-cx-muted">Extra pay for finishing a Fast Track job, on top of the normal amount.</p>
      <Card padded={false}>
        <ul className="divide-y divide-cx-line/70">
          {BONUS_SERVICES.map((svc) => {
            const it = find(svc.key);
            return (
              <li key={svc.key}>
                <PayLine
                  label={svc.label}
                  amount={it ? it.bonus_kobo : DEFAULT_BONUS_KOBO}
                  badge={!it ? <Badge tone="neutral">System default</Badge> : it.is_active === false ? <Badge tone="neutral">Off</Badge> : null}
                  onClick={() => open(svc)}
                />
              </li>
            );
          })}
        </ul>
      </Card>
      <Sheet
        open={!!editing}
        onOpenChange={(o) => !o && !saving && setEditing(null)}
        title={editing ? `Fast Track bonus — ${editing.label}` : ""}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button block loading={saving} onClick={save}>Save bonus</Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError ? <Notice tone="red">{formError}</Notice> : null}
          <Field label="Bonus per job" required hint={`If no bonus is saved, agents get ${formatNaira(DEFAULT_BONUS_KOBO)}.`}>
            {(p) => <MoneyInput {...p} value={value} onChange={setValue} placeholder={toNaira(DEFAULT_BONUS_KOBO)} />}
          </Field>
          <div className="rounded-cx border border-cx-line p-3.5">
            <Switch checked={active} onChange={setActive} label="Pay this bonus" description={active ? "Agents earn this on Fast Track jobs." : "No bonus is paid for this service."} />
          </div>
        </div>
      </Sheet>
    </div>
  );
}

/* ── Update unpaid jobs ─────────────────────────────────────────────── */

export function SyncSheet({ open, onOpenChange, agent, onDone }) {
  const pushToast = useToast();
  const [resetLegacy, setResetLegacy] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setResult(null);
    setError(null);
    setResetLegacy(true);
  }, [open]);

  const run = async () => {
    setRunning(true);
    setError(null);
    const res = await syncAdminUndisbursedCompensation({ update_never_disbursed_agents: resetLegacy, ...(agent ? { agent_id: agent.id } : {}) });
    setRunning(false);
    if (res.error) return setError(res.error);
    setResult(res.data);
    pushToast({ tone: "success", title: "Unpaid jobs updated" });
    onDone?.();
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !running && onOpenChange(o)}
      title={agent ? `Update ${agent.name}'s unpaid jobs` : "Apply new pay to unpaid jobs"}
      description="Recalculates pay that hasn't been sent yet using the current amounts."
      footer={
        result ? (
          <Button block onClick={() => onOpenChange(false)}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={running}>Cancel</Button>
            <Button block icon={RefreshCw} loading={running} onClick={run}>Update unpaid jobs</Button>
          </>
        )
      }
    >
      {result ? (
        <dl className="grid grid-cols-2 gap-3">
          {[
            ["Payouts recalculated", result.transfers_updated],
            ["Net change to wallets", `${result.transfers_total_delta_kobo >= 0 ? "+" : ""}${formatNaira(result.transfers_total_delta_kobo)}`],
            ["Open documents updated", result.items_updated],
            ["Agents reset to new rates", result.agents_updated],
          ].map(([k, v]) => (
            <div key={k} className="rounded-cx bg-cx-sunken p-3">
              <dt className="text-[13px] text-cx-muted">{k}</dt>
              <dd className="text-[17px] font-semibold text-cx-ink">{v ?? 0}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="space-y-4">
          {error ? <Notice tone="red">{error}</Notice> : null}
          <ul className="list-disc space-y-1.5 pl-5 text-[15px] text-cx-ink-2">
            <li>Pending and failed payouts are recalculated; agent wallets are adjusted by the difference.</li>
            <li>Vehicle-papers documents not yet accepted take the new amounts.</li>
            <li>Money already paid out is never changed.</li>
          </ul>
          <div className="rounded-cx border border-cx-line p-3.5">
            <Switch
              checked={resetLegacy}
              onChange={setResetLegacy}
              label="Remove the old ₦10,000 flat rate"
              description="From agents who have never been paid, so they follow the current amounts."
            />
          </div>
        </div>
      )}
    </Sheet>
  );
}
