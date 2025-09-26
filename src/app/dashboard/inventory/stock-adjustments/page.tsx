import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SectionHeader } from '@/components/layout/section-header';
import { RoleGuard } from '@/components/auth/role-guard';
import { Permission } from '@/lib/auth/roles';

export const metadata: Metadata = {
  title: 'Stock Adjustments | E-Wheels',
  description: 'Audit trail of inventory changes'
};

export default function StockAdjustmentsPage() {
  return (
    <RoleGuard permissions={[Permission.VIEW_INVENTORY]} showError>
      <PageContainer>
        <div className="mb-4">
          <Breadcrumbs />
        </div>
        <div className="space-y-6">
          <SectionHeader
            title="Stock Adjustments"
            description="Increase or decrease stock with reasons and maintain a clean audit trail."
          />
          <div className="rounded-xl border p-6 text-sm text-muted-foreground">
            Adjustments list and create flow will be implemented in Phase 3.
          </div>
        </div>
      </PageContainer>
    </RoleGuard>
  );
}
