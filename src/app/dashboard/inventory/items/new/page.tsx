import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SectionHeader } from '@/components/layout/section-header';
import { RoleGuard } from '@/components/auth/role-guard';
import { Permission } from '@/lib/auth/roles';

export const metadata: Metadata = {
  title: 'Add Item | E-Wheels',
  description: 'Create a new inventory item'
};

export default function AddItemPage() {
  return (
    <RoleGuard permissions={[Permission.CREATE_INVENTORY_ITEM]} showError>
      <PageContainer>
        <div className='mb-4'>
          <Breadcrumbs />
        </div>
        <div className='space-y-6'>
          <SectionHeader
            title='Add Item'
            description='Define item details. Stock updates happen via adjustments or receiving.'
          />
          <div className='text-muted-foreground rounded-xl border p-6 text-sm'>
            Item form will be implemented in Phase 2.
          </div>
        </div>
      </PageContainer>
    </RoleGuard>
  );
}
