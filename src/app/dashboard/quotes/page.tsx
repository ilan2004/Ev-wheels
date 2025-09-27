'use client';

import { QuotesListPage } from '@/components/billing/quotes/quotes-list-page';
import { RoleGuard } from '@/components/auth/role-guard';
import { Permission } from '@/lib/auth/roles';
import { useRequireAuth } from '@/lib/auth/use-require-auth';

export default function QuotesPage() {
  useRequireAuth();
  return (
    <RoleGuard permissions={[Permission.GENERATE_QUOTATION]} showError>
      <QuotesListPage />
    </RoleGuard>
  );
}
