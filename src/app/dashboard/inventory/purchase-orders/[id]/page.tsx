import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SectionHeader } from '@/components/layout/section-header';
import { RoleGuard } from '@/components/auth/role-guard';
import { Permission } from '@/lib/auth/roles';

export const metadata: Metadata = {
  title: 'Purchase Order | E-Wheels',
  description: 'Purchase order details'
};

export default function PurchaseOrderDetailPage() {
  return (
    <RoleGuard permissions={[Permission.VIEW_INVENTORY]} showError>
      <PageContainer>
        <div className='mb-4'>
          <Breadcrumbs />
        </div>
        <div className='space-y-6'>
          <SectionHeader
            title='Purchase Order'
            description='Details and receiving coming soon.'
          />
          <div className='text-muted-foreground rounded-xl border p-6 text-sm'>
            PO details UI will be implemented in Phase 4.
          </div>
        </div>
      </PageContainer>
    </RoleGuard>
  );
}
