"use client";

import AccountsTable from "@/app/components/superadmin/AccountsTable";

export default function SuperAdminAgentsPage() {
  return <AccountsTable role="agent" title="Agents" description="VIO field agent accounts, including VIO office, LGA, and commission." />;
}
