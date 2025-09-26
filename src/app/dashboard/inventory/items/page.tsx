import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SectionHeader } from '@/components/layout/section-header';
import { RoleGuard } from '@/components/auth/role-guard';
import { Permission } from '@/lib/auth/roles';

export const metadata: Metadata = {
  title: 'Items | E-Wheels',
  description: 'Inventory items list'
};

export default function InventoryItemsPage() {
  return (
    <RoleGuard permissions={[Permission.VIEW_INVENTORY]} showError>
      <PageContainer>
        <div className="mb-4">
          <Breadcrumbs />
        </div>
        <div className="space-y-6">
          <SectionHeader
            title="Items"
            description="Search, filter, and manage inventory items."
          />
          <div className="rounded-xl border p-6 text-sm text-muted-foreground">
            Items table UI will be implemented in Phase 2.
          </div>
        </div>
      </PageContainer>
    </RoleGuard>
  );
}
