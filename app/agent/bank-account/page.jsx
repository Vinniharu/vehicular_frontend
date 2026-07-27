"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const BRAND = "#28A745";

export default function AgentBankAccountRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/agent/wallet?tab=bank-account");
  }, [router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: BRAND }} />
      <p className="text-[13px] font-medium text-slate-500">Bank Account has moved into the Earnings Wallet…</p>
    </div>
  );
}
