import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SectionHeader } from '@/components/layout/section-header';
import { RoleGuard } from '@/components/auth/role-guard';
import { Permission } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Inventory | E-Wheels',
  description:
    'Manage inventory items, categories, suppliers, and stock movements'
};

export default function InventoryOverviewPage() {
  return (
    <RoleGuard permissions={[Permission.VIEW_INVENTORY]} showError>
      <PageContainer>
        <div className='mb-4'>
          <Breadcrumbs />
        </div>
        <div className='space-y-6'>
          <SectionHeader
            title='Inventory'
            description='Manage items, categories, suppliers, and stock movements.'
            actions={
              <>
                <Button asChild>
                  <Link href='/dashboard/inventory/new'>Add Item</Link>
                </Button>
                <Button variant='secondary' asChild>
                  <Link href='/dashboard/inventory/alerts'>Low Stock</Link>
                </Button>
              </>
            }
          />

          <div className='grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3'>
            <Link
              href='/dashboard/inventory/categories'
              className='group hover:bg-muted/40 rounded-xl border p-4 transition'
            >
              <div className='text-base font-semibold'>Categories</div>
              <div className='text-muted-foreground text-sm'>
                Organize items into categories
              </div>
            </Link>
            <Link
              href='/dashboard/inventory/suppliers'
              className='group hover:bg-muted/40 rounded-xl border p-4 transition'
            >
              <div className='text-base font-semibold'>Suppliers</div>
              <div className='text-muted-foreground text-sm'>
                Manage supplier information
              </div>
            </Link>
            <Link
              href='/dashboard/inventory/purchase-orders'
              className='group hover:bg-muted/40 rounded-xl border p-4 transition'
            >
              <div className='text-base font-semibold'>Purchase Orders</div>
              <div className='text-muted-foreground text-sm'>
                Create and receive stock
              </div>
            </Link>
            <Link
              href='/dashboard/inventory/stock-adjustments'
              className='group hover:bg-muted/40 rounded-xl border p-4 transition'
            >
              <div className='text-base font-semibold'>Stock Adjustments</div>
              <div className='text-muted-foreground text-sm'>
                Audit trail of stock changes
              </div>
            </Link>
            <Link
              href='/dashboard/inventory/movements'
              className='group hover:bg-muted/40 rounded-xl border p-4 transition'
            >
              <div className='text-base font-semibold'>Movements</div>
              <div className='text-muted-foreground text-sm'>
                Request issue/receive/transfer; approve as admin
              </div>
            </Link>
          </div>

          <div className='text-muted-foreground rounded-xl border p-6 text-sm'>
            Inventory UI and data are coming in the next phases. Start by adding
            your first item or exploring placeholders above.
          </div>
        </div>
      </PageContainer>
    </RoleGuard>
  );
}
