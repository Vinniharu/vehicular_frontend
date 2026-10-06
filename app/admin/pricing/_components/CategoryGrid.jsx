"use client";

import { VEHICLE_CATEGORY_OPTIONS } from "@/lib/constants/vehicleCategories";
import { useState } from "react";
import PriceRowCard from "./PriceRowCard";
import { cellKey, rowStateFromApiItem } from "../_lib/rowState";

// The 12-cell vehicle-category grid for one service_key — shared by every
// card that has category pricing (Vehicle Particulars' 5 document types,
// nested under their own sub-panel, and Physical Condition Inspection's
// standalone card).
export default function CategoryGrid({ serviceKey, rows, editing, onChange, onDelete, isGeneralScope }) {
  const [bulkPercent, setBulkPercent] = useState("");

  // Fills the deposit % on every category cell at once; the admin still
  // reviews and saves as usual.
  const applyToAll = () => {
    if (bulkPercent === "") return;
    for (const { value: vehicle_category } of VEHICLE_CATEGORY_OPTIONS) {
      const key = cellKey(serviceKey, vehicle_category);
      const current = rows[key] || rowStateFromApiItem({});
      onChange(key, { ...current, initial_deposit_percent: bulkPercent, initial_deposit_amount_kobo: "" });
    }
  };

  return (
    <div className="space-y-3">
      <p className="rounded-lg bg-slate-50 px-3 py-2 text-[12.5px] text-slate-600">
        Customers pay the price for their vehicle category and that category's deposit %. The fallback row above only
        applies when a category has no price of its own.
      </p>
      {editing ? (
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor={`bulk-${serviceKey}`} className="block text-[11px] font-medium text-slate-500 mb-1">
              Deposit % for every category
            </label>
            <input
              id={`bulk-${serviceKey}`}
              type="number" min="0" max="100" value={bulkPercent}
              onChange={(e) => setBulkPercent(e.target.value)}
              className="w-28 rounded-lg px-3 py-2 text-[13px] bg-slate-50 border border-[#E5E5E5] focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]"
            />
          </div>
          <button
            type="button"
            onClick={applyToAll}
            disabled={bulkPercent === ""}
            className="rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Apply to all categories
          </button>
        </div>
      ) : null}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {VEHICLE_CATEGORY_OPTIONS.map(({ value: vehicle_category, label: categoryLabel }) => {
        const key = cellKey(serviceKey, vehicle_category);
        return (
          <PriceRowCard
            key={key}
            label={categoryLabel}
            row={rows[key] || rowStateFromApiItem({})}
            onChange={(next) => onChange(key, next)}
            editing={editing}
            amountRequired
            onDelete={editing ? () => onDelete(vehicle_category, categoryLabel) : null}
            isGeneralScope={isGeneralScope}
          />
        );
      })}
    </div>
    </div>
  );
}
