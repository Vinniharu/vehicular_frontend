"use client";

import { Trash2 } from "lucide-react";
import { nairaFmt } from "../_lib/rowState";

const smallInputCls = "w-full rounded-lg px-3 py-2 text-[13px] bg-slate-50 border border-[#E5E5E5] focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]";

// One dense card per price row — deliberately just two fields, Amount and
// Initial Deposit %. Priority and the 7 financing-detail fields
// (app/models/pricing.py PriceExtrasMixin) used to be editable here too,
// but nothing in checkout/payment ever reads them and they only added
// noise — removed from the UI. Their values aren't touched server-side
// (see admin.py's _apply_extras), so any row an admin set them on before
// keeps that value; this form just never edits it again. Shared by every
// pricing card on the page, regardless of which backend table its row
// belongs to.
export default function PriceRowCard({ label, row, onChange, editing, amountPlaceholder = "Not set", amountRequired = false, onDelete, isGeneralScope }) {
  const set = (field, value) => onChange({ ...row, [field]: value });
  return (
    <div className="rounded-xl border border-[#E5E5E5] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {row.is_override && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                State override
              </span>
            )}
            {row.is_override && !row.is_active && (
              <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                Inactive — general price applies
              </span>
            )}
            {!row.is_override && !row.is_active && (
              <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                Inactive — fallback price applies
              </span>
            )}
          </div>
        </div>
        {editing && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => set("is_active", !row.is_active)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${row.is_active ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-500"}`}
            >
              {row.is_active ? "Active" : "Inactive"}
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="text-slate-400 hover:text-red-600 transition-colors"
                title={isGeneralScope ? "Delete general price (removes fallback for everyone)" : "Delete override (reverts to general price)"}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Amount (₦)</label>
          {editing ? (
            <input
              type="number" min={amountRequired ? "1" : "0"} value={row.amount} placeholder={amountPlaceholder}
              onChange={(e) => set("amount", e.target.value)} className={smallInputCls}
            />
          ) : (
            <p className="text-[14px] font-semibold text-slate-800">{row.amount ? nairaFmt(row.amount) : amountPlaceholder}</p>
          )}
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Initial Deposit (%)</label>
          {editing ? (
            <input
              type="number" min="0" max="100" value={row.initial_deposit_percent} placeholder="10"
              onChange={(e) => set("initial_deposit_percent", e.target.value)} className={smallInputCls}
            />
          ) : (
            <p className="text-[14px] text-slate-600">{row.initial_deposit_percent || "10"}%</p>
          )}
        </div>
      </div>
    </div>
  );
}
