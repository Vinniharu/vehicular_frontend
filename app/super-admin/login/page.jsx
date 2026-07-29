"use client";

import { Suspense } from "react";
import PortalLoginForm from "@/app/components/auth/PortalLoginForm";

export default function SuperAdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <PortalLoginForm portalName="Super Admin" expectedRole="super_admin" homePath="/super-admin" />
    </Suspense>
  );
}
