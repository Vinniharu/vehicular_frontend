"use client";

// Prices by vehicle type for one service: 12 tappable tiles, each edited in
// the shared price sheet, plus a "set all" sheet for bulk changes.

import { useState } from "react";
import { Layers } from "lucide-react";
import { VEHICLE_CATEGORY_OPTIONS } from "@/lib/constants/vehicleCategories";
import { Button, Field, Notice, Sheet } from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";
import { MoneyInput, PercentInput, moneyError } from "../../_kit";
import { usePricingData } from "../_context/PricingDataContext";
import { PriceEditSheet, depositText, priceText } from "./PriceRow";

const cx = (...parts) => parts.filter(Boolean).join(" ");

export default function CategoryGrid({ serviceKey, groupLabel }) {
  const pushToast = useToast();
  const { isGeneralScope, getCell, saveCells, deleteCell } = usePricingData();
  const [editing, setEditing] = useState(null); // { value, label }
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkAmount, setBulkAmount] = useState("");
  const [bulkPercent, setBulkPercent] = useState("");
  const [bulkError, setBulkError] = useState(null);
  const [bulkSaving, setBulkSaving] = useState(false);

  const editingRow = editing ? getCell(serviceKey, editing.value) : null;

  const saveBulk = async () => {
    if (!bulkAmount && bulkPercent === "") return setBulkError("Enter a price, a deposit %, or both.");
    const err = moneyError(bulkAmount, { allowZero: false });
    if (err) return setBulkError(err);
    if (bulkPercent !== "" && (Number(bulkPercent) < 0 || Number(bulkPercent) > 100 || Number.isNaN(Number(bulkPercent)))) {
      return setBulkError("Deposit must be between 0 and 100%.");
    }
    const missingPrice = !bulkAmount && VEHICLE_CATEGORY_OPTIONS.some((c) => !getCell(serviceKey, c.value).amount);
    if (missingPrice) return setBulkError("Some vehicle types have no price yet — enter a price too.");
    setBulkError(null);
    setBulkSaving(true);
    const cells = VEHICLE_CATEGORY_OPTIONS.map(({ value }) => {
      const row = getCell(serviceKey, value);
      return {
        vehicle_category: value,
        row: {
          ...row,
          amount: bulkAmount ? bulkAmount.replace(/,/g, "") : row.amount,
          ...(bulkPercent !== "" ? { initial_deposit_percent: bulkPercent, initial_deposit_amount_kobo: "" } : {}),
        },
      };
    });
    const res = await saveCells(serviceKey, cells);
    setBulkSaving(false);
    if (!res.ok) return setBulkError(res.error || "Couldn't save these prices.");
    pushToast({ tone: "success", title: "All vehicle types updated", body: groupLabel });
    setBulkOpen(false);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-cx-muted">Customers pay the price for their vehicle type.</p>
        <Button
          variant="secondary"
          size="sm"
          icon={Layers}
          onClick={() => {
            setBulkAmount("");
            setBulkPercent("");
            setBulkError(null);
            setBulkOpen(true);
          }}
        >
          Set all vehicle types
        </Button>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {VEHICLE_CATEGORY_OPTIONS.map(({ value, label }) => {
          const row = getCell(serviceKey, value);
          return (
            <li key={value}>
              <button
                type="button"
                onClick={() => setEditing({ value, label })}
                className={cx(
                  "cx-focus flex h-full w-full flex-col rounded-cx border bg-cx-surface p-3 text-left transition-colors hover:border-cx-brand/60",
                  row.is_override ? "border-cx-amber/40" : "border-cx-line"
                )}
              >
                <span className="text-[13px] font-medium leading-snug text-cx-ink-2">{label}</span>
                <span className={cx("mt-1 text-[15px] font-semibold", row.amount ? "text-cx-ink" : "text-cx-muted")}>{priceText(row)}</span>
                <span className="text-xs text-cx-muted">Deposit {depositText(row, isGeneralScope)}</span>
                {row.is_override || row.is_active === false ? (
                  <span className="mt-1 text-xs font-medium text-cx-amber">
                    {row.is_active === false ? "Off" : "This state's price"}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      <PriceEditSheet
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing ? `${groupLabel} — ${editing.label}` : ""}
        row={editingRow}
        isGeneralScope={isGeneralScope}
        amountRequired
        canDelete={!!editingRow && (isGeneralScope ? !!editingRow.amount : editingRow.is_override)}
        onSave={(next) => saveCells(serviceKey, [{ vehicle_category: editing.value, row: next }])}
        onDelete={() => deleteCell(serviceKey, editing.value)}
      />

      <Sheet
        open={bulkOpen}
        onOpenChange={(o) => !bulkSaving && setBulkOpen(o)}
        title="Set all vehicle types"
        description={`${groupLabel}. Fill in what you want to change; blank fields keep each vehicle type's current value.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setBulkOpen(false)} disabled={bulkSaving}>Cancel</Button>
            <Button block loading={bulkSaving} onClick={saveBulk}>Apply to all 12</Button>
          </>
        }
      >
        <div className="space-y-4">
          {bulkError ? <Notice tone="red">{bulkError}</Notice> : null}
          <Field label="Price for every vehicle type" optional>
            {(p) => <MoneyInput {...p} value={bulkAmount} onChange={setBulkAmount} placeholder="Keep current prices" />}
          </Field>
          <Field label="Deposit for every vehicle type" optional>
            {(p) => <PercentInput {...p} value={bulkPercent} onChange={setBulkPercent} placeholder="Keep current" />}
          </Field>
          {!isGeneralScope ? <Notice tone="amber">This sets this state's own price for all 12 vehicle types.</Notice> : null}
        </div>
      </Sheet>
    </div>
  );
}
