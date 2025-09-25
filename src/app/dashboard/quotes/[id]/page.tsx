import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserRole, userHasPermission } from '@/lib/auth/utils';
import { Permission } from '@/lib/auth/roles';
import { QuoteDetailPage } from '@/components/billing/quotes/quote-detail-page';

interface QuotePageProps {
  params: Promise<{ id: string }>;
}

export default async function QuotePage({ params }: QuotePageProps) {
  const { id } = await params;
  const user = await currentUser();

  if (!user) {
    return redirect('/sign-in');
  }

  const userRole = getUserRole(user);
  
  // If user has no role assigned, redirect to role assignment
  if (!userRole) {
    return redirect('/auth/assign-role');
  }

  // Check if user has permission to view quotes
  if (!userHasPermission(user, Permission.GENERATE_QUOTATION)) {
    return redirect('/dashboard');
  }

  return <QuoteDetailPage id={id} />;
}
