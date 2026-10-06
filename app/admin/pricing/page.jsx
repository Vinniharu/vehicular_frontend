"use client";

import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { clonePricing, getReferenceStates } from "@/lib/api";
import { Button, Field, Notice, PageHeader, Select, Sheet } from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";
import { ScopePicker } from "../_kit";
import { SERVICE_SECTIONS } from "./_data/serviceSections";
import { PricingDataProvider } from "./_context/PricingDataContext";
import ServicePricingCard from "./_components/ServicePricingCard";
import FastTrackPricingCard from "./_components/FastTrackPricingCard";

const cx = (...parts) => parts.filter(Boolean).join(" ");

const JUMPS = [
  ...SERVICE_SECTIONS.map((s) => ({ id: s.slug, label: s.title.replace(/ Services$/, "").replace(/ \(.*\)$/, "") })),
  { id: "fast-track", label: "Fast Track" },
];

function CopyPricesSheet({ open, onOpenChange, states, defaultTarget, onCopied }) {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setSource("");
    setTarget(defaultTarget || "");
    setError(null);
  }, [open, defaultTarget]);

  const copy = async () => {
    if (!target) return setError("Choose the state to copy into.");
    if ((source || null) === (target || null)) return setError("Choose two different scopes.");
    setSaving(true);
    setError(null);
    const res = await clonePricing({ source_state_id: source ? parseInt(source, 10) : null, target_state_id: parseInt(target, 10) });
    setSaving(false);
    if (res.error) return setError(res.error || "Couldn't copy prices. Try again.");
    onCopied(parseInt(target, 10));
  };

  const name = (id) => (id ? states.find((s) => String(s.id) === String(id))?.name : "General");

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !saving && onOpenChange(o)}
      title="Copy prices to a state"
      description="Copies every price, deposit and on/off setting into the state you choose."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button block icon={Copy} loading={saving} onClick={copy}>{target ? `Copy to ${name(target)}` : "Copy prices"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <Notice tone="red">{error}</Notice> : null}
        <Field label="Copy from">
          {(p) => (
            <Select {...p} value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="">General (all states)</option>
              {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Copy into" required>
          {(p) => (
            <Select {...p} value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Choose a state</option>
              {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          )}
        </Field>
      </div>
    </Sheet>
  );
}

export default function AdminPricingPage() {
  const pushToast = useToast();
  const [states, setStates] = useState([]);
  const [scope, setScope] = useState(""); // "" = general
  const [copyOpen, setCopyOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [openIds, setOpenIds] = useState(() => new Set([SERVICE_SECTIONS[0].slug]));

  useEffect(() => {
    getReferenceStates().then((res) => res.data && setStates(res.data));
  }, []);

  const stateId = scope ? parseInt(scope, 10) : null;
  const scopeKey = stateId ?? "general";

  const toggle = (id) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const jumpTo = (id) => {
    setOpenIds((prev) => new Set(prev).add(id));
    requestAnimationFrame(() => document.getElementById(`svc-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const onCopied = (targetId) => {
    setCopyOpen(false);
    pushToast({ tone: "success", title: "Prices copied" });
    if (targetId === stateId) setReloadKey((k) => k + 1);
    else setScope(String(targetId));
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Pricing"
        description="What customers pay for each service. Set general prices, then give a state its own price where needed."
        actions={<Button variant="secondary" size="sm" icon={Copy} onClick={() => setCopyOpen(true)}>Copy to a state</Button>}
      />

      <div className="mb-4 rounded-cx-lg border border-cx-line bg-cx-surface p-4 shadow-cx">
        <ScopePicker states={states} value={scope} onChange={setScope} />
      </div>

      <nav aria-label="Jump to a service" className="sticky top-14 z-10 -mx-4 mb-4 bg-cx-paper/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:top-16 lg:-mx-10 lg:px-10">
        <ul className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] md:flex-wrap md:overflow-visible">
          {JUMPS.map((j) => (
            <li key={j.id}>
              <button
                type="button"
                onClick={() => jumpTo(j.id)}
                className={cx(
                  "cx-focus min-h-9 shrink-0 whitespace-nowrap rounded-full border px-3 text-sm font-medium transition-colors",
                  openIds.has(j.id) ? "border-cx-brand/40 bg-cx-brand-soft text-cx-brand-deep" : "border-cx-line-strong bg-cx-surface text-cx-ink-2 hover:bg-cx-sunken"
                )}
              >
                {j.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <PricingDataProvider stateId={stateId} reloadKey={reloadKey}>
        <div className="space-y-3">
          {SERVICE_SECTIONS.map((section) => (
            <ServicePricingCard key={`${scopeKey}:${section.slug}`} section={section} open={openIds.has(section.slug)} onToggle={() => toggle(section.slug)} />
          ))}
          <FastTrackPricingCard key={`ft:${scopeKey}`} stateId={stateId} open={openIds.has("fast-track")} onToggle={() => toggle("fast-track")} />
        </div>
      </PricingDataProvider>

      <CopyPricesSheet open={copyOpen} onOpenChange={setCopyOpen} states={states} defaultTarget={scope} onCopied={onCopied} />
    </div>
  );
}
