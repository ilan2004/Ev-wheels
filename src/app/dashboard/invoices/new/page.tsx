'use client';

import { CreateInvoicePage } from '@/components/billing/invoices/create-invoice-page';
import { RoleGuard } from '@/components/auth/role-guard';
import { Permission } from '@/lib/auth/roles';
import { useRequireAuth } from '@/lib/auth/use-require-auth';

export default function NewInvoicePage() {
  useRequireAuth();
  return (
    <RoleGuard permissions={[Permission.GENERATE_INVOICE]} showError>
      <CreateInvoicePage />
    </RoleGuard>
  );
}
