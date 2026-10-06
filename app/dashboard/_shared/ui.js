// Shared button/input/label class strings, consolidated from the
// near-identical copies previously duplicated in apply/page.jsx,
// apply/[id]/page.jsx, and wallet/page.jsx. Color is intentionally left
// out of the button variants (callers pair these with a background color
// class or inline style, since not every btnPrimary usage is brand-green —
// e.g. some are amber for a warning CTA).

// Mobile-first sizing (customer redesign): 44px+ tap targets and 15px text.
export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-cx px-5 py-3 text-[15px] font-semibold text-white transition-colors disabled:opacity-50 cx-focus";

export const btnSecondary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-cx border border-cx-line-strong bg-cx-surface px-5 py-3 text-[15px] font-semibold text-cx-ink hover:bg-cx-sunken transition-colors cx-focus";

export const btnGhost =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-cx px-3 py-2 text-sm font-semibold text-cx-muted hover:text-cx-ink hover:bg-cx-sunken transition-colors cx-focus";

// 16px on phones so iOS Safari doesn't zoom into the field on focus.
export const inputBase =
  "w-full min-h-12 rounded-cx border border-cx-line-strong bg-cx-surface px-3.5 py-2.5 text-base sm:text-[15px] text-cx-ink placeholder:text-cx-muted/70 outline-none transition-shadow focus:border-cx-brand focus:ring-4 focus:ring-[color:var(--cx-focus)]";

// Sentence-case field label (apply / apply detail forms).
export const label = "block text-sm font-medium text-cx-ink mb-1.5";

// Uppercase tracked field label (wallet forms) — kept distinct from `label`
// rather than unified, since collapsing them would be a visual change
// beyond what either page currently asks for.
export const fieldLabel = "block text-sm font-medium text-cx-ink mb-1.5";
