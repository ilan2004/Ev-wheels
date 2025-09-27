'use client';

import DashboardContent from '@/components/dashboard/dashboard-content';
import { useAuth } from '@/hooks/use-auth';

export default function Dashboard() {
  const { user, role } = useAuth();
  if (!user) return null;
  const userData = {
    id: (user as any).id,
    firstName: (user as any).user_metadata?.firstName ?? null,
    lastName: (user as any).user_metadata?.lastName ?? null,
    emailAddresses: [{ id: '0', emailAddress: (user as any).email }],
    imageUrl: '',
    publicMetadata: { role },
  } as any;
  return <DashboardContent user={userData} role={role as any} />;
}
