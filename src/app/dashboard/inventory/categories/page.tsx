import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SectionHeader } from '@/components/layout/section-header';
import { RoleGuard } from '@/components/auth/role-guard';
import { Permission } from '@/lib/auth/roles';

export const metadata: Metadata = {
  title: 'Categories | E-Wheels',
  description: 'Manage item categories'
};

export default function InventoryCategoriesPage() {
  return (
    <RoleGuard permissions={[Permission.VIEW_INVENTORY]} showError>
      <PageContainer>
        <div className='mb-4'>
          <Breadcrumbs />
        </div>
        <div className='space-y-6'>
          <SectionHeader
            title='Categories'
            description='Create and manage inventory categories.'
          />
          <div className='text-muted-foreground rounded-xl border p-6 text-sm'>
            Categories management UI will be implemented in Phase 2.
          </div>
        </div>
      </PageContainer>
    </RoleGuard>
  );
}
