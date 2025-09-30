import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SectionHeader } from '@/components/layout/section-header';
import { RoleGuard } from '@/components/auth/role-guard';
import { Permission } from '@/lib/auth/roles';

export const metadata: Metadata = {
  title: 'Item Details | E-Wheels',
  description: 'View and edit inventory item details'
};

export default function ItemDetailPage() {
  return (
    <RoleGuard permissions={[Permission.VIEW_INVENTORY]} showError>
      <PageContainer>
        <div className='mb-4'>
          <Breadcrumbs />
        </div>
        <div className='space-y-6'>
          <SectionHeader
            title='Item Details'
            description='Edit item info and view stock movement history.'
          />
          <div className='text-muted-foreground rounded-xl border p-6 text-sm'>
            Item detail view will be implemented in Phase 2/3.
          </div>
        </div>
      </PageContainer>
    </RoleGuard>
  );
}
