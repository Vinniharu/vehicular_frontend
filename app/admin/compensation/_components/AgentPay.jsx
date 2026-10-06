"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Users } from "lucide-react";
import {
  adminGetAgents,
  bulkUpdateAgentCommission,
  getAdminAgentCompensation,
  getAdminSettings,
  updateAdminAgentCompensation,
} from "@/lib/api";
import { Badge, Button, Card, EmptyState, ErrorState, Field, Notice, Select, Sheet, SkeletonList } from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";
import { ConfirmSheet, MoneyInput, Switch, Tabs, Toolbar, formatNaira, moneyError, toKobo } from "../../_kit";
import ServicePayGrid from "./ServicePayGrid";
import PayEditSheet from "./PayEditSheet";
import { PayLine, SyncSheet } from "./Panels";
import { DEFAULT_TYPES, OTHER_SERVICES, cellId } from "./services";

const cx = (...parts) => parts.filter(Boolean).join(" ");
const agentArea = (a) => [a.agent_profile?.lga || a.lga, a.agent_profile?.state || a.state].filter(Boolean).join(", ");

/* ── Change pay for every agent ─────────────────────────────────────── */

function BulkPaySheet({ open, onOpenChange, onDone }) {
  const pushToast = useToast();
  const [value, setValue] = useState("");
  const [type, setType] = useState("");
  const [neverPaidOnly, setNeverPaidOnly] = useState(false);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValue("");
    setType("");
    setNeverPaidOnly(false);
    setError(null);
  }, [open]);

  const typeLabel = type ? DEFAULT_TYPES.find((t) => t.key === type)?.label : "every service (flat rate)";
  const kobo = value === "" ? null : toKobo(value);
  const who = !type && neverPaidOnly ? "every agent who has never been paid" : "every agent";
  const summary = kobo == null ? `Reset ${who}'s pay for ${typeLabel} to the default.` : `Set ${who}'s pay for ${typeLabel} to ${formatNaira(kobo)}.`;
  const warning = !type && neverPaidOnly
    ? "Agents who have been paid before keep their current amount."
    : !type
    ? "This replaces every agent's own flat rate."
    : "Other services and agents' flat rates are not changed.";

  const next = () => {
    const err = moneyError(value);
    if (err) return setError(err);
    setError(null);
    setConfirming(true);
  };

  const apply = async () => {
    setSaving(true);
    const res = await bulkUpdateAgentCommission(kobo, type || null, !type && neverPaidOnly);
    setSaving(false);
    setConfirming(false);
    if (res.error) return setError(res.error);
    pushToast({ tone: "success", title: `Pay updated for ${res.data?.updated_count ?? "all"} agents` });
    onOpenChange(false);
    onDone?.();
  };

  return (
    <>
      <Sheet
        open={open && !confirming}
        onOpenChange={(o) => !saving && onOpenChange(o)}
        title="Change pay for all agents"
        description="Sets one amount for every agent at once."
        footer={
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button block onClick={next}>Review change</Button>
          </>
        }
      >
        <div className="space-y-4">
          {error ? <Notice tone="red">{error}</Notice> : null}
          <Field label="Service">
            {(p) => (
              <Select {...p} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Every service (flat rate)</option>
                {DEFAULT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Agent is paid" hint="Leave blank to reset to the default.">
            {(p) => <MoneyInput {...p} value={value} onChange={setValue} placeholder="Default" />}
          </Field>
          {!type ? (
            <div className="rounded-cx border border-cx-line p-3.5">
              <Switch checked={neverPaidOnly} onChange={setNeverPaidOnly} label="Only agents never paid before" />
            </div>
          ) : null}
        </div>
      </Sheet>
      <ConfirmSheet open={confirming} onOpenChange={setConfirming} title="Apply this change?" description={warning} confirmLabel="Apply to all agents" loading={saving} onConfirm={apply}>
        <p className="text-[15px] text-cx-ink">{summary}</p>
      </ConfirmSheet>
    </>
  );
}

/* ── One agent ──────────────────────────────────────────────────────── */

function AgentDetail({ agent, defaults, onBack, onChanged }) {
  const [comp, setComp] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("vehicle");
  const [syncOnSave, setSyncOnSave] = useState(true);
  const [editing, setEditing] = useState(null); // { key, label } | "flat"
  const [syncOpen, setSyncOpen] = useState(false);

  const load = async () => {
    setError(null);
    const res = await getAdminAgentCompensation(agent.id);
    if (res.error) return setError(res.error);
    setComp(res.data);
  };
  useEffect(() => {
    setComp(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent.id]);

  const cells = useMemo(() => Object.fromEntries((comp?.items || []).map((i) => [cellId(i.service_key, i.vehicle_category), i])), [comp]);

  const patch = async (body) => {
    const res = await updateAdminAgentCompensation(agent.id, { ...body, sync_undisbursed: syncOnSave });
    if (res.error) return { ok: false, error: res.error };
    setComp(res.data);
    onChanged?.(res.data);
    return { ok: true };
  };

  const syncSwitch = (
    <div className="rounded-cx border border-cx-line p-3.5">
      <Switch checked={syncOnSave} onChange={setSyncOnSave} label="Also update this agent's unpaid jobs" description="Recalculates pay not yet sent." />
    </div>
  );

  const flat = comp?.custom_commission_kobo ?? null;
  const overrides = comp?.general_overrides || {};
  const defaultFor = (key) => defaults?.default_commission_by_type?.[key] ?? defaults?.default_agent_commission_kobo ?? null;

  return (
    <div>
      <button type="button" onClick={onBack} className="cx-focus -ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-cx px-2 text-sm font-medium text-cx-muted hover:text-cx-ink lg:hidden">
        <ChevronLeft className="h-4 w-4" aria-hidden /> All agents
      </button>
      <Card className="mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[19px] font-semibold text-cx-ink">{comp?.agent_name || agent.name}</h2>
            <p className="truncate text-sm text-cx-muted">{comp?.agent_email || agent.email}</p>
            {comp ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone={comp.has_been_disbursed ? "brand" : "neutral"}>{comp.has_been_disbursed ? `Paid ${comp.disbursed_count} time${comp.disbursed_count === 1 ? "" : "s"}` : "Never paid"}</Badge>
                {flat != null ? <Badge tone="amber">Flat rate {formatNaira(flat)}</Badge> : null}
              </div>
            ) : null}
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => setSyncOpen(true)}>Update unpaid jobs</Button>
        </div>
      </Card>

      {error && !comp ? (
        <ErrorState message={error} onRetry={load} />
      ) : !comp ? (
        <SkeletonList rows={3} />
      ) : (
        <>
          <Tabs
            tabs={[
              { id: "vehicle", label: "By vehicle type" },
              { id: "other", label: "Other services" },
              { id: "flat", label: "Flat rate" },
            ]}
            value={tab}
            onChange={setTab}
            label="Agent pay sections"
            className="mb-4"
          />

          {tab === "vehicle" ? (
            <ServicePayGrid
              ownBadge="This agent"
              getCell={(sk, cat) => {
                const c = cells[cellId(sk, cat)];
                return { own: c?.override_kobo ?? null, shown: c?.effective_kobo ?? c?.override_kobo ?? null };
              }}
              fallbackText={() => "the general pay for all agents is used"}
              saveCells={(sk, list) => patch({ items: list.map((c) => ({ service_key: sk, vehicle_category: c.vehicle_category, compensation_kobo: c.kobo, is_active: true })) })}
              sheetExtra={syncSwitch}
            />
          ) : null}

          {tab === "other" ? (
            <Card padded={false}>
              <ul className="divide-y divide-cx-line/70">
                {OTHER_SERVICES.map((s) => {
                  const own = overrides[s.key] ?? null;
                  const fallback = flat ?? defaultFor(s.key);
                  return (
                    <li key={s.key}>
                      <PayLine
                        label={s.label}
                        amount={own ?? fallback}
                        hint={own == null ? (flat != null ? "Uses this agent's flat rate" : "Uses the default pay") : undefined}
                        badge={own != null ? <Badge tone="brand">This agent</Badge> : null}
                        onClick={() => setEditing(s)}
                      />
                    </li>
                  );
                })}
              </ul>
            </Card>
          ) : null}

          {tab === "flat" ? (
            <div className="space-y-3">
              <p className="text-[15px] text-cx-muted">One amount this agent earns per job whenever no more specific amount is set.</p>
              <Card padded={false}>
                <PayLine label="Flat rate per job" amount={flat} emptyText="Not set" onClick={() => setEditing("flat")} />
              </Card>
            </div>
          ) : null}
        </>
      )}

      <PayEditSheet
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing === "flat" ? `Flat rate — ${agent.name}` : editing ? `${editing.label} — ${agent.name}` : ""}
        kobo={editing === "flat" ? flat : editing ? overrides[editing.key] ?? null : null}
        fallbackText={editing === "flat" ? "the default pay for each service is used" : flat != null ? "this agent's flat rate is paid" : "the default pay is used"}
        clearLabel={editing === "flat" ? "Remove flat rate" : "Use the default instead"}
        onSave={(kobo) => (editing === "flat" ? patch({ custom_commission_kobo: kobo }) : patch({ general_overrides: { [editing.key]: kobo } }))}
      >
        {syncSwitch}
      </PayEditSheet>

      <SyncSheet open={syncOpen} onOpenChange={setSyncOpen} agent={agent} onDone={load} />
    </div>
  );
}

