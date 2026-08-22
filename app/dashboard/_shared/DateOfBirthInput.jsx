"use client";

import { inputBase } from "@/app/dashboard/_shared/ui";

// A native date input, plus an explicit, unambiguous preview line below it —
// the native input alone renders in the browser/OS locale format (e.g.
// unlabeled MM/DD/YYYY on a US-locale browser), which is easy to misread;
// the preview line spells the assembled date out in words so there's no
// ambiguity about what got selected, regardless of locale.
//
// Contract: `value` is an ISO "YYYY-MM-DD" string (or ""), `onChange`
// receives the same — matches what every call site already passes around
// (apply/page.jsx's `dob` state, apply/[id]/page.jsx's and
// support/applications/[id]/page.jsx's `form.date_of_birth`), so none of
// them need to change.

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MIN_AGE_YEARS = 16;
const MAX_AGE_YEARS = 100;

function parseIso(value) {
  if (!value) return null;
  const [y, m, d] = String(value).split("-");
  if (!y || !m || !d) return null;
  return { day: parseInt(d, 10), month: parseInt(m, 10), year: parseInt(y, 10) };
}

// Avoids new Date(iso).toISOString() round-tripping, which shifts by a day
// for any UTC+ timezone (see app/support/documents/page.jsx's
// toDateInputValue for the same caution) — built from local date parts only.
function formatDateInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function DateOfBirthInput({ value, onChange, hasError }) {
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - MIN_AGE_YEARS, today.getMonth(), today.getDate());
  const minDate = new Date(today.getFullYear() - MAX_AGE_YEARS, today.getMonth(), today.getDate());

  const parsed = parseIso(value);

  return (
    <div>
      <input
        type="date"
        className={`${inputBase} ${hasError ? "border-red-400 focus:border-red-400 focus:ring-red-400/15" : ""}`}
        value={value || ""}
        min={formatDateInputValue(minDate)}
        max={formatDateInputValue(maxDate)}
        onChange={(e) => onChange(e.target.value)}
      />
      {parsed && (
        <p className="mt-1.5 text-[12px] font-medium text-slate-600">
          Selected: {parsed.day} {MONTHS[parsed.month - 1]} {parsed.year}
        </p>
      )}
    </div>
  );
}
