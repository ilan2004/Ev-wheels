import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { BatteryStatus } from '@/types/bms';
import { StatusPageClient } from './status-client';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SectionHeader } from '@/components/layout/section-header';

export const metadata: Metadata = {
  title: 'Battery Status | E-Wheels',
  description: 'View and update the status of battery repairs'
};

export default function BatteryStatusPage() {
  // Demo props; in a real app, fetch current status and history for a selected battery
  const currentStatus = BatteryStatus.RECEIVED;
  const batteryId = 'demo-1';

  return (
    <PageContainer>
      <div className="mb-4">
        <Breadcrumbs />
      </div>
      <div className="space-y-6">
        <SectionHeader
          title="Battery Status"
          description="Track and update repair workflow status"
        />
        <StatusPageClient currentStatus={currentStatus} batteryId={batteryId} />
      </div>
    </PageContainer>
  );
}
