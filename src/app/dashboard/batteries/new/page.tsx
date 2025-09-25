import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { BatteryForm } from '@/components/bms/battery-form';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SectionHeader } from '@/components/layout/section-header';

export const metadata: Metadata = {
  title: 'Add New Battery | E-Wheels',
  description: 'Register a new battery for repair and service tracking'
};

export default function NewBatteryPage() {
  return (
    <PageContainer>
      <div className="mb-4">
        <Breadcrumbs />
      </div>
      <div className="space-y-6">
        <SectionHeader
          title="Add New Battery"
          description="Register a new battery for repair and service tracking"
        />
        <BatteryForm />
      </div>
    </PageContainer>
  );
}
