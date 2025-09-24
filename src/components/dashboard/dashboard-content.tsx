'use client';

import { User } from '@clerk/nextjs/server';
import { UserRole } from '@/lib/auth/roles';
import { AdminDashboard } from './admin-dashboard';
import { TechnicianDashboard } from './technician-dashboard';

interface DashboardContentProps {
  user: User;
  role: UserRole;
}

export default function DashboardContent({ user, role }: DashboardContentProps) {
  switch (role) {
    case UserRole.ADMIN:
      return <AdminDashboard user={user} />;
    case UserRole.TECHNICIAN:
      return <TechnicianDashboard user={user} />;
    default:
      return (
        <div className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Role Not Recognized</h1>
            <p className="text-gray-600 mt-2">
              Please contact your administrator for role assignment.
            </p>
          </div>
        </div>
      );
  }
}
