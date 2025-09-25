import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserRole, userHasPermission } from '@/lib/auth/utils';
import { Permission } from '@/lib/auth/roles';
import { InvoicesListPage } from '@/components/billing/invoices/invoices-list-page';

export default async function InvoicesPage() {
  const user = await currentUser();

  if (!user) {
    return redirect('/sign-in');
  }

  const userRole = getUserRole(user);
  
  // If user has no role assigned, redirect to role assignment
  if (!userRole) {
    return redirect('/auth/assign-role');
  }

  // Check if user has permission to view invoices
  if (!userHasPermission(user, Permission.GENERATE_INVOICE)) {
    return redirect('/dashboard');
  }

  return <InvoicesListPage />;
}
