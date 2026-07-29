"use client";

import { Suspense } from "react";
import PortalLoginForm from "@/app/components/auth/PortalLoginForm";

export default function StaffLoginPage() {
  return (
    <Suspense fallback={null}>
      <PortalLoginForm portalName="Staff" expectedRole={["staff", "admin"]} homePath="/staff" />
    </Suspense>
  );
}
