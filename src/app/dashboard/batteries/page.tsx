import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { BatteryManagement } from '@/components/bms/battery-management';

export const metadata: Metadata = {
  title: 'Battery Management | E-Wheels',
  description: 'Manage battery repairs, diagnostics, and customer service records'
};

export default function BatteriesPage() {
  return (
    <PageContainer>
      <BatteryManagement />
    </PageContainer>
  );
}
