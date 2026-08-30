"use client";

import { VEHICLE_CATEGORY_OPTIONS } from "@/lib/constants/vehicleCategories";
import PriceRowCard from "./PriceRowCard";
import { cellKey, rowStateFromApiItem } from "../_lib/rowState";

// The 12-cell vehicle-category grid for one service_key — shared by every
// card that has category pricing (Vehicle Particulars' 5 document types,
// nested under their own sub-panel, and Physical Condition Inspection's
// standalone card).
export default function CategoryGrid({ serviceKey, rows, editing, onChange, onDelete, isGeneralScope }) {
  return (
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
  );
}
