"use client";

// Manual agent assignment (when routing found nobody) and reassignment.

import { useState } from "react";
import { Building2, RefreshCw, UserCheck } from "lucide-react";
import { staffAssignAgent, staffGetEligibleAgents } from "@/lib/api";
import { Badge, Button, Card, Field, Notice, Select, Sheet } from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";

const REASSIGNABLE = ["routed", "agent_assigned", "agent_accepted"];

export default function AgentAssignment({ application, onChanged }) {
  const pushToast = useToast();
  const [open, setOpen] = useState(false);
  const [agents, setAgents] = useState(null);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const assigned = !!application.assigned_agent_id;
  const needsManual = application.status === "routed" && !assigned;
  if (!assigned && !needsManual) return null;

  const openPicker = async () => {
    setSelected("");
    setError(null);
    setOpen(true);
    if (!agents) {
      const res = await staffGetEligibleAgents(application.id);
      setAgents(res.data || []);
    }
  };

  const choices = (agents || []).filter((a) => a.has_bank_account && a.agent_id !== application.assigned_agent_id);

  const assign = async () => {
    if (!selected) return setError("Pick an agent.");
    setSaving(true);
    setError(null);
    const res = await staffAssignAgent(application.id, Number(selected));
    setSaving(false);
    if (res.error) return setError(res.error);
    pushToast({ tone: "success", title: assigned ? "Agent reassigned" : "Agent assigned" });
    setOpen(false);
    onChanged();
  };

  return (
    <>
      {needsManual ? (
        <Notice
          tone="amber"
          icon={UserCheck}
          title="No agent picked this up automatically"
          action={<Button size="sm" onClick={openPicker}>Assign an agent</Button>}
        >
          Choose an available agent who handles this service.
        </Notice>
      ) : (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cx-brand-soft text-cx-brand-deep">
                <Building2 className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-[15px] font-semibold text-cx-ink">Agent #{application.assigned_agent?.agent_id || application.assigned_agent_id}</p>
                <p className="text-[13px] text-cx-muted">{[application.assigned_agent?.lga, application.assigned_agent?.state].filter(Boolean).join(", ") || "Location not set"}</p>
              </div>
              <Badge tone="brand">Assigned</Badge>
            </div>
            {REASSIGNABLE.includes(application.status) ? (
              <Button variant="secondary" size="sm" icon={RefreshCw} onClick={openPicker}>Reassign</Button>
            ) : null}
          </div>
        </Card>
      )}

      <Sheet
        open={open}
        onOpenChange={(o) => !o && !saving && setOpen(false)}
        title={assigned ? "Reassign to another agent" : "Assign an agent"}
        description="Only agents who handle this service and have a bank account are listed."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button block loading={saving} disabled={!agents} onClick={assign}>{assigned ? "Reassign" : "Assign"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {error ? <Notice tone="red">{error}</Notice> : null}
          {!agents ? (
            <p className="text-sm text-cx-muted">Loading agents…</p>
          ) : choices.length === 0 ? (
            <Notice tone="amber">No {assigned ? "other " : ""}eligible agents for {(application.application_type || "this service").replace(/_/g, " ")}.</Notice>
          ) : (
            <Field label="Agent">
              {(p) => (
                <Select {...p} value={selected} onChange={(e) => setSelected(e.target.value)}>
                  <option value="">Choose an agent</option>
                  {choices.map((a) => (
                    <option key={a.agent_id} value={a.agent_id}>
                      Agent #{a.agent_id} — {a.lga}, {a.state}{a.matches_location ? " (local)" : ""}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}
        </div>
      </Sheet>
    </>
  );
}
