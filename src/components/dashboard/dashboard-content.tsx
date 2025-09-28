'use client';

import { UserRole } from '@/lib/auth/roles';
import { AdminDashboard } from './admin-dashboard';
import { TechnicianDashboard } from './technician-dashboard';
import { ManagerDashboard } from './manager-dashboard';

// Serialized user data for client components
interface SerializedUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: { id: string; emailAddress: string }[];
  imageUrl: string;
  publicMetadata: Record<string, any>;
}

interface DashboardContentProps {
  user: SerializedUser;
  role: UserRole;
}

export default function DashboardContent({
  user,
  role
}: DashboardContentProps) {
  switch (role) {
    case UserRole.ADMIN:
      return <AdminDashboard user={user} />;
    case UserRole.MANAGER:
      return <ManagerDashboard user={user} />;
    case UserRole.TECHNICIAN:
      return <TechnicianDashboard user={user} />;
    default:
      return (
        <div className='p-6'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-gray-900'>
              Role Not Recognized
            </h1>
            <p className='mt-2 text-gray-600'>
              Please contact your administrator for role assignment.
            </p>
          </div>
        </div>
      );
  }
}
