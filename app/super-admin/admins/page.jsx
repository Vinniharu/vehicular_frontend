"use client";

import AccountsTable from "@/app/components/superadmin/AccountsTable";

export default function SuperAdminAdminsPage() {
  return <AccountsTable role="admin" title="Admins" description="Admin accounts with access to the Admin portal." />;
}
