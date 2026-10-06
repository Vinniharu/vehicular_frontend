"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "../_components/ui";

export default function AgentBankAccountRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/agent/wallet?tab=bank-account");
  }, [router]);
  return <Spinner label="Opening your wallet…" />;
}
