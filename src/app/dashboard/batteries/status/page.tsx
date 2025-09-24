import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { BatteryStatus } from '@/types/bms';
import { StatusPageClient } from './status-client';

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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Battery Status</h1>
          <p className="text-muted-foreground">Track and update repair workflow status</p>
        </div>
        <StatusPageClient currentStatus={currentStatus} batteryId={batteryId} />
      </div>
    </PageContainer>
  );
}
