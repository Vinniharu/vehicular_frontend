"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "../_components/ui";

export default function AgentTransfersRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/agent/wallet?tab=transfers");
  }, [router]);
  return <Spinner label="Opening your wallet…" />;
}
