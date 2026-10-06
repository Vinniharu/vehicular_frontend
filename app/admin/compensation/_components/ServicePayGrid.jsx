"use client";

// Pay by vehicle type, for all agents or one agent. One collapsible card per
// service: an "any vehicle type" amount plus 12 vehicle-type tiles. Each tile
// is edited on its own; "Set all vehicle types" changes all 12 at once.

import { useState } from "react";
import { ChevronDown, ChevronRight, Layers } from "lucide-react";
import { VEHICLE_CATEGORY_OPTIONS } from "@/lib/constants/vehicleCategories";
import { Badge, Button, Field, Notice, Sheet } from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";
import { MoneyInput, Tabs, formatNaira, moneyError, toKobo } from "../../_kit";
import { VEHICLE_GROUPS } from "./services";
import PayEditSheet from "./PayEditSheet";

const cx = (...parts) => parts.filter(Boolean).join(" ");

/**
 * getCell(serviceKey, category|null) → { own: kobo|null, shown: kobo|null }
 *   own   — the amount set at this level (null = not set here)
 *   shown — what the agent is actually paid (may come from a fallback)
 * fallbackText(serviceKey, category) → words for where an unset amount comes from
 * saveCells(serviceKey, [{ vehicle_category, kobo }]) → { ok, error }
 */
