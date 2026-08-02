"use client";

import { Suspense } from "react";
import PortalLoginForm from "@/app/components/auth/PortalLoginForm";

export default function SupportLoginPage() {
  return (
    <Suspense fallback={null}>
      <PortalLoginForm portalName="Support" expectedRole={["support", "admin"]} homePath="/support" />
    </Suspense>
  );
}
