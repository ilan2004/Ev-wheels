'use client';

import { AddPaymentPage } from '@/components/billing/invoices/add-payment-page';
import { RoleGuard } from '@/components/auth/role-guard';
import { Permission } from '@/lib/auth/roles';
import { useRequireAuth } from '@/lib/auth/use-require-auth';
import { useParams } from 'next/navigation';

export default function PaymentPage() {
  useRequireAuth();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  return (
    <RoleGuard permissions={[Permission.GENERATE_INVOICE]} showError>
      <AddPaymentPage invoiceId={id} />
    </RoleGuard>
  );
}
