"use client";

import { Suspense } from "react";
import PortalLoginForm from "@/app/components/auth/PortalLoginForm";

export default function AgentLoginPage() {
  return (
    <Suspense fallback={null}>
      <PortalLoginForm portalName="Agent" expectedRole="agent" homePath="/agent" />
    </Suspense>
  );
}
