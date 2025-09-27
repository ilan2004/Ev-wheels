'use client';

import { InvoicesListPage } from '@/components/billing/invoices/invoices-list-page';
import { RoleGuard } from '@/components/auth/role-guard';
import { Permission } from '@/lib/auth/roles';
import { useRequireAuth } from '@/lib/auth/use-require-auth';

export default function InvoicesPage() {
  useRequireAuth();
  return (
    <RoleGuard permissions={[Permission.GENERATE_INVOICE]} showError>
      <InvoicesListPage />
    </RoleGuard>
  );
}
