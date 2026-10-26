import { Info } from "lucide-react";

// Required on ad landing pages: Vehiculars helps with government documents,
// so ad reviewers need to see plainly that we are not a government body.
// Server-safe and never animated, so crawlers always see it in the HTML.
export const DISCLAIMER_TEXT =
  "Vehiculars is a private service provider. We are not affiliated with FRSC, VIO, the Nigeria Police Force or any government agency.";

export default function Disclaimer({ variant = "inline", className = "" }) {
  if (variant === "footer") {
    return <p className={`text-[12.5px] leading-relaxed text-white/55 ${className}`}>{DISCLAIMER_TEXT}</p>;
  }
  return (
    <p className={`flex items-start gap-2 text-[12.5px] leading-relaxed text-mk-muted ${className}`}>
      <Info className="mt-[2px] h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{DISCLAIMER_TEXT}</span>
    </p>
  );
}
