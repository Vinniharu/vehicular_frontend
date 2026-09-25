"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AgentParticularsJobsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/agent/applications");
  }, [router]);

  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#28A745]" />
    </div>
  );
}
