"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, RefreshCw } from "lucide-react";
import { Button, PageHeader } from "@/app/dashboard/_kit";
import { Tabs } from "../_kit";
import { BonusPanel, DefaultsPanel, SyncSheet, VehiclePayPanel } from "./_components/Panels";
import AgentPay from "./_components/AgentPay";

const TABS = [
  { id: "vehicle", label: "Pay by vehicle type" },
  { id: "defaults", label: "Default pay" },
  { id: "agents", label: "Agent-specific pay" },
  { id: "bonus", label: "Fast Track bonus" },
];

// The order the backend uses to decide an agent's pay for a job.
const ORDER = [
  "An amount set for that agent (for the vehicle type or service).",
  "Pay by vehicle type, for all agents.",
  "The agent's flat rate, if they have one.",
  "Default pay for the service.",
  "The fallback amount, then the system default.",
];

export default function AdminCompensationPage() {
  const [tab, setTab] = useState("vehicle");
  const [syncOpen, setSyncOpen] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Agent pay"
        description="What agents earn for each finished job."
        actions={<Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => setSyncOpen(true)}>Apply to unpaid jobs</Button>}
      />

      <div className="mb-5 rounded-cx-lg border border-cx-line bg-cx-surface shadow-cx">
        <button type="button" onClick={() => setShowOrder((o) => !o)} aria-expanded={showOrder} className="cx-focus flex w-full items-center gap-2.5 rounded-cx-lg px-4 py-3 text-left">
          <HelpCircle className="h-5 w-5 shrink-0 text-cx-muted" aria-hidden />
          <span className="flex-1 text-[15px] font-medium text-cx-ink">Which amount does an agent get?</span>
          <ChevronDown className={`h-5 w-5 text-cx-muted transition-transform ${showOrder ? "rotate-180" : ""}`} aria-hidden />
        </button>
        {showOrder ? (
          <ol className="list-decimal space-y-1 border-t border-cx-line py-3 pl-11 pr-4 text-[15px] text-cx-ink-2">
            {ORDER.map((line) => <li key={line}>{line}</li>)}
            <li className="list-none -ml-6 pt-1 text-sm text-cx-muted">The first one that's set is paid.</li>
          </ol>
        ) : null}
      </div>

      <Tabs tabs={TABS} value={tab} onChange={setTab} label="Agent pay sections" className="mb-5" />

      <div key={refreshKey}>
        {tab === "vehicle" ? <VehiclePayPanel /> : null}
        {tab === "defaults" ? <DefaultsPanel /> : null}
        {tab === "agents" ? <AgentPay /> : null}
        {tab === "bonus" ? <BonusPanel /> : null}
      </div>

      <SyncSheet open={syncOpen} onOpenChange={setSyncOpen} onDone={() => setRefreshKey((k) => k + 1)} />
    </div>
  );
}
