import { GOLD } from "@/app/components/landing/theme";

/**
 * Shared icon chip for every marketing "service card" surface — extracted
 * from 3 near-identical copies (services hub, landing Services section,
 * pricing page). Deliberately has no "use client" — must stay
 * server-renderable so app/services/page.jsx (a zero-client-JS route)
 * doesn't gain a client bundle just by using this.
 */
export default function ServiceIcon({ icon: Icon, tone = "brand", size = "md" }) {
  const sizeCls = size === "lg" ? "h-11 w-11" : "h-10 w-10";
  const toneStyle =
    tone === "onDark"
      ? { background: `${GOLD}26`, color: GOLD }
      : tone === "brandStrong"
      ? { background: "rgba(40, 167, 69,0.15)", color: "#28A745" }
      : { background: "rgba(40, 167, 69,0.10)", color: "#28A745" };
  return (
    <span className={`inline-flex ${sizeCls} shrink-0 items-center justify-center rounded-xl`} style={toneStyle}>
      <Icon className="h-5 w-5" />
    </span>
  );
}
