"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Existing applications now live on the unified /dashboard/applications
// list. This route has no picker of its own (unlike number-plate), so it
// forwards to the requirements-preview screen, which is now the single
// consistent hop before every wizard.
export default function VehicleParticularsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/apply/requirements?type=vehicle_particulars");
  }, [router]);
  return null;
}
