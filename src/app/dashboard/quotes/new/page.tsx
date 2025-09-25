import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserRole, userHasPermission } from '@/lib/auth/utils';
import { Permission } from '@/lib/auth/roles';
import { CreateQuotePage } from '@/components/billing/quotes/create-quote-page';

export default async function NewQuotePage() {
  const user = await currentUser();

  if (!user) {
    return redirect('/sign-in');
  }

  const userRole = getUserRole(user);
  
  // If user has no role assigned, redirect to role assignment
  if (!userRole) {
    return redirect('/auth/assign-role');
  }

  // Check if user has permission to create quotes
  if (!userHasPermission(user, Permission.GENERATE_QUOTATION)) {
    return redirect('/dashboard');
  }

  return <CreateQuotePage />;
}
