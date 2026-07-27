/**
 * Vehiculars UI Design System Tokens
 *
 * Identity: Vehiculars digitizes a document-heavy, trust-dependent government process
 * (driver's licence issuance). Brand palette is green (#28A745) / black (#111111) /
 * white (#FFFFFF), matching the logo mark. A display serif is still used for
 * headings/large numbers that reads closer to an official certificate than a SaaS
 * dashboard. The status-tone system is unchanged — those are functional scanability
 * cues (warning/danger/info/etc.), not brand color.
 *
 * Two surfaces:
 * - Surface A (Customer): paper background, generous radii (16-24px), soft shadows.
 * - Surface B (Staff/Agent/Admin): dense layouts, tight radii (8-12px), dark sidebar.
 */

export const colors = {
  // Brand & Primary Action
  primary: {
    DEFAULT: "#28A745",
    hover: "#1F8838",
    active: "#166B2C",
    light: "#E9F7EC",
    border: "#A8E0B3",
  },

  // Customer surface — ink/paper instead of a generic neutral-gray scale
  ink: {
    DEFAULT: "#111111", // primary text — true black
    secondary: "#3A3A3A",
    muted: "#7A7A7A",
  },
  paper: {
    DEFAULT: "#F7F7F7", // page background — very light neutral gray so white cards still lift off it
    card: "#FFFFFF", // cards lift off the paper background
    border: "#E5E5E5",
    borderStrong: "#D4D4D4",
  },

  // Legacy neutral scale — still used in a few places, kept for compatibility
  neutral: {
    white: "#FFFFFF",
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
    950: "#0A0F1D",
  },

  // Dark chrome (sidebars) — true black per brand spec
  chrome: {
    sidebarBg: "#111111",
    sidebarBorder: "rgba(255, 255, 255, 0.06)",
    sidebarFooter: "#0A0A0A",
    mainBg: "#F7F7F7",
  },

  // Semantic status tones (always rendered as dot + label pill)
  status: {
    info: { dot: "#0EA5E9", bg: "#F0F9FF", text: "#0369A1", border: "#BAE6FD" },
    warning: { dot: "#F59E0B", bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
    danger: {
      // Retuned from Tailwind's stock red-500 to a desaturated "ink stamp" red —
      // reads as an official rejection stamp rather than a generic error color.
      dot: "#B3452F",
      bg: "#FBF1EE",
      text: "#8A3320",
      border: "#E8C4B8",
    },
    success: { dot: "#10B981", bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
    purple: { dot: "#8B5CF6", bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
    teal: { dot: "#14B8A6", bg: "#F0FDFA", text: "#0F766E", border: "#99F6E4" },
    indigo: { dot: "#6366F1", bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE" },
    expiredCalm: { dot: "#64748B", bg: "#F1F5F9", text: "#475569", border: "#E2E8F0" },
  },
};

export const typography = {
  fontFamily: {
    // Body/UI — unchanged, already loaded via next/font in app/layout.tsx
    sans: ["var(--font-geist-sans)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
    // Reference numbers, amounts, IDs — already the right instinct, keep it
    mono: ["var(--font-geist-mono)", "SFMono-Regular", "monospace"],
    // Page headings and the biggest numeric moments only — used with restraint
    display: ["var(--font-display-serif)", "Georgia", "serif"],
  },

  scale: {
    label: { size: "11px", lineHeight: "16px", letterSpacing: "0.06em", fontWeight: "600" },
    body: { size: "13px", lineHeight: "20px", letterSpacing: "-0.005em", fontWeight: "400" },
    bodyMedium: { size: "13px", lineHeight: "20px", letterSpacing: "-0.005em", fontWeight: "500" },
    bodyBold: { size: "13px", lineHeight: "20px", letterSpacing: "-0.005em", fontWeight: "600" },
    cardTitle: { size: "16px", lineHeight: "24px", letterSpacing: "-0.01em", fontWeight: "600" },
    sectionHeader: { size: "18px", lineHeight: "26px", letterSpacing: "-0.015em", fontWeight: "700" },
    pageTitle: { size: "28px", lineHeight: "34px", letterSpacing: "-0.01em", fontWeight: "500" }, // set in display serif
  },
};

export const spacing = {
  customer: { cardPadding: "24px", cardGap: "20px", sectionMargin: "32px" },
  staff: { tableCellPadding: "12px 16px", cardPadding: "16px", rowGap: "8px" },
};

export const radii = {
  customer: { card: "20px", button: "12px", input: "12px", pill: "9999px" },
  staff: { card: "12px", button: "8px", input: "8px", pill: "9999px" },
};

export const shadows = {
  customerCard: "0 1px 3px 0 rgba(17, 17, 17, 0.06), 0 1px 2px -1px rgba(17, 17, 17, 0.06)",
  customerCardHover: "0 10px 15px -3px rgba(17, 17, 17, 0.09), 0 4px 6px -4px rgba(17, 17, 17, 0.05)",
  modalBackdrop: "0 25px 50px -12px rgba(17, 17, 17, 0.3)",
};