/* ── Agent list + detail ────────────────────────────────────────────── */

export default function AgentPay() {
  const [agents, setAgents] = useState(null);
  const [defaults, setDefaults] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const load = async () => {
    setError(null);
    const [a, s] = await Promise.all([adminGetAgents(), getAdminSettings()]);
    if (a.error) setError(a.error);
    setAgents(Array.isArray(a.data) ? a.data : []);
    if (s.data) setDefaults(s.data);
  };
  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (agents || []).filter((a) => !q || [a.name, a.email, agentArea(a)].filter(Boolean).some((v) => v.toLowerCase().includes(q)));
  }, [agents, query]);

  if (error && !agents?.length) return <ErrorState message={error} onRetry={load} />;
  if (!agents) return <SkeletonList rows={4} />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[15px] text-cx-muted">Give an agent their own amounts. Anything not set uses the general pay.</p>
        <Button variant="secondary" size="sm" icon={Users} onClick={() => setBulkOpen(true)}>Change pay for all agents</Button>
      </div>

      <div className="lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-5">
        <div className={cx(selected && "hidden lg:block")}>
          <Toolbar search={query} onSearch={setQuery} placeholder="Search agents" />
          {visible.length === 0 ? (
            <EmptyState icon={Users} title={query ? "No agents match" : "No agents yet"} />
          ) : (
            <Card padded={false} className="lg:max-h-[calc(100dvh-260px)] lg:overflow-y-auto">
              <ul className="divide-y divide-cx-line/70">
                {visible.map((a) => {
                  const active = selected?.id === a.id;
                  const flat = a.agent_profile?.custom_commission_kobo;
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(a)}
                        aria-current={active ? "true" : undefined}
                        className={cx("cx-focus flex w-full items-center gap-3 px-4 py-3 text-left", active ? "bg-cx-brand-soft" : "hover:bg-cx-sunken/70")}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cx-sunken text-sm font-semibold text-cx-ink-2">
                          {(a.name || "?").charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={cx("truncate text-[15px]", active ? "font-semibold text-cx-brand-deep" : "font-medium text-cx-ink")}>{a.name}</p>
                          <p className="truncate text-[13px] text-cx-muted">
                            {agentArea(a) || a.email}
                            {flat != null ? ` · ${formatNaira(flat)} flat` : ""}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 shrink-0 text-cx-muted lg:hidden" aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>

        <div className={cx(!selected && "hidden lg:block")}>
          {selected ? (
            <AgentDetail
              key={selected.id}
              agent={selected}
              defaults={defaults}
              onBack={() => setSelected(null)}
              onChanged={(data) =>
                setAgents((list) => list.map((a) => (a.id === selected.id ? { ...a, agent_profile: { ...a.agent_profile, custom_commission_kobo: data.custom_commission_kobo } } : a)))
              }
            />
          ) : (
            <EmptyState icon={Users} title="Choose an agent" description="Pick an agent on the left to see and change their pay." />
          )}
        </div>
      </div>

      <BulkPaySheet open={bulkOpen} onOpenChange={setBulkOpen} onDone={load} />
    </div>
  );
}
