'use client';

import { InvoiceDetailPage } from '@/components/billing/invoices/invoice-detail-page';
import { RoleGuard } from '@/components/auth/role-guard';
import { Permission } from '@/lib/auth/roles';
import { useRequireAuth } from '@/lib/auth/use-require-auth';
import { useParams } from 'next/navigation';

export default function InvoicePage() {
  useRequireAuth();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  return (
    <RoleGuard permissions={[Permission.GENERATE_INVOICE]} showError>
      <InvoiceDetailPage id={id} />
    </RoleGuard>
  );
}
