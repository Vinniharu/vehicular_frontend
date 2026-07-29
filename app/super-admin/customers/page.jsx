"use client";

import AccountsTable from "@/app/components/superadmin/AccountsTable";

export default function SuperAdminCustomersPage() {
  return <AccountsTable role="customer" title="Customers" description="Every customer account on the platform." />;
}
