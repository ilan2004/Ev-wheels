import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/auth/utils';
import DashboardContent from '@/components/dashboard/dashboard-content';

export default async function Dashboard() {
  const user = await currentUser();

  if (!user) {
    return redirect('/sign-in');
  }

  const userRole = getUserRole(user);
  
  // If user has no role assigned, redirect to role assignment
  if (!userRole) {
    return redirect('/auth/assign-role');
  }

  // Serialize user data for client component
  const userData = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    emailAddresses: user.emailAddresses.map(email => ({
      id: email.id,
      emailAddress: email.emailAddress
    })),
    imageUrl: user.imageUrl,
    publicMetadata: user.publicMetadata
  };

  return <DashboardContent user={userData} role={userRole} />;
}
