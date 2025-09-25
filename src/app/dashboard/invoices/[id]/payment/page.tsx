import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserRole, userHasPermission } from '@/lib/auth/utils';
import { Permission } from '@/lib/auth/roles';
import { AddPaymentPage } from '@/components/billing/invoices/add-payment-page';

interface PaymentPageProps {
  params: Promise<{ id: string }>;
}

export default async function PaymentPage({ params }: PaymentPageProps) {
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

  // Check if user has permission to add payments
  if (!userHasPermission(user, Permission.GENERATE_INVOICE)) {
    return redirect('/dashboard');
  }

  return <AddPaymentPage invoiceId={id} />;
}