export default function ServicePayGrid({ getCell, fallbackText, saveCells, sheetExtra, ownBadge = "Set here" }) {
  const pushToast = useToast();
  const [group, setGroup] = useState(VEHICLE_GROUPS[0].id);
  const [open, setOpen] = useState(() => new Set());
  const [editing, setEditing] = useState(null); // { service, category: {value,label} | null }
  const [bulkFor, setBulkFor] = useState(null);
  const [bulkValue, setBulkValue] = useState("");
  const [bulkError, setBulkError] = useState(null);
  const [bulkSaving, setBulkSaving] = useState(null);

  const services = VEHICLE_GROUPS.find((g) => g.id === group).services;
  const toggle = (k) => setOpen((prev) => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const runBulk = async (mode) => {
    let kobo = null;
    if (mode === "set") {
      const err = moneyError(bulkValue, { required: true });
      if (err) return setBulkError(err);
      kobo = toKobo(bulkValue);
    }
    setBulkError(null);
    setBulkSaving(mode);
    const res = await saveCells(bulkFor.key, VEHICLE_CATEGORY_OPTIONS.map((c) => ({ vehicle_category: c.value, kobo })));
    setBulkSaving(null);
    if (!res.ok) return setBulkError(res.error || "Couldn't save.");
    pushToast({ tone: "success", title: mode === "set" ? "All vehicle types updated" : "Vehicle-type amounts cleared", body: bulkFor.label });
    setBulkFor(null);
  };

  const editingCell = editing ? getCell(editing.service.key, editing.category?.value ?? null) : null;

  return (
    <div>
      <Tabs tabs={VEHICLE_GROUPS.map((g) => ({ id: g.id, label: g.label, count: g.services.length }))} value={group} onChange={setGroup} label="Service group" className="mb-4" />

      <div className="space-y-3">
        {services.map((svc) => {
          const isOpen = open.has(svc.key);
          const any = getCell(svc.key, null);
          const ownCount = VEHICLE_CATEGORY_OPTIONS.filter((c) => getCell(svc.key, c.value).own != null).length;
          return (
            <section key={svc.key} className="rounded-cx-lg border border-cx-line bg-cx-surface shadow-cx">
              <button type="button" onClick={() => toggle(svc.key)} aria-expanded={isOpen} className="cx-focus flex w-full items-center gap-3 rounded-cx-lg px-4 py-4 text-left sm:px-5">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[16px] font-semibold text-cx-ink">{svc.label}</h3>
                  <p className="text-sm text-cx-muted">
                    {any.shown != null ? `${formatNaira(any.shown)} for any vehicle type` : "No amount for any vehicle type"}
                    {ownCount ? ` · ${ownCount} vehicle type${ownCount > 1 ? "s" : ""} set` : ""}
                  </p>
                </div>
                <ChevronDown className={cx("h-5 w-5 shrink-0 text-cx-muted transition-transform", isOpen && "rotate-180")} aria-hidden />
              </button>
              {isOpen ? (
                <div className="border-t border-cx-line">
                  <button type="button" onClick={() => setEditing({ service: svc, category: null })} className="cx-focus group flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-cx-sunken/70 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium text-cx-ink">Any vehicle type</p>
                      <p className="text-[13px] text-cx-muted">Used when a vehicle type below has no amount</p>
                      {any.own != null ? <Badge tone="brand" className="mt-1">{ownBadge}</Badge> : null}
                    </div>
                    <span className={cx("w-28 shrink-0 text-right text-[15px] font-semibold", any.shown != null ? "text-cx-ink" : "text-cx-muted")}>{formatNaira(any.shown, "Not set")}</span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-cx-muted" aria-hidden />
                  </button>
                  <div className="border-t border-cx-line px-4 py-4 sm:px-5">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-cx-ink-2">By vehicle type</p>
                      <Button variant="secondary" size="sm" icon={Layers} onClick={() => { setBulkValue(""); setBulkError(null); setBulkFor(svc); }}>
                        Set all vehicle types
                      </Button>
                    </div>
                    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {VEHICLE_CATEGORY_OPTIONS.map((c) => {
                        const cell = getCell(svc.key, c.value);
                        return (
                          <li key={c.value}>
                            <button
                              type="button"
                              onClick={() => setEditing({ service: svc, category: c })}
                              className={cx("cx-focus flex h-full w-full flex-col rounded-cx border bg-cx-surface p-3 text-left hover:border-cx-brand/60", cell.own != null ? "border-cx-brand/40" : "border-cx-line")}
                            >
                              <span className="text-[13px] font-medium leading-snug text-cx-ink-2">{c.label}</span>
                              <span className={cx("mt-1 text-[15px] font-semibold", cell.own != null ? "text-cx-ink" : "text-cx-muted")}>{formatNaira(cell.shown, "Not set")}</span>
                              <span className="text-xs text-cx-muted">{cell.own != null ? ownBadge : "Default"}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      <PayEditSheet
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing ? `${editing.service.label} — ${editing.category ? editing.category.label : "any vehicle type"}` : ""}
        kobo={editingCell?.own ?? null}
        fallbackText={editing ? fallbackText(editing.service.key, editing.category?.value ?? null) : ""}
        onSave={(kobo) => saveCells(editing.service.key, [{ vehicle_category: editing.category?.value ?? null, kobo }])}
      >
        {sheetExtra}
      </PayEditSheet>

      <Sheet
        open={!!bulkFor}
        onOpenChange={(o) => !bulkSaving && !o && setBulkFor(null)}
        title={bulkFor ? `${bulkFor.label} — all vehicle types` : ""}
        description="Sets the same amount for all 12 vehicle types."
        footer={
          <>
            <Button variant="secondary" onClick={() => setBulkFor(null)} disabled={!!bulkSaving}>Cancel</Button>
            <Button block loading={bulkSaving === "set"} disabled={bulkSaving === "clear"} onClick={() => runBulk("set")}>Apply to all 12</Button>
          </>
        }
      >
        <div className="space-y-4">
          {bulkError ? <Notice tone="red">{bulkError}</Notice> : null}
          <Field label="Agent is paid" required>
            {(p) => <MoneyInput {...p} value={bulkValue} onChange={setBulkValue} placeholder="0" />}
          </Field>
          {sheetExtra}
          <Button variant="ghost" className="-ml-1" loading={bulkSaving === "clear"} disabled={bulkSaving === "set"} onClick={() => runBulk("clear")}>
            Clear all 12 (use the default)
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
