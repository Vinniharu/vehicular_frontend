"use client";

import { Suspense } from "react";
import PortalLoginForm from "@/app/components/auth/PortalLoginForm";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <PortalLoginForm portalName="Admin" expectedRole="admin" homePath="/admin" />
    </Suspense>
  );
}
