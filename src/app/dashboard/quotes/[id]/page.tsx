'use client';

import { QuoteDetailPage } from '@/components/billing/quotes/quote-detail-page';
import { RoleGuard } from '@/components/auth/role-guard';
import { Permission } from '@/lib/auth/roles';
import { useRequireAuth } from '@/lib/auth/use-require-auth';
import { useParams } from 'next/navigation';

export default function QuotePage() {
  useRequireAuth();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  return (
    <RoleGuard permissions={[Permission.GENERATE_QUOTATION]} showError>
      <QuoteDetailPage id={id} />
    </RoleGuard>
  );
}
