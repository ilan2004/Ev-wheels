import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { BatteryForm } from '@/components/bms/battery-form';

export const metadata: Metadata = {
  title: 'Add New Battery | E-Wheels',
  description: 'Register a new battery for repair and service tracking'
};

export default function NewBatteryPage() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Battery</h1>
          <p className="text-muted-foreground">
            Register a new battery for repair and service tracking
          </p>
        </div>
        
        <BatteryForm />
      </div>
    </PageContainer>
  );
}
