import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SectionHeader } from '@/components/layout/section-header';
import { RoleGuard } from '@/components/auth/role-guard';
import { Permission } from '@/lib/auth/roles';

export const metadata: Metadata = {
  title: 'Low Stock Alerts | E-Wheels',
  description: 'View items below minimum stock levels'
};

export default function InventoryAlertsPage() {
  return (
    <RoleGuard permissions={[Permission.VIEW_INVENTORY]} showError>
      <PageContainer>
        <div className="mb-4">
          <Breadcrumbs />
        </div>
        <div className="space-y-6">
          <SectionHeader
            title="Low Stock Alerts"
            description="Items under their minimum stock threshold will appear here."
          />
          <div className="rounded-xl border p-6 text-sm text-muted-foreground">
            Alerts list coming soon. You will see items that require replenishment once the data layer is wired in.
          </div>
        </div>
      </PageContainer>
    </RoleGuard>
  );
}
