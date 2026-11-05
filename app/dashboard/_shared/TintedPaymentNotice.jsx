import { Info } from "lucide-react";

// Shown before payment, straight after it, and on the application page until
// the verification link has gone out.
export default function TintedPaymentNotice({ className = "" }) {
  return (
    <div className={`flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-[13px] leading-relaxed text-amber-900 ${className}`} role="note">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        Within 5 working days after payment, an Agent from our team will reach out to you, and a verification link will be sent to your email or SMS. Please keep an eye on your email, SMS, and spam/junk folder. Once you receive the link, kindly follow the instructions to complete your facial verification and proceed with the approval process.
      </p>
    </div>
  );
}
