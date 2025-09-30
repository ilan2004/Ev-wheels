import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { BatteryDetails } from '@/components/bms/battery-details';
import { Breadcrumbs } from '@/components/breadcrumbs';

interface BatteryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params
}: BatteryPageProps): Promise<Metadata> {
  // In a real app, you would fetch the battery data here
  const { id } = await params;
  return {
    title: `Battery ${id} | E-Wheels`,
    description:
      'View and manage battery repair details, status, and diagnostics'
  };
}

export default async function BatteryPage({ params }: BatteryPageProps) {
  const { id } = await params;
  return (
    <PageContainer>
      <div className='mb-4'>
        <Breadcrumbs />
      </div>
      <BatteryDetails batteryId={id} />
    </PageContainer>
  );
}
