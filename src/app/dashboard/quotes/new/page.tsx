'use client';

import { CreateQuotePage } from '@/components/billing/quotes/create-quote-page';
import { RoleGuard } from '@/components/auth/role-guard';
import { Permission } from '@/lib/auth/roles';
import { useRequireAuth } from '@/lib/auth/use-require-auth';

export default function NewQuotePage() {
  useRequireAuth();
  return (
    <RoleGuard permissions={[Permission.GENERATE_QUOTATION]} showError>
      <CreateQuotePage />
    </RoleGuard>
  );
}
