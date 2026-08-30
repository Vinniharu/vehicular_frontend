"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Existing applications now live on the unified /dashboard/applications
// list. This route has no picker of its own (unlike number-plate), so it
// just forwards straight to the wizard.
export default function TintedPermitRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/apply/tinted-permit/new");
  }, [router]);
  return null;
}
